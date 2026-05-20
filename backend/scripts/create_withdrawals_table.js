import pool from '../config/database.js';

const createWithdrawalsTable = async () => {
    try {
        console.log('Tablo oluşturuluyor...');

        await pool.execute(`
            CREATE TABLE IF NOT EXISTS withdrawals (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                amount DECIMAL(10, 2) NOT NULL,
                currency VARCHAR(3) DEFAULT 'TRY',
                bank_name VARCHAR(100),
                iban VARCHAR(50),
                account_holder VARCHAR(100),
                status ENUM('pending', 'completed', 'rejected', 'cancelled') DEFAULT 'pending',
                admin_note TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        console.log('✅ withdrawals tablosu başarıyla oluşturuldu.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Hata:', error);
        process.exit(1);
    }
};

createWithdrawalsTable();
