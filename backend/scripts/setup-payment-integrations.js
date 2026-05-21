/**
 * teknopro odeme tablolari — MySQL acikken calistirin:
 *   node scripts/setup-payment-integrations.js
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const log = (msg) => console.log(msg);

async function columnExists(conn, table, column) {
    const [rows] = await conn.execute(
        `SELECT COUNT(*) AS c FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [table, column]
    );
    return rows[0].c > 0;
}

async function tableExists(conn, table) {
    const [rows] = await conn.execute(
        `SELECT COUNT(*) AS c FROM information_schema.TABLES
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
        [table]
    );
    return rows[0].c > 0;
}

async function main() {
    log('Baglanti: ' + (process.env.DB_HOST || 'localhost') + ' / ' + (process.env.DB_NAME || 'teknopro'));

    let conn;
    try {
        conn = await mysql.createConnection({
            host: process.env.DB_HOST || '127.0.0.1',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'teknopro',
            connectTimeout: 10000,
        });
    } catch (e) {
        console.error('MySQL baglanamadi:', e.message);
        console.error('XAMPP MySQL Start veya: .\\scripts\\repair-mysql-xampp.ps1');
        process.exit(1);
    }

    log('[1/4] payment_requests tablosu...');
    await conn.execute(`
        CREATE TABLE IF NOT EXISTS payment_requests (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            bonus_amount DECIMAL(10,2) DEFAULT 0,
            total_amount DECIMAL(10,2) NOT NULL,
            payment_method VARCHAR(50) NOT NULL DEFAULT 'bank_transfer',
            gateway VARCHAR(50) DEFAULT NULL,
            status VARCHAR(50) NOT NULL DEFAULT 'pending',
            reference_number VARCHAR(100) UNIQUE,
            transaction_id VARCHAR(200) DEFAULT NULL,
            metadata JSON DEFAULT NULL,
            response_data JSON DEFAULT NULL,
            user_note TEXT DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            KEY idx_user_id (user_id),
            KEY idx_status (status),
            KEY idx_payment_method (payment_method)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    log('[2/4] transactions.payment_method...');
    if (!(await columnExists(conn, 'transactions', 'payment_method'))) {
        await conn.execute(
            'ALTER TABLE transactions ADD COLUMN payment_method VARCHAR(50) DEFAULT NULL AFTER status'
        );
    } else {
        log('    zaten var, atlandi');
    }

    log('[3/4] bank_transfer_notifications.payment_request_id...');
    if (await tableExists(conn, 'bank_transfer_notifications')) {
        if (!(await columnExists(conn, 'bank_transfer_notifications', 'payment_request_id'))) {
            await conn.execute(
                'ALTER TABLE bank_transfer_notifications ADD COLUMN payment_request_id INT NULL DEFAULT NULL AFTER id'
            );
            try {
                await conn.execute(
                    'ALTER TABLE bank_transfer_notifications ADD KEY idx_payment_request_id (payment_request_id)'
                );
            } catch {
                /* indeks zaten var olabilir */
            }
        } else {
            log('    zaten var, atlandi');
        }
    } else {
        log('    bank_transfer_notifications yok, atlandi');
    }

    log('[4/4] odeme ayarlari...');
    const settings = [
        ['credit_card_enabled', '1', 'boolean', 'payment', 'Kredi karti aktif'],
        ['bank_transfer_enabled', '1', 'boolean', 'payment', 'Havale aktif'],
        ['balance_enabled', '1', 'boolean', 'payment', 'Bakiye aktif'],
        ['paypal_enabled', '1', 'boolean', 'payment', 'PayPal aktif'],
        ['payment_demo_mode', '1', 'boolean', 'payment', 'Demo odeme modu'],
        ['demo_card_number', '4242 4242 4242 4242', 'text', 'payment', 'Demo test kart numarasi'],
        ['demo_card_holder', 'Demo Kullanici', 'text', 'payment', 'Demo kart sahibi'],
        ['demo_card_expiry', '12/34', 'text', 'payment', 'Demo kart SKT'],
        ['demo_card_cvv', '123', 'text', 'payment', 'Demo kart CVV'],
        ['demo_paypal_email', 'demo@teknopro.com', 'text', 'payment', 'Demo PayPal e-posta'],
        ['demo_paypal_password', 'demo1234', 'text', 'payment', 'Demo PayPal sifre'],
        ['stripe_enabled', '0', 'boolean', 'payment', 'Stripe'],
        ['iyzico_enabled', '0', 'boolean', 'payment', 'Iyzico'],
    ];
    for (const row of settings) {
        await conn.execute(
            `INSERT INTO settings (\`key\`, value, type, \`group\`, description)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE value = VALUES(value), updated_at = CURRENT_TIMESTAMP`,
            row
        );
    }

    const [tables] = await conn.execute("SHOW TABLES LIKE 'payment_requests'");
    const [pm] = await conn.execute("SHOW COLUMNS FROM transactions LIKE 'payment_method'");
    await conn.end();

    log('');
    log('payment_requests: ' + (tables.length ? 'OK' : 'EKSIK'));
    log('transactions.payment_method: ' + (pm.length ? 'OK' : 'EKSIK'));
    log('Odeme entegrasyonu kurulumu tamam.');
}

main().catch((e) => {
    console.error('HATA:', e.message);
    process.exit(1);
});
