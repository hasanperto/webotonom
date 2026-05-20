import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'teknopro'
};

async function checkDatabase() {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [columns] = await connection.execute('DESCRIBE payment_requests');
        const userNoteCol = columns.find(col => col.Field === 'user_note');

        if (userNoteCol) {
            console.log('SONUC: user_note sütunu VAR.');
        } else {
            console.log('SONUC: user_note sütunu YOK. Ekleniyor...');
            try {
                await connection.execute('ALTER TABLE payment_requests ADD COLUMN user_note TEXT AFTER response_data');
                console.log('SONUC: user_note sütunu EKLENDI.');
            } catch (e) {
                console.log('SONUC: Ekleme hatasi: ' + e.message);
            }
        }
        await connection.end();
    } catch (error) {
        console.error('GENEL HATA:', error.message);
    }
}
checkDatabase();
