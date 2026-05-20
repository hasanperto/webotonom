import pool from '../config/database.js';

const recalcAllBalances = async () => {
    try {
        console.log('🔄 Tüm bakiyeler yeniden hesaplanıyor...\n');

        // 1. Admin Kullanıcısını Bul
        const [adminRoles] = await pool.execute("SELECT id FROM user_roles WHERE slug = 'admin' LIMIT 1");
        const adminRoleId = adminRoles[0]?.id;
        let adminUserId = 1; // Default

        if (adminRoleId) {
            const [admins] = await pool.execute('SELECT id FROM users WHERE role_id = ? ORDER BY id ASC LIMIT 1', [adminRoleId]);
            if (admins.length > 0) adminUserId = admins[0].id;
        }
        console.log(`👤 Admin ID: ${adminUserId}\n`);

        // --- ADMIN BAKİYE HESABI ---
        console.log('💰 ADMIN BAKİYE HESAPLAMA:');
        
        // 1. Komisyonlar
        const [commissions] = await pool.execute(
            "SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND type = 'commission' AND status = 'completed'",
            [adminUserId]
        );
        const commissionTotal = parseFloat(commissions[0].total || 0);
        console.log(`   + Komisyonlar: ${commissionTotal.toFixed(2)} TL`);

        // 2. KDV (Vergiler)
        const [taxes] = await pool.execute(
            "SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND type = 'tax' AND status = 'completed'",
            [adminUserId]
        );
        const taxTotal = parseFloat(taxes[0].total || 0);
        console.log(`   + KDV (Vergiler): ${taxTotal.toFixed(2)} TL`);

        // 3. Bağışların tamamı (project_donations - Admin %100 alıyor)
        let donationTotal = 0;
        try {
            const [donations] = await pool.execute(
                `SELECT COALESCE(SUM(amount), 0) as total 
                 FROM project_donations 
                 WHERE status = 'completed'`
            );
            donationTotal = parseFloat(donations[0]?.total || 0); // Admin %100 alıyor
            console.log(`   + Bağışlar (Tamamı): ${donationTotal.toFixed(2)} TL`);
        } catch (e) {
            console.log('   ⚠️  Bağış tablosu kontrol edilemedi:', e.message);
        }

        const adminTotal = commissionTotal + taxTotal + donationTotal;
        const roundedAdminTotal = Math.round(adminTotal * 100) / 100;

        console.log(`   = TOPLAM: ${roundedAdminTotal.toFixed(2)} TL\n`);

        await pool.execute('UPDATE users SET balance = ? WHERE id = ?', [roundedAdminTotal, adminUserId]);
        console.log(`✅ Admin bakiyesi güncellendi: ${roundedAdminTotal.toFixed(2)} TL\n`);

        // --- DİĞER KULLANICILAR ---
        const [users] = await pool.execute('SELECT id, username, email, role_id FROM users WHERE id != ?', [adminUserId]);
        console.log(`📊 ${users.length} kullanıcının bakiyesi hesaplanıyor...\n`);

        for (const user of users) {
            console.log(`👤 ${user.username} (ID: ${user.id}):`);

            // 1. Satış Gelirleri (Transactions: sale)
            const [sales] = await pool.execute(
                "SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND type = 'sale' AND status = 'completed'",
                [user.id]
            );
            const salesIncome = parseFloat(sales[0].total || 0);
            console.log(`   + Satış Gelirleri: ${salesIncome.toFixed(2)} TL`);

            // 2. Para Yatırma - Transactions tablosundan (deposit tipi)
            const [depositTransactions] = await pool.execute(
                "SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND type = 'deposit' AND status = 'completed'",
                [user.id]
            );
            const depositFromTransactions = parseFloat(depositTransactions[0].total || 0);
            console.log(`   + Para Yatırma (Transactions): ${depositFromTransactions.toFixed(2)} TL`);

            // 3. Para Yatırma - Payment Requests tablosundan
            let depositFromRequests = 0;
            try {
                const [deposits] = await pool.execute(
                    "SELECT COALESCE(SUM(amount), 0) as total FROM payment_requests WHERE user_id = ? AND status = 'approved'",
                    [user.id]
                );
                depositFromRequests = parseFloat(deposits[0].total || 0);
                console.log(`   + Para Yatırma (Payment Requests): ${depositFromRequests.toFixed(2)} TL`);
            } catch (e) {
                console.log('   ⚠️  Payment requests tablosu kontrol edilemedi');
            }

            // 4. Bağışlardan gelir YOK - Satıcılar sadece satış gelirlerinden kazanıyor
            // (Bağışların tamamı admin'e gidiyor)

            // 5. Para Çekme (Withdrawals: completed)
            let withdrawnAmount = 0;
            try {
                const [withdrawals] = await pool.execute(
                    "SELECT COALESCE(SUM(amount), 0) as total FROM withdrawals WHERE user_id = ? AND status = 'completed'",
                    [user.id]
                );
                withdrawnAmount = parseFloat(withdrawals[0].total || 0);
                if (withdrawnAmount > 0) {
                    console.log(`   - Para Çekme: ${withdrawnAmount.toFixed(2)} TL`);
                }
            } catch (e) {
                console.log('   ⚠️  Withdrawals tablosu kontrol edilemedi');
            }

            // 6. Sipariş ödemeleri (purchase) - Bu kullanıcının bakiyesinden düşülmüş olmalı
            // Ancak bu zaten balance'dan düşülmüş olmalı, bu yüzden hesaplamaya dahil etmiyoruz

            // Bakiye Hesaplama (Bağış gelirleri dahil değil - sadece satış gelirleri)
            let balance = salesIncome + depositFromTransactions + depositFromRequests - withdrawnAmount;
            balance = Math.round(balance * 100) / 100;

            console.log(`   = BAKİYE: ${balance.toFixed(2)} TL\n`);

            // Güncelleme
            await pool.execute('UPDATE users SET balance = ? WHERE id = ?', [balance, user.id]);
        }

        // Özet Rapor
        console.log('\n📊 ÖZET RAPOR:');
        const [allUsers] = await pool.execute(
            `SELECT u.id, u.username, u.balance, ur.name as role_name
             FROM users u
             LEFT JOIN user_roles ur ON u.role_id = ur.id
             ORDER BY u.balance DESC`
        );

        allUsers.forEach(u => {
            console.log(`   ${u.username} (${u.role_name || 'Kullanıcı'}): ${parseFloat(u.balance || 0).toFixed(2)} TL`);
        });

        const [totalBalance] = await pool.execute('SELECT COALESCE(SUM(balance), 0) as total FROM users');
        console.log(`\n💰 Toplam Sistem Bakiyesi: ${parseFloat(totalBalance[0].total || 0).toFixed(2)} TL`);

        console.log('\n✅ Tüm bakiyeler başarıyla güncellendi!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Hata:', error);
        process.exit(1);
    }
};

recalcAllBalances();
