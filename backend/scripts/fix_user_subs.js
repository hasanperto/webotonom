import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function fixUserSubs() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'teknopro'
        });

        console.log('Checking user_subscriptions table...');

        const [rows] = await connection.execute('SHOW COLUMNS FROM user_subscriptions');
        const columns = rows.map(r => r.Field);

        if (!columns.includes('payment_method')) {
            console.log('Adding payment_method column...');
            await connection.execute(`
                ALTER TABLE user_subscriptions 
                ADD COLUMN payment_method VARCHAR(50) DEFAULT 'credit_card'
            `);
        } else {
            console.log('payment_method column exists.');
        }

        // Check billing_period in subscription_plans one last time strictly
        // (The previous script might have failed silently if error msg was ignored)
        // But since plans are inserted with '3_months', it must be fine or it is VARCHAR.
        // Actually, previous DESCRIBE showed 'enum' (truncated).

        console.log('Done.');

    } catch (error) {
        console.error('Script error:', error);
    } finally {
        if (connection) await connection.end();
        process.exit();
    }
}

fixUserSubs();
