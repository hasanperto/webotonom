import pool from '../config/database.js';

async function checkTable() {
    try {
        const [rows] = await pool.execute('SHOW TABLES LIKE "bank_accounts"');
        console.log('Tablo var mı?', rows.length > 0 ? 'EVET' : 'HAYIR');
        
        if (rows.length > 0) {
            const [cols] = await pool.execute('DESCRIBE bank_accounts');
            console.log('\nKolonlar:');
            cols.forEach(col => {
                console.log(`  - ${col.Field} (${col.Type})`);
            });
            
            const [data] = await pool.execute('SELECT COUNT(*) as count FROM bank_accounts');
            console.log(`\nKayıt sayısı: ${data[0].count}`);
        } else {
            console.log('\n⚠️ Tablo bulunamadı! Oluşturuluyor...');
            const fs = await import('fs');
            const path = await import('path');
            const { fileURLToPath } = await import('url');
            const __filename = fileURLToPath(import.meta.url);
            const __dirname = path.dirname(__filename);
            
            const sqlPath = path.join(__dirname, '../services/yedekdb/database_bank_accounts.sql');
            const sql = fs.readFileSync(sqlPath, 'utf8');
            const statements = sql.split(';').filter(s => s.trim() && !s.trim().startsWith('--'));
            
            for (const stmt of statements) {
                if (stmt.trim()) {
                    await pool.execute(stmt.trim() + ';');
                }
            }
            console.log('✅ Tablo oluşturuldu!');
        }
        
        process.exit(0);
    } catch (err) {
        console.error('❌ Hata:', err.message);
        console.error(err);
        process.exit(1);
    }
}

checkTable();
