import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars from backend root
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function applyTranslations() {
    const config = {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        multipleStatements: true
    };

    console.log('Connecting to database...', { ...config, password: '***' });

    try {
        const connection = await mysql.createConnection(config);
        console.log('Connected!');

        const sqlPath = path.join(__dirname, '..', 'database_auth_translations.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Executing SQL from:', sqlPath);
        await connection.query(sql);

        console.log('Translations applied successfully!');
        await connection.end();
    } catch (error) {
        console.error('Error applying translations:', error);
        process.exit(1);
    }
}

applyTranslations();
