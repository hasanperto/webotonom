/**
 * Mobil menü tema anahtarı çevirileri
 * Kullanım: node scripts/add-theme-menu-translations.js
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
    ['tr', 'theme.switch_to_light', 'Açık Mod', 'theme'],
    ['tr', 'theme.switch_to_dark', 'Koyu Mod', 'theme'],
    ['en', 'theme.switch_to_light', 'Light Mode', 'theme'],
    ['en', 'theme.switch_to_dark', 'Dark Mode', 'theme'],
    ['de', 'theme.switch_to_light', 'Heller Modus', 'theme'],
    ['de', 'theme.switch_to_dark', 'Dunkler Modus', 'theme'],
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
        console.log('\ntheme.switch_* çevirileri tamam.');
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
