import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlPath = path.join(__dirname, '..', 'database_auth_translations.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

const conn = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'teknopro',
  multipleStatements: true,
});

await conn.query(sql);
const [rows] = await conn.query(
  "SELECT language_code, `key`, `value` FROM translations WHERE `key` IN ('auth.split_tagline','auth.login_tab','auth.register_tab','auth.segment_label') ORDER BY `key`, language_code",
);
console.log('Ornek auth anahtarlari:', rows);
await conn.end();
console.log('Tamam: database_auth_translations.sql uygulandi.');
