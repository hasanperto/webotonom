/**
 * Ana sayfa Özellikler bölümü başlık çevirileri
 * Kullanım: node scripts/add-home-features-translations.js
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'teknopro',
});

const translations = [
    ['tr', 'home.features.section_label', 'Özellikler', 'home'],
    ['tr', 'home.features.title', 'Neden TeknoProje?', 'home'],
    ['tr', 'home.features.subtitle', 'Geliştiriciler ve alıcılar için tasarlanmış güçlü özelliklerle projelerinizi yönetin.', 'home'],
    ['en', 'home.features.section_label', 'Features', 'home'],
    ['en', 'home.features.title', 'Why TeknoProje?', 'home'],
    ['en', 'home.features.subtitle', 'Manage your projects with powerful features designed for developers and buyers.', 'home'],
    ['de', 'home.features.section_label', 'Funktionen', 'home'],
    ['de', 'home.features.title', 'Warum TeknoProje?', 'home'],
    ['de', 'home.features.subtitle', 'Verwalten Sie Ihre Projekte mit leistungsstarken Funktionen für Entwickler und Käufer.', 'home'],
];

async function main() {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        for (const [lang, key, value, group] of translations) {
            const [existing] = await connection.execute(
                'SELECT id FROM translations WHERE language_code = ? AND `key` = ?',
                [lang, key]
            );
            if (existing.length > 0) {
                await connection.execute(
                    'UPDATE translations SET value = ?, `group` = ?, updated_at = NOW() WHERE language_code = ? AND `key` = ?',
                    [value, group, lang, key]
                );
                console.log(`Güncellendi: ${lang} ${key}`);
            } else {
                await connection.execute(
                    'INSERT INTO translations (language_code, `key`, value, `group`, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
                    [lang, key, value, group]
                );
                console.log(`Eklendi: ${lang} ${key}`);
            }
        }
        await connection.commit();
        console.log('\nhome.features.* çevirileri tamam.');
    } catch (e) {
        await connection.rollback();
        console.error(e);
        process.exitCode = 1;
    } finally {
        connection.release();
        await pool.end();
    }
}

main();
