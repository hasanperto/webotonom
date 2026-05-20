import pool from '../config/database.js';

async function checkTranslations() {
    try {
        const [rows] = await pool.execute(
            `SELECT language_code, \`key\`, value 
             FROM translations 
             WHERE \`key\` IN (
                 'contact.working_hours',
                 'contact.contact_us',
                 'contact.form_description',
                 'contact.our_location',
                 'contact.name_placeholder',
                 'contact.email_placeholder',
                 'contact.phone_placeholder',
                 'contact.message_placeholder'
             )
             ORDER BY language_code, \`key\``
        );
        
        console.log('📋 Bulunan çeviriler:');
        console.log('===================');
        
        if (rows.length === 0) {
            console.log('❌ Hiç çeviri bulunamadı!');
        } else {
            rows.forEach(row => {
                console.log(`${row.language_code} | ${row.key} | ${row.value}`);
            });
        }
        
        process.exit(0);
    } catch (err) {
        console.error('❌ Hata:', err.message);
        process.exit(1);
    }
}

checkTranslations();
