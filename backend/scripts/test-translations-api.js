import pool from '../config/database.js';

async function testTranslations() {
    try {
        const lang = 'en'; // Test için İngilizce
        
        const [rows] = await pool.query(
            'SELECT * FROM translations WHERE language_code = ?',
            [lang]
        );
        
        const translations = {};
        rows.forEach(row => {
            translations[row.key] = row.value;
        });
        
        console.log(`\n📋 ${lang} dilindeki çeviriler:`);
        console.log('=====================================');
        
        const contactKeys = Object.keys(translations).filter(k => k.startsWith('contact.'));
        console.log(`\nContact çevirileri (${contactKeys.length} adet):`);
        contactKeys.forEach(key => {
            console.log(`  ${key}: ${translations[key]}`);
        });
        
        // Özellikle kontrol edilmesi gerekenler
        const requiredKeys = [
            'contact.working_hours',
            'contact.contact_us',
            'contact.form_description',
            'contact.our_location'
        ];
        
        console.log(`\n✅ Kontrol edilen anahtarlar:`);
        requiredKeys.forEach(key => {
            if (translations[key]) {
                console.log(`  ✅ ${key}: ${translations[key]}`);
            } else {
                console.log(`  ❌ ${key}: BULUNAMADI`);
            }
        });
        
        process.exit(0);
    } catch (err) {
        console.error('❌ Hata:', err.message);
        process.exit(1);
    }
}

testTranslations();
