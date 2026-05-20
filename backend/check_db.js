import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .env dosyasını backend klasöründen yükle
dotenv.config({ path: path.join(__dirname, '.env') });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'teknopro' // Default olarak .env'deki ismi kullan
};

async function checkDatabase() {
    console.log('Veritabanı Config:', { ...dbConfig, password: '***' });
    try {
        const connection = await mysql.createConnection(dbConfig);
        console.log('Veritabanına bağlanıldı.');

        const [columns] = await connection.execute('DESCRIBE payment_requests');
        console.log('\npayment_requests Tablo Yapısı:');
        console.table(columns);

        const hasUserNote = columns.some(col => col.Field === 'user_note');
        if (hasUserNote) {
            console.log('\n✅ user_note sütunu MEVCUT.');
        } else {
            console.log('\n❌ user_note sütunu MEVCUT DEĞİL!');

            // Otomatik eklemeyi deneyelim
            console.log('user_note sütunu ekleniyor...');
            try {
                await connection.execute('ALTER TABLE payment_requests ADD COLUMN user_note TEXT AFTER response_data');
                console.log('✅ user_note sütunu başarıyla eklendi!');
            } catch (alterError) {
                console.error('Sütun ekleme hatası:', alterError.message);
            }
        }

        // Çevirileri de kontrol edelim/yükleyelim
        console.log('\nÇeviriler kontrol ediliyor...');
        const [transCheck] = await connection.execute("SELECT id FROM translations WHERE `key` = 'pending_payments.title' LIMIT 1");
        if (transCheck.length === 0) {
            console.log('⚠️ pending_payments çevirileri eksik, yüklenmesi önerilir.');
        } else {
            console.log('✅ pending_payments çevirileri mevcut.');
        }

        await connection.end();
    } catch (error) {
        console.error('Hata:', error.message);
    }
}

checkDatabase();
