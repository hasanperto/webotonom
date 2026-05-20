import pool from '../config/database.js';

/**
 * Eksik transaction'ları bulur
 */
const checkMissingTransactions = async () => {
    try {
        const sellerId = 8; // saticihasan
        console.log(`\n🔍 Satıcı ID ${sellerId} (saticihasan) - Eksik Transaction Kontrolü\n`);
        console.log('='.repeat(60));

        // 1. Satıcının projelerine ait tüm siparişleri getir
        const [orders] = await pool.execute(
            `SELECT 
                o.id,
                o.order_number,
                o.final_amount,
                o.total_amount,
                o.discount_amount,
                o.commission_rate,
                o.payment_status,
                o.order_status,
                o.created_at,
                oi.project_id,
                oi.subtotal,
                p.title as project_title,
                p.user_id as seller_id
             FROM orders o
             INNER JOIN order_items oi ON o.id = oi.order_id
             INNER JOIN projects p ON oi.project_id = p.id
             WHERE p.user_id = ?
             ORDER BY o.created_at DESC`,
            [sellerId]
        );

        console.log(`📦 Toplam Sipariş: ${orders.length} adet\n`);

        // 2. Her sipariş için transaction var mı kontrol et
        const ordersWithoutTransaction = [];
        const ordersWithTransaction = [];

        for (const order of orders) {
            // Bu sipariş için sale transaction var mı?
            const [transactions] = await pool.execute(
                `SELECT id, amount, status, created_at, description
                 FROM transactions
                 WHERE order_id = ? AND user_id = ? AND type = 'sale'`,
                [order.id, sellerId]
            );

            if (transactions.length === 0) {
                ordersWithoutTransaction.push({
                    order: order,
                    reason: 'Transaction yok'
                });
            } else {
                ordersWithTransaction.push({
                    order: order,
                    transaction: transactions[0]
                });
            }
        }

        console.log(`✅ Transaction'ı Olan Siparişler: ${ordersWithTransaction.length} adet\n`);
        for (const item of ordersWithTransaction) {
            console.log(`   Sipariş: ${item.order.order_number}`);
            console.log(`   Durum: ${item.order.order_status} / ${item.order.payment_status}`);
            console.log(`   Transaction ID: ${item.transaction.id}`);
            console.log(`   Transaction Tutar: ${parseFloat(item.transaction.amount).toFixed(2)} TL`);
            console.log(`   Transaction Tarihi: ${new Date(item.transaction.created_at).toLocaleString('tr-TR')}`);
            console.log('');
        }

        console.log(`\n❌ Transaction'ı OLMAYAN Siparişler: ${ordersWithoutTransaction.length} adet\n`);
        
        if (ordersWithoutTransaction.length > 0) {
            for (const item of ordersWithoutTransaction) {
                const order = item.order;
                console.log(`   Sipariş: ${order.order_number}`);
                console.log(`   Sipariş ID: ${order.id}`);
                console.log(`   Proje: ${order.project_title}`);
                console.log(`   Sipariş Tutarı: ${parseFloat(order.final_amount).toFixed(2)} TL`);
                console.log(`   Durum: ${order.order_status} / ${order.payment_status}`);
                console.log(`   Sipariş Tarihi: ${new Date(order.created_at).toLocaleString('tr-TR')}`);
                
                // Neden transaction oluşmamış olabilir?
                let reason = '';
                if (order.payment_status !== 'paid') {
                    reason = '❌ Ödeme yapılmamış (payment_status != paid)';
                } else if (order.order_status !== 'completed') {
                    reason = '⏳ Sipariş henüz tamamlanmamış (order_status != completed)';
                } else {
                    reason = '⚠️ Sipariş tamamlanmış ama transaction oluşturulmamış (HATA!)';
                }
                console.log(`   Sebep: ${reason}`);
                
                // Satıcı payını hesapla
                const vatRate = 18;
                const itemTotal = parseFloat(order.subtotal || 0);
                let effectiveItemTotal = itemTotal;
                
                if (order.total_amount > 0 && order.discount_amount > 0) {
                    effectiveItemTotal = itemTotal - ((itemTotal / order.total_amount) * order.discount_amount);
                }
                
                const netAmount = Math.round((effectiveItemTotal / (1 + (vatRate / 100))) * 100) / 100;
                const commissionRate = parseFloat(order.commission_rate || 20);
                const commissionAmount = Math.round((netAmount * commissionRate / 100) * 100) / 100;
                const sellerShare = Math.round((netAmount - commissionAmount) * 100) / 100;
                
                console.log(`   Beklenen Satıcı Payı: ${sellerShare.toFixed(2)} TL`);
                console.log('');
            }
        } else {
            console.log('   ✅ Tüm siparişlerin transaction\'ı var!\n');
        }

        // 3. Özet
        console.log(`\n${'='.repeat(60)}`);
        console.log(`\n📊 ÖZET:\n`);
        console.log(`   Toplam Sipariş: ${orders.length} adet`);
        console.log(`   Transaction'ı Olan: ${ordersWithTransaction.length} adet`);
        console.log(`   Transaction'ı Olmayan: ${ordersWithoutTransaction.length} adet`);
        
        if (ordersWithoutTransaction.length > 0) {
            console.log(`\n⚠️ DİKKAT: ${ordersWithoutTransaction.length} adet sipariş için transaction oluşturulmamış!`);
            console.log(`   Bu siparişler için satıcıya ödeme yapılmamış demektir.`);
        }

        console.log(`\n${'='.repeat(60)}\n`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Hata:', error);
        process.exit(1);
    }
};

checkMissingTransactions();
