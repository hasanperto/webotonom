/**
 * backend/services/yedekdb içindeki SQL yedeklerini MySQL'e yükler.
 * Kullanım: node scripts/import-yedekdb.js
 */
import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const YEDEK_DIR = path.join(__dirname, '../services/yedekdb');

dotenv.config({ path: path.join(__dirname, '../.env') });

const SKIP = new Set(['database_cleanup_data.sql', 'database_sample_data.sql']);

function buildFileOrder() {
    const all = fs.readdirSync(YEDEK_DIR).filter((f) => f.endsWith('.sql') && !SKIP.has(f));
    const early = [
        'database.sql',
        'database_missing_tables.sql',
        'database_fix_cart_and_projects.sql',
        'database_alter_tables.sql',
        'database_multilang_update.sql',
        'database_i18n_sales.sql',
        'database_translations_3_languages.sql',
        'database_update_languages_to_3.sql'
    ];
    const late = ['database_complete_multilang.sql'];
    const skipNames = new Set([...early, ...late]);
    const rest = all.filter((f) => !skipNames.has(f)).sort((a, b) => a.localeCompare(b));
    const ordered = [...early.filter((f) => all.includes(f)), ...rest, ...late.filter((f) => all.includes(f))];
    return ordered.map((f) => path.join(YEDEK_DIR, f));
}

function readSql(filePath) {
    let sql = fs.readFileSync(filePath, 'utf8');
    if (sql.charCodeAt(0) === 0xfeff) {
        sql = sql.slice(1);
    }
    return sql;
}

async function runFile(connection, filePath) {
    const name = path.basename(filePath);
    const sql = readSql(filePath);
    if (!sql.trim()) {
        console.log(`  (boş) ${name}`);
        return { name, ok: true, skipped: true };
    }
    try {
        await connection.query(sql);
        console.log(`  OK  ${name}`);
        return { name, ok: true };
    } catch (err) {
        const msg = err.sqlMessage || err.message;
        console.warn(`  UYARI ${name}: ${msg}`);
        return { name, ok: false, error: msg };
    }
}

async function main() {
    const host = process.env.DB_HOST || 'localhost';
    const user = process.env.DB_USER || 'root';
    const password = process.env.DB_PASSWORD || '';
    const database = process.env.DB_NAME || 'teknopro';

    console.log(`MySQL: ${user}@${host}  veritabanı: ${database}\n`);

    const rootConn = await mysql.createConnection({
        host,
        user,
        password,
        multipleStatements: true
    });

    await rootConn.query(`DROP DATABASE IF EXISTS \`${database}\``);
    console.log(`Eski "${database}" silindi.`);

    const files = buildFileOrder();
    console.log(`${files.length} SQL dosyası yüklenecek...\n`);

    let ok = 0;
    let warn = 0;

    const schemaFile = files.find((f) => path.basename(f) === 'database.sql');
    const restFiles = files.filter((f) => path.basename(f) !== 'database.sql');

    if (schemaFile) {
        const r = await runFile(rootConn, schemaFile);
        if (r.ok) ok++;
        else warn++;
    }

    const conn = await mysql.createConnection({
        host,
        user,
        password,
        database,
        multipleStatements: true
    });

    for (const filePath of restFiles) {
        const result = await runFile(conn, filePath);
        if (result.ok) ok++;
        else warn++;
    }

    const [tables] = await conn.query('SHOW TABLES');
    await conn.end();
    await rootConn.end();

    console.log(`\nBitti: ${ok} başarılı, ${warn} uyarı/hata.`);
    console.log(`Tablo sayısı (${database}): ${tables.length}`);
}

main().catch((e) => {
    console.error('İçe aktarma başarısız:', e.message);
    process.exit(1);
});
