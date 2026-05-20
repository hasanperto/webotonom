import pool from '../config/database.js';

const fixTransactionsTaxType = async () => {
    try {
        console.log('🔄 Transactions tablosu düzeltiliyor...');

        // 1. Transactions tablosunda 'tax' tipini ENUM'a ekle
        console.log('📝 Tax tipini ENUM\'a ekleniyor...');
        await pool.execute(`
            ALTER TABLE transactions 
            MODIFY COLUMN type ENUM('purchase', 'sale', 'commission', 'payout', 'refund', 'donation', 'deposit', 'tax') DEFAULT NULL
        `);
        console.log('✅ Tax tipi ENUM\'a eklendi');

        // 2. Boş string KDV transaction'larını 'tax' tipine güncelle
        console.log('📝 Boş string KDV transaction\'ları düzeltiliyor...');
        const [updateResult] = await pool.execute(`
            UPDATE transactions 
            SET type = 'tax' 
            WHERE (type IS NULL OR type = '' OR type = 'deposit')
            AND description LIKE '%KDV Geliri%'
        `);
        console.log(`✅ ${updateResult.affectedRows} adet KDV transaction düzeltildi`);

        // 3. Transactions tablosundaki type değerlerini analiz et
        console.log('\n📊 Transaction type dağılımı:');
        const [typeStats] = await pool.execute(`
            SELECT 
                type,
                COUNT(*) as count,
                SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_completed,
                SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as total_pending
            FROM transactions
            GROUP BY type
            ORDER BY count DESC
        `);

        typeStats.forEach(stat => {
            console.log(`   ${stat.type || '(NULL)'}: ${stat.count} adet, Tamamlanan: ${parseFloat(stat.total_completed || 0).toFixed(2)} TL`);
        });

        // 4. Boş veya NULL type'ları kontrol et
        const [emptyTypes] = await pool.execute(`
            SELECT COUNT(*) as count
            FROM transactions
            WHERE type IS NULL OR type = ''
        `);
        
        if (emptyTypes[0].count > 0) {
            console.log(`\n⚠️  UYARI: ${emptyTypes[0].count} adet boş type transaction bulundu`);
            const [emptyList] = await pool.execute(`
                SELECT id, user_id, order_id, type, amount, description, created_at
                FROM transactions
                WHERE type IS NULL OR type = ''
                ORDER BY created_at DESC
                LIMIT 10
            `);
            emptyList.forEach(t => {
                console.log(`   ID: ${t.id}, Amount: ${t.amount}, Desc: ${t.description?.substring(0, 50)}...`);
            });
        } else {
            console.log('\n✅ Tüm transaction\'lar geçerli type değerine sahip');
        }

        // 5. KDV transaction'larını kontrol et
        const [taxTransactions] = await pool.execute(`
            SELECT COUNT(*) as count, SUM(amount) as total
            FROM transactions
            WHERE type = 'tax' AND status = 'completed'
        `);
        console.log(`\n💰 Toplam KDV Geliri: ${parseFloat(taxTransactions[0].total || 0).toFixed(2)} TL (${taxTransactions[0].count} transaction)`);

        console.log('\n✅ Tüm düzeltmeler tamamlandı!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Hata:', error.message);
        
        // Eğer ENUM zaten güncellenmişse, sadece UPDATE yap
        if (error.message.includes('tax') || error.message.includes('ENUM')) {
            console.log('\n⚠️  ENUM zaten güncellenmiş olabilir. Sadece UPDATE işlemi yapılıyor...');
            try {
                const [updateResult] = await pool.execute(`
                    UPDATE transactions 
                    SET type = 'tax' 
                    WHERE (type IS NULL OR type = '' OR type = 'deposit')
                    AND description LIKE '%KDV Geliri%'
                `);
                console.log(`✅ ${updateResult.affectedRows} adet KDV transaction düzeltildi`);
                process.exit(0);
            } catch (updateError) {
                console.error('❌ UPDATE hatası:', updateError.message);
                process.exit(1);
            }
        } else {
            process.exit(1);
        }
    }
};

fixTransactionsTaxType();
