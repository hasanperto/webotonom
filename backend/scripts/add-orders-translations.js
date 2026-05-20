import pool from '../config/database.js';

const translations = [
    { lang: 'tr', key: 'orders.pay_now', value: 'Ödeme Yap', group: 'orders' },
    { lang: 'en', key: 'orders.pay_now', value: 'Pay Now', group: 'orders' },
    { lang: 'de', key: 'orders.pay_now', value: 'Jetzt bezahlen', group: 'orders' },
    
    { lang: 'tr', key: 'orders.pay_order', value: 'Sipariş Ödemesi', group: 'orders' },
    { lang: 'en', key: 'orders.pay_order', value: 'Order Payment', group: 'orders' },
    { lang: 'de', key: 'orders.pay_order', value: 'Bestellzahlung', group: 'orders' }
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
