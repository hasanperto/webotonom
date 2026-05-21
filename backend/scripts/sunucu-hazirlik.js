/**
 * Sunucu on kontrol + odeme/order tablolari
 * NODE_ENV=production node scripts/sunucu-hazirlik.js
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.join(__dirname, '..');

const log = (msg) => console.log(msg);

async function main() {
    log('=== Sunucu hazirlik ===');
    log(`DB: ${process.env.DB_HOST || '127.0.0.1'} / ${process.env.DB_NAME || 'teknopro'}`);

    let conn;
    try {
        conn = await mysql.createConnection({
            host: process.env.DB_HOST || '127.0.0.1',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'teknopro',
            connectTimeout: 15000,
        });
    } catch (e) {
        console.error('DB baglanti HATA:', e.message);
        process.exit(1);
    }

    await conn.execute('SELECT 1');
    log('[OK] Veritabani baglantisi');

    const tables = ['users', 'projects', 'orders', 'order_items', 'cart', 'settings', 'transactions'];
    for (const t of tables) {
        const [r] = await conn.execute(
            `SELECT COUNT(*) AS c FROM information_schema.TABLES
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
            [t]
        );
        if (r[0].c === 0) {
            console.error(`[EKSIK] Tablo yok: ${t} — yedekdb SQL import edin`);
            process.exit(1);
        }
    }
    log('[OK] Temel tablolar');

    const [planCol] = await conn.execute(
        "SHOW COLUMNS FROM order_items LIKE 'plan_id'"
    );
    if (!planCol.length) {
        log('[...] order_items.plan_id ekleniyor');
        await conn.execute('ALTER TABLE order_items MODIFY project_id INT NULL');
        await conn.execute(
            'ALTER TABLE order_items ADD COLUMN plan_id INT NULL DEFAULT NULL AFTER project_id'
        );
        log('[OK] plan_id eklendi');
    }

    await conn.end();

    const run = (script) =>
        new Promise((resolve, reject) => {
            const p = spawn(process.execPath, [path.join(backendRoot, 'scripts', script)], {
                cwd: backendRoot,
                stdio: 'inherit',
                env: { ...process.env, NODE_ENV: process.env.NODE_ENV || 'production' },
            });
            p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`${script} exit ${code}`))));
        });

    try {
        await run('setup-payment-integrations.js');
        log('[OK] Odeme entegrasyonlari');
    } catch (e) {
        console.error('Odeme kurulum uyarisi:', e.message);
    }

    log('');
    log('Sonraki adimlar:');
    log('  - FRONTEND_URL ve CORS_ORIGIN = canli domain');
    log('  - JWT_SECRET guclu anahtar');
    log('  - Admin > Sanal Poslar > Demo mod (test) veya canli Stripe/PayPal');
    log('  - curl https://DOMAIN/api/health');
    log('=== Hazirlik tamam ===');
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
