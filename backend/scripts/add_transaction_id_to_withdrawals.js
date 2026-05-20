import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'teknopro',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

async function addTransactionIdColumn() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Veritabanına bağlanıldı.');

        // Önce kolonun var olup olmadığını kontrol et
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? 
            AND TABLE_NAME = 'withdrawals' 
            AND COLUMN_NAME = 'transaction_id'
        `, [dbConfig.database]);

        if (columns.length > 0) {
            console.log('✅ transaction_id kolonu zaten mevcut.');
            process.exit(0);
        }

        // Kolonu ekle
        await connection.execute(`
            ALTER TABLE withdrawals 
            ADD COLUMN transaction_id VARCHAR(100) DEFAULT NULL 
            AFTER admin_note
        `);

        console.log('✅ transaction_id kolonu başarıyla eklendi.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Hata:', error);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

addTransactionIdColumn();
