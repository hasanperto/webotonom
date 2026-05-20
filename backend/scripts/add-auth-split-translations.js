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

const translations = [
    ['tr', 'auth.split_tagline', 'Projelerinizi güvenle yönetin ve keşfedin.', 'auth'],
    ['tr', 'auth.segment_label', 'Giriş veya kayıt', 'auth'],
    ['tr', 'auth.login_tab', 'Giriş', 'auth'],
    ['tr', 'auth.register_tab', 'Kayıt', 'auth'],
    ['en', 'auth.split_tagline', 'Manage and discover your projects with confidence.', 'auth'],
    ['en', 'auth.segment_label', 'Sign in or register', 'auth'],
    ['en', 'auth.login_tab', 'Sign in', 'auth'],
    ['en', 'auth.register_tab', 'Register', 'auth'],
    ['de', 'auth.split_tagline', 'Verwalten und entdecken Sie Ihre Projekte sicher.', 'auth'],
    ['de', 'auth.segment_label', 'Anmelden oder registrieren', 'auth'],
    ['de', 'auth.login_tab', 'Anmelden', 'auth'],
    ['de', 'auth.register_tab', 'Registrieren', 'auth']
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
        console.log('\nauth.* çevirileri tamam.');
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
