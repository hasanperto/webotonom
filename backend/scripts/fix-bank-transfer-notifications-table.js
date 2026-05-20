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

async function fixTable() {
    try {
        console.log('Tablo yapısı kontrol ediliyor...');
        
        // Mevcut kolonları kontrol et
        const [columns] = await pool.execute('DESCRIBE bank_transfer_notifications');
        const columnNames = columns.map(col => col.Field);
        
        console.log('Mevcut kolonlar:', columnNames);
        
        // order_id kolonu yoksa ekle
        if (!columnNames.includes('order_id')) {
            console.log('order_id kolonu ekleniyor...');
            await pool.execute(`
                ALTER TABLE bank_transfer_notifications 
                ADD COLUMN order_id INT(11) NULL AFTER id,
                ADD INDEX idx_order_id (order_id)
            `);
            console.log('order_id kolonu eklendi');
        }
        
        // user_id kolonu yoksa ekle
        if (!columnNames.includes('user_id')) {
            console.log('user_id kolonu ekleniyor...');
            await pool.execute(`
                ALTER TABLE bank_transfer_notifications 
                ADD COLUMN user_id INT(11) NULL AFTER order_id,
                ADD INDEX idx_user_id (user_id)
            `);
            console.log('user_id kolonu eklendi');
        }
        
        // receipt_number kolonu yoksa ekle
        if (!columnNames.includes('receipt_number')) {
            console.log('receipt_number kolonu ekleniyor...');
            await pool.execute(`
                ALTER TABLE bank_transfer_notifications 
                ADD COLUMN receipt_number VARCHAR(100) NULL AFTER user_id
            `);
            console.log('receipt_number kolonu eklendi');
        }
        
        // reference_number kolonu yoksa ekle (zaten var olabilir)
        if (!columnNames.includes('reference_number')) {
            console.log('reference_number kolonu ekleniyor...');
            await pool.execute(`
                ALTER TABLE bank_transfer_notifications 
                ADD COLUMN reference_number VARCHAR(100) NULL AFTER receipt_number
            `);
            console.log('reference_number kolonu eklendi');
        }
        
        // receipt_file kolonu yoksa ekle (receipt_image yerine)
        if (!columnNames.includes('receipt_file')) {
            console.log('receipt_file kolonu ekleniyor...');
            await pool.execute(`
                ALTER TABLE bank_transfer_notifications 
                ADD COLUMN receipt_file VARCHAR(255) NULL AFTER reference_number
            `);
            console.log('receipt_file kolonu eklendi');
        }
        
        // status kolonu yoksa ekle
        if (!columnNames.includes('status')) {
            console.log('status kolonu ekleniyor...');
            await pool.execute(`
                ALTER TABLE bank_transfer_notifications 
                ADD COLUMN status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' AFTER notes
            `);
            console.log('status kolonu eklendi');
        }
        
        // updated_at kolonu yoksa ekle
        if (!columnNames.includes('updated_at')) {
            console.log('updated_at kolonu ekleniyor...');
            await pool.execute(`
                ALTER TABLE bank_transfer_notifications 
                ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at
            `);
            console.log('updated_at kolonu eklendi');
        }
        
        // Foreign key'leri ekle (eğer yoksa)
        try {
            await pool.execute(`
                ALTER TABLE bank_transfer_notifications 
                ADD CONSTRAINT fk_bank_notification_order 
                FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
            `);
            console.log('order_id foreign key eklendi');
        } catch (e) {
            if (!e.message.includes('Duplicate')) {
                console.log('Foreign key zaten var veya hata:', e.message);
            }
        }
        
        try {
            await pool.execute(`
                ALTER TABLE bank_transfer_notifications 
                ADD CONSTRAINT fk_bank_notification_user 
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            `);
            console.log('user_id foreign key eklendi');
        } catch (e) {
            if (!e.message.includes('Duplicate')) {
                console.log('Foreign key zaten var veya hata:', e.message);
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

fixTable().catch(console.error);
