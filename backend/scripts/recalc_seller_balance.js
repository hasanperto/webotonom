import pool from '../config/database.js';

/**
 * Satıcı bakiyesini transaction'lara göre yeniden hesaplar
 */
const recalcSellerBalance = async () => {
    try {
        const sellerId = 8; // saticihasan
        console.log(`\n🔄 Satıcı ID ${sellerId} (saticihasan) Bakiye Yeniden Hesaplama\n`);
        console.log('='.repeat(60));

        // 1. Tüm sale transaction'larını getir
        const [sales] = await pool.execute(
            `SELECT 
                t.id,
                t.order_id,
                t.amount,
                t.status,
                t.unblock_date,
                t.created_at,
                o.created_at as order_date
             FROM transactions t
             LEFT JOIN orders o ON t.order_id = o.id
             WHERE t.user_id = ? AND t.type = 'sale' AND t.status = 'completed'
             ORDER BY t.created_at DESC`,
            [sellerId]
        );

        console.log(`📊 ${sales.length} adet sale transaction bulundu\n`);

        let totalBlocked = 0;
        let totalAvailable = 0;
        const now = new Date();

        for (const sale of sales) {
            const amount = parseFloat(sale.amount);
            const orderDate = sale.order_date ? new Date(sale.order_date) : new Date(sale.created_at);
            
            // Sipariş tarihinden 7 gün sonrasını hesapla
            const calculatedUnblockDate = new Date(orderDate);
            calculatedUnblockDate.setDate(calculatedUnblockDate.getDate() + 7);
            
            if (calculatedUnblockDate > now) {
                totalBlocked += amount;
            } else {
                totalAvailable += amount;
            }
        }

        console.log(`💰 Hesaplanan Bakiyeler:`);
        console.log(`   Çekilebilir: ${totalAvailable.toFixed(2)} TL`);
        console.log(`   Bloke: ${totalBlocked.toFixed(2)} TL`);
        console.log(`   Toplam: ${(totalAvailable + totalBlocked).toFixed(2)} TL`);

        // 2. Çekimleri kontrol et
        const [withdrawals] = await pool.execute(
            `SELECT COALESCE(SUM(amount), 0) as total 
             FROM withdrawals 
             WHERE user_id = ? AND status != 'rejected'`,
            [sellerId]
        );
        const withdrawnTotal = parseFloat(withdrawals[0].total || 0);

        console.log(`\n💸 Çekilen Toplam: ${withdrawnTotal.toFixed(2)} TL`);

        // 3. Users tablosunu güncelle
        const newBalance = totalAvailable - withdrawnTotal;
        const newBlockedBalance = totalBlocked;

        console.log(`\n📝 Güncellenecek Bakiyeler:`);
        console.log(`   Çekilebilir Bakiye: ${newBalance.toFixed(2)} TL`);
        console.log(`   Bloke Bakiye: ${newBlockedBalance.toFixed(2)} TL`);

        // Güncelle
        await pool.execute(
            'UPDATE users SET balance = ?, blocked_balance = ? WHERE id = ?',
            [Math.max(0, newBalance), newBlockedBalance, sellerId]
        );

        console.log(`\n✅ Bakiye güncellendi!`);

        // 4. Kontrol
        const [updatedUser] = await pool.execute('SELECT balance, blocked_balance FROM users WHERE id = ?', [sellerId]);
        console.log(`\n📊 Güncellenmiş Bakiyeler:`);
        console.log(`   Çekilebilir: ${parseFloat(updatedUser[0].balance).toFixed(2)} TL`);
        console.log(`   Bloke: ${parseFloat(updatedUser[0].blocked_balance).toFixed(2)} TL`);
        console.log(`   Toplam: ${(parseFloat(updatedUser[0].balance) + parseFloat(updatedUser[0].blocked_balance)).toFixed(2)} TL`);

        console.log(`\n${'='.repeat(60)}\n`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Hata:', error);
        process.exit(1);
    }
};

recalcSellerBalance();
