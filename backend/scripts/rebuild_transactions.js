import pool from '../config/database.js';

const rebuildTransactions = async () => {
    try {
        console.log('🔄 Eksik transaction kayıtları onarılıyor...');

        // 1. Durumu 'completed' veya 'paid' olan tüm sipariş kalemlerini çek
        // Sadece projesi olanlar (satıcı geliri)
        const [items] = await pool.execute(
            `SELECT oi.*, 
                    o.id as order_id, o.order_number, o.created_at, o.currency,
                    o.total_amount, o.discount_amount, o.commission_rate,
                    p.user_id as seller_id, p.title as project_title,
                    u.username as buyer_name
             FROM order_items oi
             INNER JOIN orders o ON oi.order_id = o.id
             INNER JOIN projects p ON oi.project_id = p.id
             LEFT JOIN users u ON o.user_id = u.id
             WHERE (o.order_status = 'completed' OR o.payment_status = 'paid')`
        );

        let addedCount = 0;

        for (const item of items) {
            // Bu kalem için transaction var mı?
            const [exists] = await pool.execute(
                `SELECT id FROM transactions 
                 WHERE order_id = ? AND user_id = ? AND type = 'sale' 
                 AND description LIKE ?`,
                [item.order_id, item.seller_id, `%${item.project_title}%`]
            );

            if (exists.length > 0) {
                continue; // Zaten var
            }

            // --- HESAPLAMA (Admin.js ile aynı mantık) ---
            const roundMoney = (amount) => Math.round(amount * 100) / 100;
            const vatRate = 18;

            const itemTotal = parseFloat(item.subtotal);
            let effectiveItemTotal = itemTotal;

            if (parseFloat(item.total_amount) > 0 && parseFloat(item.discount_amount) > 0) {
                effectiveItemTotal = itemTotal - ((itemTotal / parseFloat(item.total_amount)) * parseFloat(item.discount_amount));
            }
            effectiveItemTotal = roundMoney(effectiveItemTotal);

            const netAmount = roundMoney(effectiveItemTotal / (1 + (vatRate / 100)));
            const commissionRate = parseFloat(item.commission_rate || 15);
            const commissionAmount = roundMoney((netAmount * commissionRate) / 100);
            const sellerShare = roundMoney(netAmount - commissionAmount);

            if (sellerShare > 0) {
                console.log(`➕ Transaction ekleniyor: Sipariş #${item.order_number} -> Satıcı ${item.seller_id} -> Tutar: ${sellerShare}`);

                await pool.execute(
                    `INSERT INTO transactions (user_id, order_id, type, amount, currency, status, description, created_at)
                     VALUES (?, ?, 'sale', ?, ?, 'completed', ?, ?)`,
                    [
                        item.seller_id,
                        item.order_id,
                        sellerShare,
                        item.currency || 'TRY',
                        `Proje Satışı: ${item.project_title} (#${item.order_number})`,
                        item.created_at // Sipariş tarihiyle aynı yapalım
                    ]
                );
                addedCount++;
            }
        }

        console.log(`✅ ${addedCount} adet eksik transaction oluşturuldu.`);

        // 2. Bakiyeleri tekrar senkronize et
        console.log('🔄 Bakiyeler güncelleniyor...');

        // Transaction'ı olan tüm kullanıcıları bul
        const [users] = await pool.execute('SELECT DISTINCT user_id FROM transactions');

        for (const user of users) {
            const userId = user.user_id;

            // Toplam Kazanç
            const [earnings] = await pool.execute(
                `SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND type = 'sale' AND status = 'completed'`,
                [userId]
            );
            const totalEarnings = parseFloat(earnings[0].total || 0);

            // Toplam Çekilen
            const [withdrawals] = await pool.execute(
                `SELECT COALESCE(SUM(amount), 0) as total FROM withdrawals WHERE user_id = ? AND status = 'completed'`,
                [userId]
            );
            const totalWithdrawn = parseFloat(withdrawals[0].total || 0);

            const correctBalance = Math.round((totalEarnings - totalWithdrawn) * 100) / 100;

            await pool.execute('UPDATE users SET balance = ? WHERE id = ?', [correctBalance, userId]);
            console.log(`User ${userId} balance updated to: ${correctBalance}`);
        }

        process.exit(0);
    } catch (error) {
        console.error('Rebuild failed:', error);
        process.exit(1);
    }
};

rebuildTransactions();
