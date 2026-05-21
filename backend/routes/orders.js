import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import pool from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Multer yapılandırması (bank transfer receipts için)
const receiptStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const receiptDir = path.join(process.cwd(), 'public', 'uploads', 'receipts');
        if (!fs.existsSync(receiptDir)) {
            fs.mkdirSync(receiptDir, { recursive: true });
        }
        cb(null, receiptDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'receipt-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const receiptUpload = multer({
    storage: receiptStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif|webp|pdf/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype) || file.mimetype === 'application/pdf';
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Sadece resim veya PDF dosyaları yüklenebilir!'));
        }
    }
});

// Sipariş oluştur
router.post('/', authenticate, async (req, res) => {
    try {
        const { billing_info, coupon_code, payment_method, card_id } = req.body;
        const userId = req.user.id;

        if (!billing_info || !billing_info.name || !billing_info.email || !billing_info.address) {
            return res.status(400).json({ error: 'Fatura bilgileri eksik' });
        }

        // Sepeti getir (Hem projeler hem planlar)
        const [cartItems] = await pool.execute(
            `SELECT c.*, 
                    p.title as project_title, p.price as project_price, p.discount_price, p.currency as project_currency,
                    sp.name as plan_name, sp.price as plan_price, sp.currency as plan_currency, sp.billing_period
             FROM cart c
             LEFT JOIN projects p ON c.project_id = p.id
             LEFT JOIN subscription_plans sp ON c.plan_id = sp.id
             WHERE c.user_id = ?`,
            [userId]
        );

        if (cartItems.length === 0) {
            return res.status(400).json({ error: 'Sepet boş' });
        }

        // Toplam hesapla ve order items hazırla
        let totalAmount = 0;
        let discountAmount = 0;
        const orderItems = [];
        const subscriptionItems = []; // Abonelik planları için
        let currency = 'TRY';

        cartItems.forEach(item => {
            let price = 0;
            let title = '';

            if (item.project_id) {
                price = parseFloat(item.discount_price || item.project_price);
                title = item.project_title;
                currency = item.project_currency || 'TRY';
            } else if (item.plan_id) {
                price = parseFloat(item.plan_price);
                title = item.plan_name;
                currency = item.plan_currency || 'TRY';
                subscriptionItems.push({
                    plan_id: item.plan_id,
                    billing_period: item.billing_period,
                    price: price
                });
            }

            const quantity = item.quantity || 1;
            const subtotal = price * quantity;
            totalAmount += subtotal;

            orderItems.push({
                project_id: item.project_id || null,
                plan_id: item.plan_id || null,
                title: title,
                price: price,
                quantity: quantity,
                subtotal: subtotal
            });
        });

        // Kupon kontrolü
        if (coupon_code) {
            const [coupons] = await pool.execute(
                `SELECT * FROM coupons 
                 WHERE code = ? AND status = 'active' 
                 AND (expires_at IS NULL OR expires_at > NOW())
                 AND (usage_limit IS NULL OR usage_count < usage_limit)`,
                [coupon_code.toUpperCase()]
            );

            if (coupons.length > 0) {
                const coupon = coupons[0];

                // Minimum tutar kontrolü
                if (coupon.min_amount && totalAmount < coupon.min_amount) {
                    return res.status(400).json({ error: `Bu kupon için minimum ${coupon.min_amount} TL tutarında alışveriş yapmalısınız` });
                }

                // İndirim hesapla
                if (coupon.discount_type === 'percentage') {
                    discountAmount = (totalAmount * coupon.discount_value) / 100;
                    if (coupon.max_amount) {
                        discountAmount = Math.min(discountAmount, coupon.max_amount);
                    }
                } else {
                    discountAmount = coupon.discount_value;
                }

                // Kupon kullanım sayısını artır
                await pool.execute(
                    'UPDATE coupons SET usage_count = usage_count + 1 WHERE id = ?',
                    [coupon.id]
                );
            }
        }

        const finalAmount = totalAmount - discountAmount;

        // Ödeme Simülasyonu: Kredi kartı ile ise 'paid' yapalım ama sipariş 'processing' kalsın (Admin onayı için)
        // Kullanıcı: "admin islemi onaylamadan para saticiya geciyor" -> Bu yüzden completed yapmıyoruz.
        let paymentStatus = 'pending';
        let orderStatus = 'pending';

        // Bakiye ile ödeme kontrolü - Order oluşturulurken bakiyeyi düş
        if (payment_method === 'balance') {
            const [userData] = await pool.execute('SELECT balance FROM users WHERE id = ?', [userId]);
            const currentBalance = parseFloat(userData[0]?.balance || 0);
            
            if (currentBalance < finalAmount) {
                return res.status(400).json({ error: 'Bakiyeniz yetersiz. Mevcut bakiye: ' + currentBalance.toFixed(2) + ' TL' });
            }

            // Bakiyeyi düş
            await pool.execute(
                'UPDATE users SET balance = balance - ? WHERE id = ?',
                [finalAmount, userId]
            );

            paymentStatus = 'paid';
            orderStatus = 'processing';
        } else if (payment_method === 'credit_card') {
            paymentStatus = 'paid';
            orderStatus = 'processing'; // Admin onayı / kontrolü için işlemde olarak başlat
        } else if (payment_method === 'bank_transfer') {
            // Banka havalesi ile ödeme: Ödeme bekleniyor durumunda başlat
            paymentStatus = 'pending';
            orderStatus = 'pending';
        }

        // Mevcut komisyon oranını al (siparişe kaydetmek için)
        let commissionRate = 15;
        try {
            const [settings] = await pool.execute(
                "SELECT value FROM settings WHERE `key` = 'commission_rate' ORDER BY id LIMIT 1"
            );
            if (settings.length > 0) commissionRate = parseFloat(settings[0].value) || 15;
        } catch (e) { }

        const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        // Sipariş oluştur
        let orderResult;
        try {
            const [cols] = await pool.execute("SHOW COLUMNS FROM orders LIKE 'commission_rate'");
            const hasCommission = cols.length > 0;

            const insertQuery = `INSERT INTO orders (order_number, user_id, total_amount, discount_amount, final_amount, currency, coupon_code, payment_method, payment_status, order_status ${hasCommission ? ', commission_rate' : ''})
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ? ${hasCommission ? ', ?' : ''})`;

            const insertParams = [
                orderNumber, userId, totalAmount, discountAmount, finalAmount, currency, coupon_code || null, payment_method || 'credit_card', paymentStatus, orderStatus
            ];
            if (hasCommission) insertParams.push(commissionRate);

            [orderResult] = await pool.execute(insertQuery, insertParams);
        } catch (error) {
            throw error;
        }

        const orderId = orderResult.insertId;

        const [planCol] = await pool.execute(
            "SHOW COLUMNS FROM order_items LIKE 'plan_id'"
        );
        const hasPlanIdCol = planCol.length > 0;

        for (const item of orderItems) {
            if (hasPlanIdCol) {
                await pool.execute(
                    `INSERT INTO order_items (order_id, project_id, plan_id, price, quantity, subtotal)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [orderId, item.project_id, item.plan_id, item.price, item.quantity, item.subtotal]
                );
            } else if (item.plan_id) {
                return res.status(400).json({
                    error: 'Abonelik plani siparisi icin veritabani guncellemesi gerekli. Calistirin: node scripts/fix-order-items-plan-id.js',
                });
            } else {
                await pool.execute(
                    `INSERT INTO order_items (order_id, project_id, price, quantity, subtotal)
                     VALUES (?, ?, ?, ?, ?)`,
                    [orderId, item.project_id, item.price, item.quantity, item.subtotal]
                );
            }
        }

        // Sepeti temizle
        await pool.execute('DELETE FROM cart WHERE user_id = ?', [userId]);

        const transactionAmount = payment_method === 'balance' ? -finalAmount : finalAmount;
        const transactionStatus =
            paymentStatus === 'paid' ? 'completed' : paymentStatus === 'failed' ? 'failed' : 'pending';

        await pool.execute(
            `INSERT INTO transactions (user_id, order_id, type, amount, currency, status, payment_method, description)
             VALUES (?, ?, 'purchase', ?, ?, ?, ?, ?)`,
            [
                userId,
                orderId,
                transactionAmount,
                currency,
                transactionStatus,
                payment_method || 'credit_card',
                `Sipariş #${orderNumber}`,
            ]
        );

        // --- ABONELİK AKTİVASYONU (Eğer ödeme başarılıysa) ---
        // Abonelikler dijital hizmet olduğu için ve geri dönüşü zor olduğu için bunları otomatik onaylayabiliriz
        // Veya bunları da admin onaylı yapabiliriz. Şimdilik 'processing' durumunda kalsın, admin onaylayınca aktif olsun.
        if (paymentStatus === 'paid' && subscriptionItems.length > 0) {
            // NOT: Abonelikleri burada aktifleştirmiyoruz, admin onayına bırakıyoruz.
            // Eğer otomatik istenirse burası açılabilir.
            // Kullanıcı "onaylamadan para geçiyor" dediği için burada işlem yapmamak daha güvenli.
        }

        // KOMİSYON DAĞITIMI KALDIRILDI - Admin onayına taşınacak.

        res.status(201).json({
            message: 'Sipariş oluşturuldu',
            order: {
                id: orderId,
                order_number: orderNumber,
                total_amount: totalAmount,
                discount_amount: discountAmount,
                final_amount: finalAmount,
                items: orderItems
            }
        });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({
            error: 'Sunucu hatası',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
});

// Kullanıcı siparişlerini getir
router.get('/', authenticate, async (req, res) => {
    try {
        const { lang = 'tr' } = req.query;

        const [orders] = await pool.execute(
            `SELECT o.*, 
             COUNT(oi.id) as item_count,
             GROUP_CONCAT(
                 JSON_OBJECT(
                     'id', oi.id,
                     'project_id', oi.project_id,
                     'plan_id', oi.plan_id,
                     'project_title', COALESCE(ct.title, p.title),
                     'plan_name', sp.name,
                     'quantity', oi.quantity,
                     'price', oi.price,
                     'type', CASE WHEN oi.plan_id IS NOT NULL THEN 'subscription' ELSE 'project' END
                 ) SEPARATOR '|||'
             ) as items_json
             FROM orders o
             LEFT JOIN order_items oi ON o.id = oi.order_id
             LEFT JOIN projects p ON oi.project_id = p.id
             LEFT JOIN subscription_plans sp ON oi.plan_id = sp.id
             LEFT JOIN content_translations ct ON ct.content_id = p.id 
                 AND ct.content_type = 'project' 
                 AND ct.language_code = ?
             WHERE o.user_id = ?
             GROUP BY o.id
             ORDER BY o.created_at DESC`,
            [lang, req.user.id]
        );

        // items_json'u parse et
        const ordersWithItems = orders.map(order => {
            if (order.items_json) {
                try {
                    order.items = order.items_json.split('|||').map(item => JSON.parse(item));
                } catch (e) {
                    order.items = [];
                }
            } else {
                order.items = [];
            }
            delete order.items_json;
            return order;
        });

        res.json({ orders: ordersWithItems });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Sipariş detayı
router.get('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        // Sipariş bilgisi
        const [orders] = await pool.execute(
            'SELECT * FROM orders WHERE id = ? AND user_id = ?',
            [id, req.user.id]
        );

        if (orders.length === 0) {
            return res.status(404).json({ error: 'Sipariş bulunamadı' });
        }

        const order = orders[0];

        // Sipariş kalemleri (Hem projeler hem planlar)
        const [orderItems] = await pool.execute(
            `SELECT oi.*, 
                    p.title as project_title, p.slug as project_slug, p.user_id as seller_id,
                    u.username as seller_username, u.email as seller_email,
                    sp.name as plan_name, sp.slug as plan_slug, sp.billing_period,
                    (SELECT image_path FROM project_images WHERE project_id = p.id AND is_primary = 1 LIMIT 1) as image
             FROM order_items oi
             LEFT JOIN projects p ON oi.project_id = p.id
             LEFT JOIN subscription_plans sp ON oi.plan_id = sp.id
             LEFT JOIN users u ON p.user_id = u.id
             WHERE oi.order_id = ?`,
            [id]
        );

        // Her ürün için tüm görselleri getir (sadece projeler için)
        for (let item of orderItems) {
            if (item.project_id) {
                // URL'leri düzelt
                if (item.image) {
                    item.image = `/uploads/${item.image}`;
                }

                // Tüm görselleri getir
                const [images] = await pool.execute(
                    `SELECT image_path, is_primary 
                     FROM project_images 
                     WHERE project_id = ? 
                     ORDER BY is_primary DESC, id ASC`,
                    [item.project_id]
                );

                item.images = images.map(img => ({
                    path: `/uploads/${img.image_path}`,
                    is_primary: img.is_primary
                }));

                // Eğer görsel yoksa boş array
                if (!item.images || item.images.length === 0) {
                    item.images = [];
                }

                // Proje için title ve slug'ı düzelt
                item.title = item.project_title;
                item.slug = item.project_slug;
                
                // Proje dosyalarını getir (sadece ödenmiş siparişler için)
                if (order.payment_status === 'paid' && order.order_status !== 'cancelled') {
                    try {
                        const [files] = await pool.execute(
                            `SELECT id, file_name, file_path, file_size, file_type, version, is_latest
                             FROM project_files 
                             WHERE project_id = ? AND is_latest = 1
                             ORDER BY created_at DESC`,
                            [item.project_id]
                        );
                        
                        const formatFileSize = (bytes) => {
                            if (!bytes || bytes === 0) return 'N/A';
                            const k = 1024;
                            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
                            const i = Math.floor(Math.log(bytes) / Math.log(k));
                            return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
                        };
                        
                        item.download_files = files.map(file => ({
                            id: file.id,
                            name: file.file_name,
                            size: formatFileSize(file.file_size),
                            url: file.file_path ? `${process.env.API_URL || 'http://localhost:5000'}/uploads/${file.file_path}` : null,
                            type: file.file_type,
                            version: file.version
                        }));
                    } catch (fileError) {
                        console.warn('Project files fetch error:', fileError);
                        item.download_files = [];
                    }
                } else {
                    item.download_files = [];
                }
            } else if (item.plan_id) {
                // Plan için title ve slug'ı düzelt
                item.title = item.plan_name;
                item.slug = item.plan_slug;
                item.type = 'subscription';
            }
        }

        // Transaction bilgisi
        const [transactions] = await pool.execute(
            'SELECT * FROM transactions WHERE order_id = ? ORDER BY created_at DESC LIMIT 1',
            [id]
        );

        // Eğer card_number yoksa ve payment_method credit_card ise, user_payment_cards'dan al
        if (!order.card_number && order.payment_method === 'credit_card') {
            const [cards] = await pool.execute(
                'SELECT masked_number, card_holder FROM user_payment_cards WHERE user_id = ? AND is_default = 1 LIMIT 1',
                [req.user.id]
            );
            if (cards.length > 0) {
                order.card_number = cards[0].masked_number;
                order.card_holder = cards[0].card_holder;
            }
        }

        res.json({
            order: {
                ...order,
                items: orderItems,
                transaction: transactions[0] || null
            }
        });
    } catch (error) {
        console.error('Get order detail error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Sipariş iptal
router.post('/:id/cancel', authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        // Sipariş kontrolü
        const [orders] = await pool.execute(
            'SELECT * FROM orders WHERE id = ? AND user_id = ?',
            [id, req.user.id]
        );

        if (orders.length === 0) {
            return res.status(404).json({ error: 'Sipariş bulunamadı' });
        }

        const order = orders[0];

        // Sadece pending veya processing durumundaki siparişler iptal edilebilir
        if (order.order_status !== 'pending' && order.order_status !== 'processing') {
            return res.status(400).json({ error: 'Bu sipariş iptal edilemez' });
        }

        // Sipariş durumunu güncelle
        await pool.execute(
            'UPDATE orders SET order_status = ? WHERE id = ?',
            ['cancelled', id]
        );

        // Ödeme yapıldıysa iade işlemi başlatılabilir
        if (order.payment_status === 'paid') {
            await pool.execute(
                `INSERT INTO transactions (user_id, order_id, type, amount, currency, status, description)
                 VALUES (?, ?, 'refund', ?, ?, 'pending', ?)`,
                [
                    req.user.id,
                    id,
                    order.final_amount,
                    order.currency,
                    `Sipariş #${order.order_number} iadesi`
                ]
            );
        }

        res.json({ message: 'Sipariş iptal edildi' });
    } catch (error) {
        console.error('Cancel order error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Fatura bilgileri getir
router.get('/:id/invoice', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Sipariş bilgisi
        const [orders] = await pool.execute(
            'SELECT * FROM orders WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (orders.length === 0) {
            return res.status(404).json({ error: 'Sipariş bulunamadı' });
        }

        const order = orders[0];

        // Kullanıcı bilgileri
        const [users] = await pool.execute(
            'SELECT id, username, email, phone, first_name, last_name FROM users WHERE id = ?',
            [userId]
        );
        const user = users[0] || {};

        // Sipariş kalemleri
        const [orderItems] = await pool.execute(
            `SELECT oi.*, 
                    p.title as project_title,
                    sp.name as plan_name
             FROM order_items oi
             LEFT JOIN projects p ON oi.project_id = p.id
             LEFT JOIN subscription_plans sp ON oi.plan_id = sp.id
             WHERE oi.order_id = ?
             ORDER BY oi.id`,
            [id]
        );

        // KDV ve komisyon hesaplamaları
        const vatRate = 18;
        const subtotal = parseFloat(order.final_amount || order.total_amount || 0);
        const discountAmount = parseFloat(order.discount_amount || 0);
        const netAmount = Math.round((subtotal / (1 + (vatRate / 100))) * 100) / 100;
        const vatAmount = Math.round((subtotal - netAmount) * 100) / 100;

        // Fatura numarası oluştur
        const invoiceNumber = `INV-${order.order_number || order.id}-${Date.now().toString().slice(-6)}`;

        // Fatura tarihi
        const invoiceDate = new Date(order.created_at);

        res.json({
            invoice: {
                invoice_number: invoiceNumber,
                invoice_date: invoiceDate.toISOString(),
                order_number: order.order_number,
                order_id: order.id,
                user: {
                    name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username,
                    email: user.email,
                    phone: user.phone,
                    username: user.username
                },
                billing_info: order.billing_info ? (typeof order.billing_info === 'string' ? JSON.parse(order.billing_info) : order.billing_info) : null,
                items: orderItems.map(item => ({
                    title: item.project_title || item.plan_name || 'Ürün',
                    quantity: item.quantity || 1,
                    unit_price: parseFloat(item.price || 0),
                    total_price: parseFloat(item.subtotal || 0)
                })),
                subtotal: netAmount,
                discount: discountAmount,
                tax_rate: vatRate,
                tax_amount: vatAmount,
                total: subtotal,
                currency: order.currency || 'TRY',
                payment_method: order.payment_method || 'credit_card',
                payment_status: order.payment_status,
                order_status: order.order_status
            }
        });
    } catch (error) {
        console.error('Get invoice error:', error);
        res.status(500).json({ error: 'Sunucu hatası', details: error.message });
    }
});

// Bank transfer notification (Banka havalesi bildirimi)
router.post('/bank-transfer-notification', authenticate, receiptUpload.single('receipt_file'), async (req, res) => {
    try {
        const { receipt_number, reference_number, notes, order_id } = req.body;
        const userId = req.user.id;
        const receiptFile = req.file;

        if (!receipt_number) {
            return res.status(400).json({ error: 'Dekont numarası zorunludur' });
        }

        let orderId;

        // Eğer order_id gönderilmişse onu kullan, yoksa son siparişi bul
        if (order_id) {
            // Siparişin kullanıcıya ait olduğunu kontrol et
            const [orders] = await pool.execute(
                `SELECT id, order_number, payment_method, payment_status FROM orders 
                 WHERE id = ? AND user_id = ?`,
                [order_id, userId]
            );

            if (orders.length === 0) {
                return res.status(404).json({ error: 'Sipariş bulunamadı' });
            }

            const order = orders[0];
            if (order.payment_method !== 'bank_transfer') {
                return res.status(400).json({ error: 'Bu sipariş banka havalesi ile ödenemez' });
            }

            if (order.payment_status === 'paid') {
                return res.status(400).json({ error: 'Bu sipariş zaten ödenmiş' });
            }

            orderId = order.id;
        } else {
            // Son siparişi bul (bank transfer ile)
            const [orders] = await pool.execute(
                `SELECT id, order_number FROM orders 
                 WHERE user_id = ? AND payment_method = 'bank_transfer' AND payment_status = 'pending'
                 ORDER BY created_at DESC LIMIT 1`,
                [userId]
            );

            if (orders.length === 0) {
                return res.status(400).json({ error: 'Banka havalesi ile ödenmemiş sipariş bulunamadı' });
            }

            orderId = orders[0].id;
        }

        const receiptPath = receiptFile ? `/uploads/receipts/${receiptFile.filename}` : null;

        // Bildirimi kaydet
        await pool.execute(
            `INSERT INTO bank_transfer_notifications 
             (order_id, user_id, receipt_number, reference_number, receipt_file, notes, status, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())`,
            [orderId, userId, receipt_number, reference_number || null, receiptPath, notes || null]
        );

        // Sipariş durumunu güncelle
        await pool.execute(
            `UPDATE orders SET payment_status = 'pending_review' WHERE id = ?`,
            [orderId]
        );

        res.json({ 
            message: 'Ödeme bildirimi başarıyla gönderildi',
            order_id: orderId
        });
    } catch (error) {
        console.error('Bank transfer notification error:', error);
        console.error('Error stack:', error.stack);
        console.error('Request body:', req.body);
        console.error('Request file:', req.file);
        res.status(500).json({ 
            error: 'Sunucu hatası', 
            details: error.message,
            sqlMessage: error.sqlMessage || null,
            code: error.code || null
        });
    }
});

export default router;

