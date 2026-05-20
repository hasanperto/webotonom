
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'teknopro',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

async function createWithdrawalsTable() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database.');

        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS withdrawals (
                id int(11) NOT NULL AUTO_INCREMENT,
                user_id int(11) NOT NULL,
                amount decimal(10,2) NOT NULL,
                status enum('pending','completed','rejected') NOT NULL DEFAULT 'pending',
                iban varchar(50) DEFAULT NULL,
                bank_name varchar(100) DEFAULT NULL,
                account_holder varchar(100) DEFAULT NULL,
                transaction_id varchar(100) DEFAULT NULL,
                admin_note text DEFAULT NULL,
                created_at timestamp NOT NULL DEFAULT current_timestamp(),
                updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
                PRIMARY KEY (id),
                KEY user_id (user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;

        await connection.execute(createTableQuery);
        console.log('Withdrawals table created successfully.');

    } catch (error) {
        console.error('Error creating table:', error);
    } finally {
        if (connection) await connection.end();
    }
}

createWithdrawalsTable();
