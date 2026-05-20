import express from 'express';
import pool from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import paymentService from '../services/paymentService.js';

const router = express.Router();

// Projeye bağış yap (ziyaretçiler için authenticate olmadan da çalışabilir)
router.post('/projects/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;
        const { amount, anonymous, message, payment_method, payment_data } = req.body;

        // Ziyaretçi kontrolü - eğer authenticate middleware'i geçmediyse userId null olur
        let userId = null;
        try {
            // Token kontrolü
            const token = req.headers.authorization?.split(' ')[1];
            if (token) {
                const jwt = (await import('jsonwebtoken')).default;
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
                userId = decoded.id;
            }
        } catch (tokenError) {
            // Token yoksa veya geçersizse ziyaretçi olarak devam et
            console.log('Guest donation - no valid token');
        }

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Geçerli bir miktar giriniz' });
        }

        // Proje kontrolü
        const [projects] = await pool.execute('SELECT * FROM projects WHERE id = ?', [projectId]);
        if (projects.length === 0) {
            return res.status(404).json({ error: 'Proje bulunamadı' });
        }

        const project = projects[0];

        // Ödeme işlemi
        let paymentStatus = 'completed';
        let transactionId = null;

        if (payment_method === 'balance') {
            // Bakiye ile ödeme (sadece giriş yapmış kullanıcılar için)
            if (!userId) {
                return res.status(401).json({ error: 'Bakiye ile ödeme için giriş yapmalısınız' });
            }

            try {
                // Kullanıcı bakiyesini kontrol et
                const [userData] = await pool.execute('SELECT balance FROM users WHERE id = ?', [userId]);
                const currentBalance = parseFloat(userData[0]?.balance || 0);

                if (currentBalance < parseFloat(amount)) {
                    return res.status(400).json({ error: 'Bakiyeniz yetersiz' });
                }

                // Bakiyeyi düş
                await pool.execute(
                    'UPDATE users SET balance = balance - ? WHERE id = ?',
                    [amount, userId]
                );

                transactionId = `DON-BAL-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
                paymentStatus = 'completed'; // Bakiye ile ödeme otomatik onaylanır
            } catch (balanceError) {
                console.error('Balance payment error:', balanceError);
                return res.status(500).json({ error: 'Ödeme işlemi sırasında hata oluştu' });
            }
        } else if (payment_method === 'credit_card' || payment_method === 'stripe' || payment_method === 'guest_card') {
            // Stripe ödeme
            // Önce settings'i yükle
            await paymentService.loadPaymentSettings();
            
            const stripeResult = await paymentService.processStripePayment(
                parseFloat(amount),
                project.currency || 'TRY',
                payment_data || {},
                { project_id: projectId, user_id: userId, donation: true }
            );
            
            if (stripeResult.success) {
                transactionId = stripeResult.transactionId;
                paymentStatus = 'completed';
            } else {
                return res.status(400).json({ 
                    error: stripeResult.error || 'Ödeme başarısız',
                    details: stripeResult
                });
            }
        } else if (payment_method === 'iyzico') {
            // Iyzico ödeme
            const iyzicoResult = await paymentService.processIyzicoPayment(
                parseFloat(amount),
                payment_data || {},
                { id: userId }
            );
            
            if (iyzicoResult.success) {
                transactionId = iyzicoResult.transactionId;
                paymentStatus = 'completed';
            } else {
                return res.status(400).json({ 
                    error: iyzicoResult.error || 'Ödeme başarısız',
                    details: iyzicoResult
                });
            }
        } else if (payment_method === 'paypal' || payment_method === 'guest_paypal') {
            // PayPal ödeme
            // Önce settings'i yükle
            await paymentService.loadPaymentSettings();
            
            const paypalResult = await paymentService.processPayPalPayment(
                parseFloat(amount),
                project.currency || 'TRY',
                payment_data || {}
            );
            
            if (paypalResult.success) {
                transactionId = paypalResult.transactionId;
                paymentStatus = 'completed';
            } else {
                return res.status(400).json({ 
                    error: paypalResult.error || 'Ödeme başarısız',
                    details: paypalResult
                });
            }
        } else if (payment_method === 'bank_transfer' || payment_method === 'havale') {
            // Havale / EFT
            transactionId = `DON-TR-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
            paymentStatus = 'pending_approval'; // Havale admin onayı bekler
        } else {
            // Diğer veya belirtilmemiş
            transactionId = `DON-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
            paymentStatus = 'pending_approval';
        }

        // Bağış kaydı
        const finalStatus = paymentStatus;

        const [result] = await pool.execute(
            `INSERT INTO project_donations 
             (project_id, user_id, amount, currency, is_anonymous, message, payment_method, transaction_id, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                projectId,
                userId || null,
                amount,
                project.currency || 'TRY',
                anonymous || !userId ? 1 : 0,
                message || null,
                payment_method || (userId ? null : 'guest'),
                transactionId,
                finalStatus
            ]
        );

        // Transaction kaydı oluştur
        // Eğer bakiye ile ödeme yapıldıysa, kullanıcı bakiyesinden düşülmüş olmalı
        // Transaction kaydı purchase tipinde olmalı (bakiye düşüşü)
        if (userId && payment_method === 'balance' && finalStatus === 'completed') {
            // Bakiye ile ödeme yapıldığında purchase tipinde transaction kaydı oluştur
            await pool.execute(
                `INSERT INTO transactions (user_id, amount, type, status, description, payment_method, transaction_id) 
                 VALUES (?, ?, 'purchase', ?, ?, ?, ?)`,
                [
                    userId,
                    -parseFloat(amount), // Negatif tutar (bakiye düşüşü)
                    'completed',
                    `Bağış: ${project.title}`,
                    'balance',
                    transactionId
                ]
            );
        } else if (userId && (finalStatus === 'completed' || finalStatus === 'pending_approval')) {
            // Diğer ödeme yöntemleri için donation tipinde kayıt
            await pool.execute(
                `INSERT INTO transactions (user_id, amount, type, status, description, payment_method, transaction_id) 
                 VALUES (?, ?, 'donation', ?, ?, ?, ?)`,
                [
                    userId,
                    amount,
                    finalStatus,
                    `Proje Bağışı: ${project.title}`,
                    payment_method,
                    transactionId
                ]
            );
        }

        // Eğer işlem tamamlandıysa (completed):
        // 1. Proje toplam bağış miktarını güncelle
        // 2. Admin bakiyesine ekle
        if (finalStatus === 'completed') {
            // Proje toplam bağış güncelle
            await pool.execute(
                'UPDATE projects SET donation_received = COALESCE(donation_received, 0) + ? WHERE id = ?',
                [amount, projectId]
            );

            // Admin kullanıcısını bul ve bakiyesine ekle
            // Admin rolüne sahip ilk kullanıcıyı bul (veya ID=1 varsayılabilir ama bu daha güvenli)
            const [admins] = await pool.execute(
                `SELECT u.id FROM users u 
                 LEFT JOIN user_roles ur ON u.role_id = ur.id 
                 WHERE ur.slug = 'admin' OR u.role_id = 1 
                 ORDER BY u.id ASC LIMIT 1`
            );

            if (admins.length > 0) {
                // Admin bakiyesine tamamını ekle
                await pool.execute(
                    'UPDATE users SET balance = COALESCE(balance, 0) + ? WHERE id = ?',
                    [amount, admins[0].id]
                );
                
                // Admin için transaction kaydı oluştur
                try {
                    await pool.execute(
                        `INSERT INTO transactions (user_id, order_id, type, amount, currency, status, description)
                         VALUES (?, NULL, 'donation', ?, ?, 'completed', ?)`,
                        [admins[0].id, amount, project.currency || 'TRY', `Bağış Geliri: ${amount} TL (Proje: ${project.title})`]
                    );
                } catch (transError) {
                    console.warn('Transaction kaydı oluşturulamadı:', transError.message);
                }
            }
        }

        // Bağış limiti ve indirim hesaplama (kullanıcı için)
        let discountCoupon = null;
        if (userId && (finalStatus === 'pending_approval' || finalStatus === 'completed')) {
            try {
                // Kullanıcının bu projeye yaptığı toplam bağışı hesapla (yeni bağış dahil)
                // Not: Yeni bağış henüz veritabanına eklenmediği için manuel olarak ekliyoruz
                const [userDonations] = await pool.execute(
                    `SELECT COALESCE(SUM(amount), 0) as total FROM project_donations 
                     WHERE project_id = ? AND user_id = ? AND status IN ('completed', 'pending_approval')`,
                    [projectId, userId]
                );

                // Yeni bağış miktarını da ekle (henüz veritabanına kaydedilmedi)
                const totalDonated = parseFloat(userDonations[0]?.total || 0) + parseFloat(amount);
                const donationLimit = 1000; // Bağış limiti (örnek: 1000₺) - daha düşük limit

                // Her 1000₺ bağış için %10 indirim, maksimum %50
                // Örnek: 1000₺ = %10, 2000₺ = %20, 5000₺ = %50
                const discountPercentage = Math.min(Math.floor((totalDonated / donationLimit) * 10), 50);

                // Eğer indirim yüzdesi 0'dan büyükse kupon oluştur
                if (discountPercentage > 0) {
                    // Bu kullanıcı için bu projede zaten bir kupon var mı kontrol et
                    const couponCodePattern = `DONATE-${projectId}-${userId}-%`;
                    const [existingCoupons] = await pool.execute(
                        `SELECT id, code, discount_value FROM coupons 
                         WHERE code LIKE ? AND status = 'active' 
                         AND (expires_at IS NULL OR expires_at > NOW())
                         ORDER BY created_at DESC LIMIT 1`,
                        [couponCodePattern]
                    );

                    // Eğer kupon yoksa veya mevcut kuponun indirimi daha düşükse yeni kupon oluştur
                    let shouldCreateCoupon = true;
                    if (existingCoupons.length > 0) {
                        const existingDiscount = parseFloat(existingCoupons[0].discount_value || 0);
                        if (discountPercentage <= existingDiscount) {
                            shouldCreateCoupon = false; // Mevcut kupon daha iyi veya eşit
                        } else {
                            // Eski kuponu pasif yap
                            await pool.execute(
                                'UPDATE coupons SET status = "inactive" WHERE id = ?',
                                [existingCoupons[0].id]
                            );
                        }
                    }

                    if (shouldCreateCoupon) {
                        const couponCode = `DONATE-${projectId}-${userId}-${Date.now()}`;

                        // Kupon oluştur
                        try {
                            // Önce coupons tablosunda project_id kolonu var mı kontrol et
                            let couponInsertQuery;
                            let couponInsertParams;

                            // project_id kolonu olup olmadığını kontrol et
                            try {
                                const [columns] = await pool.execute(
                                    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
                                     WHERE TABLE_SCHEMA = DATABASE() 
                                     AND TABLE_NAME = 'coupons' 
                                     AND COLUMN_NAME = 'project_id'`
                                );

                                if (columns.length > 0) {
                                    // project_id kolonu varsa kullan
                                    couponInsertQuery = `INSERT INTO coupons 
                                         (code, discount_type, discount_value, project_id, expires_at, usage_limit, one_time_use, status, description)
                                         VALUES (?, 'percentage', ?, ?, DATE_ADD(NOW(), INTERVAL 1 YEAR), 1, 1, 'active', ?)`;
                                    couponInsertParams = [
                                        couponCode,
                                        discountPercentage,
                                        projectId,
                                        `Bağış hediyesi - Sadece bu projede geçerli`
                                    ];
                                } else {
                                    // project_id kolonu yoksa eski şekilde ekle
                                    couponInsertQuery = `INSERT INTO coupons 
                                         (code, discount_type, discount_value, expires_at, usage_limit, one_time_use, status, description)
                                         VALUES (?, 'percentage', ?, DATE_ADD(NOW(), INTERVAL 1 YEAR), 1, 1, 'active', ?)`;
                                    couponInsertParams = [
                                        couponCode,
                                        discountPercentage,
                                        `Bağış hediyesi - Proje ID: ${projectId} - Sadece bu projede geçerli`
                                    ];
                                }
                            } catch (colCheckError) {
                                // Hata durumunda eski şekilde ekle
                                couponInsertQuery = `INSERT INTO coupons 
                                     (code, discount_type, discount_value, expires_at, usage_limit, one_time_use, status, description)
                                     VALUES (?, 'percentage', ?, DATE_ADD(NOW(), INTERVAL 1 YEAR), 1, 1, 'active', ?)`;
                                couponInsertParams = [
                                    couponCode,
                                    discountPercentage,
                                    `Bağış hediyesi - Proje ID: ${projectId} - Sadece bu projede geçerli`
                                ];
                            }

                            const [couponResult] = await pool.execute(couponInsertQuery, couponInsertParams);

                            discountCoupon = {
                                code: couponCode,
                                discount: discountPercentage
                            };
                        } catch (couponInsertError) {
                            console.error('Coupon creation error:', couponInsertError);
                        }
                    } else if (existingCoupons.length > 0) {
                        // Mevcut kuponu döndür
                        discountCoupon = {
                            code: existingCoupons[0].code,
                            discount: parseFloat(existingCoupons[0].discount_value || 0)
                        };
                    }
                }
            } catch (couponError) {
                console.error('Coupon calculation error:', couponError);
            }
        }

        res.status(201).json({
            message: finalStatus === 'pending_approval'
                ? 'Bağış başarıyla yapıldı. Admin onayından sonra proje sahibine aktarılacak.'
                : finalStatus === 'completed'
                    ? 'Bağış başarıyla yapıldı'
                    : 'Bağış kaydı oluşturuldu, ödeme bekleniyor',
            donation_id: result.insertId,
            status: finalStatus,
            transaction_id: transactionId,
            discount_coupon: discountCoupon
        });
    } catch (error) {
        console.error('Donation error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Admin - Bağış onayla (komisyon dağıtımı)
router.post('/admin/:donationId/approve', authenticate, async (req, res) => {
    try {
        // Admin kontrolü (basit - gerçek uygulamada role kontrolü yapılmalı)
        const { donationId } = req.params;
        const { admin_note } = req.body;

        // Bağış kontrolü
        const [donations] = await pool.execute(
            'SELECT d.*, p.user_id as project_owner_id FROM project_donations d INNER JOIN projects p ON d.project_id = p.id WHERE d.id = ?',
            [donationId]
        );

        if (donations.length === 0) {
            return res.status(404).json({ error: 'Bağış bulunamadı' });
        }

        const donation = donations[0];

        if (donation.status === 'completed') {
            return res.status(400).json({ error: 'Bu bağış zaten onaylanmış' });
        }

        // Bağışların tamamı admin'e gidiyor (Satıcı pay almıyor)
        const donationAmount = parseFloat(donation.amount);

        // Admin kullanıcısını bul
        let adminUserId = 1; // Default
        try {
            const [adminRoles] = await pool.execute("SELECT id FROM user_roles WHERE slug = 'admin' LIMIT 1");
            if (adminRoles.length > 0) {
                const [admins] = await pool.execute('SELECT id FROM users WHERE role_id = ? ORDER BY id ASC LIMIT 1', [adminRoles[0].id]);
                if (admins.length > 0) adminUserId = admins[0].id;
            }
        } catch (e) {
            console.warn('Admin user find error:', e.message);
        }

        // Admin bakiyesine tamamını ekle
        try {
            await pool.execute(
                'UPDATE users SET balance = COALESCE(balance, 0) + ? WHERE id = ?',
                [donationAmount, adminUserId]
            );
            
            // Admin için transaction kaydı oluştur
            await pool.execute(
                `INSERT INTO transactions (user_id, order_id, type, amount, currency, status, description)
                 VALUES (?, NULL, 'donation', ?, ?, 'completed', ?)`,
                [adminUserId, donationAmount, donation.currency || 'TRY', `Bağış Geliri: ${donation.amount} TL (Proje ID: ${donation.project_id})`]
            );
        } catch (adminError) {
            console.warn('Admin balance update error:', adminError.message);
        }

        // Bağış durumunu güncelle
        // Bağış durumunu güncelle
        await pool.execute(
            `UPDATE project_donations SET status = 'completed', admin_note = COALESCE(?, admin_note) WHERE id = ?`,
            [admin_note || null, donationId]
        );

        // Proje toplam bağış güncelle
        await pool.execute(
            'UPDATE projects SET donation_received = COALESCE(donation_received, 0) + ? WHERE id = ?',
            [donation.amount, donation.project_id]
        );

        res.json({
            message: 'Bağış onaylandı ve admin bakiyesine eklendi',
            admin_amount: donationAmount,
            project_owner_amount: 0
        });
    } catch (error) {
        console.error('Approve donation error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Admin - Bağış reddet
router.post('/admin/:donationId/reject', authenticate, async (req, res) => {
    try {
        const { donationId } = req.params;
        const { admin_note } = req.body;

        // Bağış kontrolü
        const [donations] = await pool.execute(
            'SELECT * FROM project_donations WHERE id = ?',
            [donationId]
        );

        if (donations.length === 0) {
            return res.status(404).json({ error: 'Bağış bulunamadı' });
        }

        const donation = donations[0];

        if (donation.status === 'completed') {
            return res.status(400).json({ error: 'Tamamlanmış bağış reddedilemez' });
        }

        // Bağış durumunu güncelle
        await pool.execute(
            `UPDATE project_donations SET status = 'cancelled', admin_note = COALESCE(?, admin_note) WHERE id = ?`,
            [admin_note || null, donationId]
        );

        res.json({ message: 'Bağış reddedildi/iptal edildi' });
    } catch (error) {
        console.error('Reject donation error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Admin - Sadece not güncelle
router.put('/admin/:donationId/note', authenticate, async (req, res) => {
    try {
        const { donationId } = req.params;
        const { admin_note } = req.body;

        await pool.execute(
            'UPDATE project_donations SET admin_note = ? WHERE id = ?',
            [admin_note, donationId]
        );

        res.json({ message: 'Not güncellendi' });
    } catch (error) {
        console.error('Update note error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Bağış ödeme işlemini tamamla
router.post('/:donationId/complete-payment', authenticate, async (req, res) => {
    try {
        const { donationId } = req.params;
        const { payment_method, payment_data } = req.body;
        const userId = req.user.id;

        // Bağış kontrolü
        const [donations] = await pool.execute(
            'SELECT * FROM project_donations WHERE id = ? AND user_id = ?',
            [donationId, userId]
        );

        if (donations.length === 0) {
            return res.status(404).json({ error: 'Bağış bulunamadı' });
        }

        const donation = donations[0];

        if (donation.status === 'completed') {
            return res.status(400).json({ error: 'Bu bağış zaten tamamlanmış' });
        }

        // Ödeme işlemi (demo modunda)
        // TODO: Gerçek ödeme gateway entegrasyonu
        const transactionId = `DON-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        // Bağış durumunu güncelle
        await pool.execute(
            `UPDATE project_donations 
             SET status = 'completed', 
                 payment_method = ?,
                 transaction_id = ?
             WHERE id = ?`,
            [payment_method || 'manual', transactionId, donationId]
        );

        // Proje toplam bağış güncelle
        await pool.execute(
            'UPDATE projects SET donation_received = COALESCE(donation_received, 0) + ? WHERE id = ?',
            [donation.amount, donation.project_id]
        );

        res.json({
            message: 'Ödeme başarıyla tamamlandı',
            transaction_id: transactionId
        });
    } catch (error) {
        console.error('Complete payment error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Proje bağışlarını getir
router.get('/projects/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params;

        const [donations] = await pool.execute(
            `SELECT d.*, 
             CASE WHEN d.is_anonymous = 1 THEN 'Anonim' ELSE u.username END as donor_name,
             u.avatar as donor_avatar
             FROM project_donations d
             LEFT JOIN users u ON d.user_id = u.id
             WHERE d.project_id = ?
             ORDER BY d.created_at DESC`,
            [projectId]
        );

        res.json({ donations });
    } catch (error) {
        console.error('Get donations error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Kullanıcının bağışlarını getir
router.get('/user/my-donations', authenticate, async (req, res) => {
    try {
        // Önce donations'ı getir
        const [donations] = await pool.execute(
            `SELECT d.*, p.title as project_title, p.slug as project_slug
             FROM project_donations d
             INNER JOIN projects p ON d.project_id = p.id
             WHERE d.user_id = ?
             ORDER BY d.created_at DESC`,
            [req.user.id]
        );

        // Her bağış için kupon bilgisini getir
        const donationsWithCoupons = await Promise.all(
            donations.map(async (donation) => {
                try {
                    // Kupon kodundan project_id'yi parse et veya direkt project_id ile ara
                    // Kupon kodu formatı: DONATE-{projectId}-{userId}-{timestamp}
                    const couponCodePattern = `DONATE-${donation.project_id}-${req.user.id}-%`;

                    // Önce project_id kolonu var mı kontrol et
                    let couponQuery;
                    let couponParams;

                    try {
                        const [columns] = await pool.execute(
                            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
                             WHERE TABLE_SCHEMA = DATABASE() 
                             AND TABLE_NAME = 'coupons' 
                             AND COLUMN_NAME = 'project_id'`
                        );

                        // Kupon kullanıcıya özel olduğu için sadece code pattern ile ara
                        // Code pattern zaten user_id içeriyor: DONATE-{projectId}-{userId}-{timestamp}
                        couponQuery = `
                            SELECT c.* 
                            FROM coupons c
                            WHERE c.code LIKE ? 
                            AND c.status = 'active'
                            AND (c.expires_at IS NULL OR c.expires_at > NOW())
                            ORDER BY c.created_at DESC
                            LIMIT 1
                        `;
                        couponParams = [couponCodePattern];

                        if (false) { // Bu blok artık kullanılmıyor
                        } else {
                            // project_id kolonu yoksa sadece code pattern ile ara
                            couponQuery = `
                                SELECT c.* 
                                FROM coupons c
                                WHERE c.code LIKE ? 
                                AND c.status = 'active'
                                AND (c.expires_at IS NULL OR c.expires_at > NOW())
                                ORDER BY c.created_at DESC
                                LIMIT 1
                            `;
                            couponParams = [couponCodePattern];
                        }
                    } catch (colCheckError) {
                        // Hata durumunda sadece code pattern ile ara
                        couponQuery = `
                            SELECT c.* 
                            FROM coupons c
                            WHERE c.code LIKE ? 
                            AND c.status = 'active'
                            AND (c.expires_at IS NULL OR c.expires_at > NOW())
                            ORDER BY c.created_at DESC
                            LIMIT 1
                        `;
                        couponParams = [couponCodePattern];
                    }

                    const [coupons] = await pool.execute(couponQuery, couponParams);

                    if (coupons.length > 0) {
                        donation.coupon = {
                            code: coupons[0].code,
                            discount_type: coupons[0].discount_type,
                            discount_value: coupons[0].discount_value,
                            expires_at: coupons[0].expires_at,
                            project_id: coupons[0].project_id || donation.project_id
                        };
                    }
                } catch (couponError) {
                    console.warn('Coupon fetch error for donation:', donation.id, couponError.message);
                }

                return donation;
            })
        );

        res.json({ donations: donationsWithCoupons });
    } catch (error) {
        console.error('Get user donations error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Kullanıcı - Bağış mesajını güncelle
router.put('/user/:donationId/message', authenticate, async (req, res) => {
    try {
        const { donationId } = req.params;
        const { message } = req.body;
        const userId = req.user.id;

        // Bağış kontrolü ve yetki
        const [donations] = await pool.execute(
            'SELECT * FROM project_donations WHERE id = ? AND user_id = ?',
            [donationId, userId]
        );

        if (donations.length === 0) {
            return res.status(404).json({ error: 'Bağış bulunamadı veya bu işlem için yetkiniz yok' });
        }

        // Güncelleme
        await pool.execute(
            'UPDATE project_donations SET message = ? WHERE id = ?',
            [message, donationId]
        );

        res.json({ message: 'Mesaj başarıyla güncellendi' });
    } catch (error) {
        console.error('Update donation message error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

export default router;

