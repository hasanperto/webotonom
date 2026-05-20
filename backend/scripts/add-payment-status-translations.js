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

async function addTranslations() {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const translations = [
            // order_detail.payment_status.pending_review
            ['tr', 'order_detail.payment_status.pending_review', 'Ödeme İnceleniyor', 'order_detail'],
            ['en', 'order_detail.payment_status.pending_review', 'Payment Under Review', 'order_detail'],
            ['de', 'order_detail.payment_status.pending_review', 'Zahlung wird geprüft', 'order_detail'],
        ];

        for (const [lang, key, value, group] of translations) {
            // Önce mevcut çeviriyi kontrol et
            const [existing] = await connection.execute(
                `SELECT id FROM translations 
                 WHERE language_code = ? AND \`key\` = ?`,
                [lang, key]
            );

            if (existing.length > 0) {
                // Güncelle
                await connection.execute(
                    `UPDATE translations 
                     SET value = ?, \`group\` = ?, updated_at = NOW() 
                     WHERE language_code = ? AND \`key\` = ?`,
                    [value, group, lang, key]
                );
                console.log(`✓ Güncellendi: ${lang} - ${key}`);
            } else {
                // Yeni ekle
                await connection.execute(
                    `INSERT INTO translations (language_code, \`key\`, value, \`group\`, created_at, updated_at) 
                     VALUES (?, ?, ?, ?, NOW(), NOW())`,
                    [lang, key, value, group]
                );
                console.log(`✓ Eklendi: ${lang} - ${key}`);
            }
        }

        await connection.commit();
        console.log('\n✅ Tüm çeviriler başarıyla eklendi/güncellendi!');
    } catch (error) {
        await connection.rollback();
        console.error('❌ Hata:', error);
        throw error;
    } finally {
        connection.release();
        await pool.end();
    }
}

addTranslations().catch(console.error);
