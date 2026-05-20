import pool from '../config/database.js';

/**
 * Bloke bakiye sistemini uygular
 * 1. blocked_balance kolonunu ekler
 * 2. unblock_date kolonunu ekler
 * 3. Mevcut transaction'ları günceller
 */
const applyBlockedBalanceMigration = async () => {
    try {
        console.log('🔄 Bloke bakiye sistemi uygulanıyor...\n');

        // 1. Users tablosuna blocked_balance kolonu ekle
        console.log('📝 blocked_balance kolonu ekleniyor...');
        try {
            await pool.execute(`
                ALTER TABLE users 
                ADD COLUMN blocked_balance DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER balance
            `);
            console.log('✅ blocked_balance kolonu eklendi');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('ℹ️  blocked_balance kolonu zaten mevcut');
            } else {
                throw e;
            }
        }

        // 2. Transactions tablosuna unblock_date kolonu ekle
        console.log('📝 unblock_date kolonu ekleniyor...');
        try {
            await pool.execute(`
                ALTER TABLE transactions 
                ADD COLUMN unblock_date DATETIME DEFAULT NULL AFTER created_at
            `);
            console.log('✅ unblock_date kolonu eklendi');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('ℹ️  unblock_date kolonu zaten mevcut');
            } else {
                throw e;
            }
        }

        // 3. Mevcut sale transaction'ları için unblock_date ekle (7 gün sonra)
        console.log('📝 Mevcut sale transaction\'lar güncelleniyor...');
        const [updateResult] = await pool.execute(`
            UPDATE transactions 
            SET unblock_date = DATE_ADD(created_at, INTERVAL 7 DAY)
            WHERE type = 'sale' 
            AND status = 'completed' 
            AND unblock_date IS NULL
        `);
        console.log(`✅ ${updateResult.affectedRows} adet transaction güncellendi`);

        // 4. 7 günü geçmiş olanları balance'a aktar
        console.log('📝 7 günü geçmiş bloke bakiyeler aktarılıyor...');
        const [unblockResult] = await pool.execute(`
            UPDATE users u
            INNER JOIN (
                SELECT user_id, SUM(amount) as total_amount
                FROM transactions
                WHERE type = 'sale'
                AND status = 'completed'
                AND unblock_date IS NOT NULL
                AND unblock_date <= NOW()
                GROUP BY user_id
            ) t ON u.id = t.user_id
            SET 
                u.balance = u.balance + t.total_amount,
                u.blocked_balance = GREATEST(0, u.blocked_balance - t.total_amount)
        `);
        console.log(`✅ ${unblockResult.affectedRows} kullanıcının bakiyesi güncellendi`);

        // 5. Mevcut bloke bakiyeleri hesapla
        console.log('📝 Bloke bakiyeler hesaplanıyor...');
        const [blockResult] = await pool.execute(`
            UPDATE users u
            SET u.blocked_balance = (
                SELECT COALESCE(SUM(t.amount), 0)
                FROM transactions t
                WHERE t.user_id = u.id
                AND t.type = 'sale'
                AND t.status = 'completed'
                AND t.unblock_date IS NOT NULL
                AND t.unblock_date > NOW()
            )
            WHERE u.id IN (
                SELECT DISTINCT user_id 
                FROM transactions 
                WHERE type = 'sale' 
                AND status = 'completed'
                AND unblock_date IS NOT NULL
                AND unblock_date > NOW()
            )
        `);
        console.log(`✅ ${blockResult.affectedRows} kullanıcının bloke bakiyesi güncellendi`);

        // 6. Negatif bloke bakiyeleri 0 yap
        await pool.execute('UPDATE users SET blocked_balance = 0.00 WHERE blocked_balance < 0');

        // Sonuçları göster
        console.log('\n📊 SONUÇLAR:');
        const [stats] = await pool.execute(
            `SELECT 
                id,
                username,
                balance as cekilebilir_bakiye,
                blocked_balance as bloke_bakiye,
                (balance + blocked_balance) as toplam_bakiye
            FROM users
            WHERE balance > 0 OR blocked_balance > 0
            ORDER BY (balance + blocked_balance) DESC
            LIMIT 10`
        );

        stats.forEach(u => {
            console.log(`   ${u.username}:`);
            console.log(`      Çekilebilir: ${parseFloat(u.cekilebilir_bakiye || 0).toFixed(2)} TL`);
            if (parseFloat(u.bloke_bakiye || 0) > 0) {
                console.log(`      Bloke: ${parseFloat(u.bloke_bakiye || 0).toFixed(2)} TL`);
            }
            console.log(`      Toplam: ${parseFloat(u.toplam_bakiye || 0).toFixed(2)} TL`);
        });

        console.log('\n✅ Bloke bakiye sistemi başarıyla uygulandı!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Hata:', error);
        process.exit(1);
    }
};

applyBlockedBalanceMigration();
