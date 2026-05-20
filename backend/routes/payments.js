import express from 'express';
import pool from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import paymentService from '../services/paymentService.js';

const router = express.Router();

// Ödeme işlemi başlat (Stripe/Iyzico için hazırlık)
router.post('/process', authenticate, async (req, res) => {
    try {
        const { order_id, payment_method, payment_data } = req.body;
        const userId = req.user.id;

        if (!order_id) {
            return res.status(400).json({ error: 'Sipariş ID gereklidir' });
        }

        // Sipariş kontrolü
        const [orders] = await pool.execute(
            'SELECT * FROM orders WHERE id = ? AND user_id = ?',
            [order_id, userId]
        );

        if (orders.length === 0) {
            return res.status(404).json({ error: 'Sipariş bulunamadı' });
        }

        const order = orders[0];

        // Ödeme durumu kontrolü
        if (order.payment_status === 'paid') {
            // Eğer bakiye ile ödeme yapıldıysa ve bakiyeden düşülmemişse, düş
            if (order.payment_method === 'balance' || payment_method === 'balance') {
                // Daha önce purchase transaction var mı kontrol et
                const [existingPurchase] = await pool.execute(
                    'SELECT id, amount FROM transactions WHERE order_id = ? AND user_id = ? AND type = "purchase" AND payment_method = "balance"',
                    [order_id, userId]
                );
                
                // Eğer transaction varsa ve pozitif ise (düşülmemiş), bakiyeyi düş
                if (existingPurchase.length > 0 && parseFloat(existingPurchase[0].amount) > 0) {
                    const orderAmount = parseFloat(order.final_amount);
                    const [userData] = await pool.execute('SELECT balance FROM users WHERE id = ?', [userId]);
                    const currentBalance = parseFloat(userData[0]?.balance || 0);
                    
                    if (currentBalance >= orderAmount) {
                        // Bakiyeyi düş
                        await pool.execute(
                            'UPDATE users SET balance = balance - ? WHERE id = ?',
                            [orderAmount, userId]
                        );
                        
                        // Transaction'ı negatif yap
                        await pool.execute(
                            'UPDATE transactions SET amount = ? WHERE id = ?',
                            [-orderAmount, existingPurchase[0].id]
                        );
                    }
                }
            }
            return res.status(400).json({ error: 'Bu sipariş zaten ödendi' });
        }

        // Bakiye ile ödeme kontrolü
        if (payment_method === 'balance') {
            // Kullanıcı bakiyesini kontrol et
            const [userData] = await pool.execute('SELECT balance FROM users WHERE id = ?', [userId]);
            const currentBalance = parseFloat(userData[0]?.balance || 0);
            const orderAmount = parseFloat(order.final_amount);

            if (currentBalance < orderAmount) {
                return res.status(400).json({ error: 'Bakiyeniz yetersiz. Mevcut bakiye: ' + currentBalance.toFixed(2) + ' TL' });
            }

            // Bakiyeyi düş
            await pool.execute(
                'UPDATE users SET balance = balance - ? WHERE id = ?',
                [orderAmount, userId]
            );

            // Purchase transaction kaydı oluştur (negatif tutar)
            const transactionId = `TXN-BAL-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
            
            // Önce mevcut transaction var mı kontrol et (order oluşturulurken zaten oluşturulmuş olabilir)
            const [existingTrans] = await pool.execute(
                'SELECT id, amount FROM transactions WHERE order_id = ? AND user_id = ? AND type = "purchase"',
                [order_id, userId]
            );
            
            if (existingTrans.length > 0) {
                // Mevcut transaction'ı güncelle (negatif tutar ve bakiye bilgisi)
                await pool.execute(
                    `UPDATE transactions 
                     SET amount = ?, 
                         status = 'completed',
                         payment_method = 'balance',
                         transaction_id = ?,
                         description = ?
                     WHERE id = ?`,
                    [
                        -orderAmount, // Negatif tutar (bakiye düşüşü)
                        transactionId,
                        `Sipariş Ödemesi: #${order.order_number}`,
                        existingTrans[0].id
                    ]
                );
            } else {
                // Yeni transaction oluştur
                await pool.execute(
                    `INSERT INTO transactions (user_id, order_id, type, amount, currency, status, description, payment_method, transaction_id)
                     VALUES (?, ?, 'purchase', ?, ?, 'completed', ?, 'balance', ?)`,
                    [
                        userId,
                        order_id,
                        -orderAmount, // Negatif tutar (bakiye düşüşü)
                        order.currency || 'TRY',
                        'completed',
                        `Sipariş Ödemesi: #${order.order_number}`,
                        'balance',
                        transactionId
                    ]
                );
            }
        }

        // Ödeme gateway işlemi
        let paymentResult = null;
        let transactionId = null;

        if (payment_method === 'balance') {
            // Bakiye ile ödeme zaten yukarıda işlendi
            const [balanceTrans] = await pool.execute(
                'SELECT transaction_id FROM transactions WHERE order_id = ? AND user_id = ? AND type = "purchase" AND payment_method = "balance" LIMIT 1',
                [order_id, userId]
            );
            if (balanceTrans.length > 0) {
                transactionId = balanceTrans[0].transaction_id;
            }
            paymentResult = {
                success: true,
                transaction_id: transactionId || `TXN-BAL-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                payment_method: 'balance',
                amount: order.final_amount,
                currency: order.currency
            };
        } else if (payment_method === 'stripe' || payment_method === 'credit_card') {
            // Stripe ödeme
            // Önce settings'i yükle
            await paymentService.loadPaymentSettings();
            
            const stripeResult = await paymentService.processStripePayment(
                parseFloat(order.final_amount),
                order.currency || 'TRY',
                payment_data || {},
                { order_id: order_id, user_id: userId }
            );
            
            if (stripeResult.success) {
                paymentResult = {
                    success: true,
                    transaction_id: stripeResult.transactionId,
                    payment_method: 'stripe',
                    amount: order.final_amount,
                    currency: order.currency,
                    client_secret: stripeResult.clientSecret
                };
            } else {
                return res.status(400).json({ 
                    error: stripeResult.error || 'Stripe ödeme başarısız',
                    details: stripeResult
                });
            }
        } else if (payment_method === 'iyzico') {
            // Iyzico ödeme
            // Önce settings'i yükle
            await paymentService.loadPaymentSettings();
            
            const iyzicoResult = await paymentService.processIyzicoPayment(
                parseFloat(order.final_amount),
                payment_data || {},
                { id: userId }
            );
            
            if (iyzicoResult.success) {
                paymentResult = {
                    success: true,
                    transaction_id: iyzicoResult.transactionId,
                    payment_method: 'iyzico',
                    amount: order.final_amount,
                    currency: order.currency
                };
            } else {
                return res.status(400).json({ 
                    error: iyzicoResult.error || 'Iyzico ödeme başarısız',
                    details: iyzicoResult
                });
            }
        } else if (payment_method === 'paypal') {
            // PayPal ödeme
            // Önce settings'i yükle
            await paymentService.loadPaymentSettings();
            
            const paypalResult = await paymentService.processPayPalPayment(
                parseFloat(order.final_amount),
                order.currency || 'TRY',
                payment_data || {}
            );
            
            if (paypalResult.success) {
                paymentResult = {
                    success: true,
                    transaction_id: paypalResult.transactionId,
                    payment_method: 'paypal',
                    amount: order.final_amount,
                    currency: order.currency
                };
            } else {
                return res.status(400).json({ 
                    error: paypalResult.error || 'PayPal ödeme başarısız',
                    details: paypalResult
                });
            }
        } else {
            // Diğer ödeme yöntemleri (havale vb.)
            paymentResult = {
                success: true,
                transaction_id: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                payment_method: payment_method || 'manual',
                amount: order.final_amount,
                currency: order.currency
            };
        }

        // Sipariş durumunu güncelle - Banka havalesi için durumu değiştirme
        const finalPaymentMethod = payment_method || order.payment_method;
        if (finalPaymentMethod !== 'bank_transfer') {
            // Banka havalesi dışındaki ödeme yöntemleri için durumu güncelle
            await pool.execute(
                `UPDATE orders 
                 SET payment_status = 'paid', 
                     order_status = 'processing',
                     payment_method = ?
                 WHERE id = ?`,
                [finalPaymentMethod, order_id]
            );
        } else {
            // Banka havalesi için sadece payment_method'u güncelle, durumu değiştirme
            await pool.execute(
                `UPDATE orders 
                 SET payment_method = ?
                 WHERE id = ?`,
                [finalPaymentMethod, order_id]
            );
        }

        // Transaction kaydını güncelle (bakiye ile ödeme yapıldıysa zaten oluşturulmuş, sadece güncelle)
        if (payment_method === 'balance') {
            // Bakiye ile ödeme için transaction zaten oluşturulmuş, sadece transaction_id güncelle
            await pool.execute(
                `UPDATE transactions 
                 SET status = 'completed', 
                     transaction_id = ?,
                     payment_method = 'balance'
                 WHERE order_id = ? AND user_id = ? AND type = 'purchase' AND payment_method = 'balance'`,
                [paymentResult.transaction_id, order_id, userId]
            );
        } else {
            // Diğer ödeme yöntemleri için transaction güncelle
            await pool.execute(
                `UPDATE transactions 
                 SET status = 'completed', 
                     transaction_id = ?,
                     payment_method = ?
                 WHERE order_id = ? AND type = 'purchase'`,
                [
                    paymentResult.transaction_id,
                    payment_method || 'credit_card',
                    order_id
                ]
            );
        }

        // KOMİSYON VE KDV DAĞITIMI (Ödeme başarılı olduğunda)
        try {
            // Ayarları getir (KDV ve Komisyon)
            let vatRate = 18;
            try {
                const [vatSetting] = await pool.execute("SELECT value FROM settings WHERE `key` = 'vat_rate' LIMIT 1");
                if (vatSetting.length > 0) vatRate = parseFloat(vatSetting[0].value) || 18;
            } catch (e) { }

            let commissionRate = 15;
            if (order.commission_rate) {
                commissionRate = parseFloat(order.commission_rate);
            } else {
                try {
                    const [commSetting] = await pool.execute("SELECT value FROM settings WHERE `key` = 'commission_rate' LIMIT 1");
                    if (commSetting.length > 0) commissionRate = parseFloat(commSetting[0].value) || 15;
                } catch (e) { }
            }

            // Admin kullanıcısını bul
            let adminUserId = null;
            try {
                const [adminRoles] = await pool.execute("SELECT id FROM user_roles WHERE slug = 'admin' LIMIT 1");
                if (adminRoles.length > 0) {
                    const [admins] = await pool.execute("SELECT id FROM users WHERE role_id = ? ORDER BY id ASC LIMIT 1", [adminRoles[0].id]);
                    if (admins.length > 0) adminUserId = admins[0].id;
                }
                if (!adminUserId) {
                    const [backupAdmins] = await pool.execute("SELECT id FROM users WHERE role_id = 1 ORDER BY id ASC LIMIT 1");
                    if (backupAdmins.length > 0) adminUserId = backupAdmins[0].id;
                }
            } catch (adminErr) {
                console.error('[PAYMENT] Admin user find error:', adminErr.message);
            }

            const roundMoney = (amount) => Math.round(amount * 100) / 100;

            // Sipariş kalemlerini getir
            const [orderItems] = await pool.execute('SELECT * FROM order_items WHERE order_id = ?', [order_id]);

            for (const item of orderItems) {
                if (!item.project_id) continue; // Sadece projeler için (abonelikler hariç)

                const [projects] = await pool.execute("SELECT user_id, title FROM projects WHERE id = ?", [item.project_id]);
                if (projects.length === 0) continue;
                const sellerId = projects[0].user_id;
                const projectTitle = projects[0].title;

                // Kupon indirimi dahil efektif tutar hesapla
                const itemTotal = parseFloat(item.subtotal || 0);
                let effectiveItemTotal = itemTotal;
                if (order.total_amount > 0 && order.discount_amount > 0) {
                    // Kupon indirimi orantılı olarak bu kaleme dağıtılır
                    effectiveItemTotal = itemTotal - ((itemTotal / order.total_amount) * order.discount_amount);
                }
                effectiveItemTotal = roundMoney(effectiveItemTotal);

                // KDV hariç tutar hesapla
                const netAmount = roundMoney(effectiveItemTotal / (1 + (vatRate / 100)));
                // KDV tutarı
                const vatAmount = roundMoney(effectiveItemTotal - netAmount);
                // Komisyon (KDV hariç tutar üzerinden)
                const commissionAmount = roundMoney((netAmount * commissionRate) / 100);
                // Satıcıya kalan (KDV hariç - komisyon) - Kupon indirimi zaten effectiveItemTotal'da düşülmüş
                const sellerShare = roundMoney(netAmount - commissionAmount);

                // Daha önce bu sipariş için işlem yapılmış mı kontrol et
                const [existingSellerTrans] = await pool.execute(
                    `SELECT id FROM transactions WHERE order_id = ? AND user_id = ? AND type = 'sale' AND description LIKE ?`,
                    [order_id, sellerId, `%${projectTitle}%`]
                );

                // A) Satıcıya Ödeme - 7 Günlük Bloke Sistemi (Eğer daha önce ödenmemişse)
                if (existingSellerTrans.length === 0 && sellerShare > 0) {
                    // Sipariş tarihinden 7 gün sonra çekilebilir olacak
                    // Sipariş tarihini orders tablosundan al
                    const [orderInfo] = await pool.execute('SELECT created_at FROM orders WHERE id = ?', [order_id]);
                    const orderDate = orderInfo.length > 0 ? new Date(orderInfo[0].created_at) : new Date();
                    const unblockDate = new Date(orderDate);
                    unblockDate.setDate(unblockDate.getDate() + 7); // Sipariş tarihinden 7 gün sonra
                    
                    // blocked_balance kolonunu kontrol et ve ekle
                    try {
                        await pool.execute("UPDATE users SET blocked_balance = COALESCE(blocked_balance, 0) + ? WHERE id = ?", [sellerShare, sellerId]);
                    } catch (blockedError) {
                        // Eğer blocked_balance kolonu yoksa balance'a ekle (geriye dönük uyumluluk)
                        console.warn('blocked_balance kolonu bulunamadı, balance kullanılıyor:', blockedError.message);
                        await pool.execute("UPDATE users SET balance = balance + ? WHERE id = ?", [sellerShare, sellerId]);
                    }
                    
                    // Transaction kaydı oluştur (unblock_date ile - sipariş tarihinden 7 gün sonra)
                    await pool.execute(
                        `INSERT INTO transactions (user_id, order_id, type, amount, currency, status, description, unblock_date)
                         VALUES (?, ?, 'sale', ?, ?, 'completed', ?, ?)`,
                        [sellerId, order_id, sellerShare, order.currency, `Proje Satışı: ${projectTitle} (#${order.order_number})`, unblockDate]
                    );
                }

                // B) Admin'e Ödeme (KDV + Komisyon) - Eğer daha önce ödenmemişse
                if (adminUserId) {
                    const [existingAdminTrans] = await pool.execute(
                        `SELECT id FROM transactions WHERE order_id = ? AND user_id = ? AND (type = 'commission' OR type = 'tax') AND description LIKE ?`,
                        [order_id, adminUserId, `%${projectTitle}%`]
                    );

                    if (existingAdminTrans.length === 0) {
                        const totalAdminEarnings = roundMoney(commissionAmount + vatAmount);
                        if (totalAdminEarnings > 0) {
                            await pool.execute("UPDATE users SET balance = balance + ? WHERE id = ?", [totalAdminEarnings, adminUserId]);
                            
                            // Komisyon transaction
                            if (commissionAmount > 0) {
                                await pool.execute(
                                    `INSERT INTO transactions (user_id, order_id, type, amount, currency, status, description)
                                     VALUES (?, ?, 'commission', ?, ?, 'completed', ?)`,
                                    [adminUserId, order_id, commissionAmount, order.currency, `Satış Komisyonu (%${commissionRate}): ${projectTitle}`]
                                );
                            }
                            
                            // KDV transaction
                            if (vatAmount > 0) {
                                await pool.execute(
                                    `INSERT INTO transactions (user_id, order_id, type, amount, currency, status, description)
                                     VALUES (?, ?, 'tax', ?, ?, 'completed', ?)`,
                                    [adminUserId, order_id, vatAmount, order.currency, `KDV Geliri (%${vatRate}): ${projectTitle}`]
                                );
                            }
                        }
                    }
                }
            }
        } catch (distributionError) {
            console.error('[PAYMENT] Distribution error:', distributionError);
            // Hata olsa bile ödeme başarılı sayılır, dağıtım admin onayında yapılabilir
        }

        res.json({
            success: true,
            message: 'Ödeme başarıyla tamamlandı',
            transaction: paymentResult
        });
    } catch (error) {
        console.error('Process payment error:', error);
        res.status(500).json({ error: 'Ödeme işlemi sırasında bir hata oluştu' });
    }
});

