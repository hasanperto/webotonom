import pool from '../config/database.js';

const translations = [
    { lang: 'tr', key: 'checkout.payment_after_order', value: 'Önemli:', group: 'checkout' },
    { lang: 'en', key: 'checkout.payment_after_order', value: 'Important:', group: 'checkout' },
    { lang: 'de', key: 'checkout.payment_after_order', value: 'Wichtig:', group: 'checkout' },
    
    { lang: 'tr', key: 'checkout.payment_after_order_desc', value: 'Siparişinizi tamamladıktan sonra "Siparişlerim" sayfasından ödeme bildirimi yapabilirsiniz.', group: 'checkout' },
    { lang: 'en', key: 'checkout.payment_after_order_desc', value: 'After completing your order, you can submit payment notification from the "My Orders" page.', group: 'checkout' },
    { lang: 'de', key: 'checkout.payment_after_order_desc', value: 'Nach Abschluss Ihrer Bestellung können Sie die Zahlungsbenachrichtigung auf der Seite "Meine Bestellungen" einreichen.', group: 'checkout' }
];

async function addTranslations() {
    try {
        console.log('📝 Çeviriler ekleniyor...');
        
        for (const trans of translations) {
            const [existing] = await pool.execute(
                'SELECT id FROM translations WHERE language_code = ? AND `key` = ?',
                [trans.lang, trans.key]
            );
            
            if (existing.length > 0) {
                await pool.execute(
                    'UPDATE translations SET value = ? WHERE language_code = ? AND `key` = ?',
                    [trans.value, trans.lang, trans.key]
                );
                console.log(`✅ Güncellendi: ${trans.lang} - ${trans.key}`);
            } else {
                await pool.execute(
                    'INSERT INTO translations (language_code, `key`, value, `group`) VALUES (?, ?, ?, ?)',
                    [trans.lang, trans.key, trans.value, trans.group]
                );
                console.log(`✅ Eklendi: ${trans.lang} - ${trans.key}`);
            }
        }
        
        console.log('✅ Tüm çeviriler eklendi/güncellendi!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Hata:', error);
        process.exit(1);
    }
}

addTranslations();
