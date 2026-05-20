import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlPath = path.join(
  __dirname,
  '..',
  'services',
  'yedekdb',
  'database_project_detail_register_translation.sql',
);

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
  'SELECT language_code, `value` FROM translations WHERE `key` = ? ORDER BY language_code',
  ['project_detail.register'],
);
console.log('project_detail.register satirlari:', rows);
await conn.end();
