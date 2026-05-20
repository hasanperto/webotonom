import pool from '../config/database.js';

const recalcAllBalances = async () => {
    try {
        console.log('🔄 Tüm bakiyeler yeniden hesaplanıyor (Bloke Bakiye Dahil)...\n');

        // 1. Admin Kullanıcısını Bul
        const [adminRoles] = await pool.execute("SELECT id FROM user_roles WHERE slug = 'admin' LIMIT 1");
        const adminRoleId = adminRoles[0]?.id;
        let adminUserId = 1;

        if (adminRoleId) {
            const [admins] = await pool.execute('SELECT id FROM users WHERE role_id = ? ORDER BY id ASC LIMIT 1', [adminRoleId]);
            if (admins.length > 0) adminUserId = admins[0].id;
        }
        console.log(`👤 Admin ID: ${adminUserId}\n`);

        // --- ADMIN BAKİYE HESABI ---
        console.log('💰 ADMIN BAKİYE HESAPLAMA:');
        
        const [commissions] = await pool.execute(
            "SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND type = 'commission' AND status = 'completed'",
            [adminUserId]
        );
        const commissionTotal = parseFloat(commissions[0].total || 0);
        console.log(`   + Komisyonlar: ${commissionTotal.toFixed(2)} TL`);

        const [taxes] = await pool.execute(
            "SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND type = 'tax' AND status = 'completed'",
            [adminUserId]
        );
        const taxTotal = parseFloat(taxes[0].total || 0);
        console.log(`   + KDV (Vergiler): ${taxTotal.toFixed(2)} TL`);

        let donationTotal = 0;
        try {
            const [donations] = await pool.execute(
                `SELECT COALESCE(SUM(amount), 0) as total 
                 FROM project_donations 
                 WHERE status = 'completed'`
            );
            donationTotal = parseFloat(donations[0]?.total || 0);
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

            // 1. Çekilebilir Bakiye: 7 günü geçmiş sale transaction'lar
            let availableBalance = 0;
            let blockedBalance = 0;
            
            try {
                // unblock_date kolonu var mı kontrol et
                const [availableSales] = await pool.execute(
                    `SELECT COALESCE(SUM(amount), 0) as total 
                     FROM transactions 
                     WHERE user_id = ? 
                     AND type = 'sale' 
                     AND status = 'completed'
                     AND (unblock_date IS NULL OR unblock_date <= NOW())`,
                    [user.id]
                );
                availableBalance = parseFloat(availableSales[0].total || 0);

                // 2. Bloke Bakiye: 7 günü geçmemiş sale transaction'lar
                const [blockedSales] = await pool.execute(
                    `SELECT COALESCE(SUM(amount), 0) as total 
                     FROM transactions 
                     WHERE user_id = ? 
                     AND type = 'sale' 
                     AND status = 'completed'
                     AND unblock_date IS NOT NULL
                     AND unblock_date > NOW()`,
                    [user.id]
                );
                blockedBalance = parseFloat(blockedSales[0].total || 0);
            } catch (e) {
                // unblock_date kolonu yoksa, tüm sale transaction'ları çekilebilir say
                const [allSales] = await pool.execute(
                    `SELECT COALESCE(SUM(amount), 0) as total 
                     FROM transactions 
                     WHERE user_id = ? 
                     AND type = 'sale' 
                     AND status = 'completed'`,
                    [user.id]
                );
                availableBalance = parseFloat(allSales[0].total || 0);
                blockedBalance = 0;
            }
            
            if (availableBalance > 0) {
                console.log(`   + Çekilebilir Satış Gelirleri: ${availableBalance.toFixed(2)} TL`);
            }
            if (blockedBalance > 0) {
                console.log(`   + Bloke Bakiye (7 gün): ${blockedBalance.toFixed(2)} TL`);
            }

            // 3. Para Yatırma - Transactions
            const [depositTransactions] = await pool.execute(
                "SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND type = 'deposit' AND status = 'completed'",
                [user.id]
            );
            const depositFromTransactions = parseFloat(depositTransactions[0].total || 0);
            if (depositFromTransactions > 0) {
                console.log(`   + Para Yatırma (Transactions): ${depositFromTransactions.toFixed(2)} TL`);
            }

            // 4. Para Yatırma - Payment Requests
            let depositFromRequests = 0;
            try {
                const [deposits] = await pool.execute(
                    "SELECT COALESCE(SUM(amount), 0) as total FROM payment_requests WHERE user_id = ? AND status = 'approved'",
                    [user.id]
                );
                depositFromRequests = parseFloat(deposits[0].total || 0);
                if (depositFromRequests > 0) {
                    console.log(`   + Para Yatırma (Payment Requests): ${depositFromRequests.toFixed(2)} TL`);
                }
            } catch (e) { }

            // 5. Para Çekme
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
            } catch (e) { }

            // Bakiye Hesaplama
            const balance = availableBalance + depositFromTransactions + depositFromRequests - withdrawnAmount;
            const roundedBalance = Math.round(balance * 100) / 100;
            const roundedBlocked = Math.round(blockedBalance * 100) / 100;

            console.log(`   = Çekilebilir Bakiye: ${roundedBalance.toFixed(2)} TL`);
            if (roundedBlocked > 0) {
                console.log(`   = Bloke Bakiye: ${roundedBlocked.toFixed(2)} TL`);
            }
            console.log(`   = Toplam: ${(roundedBalance + roundedBlocked).toFixed(2)} TL\n`);

            // Güncelleme
            try {
                await pool.execute('UPDATE users SET balance = ?, blocked_balance = ? WHERE id = ?', [roundedBalance, roundedBlocked, user.id]);
            } catch (e) {
                // Eğer blocked_balance kolonu yoksa sadece balance güncelle
                await pool.execute('UPDATE users SET balance = ? WHERE id = ?', [roundedBalance, user.id]);
            }
        }

        // Özet Rapor
        console.log('\n📊 ÖZET RAPOR:');
        const [allUsers] = await pool.execute(
            `SELECT u.id, u.username, u.balance, u.blocked_balance, ur.name as role_name
             FROM users u
             LEFT JOIN user_roles ur ON u.role_id = ur.id
             ORDER BY (COALESCE(u.balance, 0) + COALESCE(u.blocked_balance, 0)) DESC`
        );

        allUsers.forEach(u => {
            const total = parseFloat(u.balance || 0) + parseFloat(u.blocked_balance || 0);
            if (total > 0) {
                console.log(`   ${u.username} (${u.role_name || 'Kullanıcı'}):`);
                console.log(`      Çekilebilir: ${parseFloat(u.balance || 0).toFixed(2)} TL`);
                if (parseFloat(u.blocked_balance || 0) > 0) {
                    console.log(`      Bloke: ${parseFloat(u.blocked_balance || 0).toFixed(2)} TL`);
                }
                console.log(`      Toplam: ${total.toFixed(2)} TL`);
            }
        });

        const [totalStats] = await pool.execute(
            `SELECT 
                COALESCE(SUM(balance), 0) as total_available,
                COALESCE(SUM(blocked_balance), 0) as total_blocked
             FROM users`
        );

        console.log(`\n💰 Toplam Çekilebilir Bakiye: ${parseFloat(totalStats[0].total_available || 0).toFixed(2)} TL`);
        console.log(`💰 Toplam Bloke Bakiye: ${parseFloat(totalStats[0].total_blocked || 0).toFixed(2)} TL`);
        console.log(`💰 Toplam Sistem Bakiyesi: ${(parseFloat(totalStats[0].total_available || 0) + parseFloat(totalStats[0].total_blocked || 0)).toFixed(2)} TL`);

        console.log('\n✅ Tüm bakiyeler başarıyla güncellendi!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Hata:', error);
        process.exit(1);
    }
};

recalcAllBalances();
