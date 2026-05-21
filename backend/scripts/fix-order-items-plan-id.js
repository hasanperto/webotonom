/**
 * order_items.plan_id + nullable project_id
 * node scripts/fix-order-items-plan-id.js
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function columnExists(conn, table, column) {
    const [rows] = await conn.execute(
        `SELECT COUNT(*) AS c FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [table, column]
    );
    return rows[0].c > 0;
}

async function main() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'teknopro',
    });

    if (!(await columnExists(conn, 'order_items', 'plan_id'))) {
        await conn.execute('ALTER TABLE order_items MODIFY project_id INT NULL');
        await conn.execute(
            'ALTER TABLE order_items ADD COLUMN plan_id INT NULL DEFAULT NULL AFTER project_id'
        );
        console.log('order_items.plan_id eklendi');
    } else {
        console.log('order_items.plan_id zaten var');
    }

    await conn.end();
}

main().catch((e) => {
    console.error(e.message);
    process.exit(1);
});
