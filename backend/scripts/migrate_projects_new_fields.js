
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
        console.log('Adding new columns to projects table...');
        console.log('Connecting to DB:', process.env.DB_NAME);

        // Add completion_status
        try {
            await pool.execute("ALTER TABLE projects ADD COLUMN completion_status ENUM('completed', 'in_progress') DEFAULT 'completed'");
            console.log('Added completion_status column');
        } catch (e) {
            if (!e.message.includes("Duplicate column")) console.error(e.message);
        }

        // Add completion_percentage
        try {
            await pool.execute("ALTER TABLE projects ADD COLUMN completion_percentage TINYINT DEFAULT 100");
            console.log('Added completion_percentage column');
        } catch (e) {
            if (!e.message.includes("Duplicate column")) console.error(e.message);
        }

        // Add source_url (for github/git link)
        try {
            await pool.execute("ALTER TABLE projects ADD COLUMN source_url VARCHAR(255) DEFAULT NULL");
            console.log('Added source_url column');
        } catch (e) {
            if (!e.message.includes("Duplicate column")) console.error(e.message);
        }

        // Add timeline (for JSON data of roadmap)
        try {
            await pool.execute("ALTER TABLE projects ADD COLUMN timeline JSON DEFAULT NULL");
            console.log('Added timeline column');
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
