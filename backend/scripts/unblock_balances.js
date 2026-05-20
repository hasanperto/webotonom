import pool from '../config/database.js';

/**
 * 7 günü geçmiş bloke bakiyeleri çekilebilir bakiyeye aktarır
 * Bu script günlük olarak çalıştırılmalı (cron job)
 */
const unblockBalances = async () => {
    try {
        console.log('🔄 Bloke bakiyeler kontrol ediliyor...\n');

        // 7 günü geçmiş sale transaction'ları bul
        // Sipariş tarihinden 7 gün geçmiş olanları kontrol et
        const [expiredTransactions] = await pool.execute(
            `SELECT t.id, t.user_id, t.amount, t.order_id, t.description, t.unblock_date, o.created_at as order_date, u.username
             FROM transactions t
             INNER JOIN orders o ON t.order_id = o.id
             INNER JOIN users u ON t.user_id = u.id
             WHERE t.type = 'sale'
             AND t.status = 'completed'
             AND t.unblock_date IS NOT NULL
             AND DATE_ADD(o.created_at, INTERVAL 7 DAY) <= NOW()`
        );

        console.log(`📊 ${expiredTransactions.length} adet transaction'ın bloke süresi doldu\n`);

        let totalUnblocked = 0;
        const processedUsers = new Set();

        for (const transaction of expiredTransactions) {
            const userId = transaction.user_id;
            const amount = parseFloat(transaction.amount);

            // Kullanıcının bloke bakiyesini kontrol et
            const [user] = await pool.execute('SELECT blocked_balance, balance FROM users WHERE id = ?', [userId]);
            
            if (user.length === 0) continue;

            const currentBlocked = parseFloat(user[0].blocked_balance || 0);
            const currentBalance = parseFloat(user[0].balance || 0);

            // Bloke bakiyeden çıkar, çekilebilir bakiyeye ekle
            const newBlocked = Math.max(0, currentBlocked - amount);
            const newBalance = currentBalance + amount;

            await pool.execute(
                'UPDATE users SET blocked_balance = ?, balance = ? WHERE id = ?',
                [newBlocked, newBalance, userId]
            );

            totalUnblocked += amount;
            processedUsers.add(userId);

            console.log(`✅ User ${userId}: ${amount.toFixed(2)} TL bloke bakiye → çekilebilir bakiye`);
        }

        // Özet
        console.log(`\n📊 ÖZET:`);
        console.log(`   - İşlenen transaction: ${expiredTransactions.length}`);
        console.log(`   - Etkilenen kullanıcı: ${processedUsers.size}`);
        console.log(`   - Toplam aktarılan: ${totalUnblocked.toFixed(2)} TL`);

        // Güncel durum
        const [stats] = await pool.execute(
            `SELECT 
                COUNT(DISTINCT id) as users_with_blocked,
                SUM(blocked_balance) as total_blocked,
                SUM(balance) as total_available
             FROM users
             WHERE blocked_balance > 0`
        );

        if (stats.length > 0 && stats[0].users_with_blocked > 0) {
            console.log(`\n💰 GÜNCEL DURUM:`);
            console.log(`   - Bloke bakiyesi olan kullanıcı: ${stats[0].users_with_blocked}`);
            console.log(`   - Toplam bloke bakiye: ${parseFloat(stats[0].total_blocked || 0).toFixed(2)} TL`);
            console.log(`   - Toplam çekilebilir bakiye: ${parseFloat(stats[0].total_available || 0).toFixed(2)} TL`);
        }

        console.log('\n✅ Bloke bakiye aktarımı tamamlandı!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Hata:', error);
        process.exit(1);
    }
};

unblockBalances();
