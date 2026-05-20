import pool from '../config/database.js';

async function fixReviewTranslations() {
    try {
        const translations = [
            // Türkçe - tek bir anahtar
            ['tr', 'project_detail.review_as', 'Yorumunuz {name} olarak yayınlanacak.', 'project_detail'],
            
            // İngilizce - tek bir anahtar
            ['en', 'project_detail.review_as', 'Your review will be published as {name}.', 'project_detail'],
            
            // Almanca - tek bir anahtar
            ['de', 'project_detail.review_as', 'Ihre Bewertung wird als {name} veröffentlicht.', 'project_detail']
        ];
        
        for (const [lang, key, value, group] of translations) {
            await pool.execute(
                `INSERT INTO translations (language_code, \`key\`, value, \`group\`) 
                 VALUES (?, ?, ?, ?) 
                 ON DUPLICATE KEY UPDATE value = VALUES(value)`,
                [lang, key, value, group]
            );
            console.log(`✅ ${lang} | ${key} | ${value}`);
        }
        
        console.log('\n✅ Çeviriler başarıyla güncellendi!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Hata:', err.message);
        console.error(err);
        process.exit(1);
    }
}

fixReviewTranslations();
