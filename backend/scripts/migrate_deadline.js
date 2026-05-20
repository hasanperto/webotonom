
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function migrate() {
    try {
        console.log('Adding donation_target and deadline columns to projects table...');

        try {
            await pool.execute("ALTER TABLE projects ADD COLUMN donation_target DECIMAL(10,2) DEFAULT NULL");
            console.log('Added donation_target column');
        } catch (e) {
            if (!e.message.includes("Duplicate column")) console.error(e.message);
        }

        try {
            await pool.execute("ALTER TABLE projects ADD COLUMN deadline DATETIME DEFAULT NULL");
            console.log('Added deadline column');
        } catch (e) {
            if (!e.message.includes("Duplicate column")) console.error(e.message);
        }

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration error:', error);
        process.exit(1);
    }
}

migrate();
