/**
 * Eksik şema: cart.plan_id, projects.completion_status/deadline/source_url/timeline
 * Kullanım: node scripts/fix-schema-cart-projects.js
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function columnExists(conn, table, column) {
    const [rows] = await conn.query(
        `SELECT 1 FROM information_schema.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [table, column]
    );
    return rows.length > 0;
}

async function main() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'teknopro',
        multipleStatements: true,
    });

    const alters = [];

    if (!(await columnExists(conn, 'cart', 'plan_id'))) {
        alters.push(
            'ALTER TABLE `cart` ADD COLUMN `plan_id` int(11) DEFAULT NULL AFTER `project_id`, ADD KEY `plan_id` (`plan_id`)'
        );
    }

    if (await columnExists(conn, 'cart', 'project_id')) {
        const [col] = await conn.query(
            `SELECT IS_NULLABLE FROM information_schema.COLUMNS 
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cart' AND COLUMN_NAME = 'project_id'`
        );
        if (col[0]?.IS_NULLABLE === 'NO') {
            alters.push('ALTER TABLE `cart` MODIFY COLUMN `project_id` int(11) DEFAULT NULL');
        }
    }

    const projectCols = [
        ["completion_status", "ALTER TABLE `projects` ADD COLUMN `completion_status` enum('completed','in_progress') NOT NULL DEFAULT 'completed' AFTER `status`"],
        ["deadline", "ALTER TABLE `projects` ADD COLUMN `deadline` date DEFAULT NULL AFTER `donation_received`"],
        ["source_url", "ALTER TABLE `projects` ADD COLUMN `source_url` varchar(500) DEFAULT NULL AFTER `version`"],
        ["timeline", "ALTER TABLE `projects` ADD COLUMN `timeline` text DEFAULT NULL AFTER `source_url`"],
    ];

    for (const [name, sql] of projectCols) {
        if (!(await columnExists(conn, 'projects', name))) {
            alters.push(sql);
        }
    }

    if (!(await columnExists(conn, 'content_translations', 'short_description'))) {
        alters.push(
            'ALTER TABLE `content_translations` ADD COLUMN `short_description` varchar(500) DEFAULT NULL AFTER `description`'
        );
    }

    for (const sql of alters) {
        try {
            await conn.query(sql);
            console.log('OK:', sql.slice(0, 80) + '...');
        } catch (e) {
            console.warn('UYARI:', e.message);
        }
    }

    if (alters.length === 0) {
        console.log('Şema zaten güncel.');
    } else {
        console.log(`\n${alters.length} migration uygulandı.`);
    }

    await conn.end();
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
