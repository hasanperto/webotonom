import pool from '../config/database.js';

/**
 * Eksik transaction'ı oluşturur
 */
const fixMissingTransaction = async () => {
    try {
        const orderId = 19; // ORD-1769366199567-PY4AC4D0S
        const sellerId = 8; // saticihasan
        
        console.log(`\n🔧 Eksik Transaction Düzeltme\n`);
        console.log('='.repeat(60));

        // 1. Sipariş bilgilerini getir
        const [orders] = await pool.execute(
            `SELECT 
                o.*,
                oi.project_id,
                oi.subtotal,
                p.title as project_title,
                p.user_id as seller_id
             FROM orders o
             INNER JOIN order_items oi ON o.id = oi.order_id
             INNER JOIN projects p ON oi.project_id = p.id
             WHERE o.id = ?`,
            [orderId]
        );

        if (orders.length === 0) {
            console.log('❌ Sipariş bulunamadı!');
            process.exit(1);
        }

        const order = orders[0];
        console.log(`\n📦 Sipariş Bilgileri:`);
        console.log(`   Sipariş No: ${order.order_number}`);
        console.log(`   Proje: ${order.project_title}`);
        console.log(`   Sipariş Tutarı: ${parseFloat(order.final_amount).toFixed(2)} TL`);
        console.log(`   Durum: ${order.order_status} / ${order.payment_status}`);

        // 2. Satıcı payını hesapla
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

        console.log(`\n💰 Hesaplama:`);
        console.log(`   KDV Hariç: ${netAmount.toFixed(2)} TL`);
        console.log(`   Komisyon (%${commissionRate}): ${commissionAmount.toFixed(2)} TL`);
        console.log(`   Satıcı Payı: ${sellerShare.toFixed(2)} TL`);

        // 3. Sipariş tarihinden 7 gün sonrasını hesapla
        const orderDate = new Date(order.created_at);
        const unblockDate = new Date(orderDate);
        unblockDate.setDate(unblockDate.getDate() + 7);

        console.log(`\n📅 Bloke Tarihi:`);
        console.log(`   Sipariş Tarihi: ${orderDate.toLocaleString('tr-TR')}`);
        console.log(`   Bloke Bitiş: ${unblockDate.toLocaleString('tr-TR')}`);

        // 4. Transaction oluştur
        console.log(`\n🔄 Transaction oluşturuluyor...`);
        
        // Bloke bakiyeye ekle
        await pool.execute(
            'UPDATE users SET blocked_balance = COALESCE(blocked_balance, 0) + ? WHERE id = ?',
            [sellerShare, sellerId]
        );

        // Transaction kaydı oluştur
        await pool.execute(
            `INSERT INTO transactions (user_id, order_id, type, amount, currency, status, description, unblock_date)
             VALUES (?, ?, 'sale', ?, ?, 'completed', ?, ?)`,
            [
                sellerId,
                orderId,
                sellerShare,
                order.currency || 'TRY',
                `Proje Satışı: ${order.project_title} (#${order.order_number})`,
                unblockDate
            ]
        );

        console.log(`✅ Transaction oluşturuldu!`);
        console.log(`   Satıcı bloke bakiyesine ${sellerShare.toFixed(2)} TL eklendi`);

        // 5. Kontrol
        const [updatedUser] = await pool.execute('SELECT balance, blocked_balance FROM users WHERE id = ?', [sellerId]);
        console.log(`\n📊 Güncel Bakiyeler:`);
        console.log(`   Çekilebilir: ${parseFloat(updatedUser[0].balance).toFixed(2)} TL`);
        console.log(`   Bloke: ${parseFloat(updatedUser[0].blocked_balance).toFixed(2)} TL`);

        console.log(`\n${'='.repeat(60)}\n`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Hata:', error);
        process.exit(1);
    }
};

fixMissingTransaction();
