import pool from '../config/database.js';

/**
 * Bağış yapıldığında bakiyeden düşülmemiş olanları düzeltir
 */
const fixDonationBalances = async () => {
    try {
        console.log('🔄 Bağış bakiyeleri kontrol ediliyor...\n');

        // Bakiye ile yapılan bağışları bul
        const [donations] = await pool.execute(
            `SELECT pd.id, pd.user_id, pd.amount, pd.status, pd.payment_method, pd.created_at, u.username, u.balance
             FROM project_donations pd
             INNER JOIN users u ON pd.user_id = u.id
             WHERE pd.payment_method = 'balance'
             AND pd.status = 'completed'
             ORDER BY pd.created_at DESC`
        );

        console.log(`📊 ${donations.length} adet bakiye ile yapılan bağış bulundu\n`);

        let fixedCount = 0;
        let totalDeducted = 0;

        for (const donation of donations) {
            const userId = donation.user_id;
            const amount = parseFloat(donation.amount);
            const currentBalance = parseFloat(donation.balance || 0);

            // Bu bağış için purchase tipinde transaction var mı kontrol et
            const [purchaseTrans] = await pool.execute(
                `SELECT id, amount FROM transactions 
                 WHERE user_id = ? 
                 AND type = 'purchase' 
                 AND amount = ?
                 AND description LIKE ?
                 AND created_at BETWEEN DATE_SUB(?, INTERVAL 1 HOUR) AND DATE_ADD(?, INTERVAL 1 HOUR)`,
                [userId, -amount, `%Bağış%`, donation.created_at, donation.created_at]
            );

            // Eğer purchase transaction yoksa, bakiyeden düşülmemiş demektir
            if (purchaseTrans.length === 0) {
                console.log(`⚠️  Düzeltme: ${donation.username} (ID: ${userId})`);
                console.log(`   Bağış: ${amount} TL, Mevcut Bakiye: ${currentBalance} TL`);

                // Bakiyeden düş
                const newBalance = Math.max(0, currentBalance - amount);
                await pool.execute(
                    'UPDATE users SET balance = ? WHERE id = ?',
                    [newBalance, userId]
                );

                // Purchase transaction kaydı oluştur
                const [donationInfo] = await pool.execute(
                    'SELECT p.title FROM project_donations pd INNER JOIN projects p ON pd.project_id = p.id WHERE pd.id = ?',
                    [donation.id]
                );
                const projectTitle = donationInfo.length > 0 ? donationInfo[0].title : 'Proje';

                await pool.execute(
                    `INSERT INTO transactions (user_id, amount, type, status, description, payment_method, transaction_id)
                     VALUES (?, ?, 'purchase', 'completed', ?, 'balance', ?)`,
                    [userId, -amount, `Bağış: ${projectTitle}`, `DON-BAL-FIX-${donation.id}`]
                );

                fixedCount++;
                totalDeducted += amount;

                console.log(`   ✅ Düzeltildi: Bakiye ${currentBalance} → ${newBalance} TL\n`);
            }
        }

        // Özet
        console.log(`\n📊 ÖZET:`);
        console.log(`   - Kontrol edilen bağış: ${donations.length}`);
        console.log(`   - Düzeltilen bağış: ${fixedCount}`);
        console.log(`   - Toplam düşülen bakiye: ${totalDeducted.toFixed(2)} TL`);

        if (fixedCount === 0) {
            console.log(`\n✅ Tüm bağışlar doğru işlenmiş!`);
        } else {
            console.log(`\n✅ ${fixedCount} adet bağış düzeltildi!`);
        }

        process.exit(0);

    } catch (error) {
        console.error('❌ Hata:', error);
        process.exit(1);
    }
};

fixDonationBalances();
