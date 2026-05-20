import pool from '../config/database.js';

async function fixTable() {
    try {
        console.log('🔍 Tablo kontrol ediliyor...');
        
        const [rows] = await pool.execute('SHOW TABLES LIKE "bank_accounts"');
        
        if (rows.length === 0) {
            console.log('📝 Tablo oluşturuluyor...');
            
            await pool.execute(`
                CREATE TABLE IF NOT EXISTS \`bank_accounts\` (
                  \`id\` int(11) NOT NULL AUTO_INCREMENT,
                  \`bank_name\` varchar(255) NOT NULL COMMENT 'Banka Adı',
                  \`iban\` varchar(34) NOT NULL COMMENT 'IBAN',
                  \`account_holder\` varchar(255) NOT NULL COMMENT 'Hesap Sahibi',
                  \`account_number\` varchar(50) DEFAULT NULL COMMENT 'Hesap Numarası (Opsiyonel)',
                  \`branch_name\` varchar(255) DEFAULT NULL COMMENT 'Şube Adı (Opsiyonel)',
                  \`swift_code\` varchar(11) DEFAULT NULL COMMENT 'SWIFT Kodu (Opsiyonel)',
                  \`currency\` varchar(3) DEFAULT 'TRY' COMMENT 'Para Birimi',
                  \`is_active\` tinyint(1) DEFAULT 1 COMMENT 'Aktif mi?',
                  \`sort_order\` int(11) DEFAULT 0 COMMENT 'Sıralama',
                  \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
                  \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
                  PRIMARY KEY (\`id\`),
                  KEY \`idx_is_active\` (\`is_active\`),
                  KEY \`idx_sort_order\` (\`sort_order\`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            `);
            
            console.log('✅ Tablo oluşturuldu!');
        } else {
            console.log('✅ Tablo zaten mevcut!');
        }
        
        process.exit(0);
    } catch (err) {
        console.error('❌ Hata:', err.message);
        console.error(err);
        process.exit(1);
    }
}

fixTable();
