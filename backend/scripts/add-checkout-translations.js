import pool from '../config/database.js';

const translations = [
    // checkout.account_number
    { lang: 'tr', key: 'checkout.account_number', value: 'Hesap Numarası' },
    { lang: 'en', key: 'checkout.account_number', value: 'Account Number' },
    { lang: 'de', key: 'checkout.account_number', value: 'Kontonummer' },
    
    // Bank transfer notification form
    { lang: 'tr', key: 'checkout.payment_notification_form', value: 'Ödeme Bildirimi Formu' },
    { lang: 'en', key: 'checkout.payment_notification_form', value: 'Payment Notification Form' },
    { lang: 'de', key: 'checkout.payment_notification_form', value: 'Zahlungsbenachrichtigungsformular' },
    
    { lang: 'tr', key: 'checkout.payment_notification_form_desc', value: 'Havale/EFT yaptıktan sonra ödeme bilgilerinizi gönderin. Siparişiniz en kısa sürede onaylanacaktır.' },
    { lang: 'en', key: 'checkout.payment_notification_form_desc', value: 'After making a bank transfer, submit your payment information. Your order will be confirmed as soon as possible.' },
    { lang: 'de', key: 'checkout.payment_notification_form_desc', value: 'Nach der Überweisung senden Sie bitte Ihre Zahlungsinformationen. Ihre Bestellung wird so schnell wie möglich bestätigt.' },
    
    { lang: 'tr', key: 'checkout.submit_payment_info', value: 'Ödeme Bilgilerini Gönder' },
    { lang: 'en', key: 'checkout.submit_payment_info', value: 'Submit Payment Information' },
    { lang: 'de', key: 'checkout.submit_payment_info', value: 'Zahlungsinformationen senden' },
    
    { lang: 'tr', key: 'checkout.receipt_number', value: 'Dekont Numarası' },
    { lang: 'en', key: 'checkout.receipt_number', value: 'Receipt Number' },
    { lang: 'de', key: 'checkout.receipt_number', value: 'Belegnummer' },
    
    { lang: 'tr', key: 'checkout.receipt_number_placeholder', value: 'Örn: 123456789' },
    { lang: 'en', key: 'checkout.receipt_number_placeholder', value: 'E.g: 123456789' },
    { lang: 'de', key: 'checkout.receipt_number_placeholder', value: 'z.B: 123456789' },
    
    { lang: 'tr', key: 'checkout.receipt_number_required', value: 'Dekont numarası zorunludur' },
    { lang: 'en', key: 'checkout.receipt_number_required', value: 'Receipt number is required' },
    { lang: 'de', key: 'checkout.receipt_number_required', value: 'Belegnummer ist erforderlich' },
    
    { lang: 'tr', key: 'checkout.reference_number', value: 'Referans Numarası' },
    { lang: 'en', key: 'checkout.reference_number', value: 'Reference Number' },
    { lang: 'de', key: 'checkout.reference_number', value: 'Referenznummer' },
    
    { lang: 'tr', key: 'checkout.reference_number_placeholder', value: 'CS veya referans numarası (opsiyonel)' },
    { lang: 'en', key: 'checkout.reference_number_placeholder', value: 'CS or reference number (optional)' },
    { lang: 'de', key: 'checkout.reference_number_placeholder', value: 'CS oder Referenznummer (optional)' },
    
    { lang: 'tr', key: 'checkout.upload_receipt', value: 'Dekont Yükle' },
    { lang: 'en', key: 'checkout.upload_receipt', value: 'Upload Receipt' },
    { lang: 'de', key: 'checkout.upload_receipt', value: 'Beleg hochladen' },
    
    { lang: 'tr', key: 'checkout.upload_receipt_hint', value: 'JPG, PNG veya PDF formatında (maks. 5MB)' },
    { lang: 'en', key: 'checkout.upload_receipt_hint', value: 'JPG, PNG or PDF format (max. 5MB)' },
    { lang: 'de', key: 'checkout.upload_receipt_hint', value: 'JPG, PNG oder PDF Format (max. 5MB)' },
    
    { lang: 'tr', key: 'checkout.additional_notes', value: 'Ek Notlar' },
    { lang: 'en', key: 'checkout.additional_notes', value: 'Additional Notes' },
    { lang: 'de', key: 'checkout.additional_notes', value: 'Zusätzliche Notizen' },
    
    { lang: 'tr', key: 'checkout.additional_notes_placeholder', value: 'İsteğe bağlı ek bilgiler...' },
    { lang: 'en', key: 'checkout.additional_notes_placeholder', value: 'Optional additional information...' },
    { lang: 'de', key: 'checkout.additional_notes_placeholder', value: 'Optionale zusätzliche Informationen...' },
    
    { lang: 'tr', key: 'checkout.submitting', value: 'Gönderiliyor...' },
    { lang: 'en', key: 'checkout.submitting', value: 'Submitting...' },
    { lang: 'de', key: 'checkout.submitting', value: 'Wird gesendet...' },
    
    { lang: 'tr', key: 'checkout.submit_notification', value: 'Bildirimi Gönder' },
    { lang: 'en', key: 'checkout.submit_notification', value: 'Submit Notification' },
    { lang: 'de', key: 'checkout.submit_notification', value: 'Benachrichtigung senden' },
    
    { lang: 'tr', key: 'checkout.cancel', value: 'İptal' },
    { lang: 'en', key: 'checkout.cancel', value: 'Cancel' },
    { lang: 'de', key: 'checkout.cancel', value: 'Abbrechen' },
    
    { lang: 'tr', key: 'checkout.notification_submitted_success', value: 'Ödeme bildirimi başarıyla gönderildi. Siparişiniz en kısa sürede onaylanacaktır.' },
    { lang: 'en', key: 'checkout.notification_submitted_success', value: 'Payment notification submitted successfully. Your order will be confirmed as soon as possible.' },
    { lang: 'de', key: 'checkout.notification_submitted_success', value: 'Zahlungsbenachrichtigung erfolgreich gesendet. Ihre Bestellung wird so schnell wie möglich bestätigt.' },
    
    { lang: 'tr', key: 'checkout.notification_submit_failed', value: 'Bildirim gönderilirken hata oluştu. Lütfen tekrar deneyin.' },
    { lang: 'en', key: 'checkout.notification_submit_failed', value: 'Error submitting notification. Please try again.' },
    { lang: 'de', key: 'checkout.notification_submit_failed', value: 'Fehler beim Senden der Benachrichtigung. Bitte versuchen Sie es erneut.' }
];

async function addTranslations() {
    try {
        console.log('📝 Çeviriler ekleniyor...');
        
        for (const trans of translations) {
            // Önce var mı kontrol et
            const [existing] = await pool.execute(
                'SELECT id FROM translations WHERE language_code = ? AND `key` = ?',
                [trans.lang, trans.key]
            );
            
            if (existing.length > 0) {
                // Güncelle
                await pool.execute(
                    'UPDATE translations SET value = ? WHERE language_code = ? AND `key` = ?',
                    [trans.value, trans.lang, trans.key]
                );
                console.log(`✅ Güncellendi: ${trans.lang} - ${trans.key}`);
            } else {
                // Ekle
                await pool.execute(
                    'INSERT INTO translations (language_code, `key`, value, `group`) VALUES (?, ?, ?, ?)',
                    [trans.lang, trans.key, trans.value, 'checkout']
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
