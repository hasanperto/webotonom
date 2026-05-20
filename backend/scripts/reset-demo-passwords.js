/**
 * Örnek kullanıcı şifrelerini 123456 yapar (yedek SQL'deki hash aslında "password" içindi).
 * Kullanım: node scripts/reset-demo-passwords.js
 */
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const DEMO_EMAILS = [
    'admin@teknoproje.com',
    'ahmet@example.com',
    'ayse@example.com',
    'mehmet@example.com',
    'zeynep@example.com',
    'ali@example.com',
];

async function main() {
    const password = process.argv[2] || '123456';
    const hash = await bcrypt.hash(password, 10);

    const conn = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'teknopro',
    });

    const [result] = await conn.query(
        `UPDATE users SET password = ? WHERE email IN (${DEMO_EMAILS.map(() => '?').join(',')})`,
        [hash, ...DEMO_EMAILS]
    );

    console.log(`Şifre güncellendi: "${password}" (${result.affectedRows} kullanıcı)`);
    console.log('E-postalar:', DEMO_EMAILS.join(', '));

    await conn.end();
}

main().catch((e) => {
    console.error(e.message);
    process.exit(1);
});
