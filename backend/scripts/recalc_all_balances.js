import pool from '../config/database.js';

const recalcAllBalances = async () => {
    try {
        console.log('🔄 Tüm bakiyeler yeniden hesaplanıyor...');

        // 1. Admin Kullanıcısını Bul (Rolü admin olan ilk kullanıcı)
        const [adminRoles] = await pool.execute("SELECT id FROM user_roles WHERE slug = 'admin' LIMIT 1");
        const adminRoleId = adminRoles[0]?.id;
        let adminUserId = 1; // Default

        if (adminRoleId) {
            const [admins] = await pool.execute('SELECT id FROM users WHERE role_id = ? ORDER BY id ASC LIMIT 1', [adminRoleId]);
            if (admins.length > 0) adminUserId = admins[0].id;
        }
        console.log(`👤 Admin ID: ${adminUserId}`);

        // --- ADMIN BAKİYE HESABI ---
        // Komisyonlar
        const [commissions] = await pool.execute(
            "SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND type = 'commission' AND status = 'completed'",
            [adminUserId]
        );
        // Vergiler
        const [taxes] = await pool.execute(
            "SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND type = 'tax' AND status = 'completed'",
            [adminUserId]
        );
        // Bağışlar (Platforma yapılanlar)
        // Eğer donations tablosu varsa ve project_id null ise platform bağışıdır.
        let donationsTotal = 0;
        try {
            const [donations] = await pool.execute(
                "SELECT COALESCE(SUM(amount), 0) as total FROM donations WHERE payment_status = 'paid'"
            );
            donationsTotal = parseFloat(donations[0]?.total || 0);
        } catch (e) {
            console.log('Bağış tablosu yok veya hata:', e.message);
        }

        const adminTotal = parseFloat(commissions[0].total) + parseFloat(taxes[0].total) + donationsTotal;
        const roundedAdminTotal = Math.round(adminTotal * 100) / 100;

        console.log(`💰 Admin Kazancı Hesaplanıyor:
        - Komisyonlar: ${commissions[0].total}
        - Vergiler: ${taxes[0].total}
        - Bağışlar: ${donationsTotal}
        = Toplam: ${roundedAdminTotal}`);

        await pool.execute('UPDATE users SET balance = ? WHERE id = ?', [roundedAdminTotal, adminUserId]);


        // --- DİĞER KULLANICILAR (Hasanperto vb.) ---
        const [users] = await pool.execute('SELECT id, username, email FROM users WHERE id != ?', [adminUserId]);

        for (const user of users) {
            // 1. Satış Gelirleri (Transactions: sale)
            const [sales] = await pool.execute(
                "SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND type = 'sale' AND status = 'completed'",
                [user.id]
            );
            const salesIncome = parseFloat(sales[0].total || 0);

            // 2. Para Yatırma (Payment Requests: approved)
            let depositIncome = 0;
            try {
                const [deposits] = await pool.execute(
                    "SELECT COALESCE(SUM(amount), 0) as total FROM payment_requests WHERE user_id = ? AND status = 'approved'",
                    [user.id]
                );
                depositIncome = parseFloat(deposits[0].total || 0);
            } catch (e) { }

            // 3. Para Çekme (Withdrawals: completed) - EKSİ
            const [withdrawals] = await pool.execute(
                "SELECT COALESCE(SUM(amount), 0) as total FROM withdrawals WHERE user_id = ? AND status = 'completed'",
                [user.id]
            );
            const withdrawnAmount = parseFloat(withdrawals[0].total || 0);

            // Bakiye Hesaplama
            let balance = (salesIncome + depositIncome) - withdrawnAmount;
            balance = Math.round(balance * 100) / 100;

            // Güncelleme
            await pool.execute('UPDATE users SET balance = ? WHERE id = ?', [balance, user.id]);

            if (user.username === 'hasanperto' || balance > 0) {
                console.log(`👤 ${user.username}:
                + Satış: ${salesIncome}
                + Yatırılan: ${depositIncome}
                - Çekilen: ${withdrawnAmount}
                = Bakiye: ${balance}`);
            }
        }

        console.log('✅ Tüm bakiyeler güncellendi.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Hata:', error);
        process.exit(1);
    }
};

recalcAllBalances();
