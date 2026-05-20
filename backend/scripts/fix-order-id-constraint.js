import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'teknopro',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function fixOrderIdConstraint() {
    try {
        console.log('order_id foreign key constraint kontrol ediliyor...');
        
        // Mevcut foreign key'leri kontrol et
        const [constraints] = await pool.execute(`
            SELECT CONSTRAINT_NAME, TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
            FROM information_schema.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'bank_transfer_notifications'
            AND COLUMN_NAME = 'order_id'
            AND REFERENCED_TABLE_NAME IS NOT NULL
        `);
        
        console.log('Mevcut constraints:', constraints);
        
        // Eğer order_id için NOT NULL constraint varsa ve foreign key varsa
        // Foreign key'i kaldır ve order_id'yi NULL yapılabilir hale getir
        if (constraints.length > 0) {
            for (const constraint of constraints) {
                console.log(`Foreign key kaldırılıyor: ${constraint.CONSTRAINT_NAME}`);
                try {
                    await pool.execute(`
                        ALTER TABLE bank_transfer_notifications 
                        DROP FOREIGN KEY ${constraint.CONSTRAINT_NAME}
                    `);
                    console.log(`Foreign key kaldırıldı: ${constraint.CONSTRAINT_NAME}`);
                } catch (e) {
                    console.log(`Foreign key kaldırma hatası (zaten yok olabilir): ${e.message}`);
                }
            }
        }
        
        // order_id kolonunu NULL yapılabilir hale getir
        console.log('order_id kolonu NULL yapılabilir hale getiriliyor...');
        try {
            await pool.execute(`
                ALTER TABLE bank_transfer_notifications 
                MODIFY COLUMN order_id INT(11) NULL
            `);
            console.log('order_id kolonu NULL yapılabilir hale getirildi');
        } catch (e) {
            console.log(`order_id güncelleme hatası: ${e.message}`);
        }
        
        // Yeni foreign key ekle (ON DELETE SET NULL ile)
        console.log('Yeni foreign key ekleniyor (ON DELETE SET NULL)...');
        try {
            await pool.execute(`
                ALTER TABLE bank_transfer_notifications 
                ADD CONSTRAINT fk_bank_notification_order 
                FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
            `);
            console.log('Yeni foreign key eklendi');
        } catch (e) {
            if (e.message.includes('Duplicate')) {
                console.log('Foreign key zaten var');
            } else {
                console.log(`Foreign key ekleme hatası: ${e.message}`);
            }
        }
        
        console.log('Tablo yapısı güncellendi!');
        
    } catch (error) {
        console.error('Hata:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

fixOrderIdConstraint().catch(console.error);