// Ödeme durumu kontrolü
router.get('/status/:order_id', authenticate, async (req, res) => {
    try {
        const { order_id } = req.params;
        const userId = req.user.id;

        const [orders] = await pool.execute(
            'SELECT payment_status, order_status FROM orders WHERE id = ? AND user_id = ?',
            [order_id, userId]
        );

        if (orders.length === 0) {
            return res.status(404).json({ error: 'Sipariş bulunamadı' });
        }

        res.json({
            payment_status: orders[0].payment_status,
            order_status: orders[0].order_status
        });
    } catch (error) {
        console.error('Get payment status error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Stripe payment intent oluştur (hazırlık)
router.post('/stripe/create-intent', authenticate, async (req, res) => {
    try {
        const { order_id, amount } = req.body;

        // TODO: Stripe API entegrasyonu
        // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        // const paymentIntent = await stripe.paymentIntents.create({
        //     amount: amount * 100, // Stripe cent cinsinden çalışır
        //     currency: 'try',
        //     metadata: { order_id }
        // });

        res.json({
            message: 'Stripe entegrasyonu yakında eklenecek',
            // client_secret: paymentIntent.client_secret
        });
    } catch (error) {
        console.error('Stripe create intent error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Iyzico ödeme başlat (hazırlık)
router.post('/iyzico/initialize', authenticate, async (req, res) => {
    try {
        const { order_id, amount, currency } = req.body;

        // TODO: Iyzico API entegrasyonu
        // const iyzipay = require('iyzipay');
        // const request = {
        //     locale: 'tr',
        //     conversationId: order_id,
        //     price: amount,
        //     paidPrice: amount,
        //     currency: currency || 'TRY',
        //     basketId: order_id,
        //     paymentChannel: 'WEB',
        //     paymentGroup: 'PRODUCT',
        //     callbackUrl: `${process.env.FRONTEND_URL}/payment/callback`
        // };

        res.json({
            message: 'Iyzico entegrasyonu yakında eklenecek',
            // payment_page_url: response.paymentPageUrl
        });
    } catch (error) {
        console.error('Iyzico initialize error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

export default router;

