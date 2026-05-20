import pool from '../config/database.js';

const fixBalances = async () => {
    try {
        console.log('🔄 Satıcı bakiyeleri senkronize ediliyor...');

        // Tüm kullanıcıları al (Sadece işlem yapmış olanları da alabiliriz ama hepsi daha garanti)
        const [users] = await pool.execute('SELECT id, username, balance FROM users');

        for (const user of users) {
            // 1. Toplam Net Kazanç (Transactions)
            const [earnings] = await pool.execute(
                `SELECT COALESCE(SUM(amount), 0) as total 
                 FROM transactions 
                 WHERE user_id = ? AND type = 'sale' AND status = 'completed'`,
                [user.id]
            );
            const totalEarnings = parseFloat(earnings[0].total || 0);

            // 2. Toplam Onaylanmış Çekim (Withdrawals)
            const [withdrawals] = await pool.execute(
                `SELECT COALESCE(SUM(amount), 0) as total 
                 FROM withdrawals 
                 WHERE user_id = ? AND status = 'completed'`,
                [user.id]
            );
            const totalWithdrawn = parseFloat(withdrawals[0].total || 0);

            // 3. Doğru Bakiye Hesabı & Yuvarlama (2 hane)
            let correctBalance = totalEarnings - totalWithdrawn;
            correctBalance = Math.round(correctBalance * 100) / 100;

            // 4. Güncelleme (Sadece fark varsa)
            const currentBalance = parseFloat(user.balance || 0);

            if (Math.abs(currentBalance - correctBalance) > 0.01) {
                console.log(`⚠️ Düzeltme: ${user.username} (ID: ${user.id}) -> Eski: ${currentBalance}, Yeni: ${correctBalance}`);
                await pool.execute(
                    'UPDATE users SET balance = ? WHERE id = ?',
                    [correctBalance, user.id]
                );
            }
        }

        console.log('✅ Bakiye senkronizasyonu tamamlandı.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Hata:', error);
        process.exit(1);
    }
};

fixBalances();
