import pool from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function addTranslations() {
    try {
        const sqlPath = path.join(__dirname, '../services/yedekdb/database_contact_missing_translations.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        // SQL'i statement'lara ayır
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s && !s.startsWith('--') && s.length > 0);
        
        for (const stmt of statements) {
            if (stmt.trim()) {
                await pool.execute(stmt.trim() + ';');
            }
        }
        
        console.log('✅ Contact sayfası çevirileri başarıyla eklendi!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Hata:', err.message);
        console.error(err);
        process.exit(1);
    }
}

addTranslations();
