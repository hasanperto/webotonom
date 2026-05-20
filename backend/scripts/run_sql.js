import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runSql(filePath) {
    try {
        const sqlContent = fs.readFileSync(filePath, 'utf8');
        console.log(`Reading SQL from ${filePath}...`);

        // Split by semicolon, filter out empty (whitespace-only) statements
        const statements = sqlContent
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0);

        console.log(`Found ${statements.length} statements.`);

        const connection = await pool.getConnection();
        try {
            for (const sql of statements) {
                console.log(`Executing: ${sql.substring(0, 50)}...`);
                await connection.query(sql);
            }
            console.log('Success! All statements executed.');
        } finally {
            connection.release();
        }
        process.exit(0);
    } catch (error) {
        console.error('Error executing SQL:', error);
        process.exit(1);
    }
}

const fileToRun = process.argv[2];
if (!fileToRun) {
    console.error('Please provide an SQL file path.');
    process.exit(1);
}

runSql(fileToRun);
