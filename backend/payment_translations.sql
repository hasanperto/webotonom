-- Payment Modal and Bank Transfer Form Translations
-- Turkish, English, German

-- Payment Modal Translations
INSERT INTO translations (language_code, `key`, value) VALUES
-- Payment methods
('tr', 'payment.method.credit_card', 'Kredi/Banka Kartı'),
('en', 'payment.method.credit_card', 'Credit/Debit Card'),
('de', 'payment.method.credit_card', 'Kredit-/Debitkarte'),

('tr', 'payment.method.credit_card_desc', 'Visa, Mastercard, Troy'),
('en', 'payment.method.credit_card_desc', 'Visa, Mastercard, Troy'),
('de', 'payment.method.credit_card_desc', 'Visa, Mastercard, Troy'),

('tr', 'payment.method.bank_transfer', 'Havale/EFT'),
('en', 'payment.method.bank_transfer', 'Bank Transfer'),
('de', 'payment.method.bank_transfer', 'Banküberweisung'),

('tr', 'payment.method.bank_transfer_desc', 'Banka hesaplarımıza transfer'),
('en', 'payment.method.bank_transfer_desc', 'Transfer to our bank accounts'),
('de', 'payment.method.bank_transfer_desc', 'Überweisen Sie auf unsere Bankkonten'),

('tr', 'payment.method.mobile_payment', 'Mobil Ödeme'),
('en', 'payment.method.mobile_payment', 'Mobile Payment'),
('de', 'payment.method.mobile_payment', 'Mobile Zahlung'),

('tr', 'payment.method.mobile_payment_desc', 'Google Pay, Apple Pay'),
('en', 'payment.method.mobile_payment_desc', 'Google Pay, Apple Pay'),
('de', 'payment.method.mobile_payment_desc', 'Google Pay, Apple Pay'),

-- Payment errors
('tr', 'payment.error.invalid_card', 'Geçersiz kart numarası'),
('en', 'payment.error.invalid_card', 'Invalid card number'),
('de', 'payment.error.invalid_card', 'Ungültige Kartennummer'),

('tr', 'payment.error.invalid_name', 'Geçersiz isim'),
('en', 'payment.error.invalid_name', 'Invalid name'),
('de', 'payment.error.invalid_name', 'Ungültiger Name'),

('tr', 'payment.error.invalid_expiry', 'Geçersiz tarih'),
('en', 'payment.error.invalid_expiry', 'Invalid expiration date'),
('de', 'payment.error.invalid_expiry', 'Ungültiges Ablaufdatum'),

('tr', 'payment.error.invalid_cvv', 'Geçersiz CVV'),
('en', 'payment.error.invalid_cvv', 'Invalid CVV'),
('de', 'payment.error.invalid_cvv', 'Ungültiger CVV'),

-- Payment general
('tr', 'payment.title', 'Ödeme'),
('en', 'payment.title', 'Payment'),
('de', 'payment.title', 'Zahlung'),

('tr', 'payment.step.method', 'Yöntem'),
('en', 'payment.step.method', 'Method'),
('de', 'payment.step.method', 'Methode'),

('tr', 'payment.step.details', 'Detaylar'),
('en', 'payment.step.details', 'Details'),
('de', 'payment.step.details', 'Details'),

('tr', 'payment.step.complete', 'Tamamla'),
('en', 'payment.step.complete', 'Complete'),
('de', 'payment.step.complete', 'Abschließen'),

('tr', 'payment.select_method', 'Ödeme Yöntemi Seçin'),
('en', 'payment.select_method', 'Select Payment Method'),
('de', 'payment.select_method', 'Zahlungsmethode wählen'),

('tr', 'payment.popular', 'Popüler'),
('en', 'payment.popular', 'Popular'),
('de', 'payment.popular', 'Beliebt'),

-- Test mode
('tr', 'payment.test_mode', 'Test Modu'),
('en', 'payment.test_mode', 'Test Mode'),
('de', 'payment.test_mode', 'Testmodus'),

('tr', 'payment.test_success', 'Başarılı'),
('en', 'payment.test_success', 'Success'),
('de', 'payment.test_success', 'Erfolg'),

('tr', 'payment.test_fail', 'Başarısız'),
('en', 'payment.test_fail', 'Failed'),
('de', 'payment.test_fail', 'Fehlgeschlagen'),

('tr', 'payment.test_expiry', 'Tarih: Gelecek herhangi bir tarih'),
('en', 'payment.test_expiry', 'Exp: Any future date'),
('de', 'payment.test_expiry', 'Ablauf: Beliebiges zukünftiges Datum'),

-- Card form
('tr', 'payment.card_number', 'Kart Numarası'),
('en', 'payment.card_number', 'Card Number'),
('de', 'payment.card_number', 'Kartennummer'),

('tr', 'payment.card_name', 'Kart Üzerindeki İsim'),
('en', 'payment.card_name', 'Cardholder Name'),
('de', 'payment.card_name', 'Name auf der Karte'),

('tr', 'payment.expiry', 'Son Kullanma'),
('en', 'payment.expiry', 'Expiration'),
('de', 'payment.expiry', 'Ablaufdatum'),

('tr', 'payment.cvv', 'CVV'),
('en', 'payment.cvv', 'CVV'),
('de', 'payment.cvv', 'CVV'),

('tr', 'payment.back', 'Geri'),
('en', 'payment.back', 'Back'),
('de', 'payment.back', 'Zurück'),

('tr', 'payment.pay_now', 'Şimdi Öde'),
('en', 'payment.pay_now', 'Pay Now'),
('de', 'payment.pay_now', 'Jetzt bezahlen'),

-- Mobile payment
('tr', 'payment.select_mobile_method', 'Mobil Ödeme Yöntemi Seçin'),
('en', 'payment.select_mobile_method', 'Select Mobile Payment'),
('de', 'payment.select_mobile_method', 'Mobile Zahlung wählen'),

-- Processing
('tr', 'payment.processing', 'İşleniyor...'),
('en', 'payment.processing', 'Processing...'),
('de', 'payment.processing', 'Verarbeitung...'),

('tr', 'payment.processing_desc', 'Ödemeniz güvenli bir şekilde işleniyor.'),
('en', 'payment.processing_desc', 'Your payment is being processed securely.'),
('de', 'payment.processing_desc', 'Ihre Zahlung wird sicher verarbeitet.'),

-- Success
('tr', 'payment.success', 'Ödeme Başarılı!'),
('en', 'payment.success', 'Payment Successful!'),
('de', 'payment.success', 'Zahlung erfolgreich!'),

('tr', 'payment.added_to_balance', 'bakiyenize eklendi'),
('en', 'payment.added_to_balance', 'added to your balance'),
('de', 'payment.added_to_balance', 'zu Ihrem Guthaben hinzugefügt'),

('tr', 'payment.bonus_earned', 'bonus kazandınız!'),
('en', 'payment.bonus_earned', 'bonus earned!'),
('de', 'payment.bonus_earned', 'Bonus verdient!'),

('tr', 'payment.done', 'Tamam'),
('en', 'payment.done', 'Done'),
('de', 'payment.done', 'Fertig'),

('tr', 'payment.amount', 'Tutar'),
('en', 'payment.amount', 'Amount'),
('de', 'payment.amount', 'Betrag'),

('tr', 'payment.bonus', 'Bonus'),
('en', 'payment.bonus', 'Bonus'),
('de', 'payment.bonus', 'Bonus'),

('tr', 'payment.total', 'Toplam'),
('en', 'payment.total', 'Total'),
('de', 'payment.total', 'Gesamt'),

('tr', 'payment.secure_payment', 'Güvenli ödeme ile korunmaktadır'),
('en', 'payment.secure_payment', 'Protected with secure payment'),
('de', 'payment.secure_payment', 'Geschützt durch sichere Zahlung'),

-- Bank Transfer Form Translations
('tr', 'bank_transfer.file_too_large', 'Dosya boyutu 5MB\'dan küçük olmalıdır'),
('en', 'bank_transfer.file_too_large', 'File size must be less than 5MB'),
('de', 'bank_transfer.file_too_large', 'Dateigröße muss kleiner als 5 MB sein'),

('tr', 'bank_transfer.upload_failed', 'Dosya yüklenemedi'),
('en', 'bank_transfer.upload_failed', 'Failed to upload receipt'),
('de', 'bank_transfer.upload_failed', 'Hochladen fehlgeschlagen'),

('tr', 'bank_transfer.fill_required', 'Lütfen tüm zorunlu alanları doldurun'),
('en', 'bank_transfer.fill_required', 'Please fill in all required fields'),
('de', 'bank_transfer.fill_required', 'Bitte füllen Sie alle Pflichtfelder aus'),

('tr', 'bank_transfer.submit_failed', 'Bildirim gönderilemedi'),
('en', 'bank_transfer.submit_failed', 'Failed to submit notification'),
('de', 'bank_transfer.submit_failed', 'Benachrichtigung konnte nicht gesendet werden'),

('tr', 'bank_transfer.reference_created', 'Referans Numarası Oluşturuldu'),
('en', 'bank_transfer.reference_created', 'Reference Number Created'),
('de', 'bank_transfer.reference_created', 'Referenznummer erstellt'),

('tr', 'bank_transfer.reference_number', 'Referans Numarası'),
('en', 'bank_transfer.reference_number', 'Reference Number'),
('de', 'bank_transfer.reference_number', 'Referenznummer'),

('tr', 'bank_transfer.reference_hint', 'Lütfen bu referans numarasını havale açıklamasına ekleyin'),
('en', 'bank_transfer.reference_hint', 'Please include this reference number in your transfer description'),
('de', 'bank_transfer.reference_hint', 'Bitte fügen Sie diese Referenznummer in Ihre Überweisungsbeschreibung ein'),

('tr', 'bank_transfer.our_accounts', 'Banka Hesaplarımız'),
('en', 'bank_transfer.our_accounts', 'Our Bank Accounts'),
('de', 'bank_transfer.our_accounts', 'Unsere Bankkonten'),

('tr', 'bank_transfer.account_name', 'Hesap Adı'),
('en', 'bank_transfer.account_name', 'Account Name'),
('de', 'bank_transfer.account_name', 'Kontoname'),

('tr', 'bank_transfer.account_number', 'Hesap Numarası'),
('en', 'bank_transfer.account_number', 'Account Number'),
('de', 'bank_transfer.account_number', 'Kontonummer'),

('tr', 'bank_transfer.notify_title', 'Havale Sonrası Bize Bildirin'),
('en', 'bank_transfer.notify_title', 'Notify Us After Transfer'),
('de', 'bank_transfer.notify_title', 'Benachrichtigen Sie uns nach der Überweisung'),

('tr', 'bank_transfer.notify_desc', 'Banka havalenizi tamamladıktan sonra lütfen bu formu doldurun'),
('en', 'bank_transfer.notify_desc', 'Please fill in this form after completing the bank transfer'),
('de', 'bank_transfer.notify_desc', 'Bitte füllen Sie dieses Formular nach Abschluss der Überweisung aus'),

('tr', 'bank_transfer.sender_name', 'Gönderen Adı'),
('en', 'bank_transfer.sender_name', 'Sender Name'),
('de', 'bank_transfer.sender_name', 'Absendername'),

('tr', 'bank_transfer.sender_name_placeholder', 'Bankada görünen tam ad'),
('en', 'bank_transfer.sender_name_placeholder', 'Full name as shown in bank'),
('de', 'bank_transfer.sender_name_placeholder', 'Vollständiger Name wie in der Bank angezeigt'),

('tr', 'bank_transfer.bank_name', 'Banka Adı'),
('en', 'bank_transfer.bank_name', 'Bank Name'),
('de', 'bank_transfer.bank_name', 'Bankname'),

('tr', 'bank_transfer.select_bank', 'Bankanızı seçin'),
('en', 'bank_transfer.select_bank', 'Select your bank'),
('de', 'bank_transfer.select_bank', 'Wählen Sie Ihre Bank'),

('tr', 'bank_transfer.other_bank', 'Diğer Banka'),
('en', 'bank_transfer.other_bank', 'Other Bank'),
('de', 'bank_transfer.other_bank', 'Andere Bank'),

('tr', 'bank_transfer.receipt', 'Havale Dekontu'),
('en', 'bank_transfer.receipt', 'Transfer Receipt'),
('de', 'bank_transfer.receipt', 'Überweisungsbeleg'),

('tr', 'bank_transfer.optional', 'Opsiyonel'),
('en', 'bank_transfer.optional', 'Optional'),
('de', 'bank_transfer.optional', 'Optional'),

('tr', 'bank_transfer.uploading', 'Yükleniyor...'),
('en', 'bank_transfer.uploading', 'Uploading...'),
('de', 'bank_transfer.uploading', 'Hochladen...'),

('tr', 'bank_transfer.file_uploaded', 'Dosya yüklendi'),
('en', 'bank_transfer.file_uploaded', 'File uploaded'),
('de', 'bank_transfer.file_uploaded', 'Datei hochgeladen'),

('tr', 'bank_transfer.upload_receipt', 'Dekont yükle'),
('en', 'bank_transfer.upload_receipt', 'Upload receipt'),
('de', 'bank_transfer.upload_receipt', 'Beleg hochladen'),

('tr', 'bank_transfer.notes', 'Ek Notlar'),
('en', 'bank_transfer.notes', 'Additional Notes'),
('de', 'bank_transfer.notes', 'Zusätzliche Notizen'),

('tr', 'bank_transfer.notes_placeholder', 'İlave bilgiler...'),
('en', 'bank_transfer.notes_placeholder', 'Any additional information...'),
('de', 'bank_transfer.notes_placeholder', 'Beliebige zusätzliche Informationen...'),

('tr', 'bank_transfer.submitting', 'Gönderiliyor...'),
('en', 'bank_transfer.submitting', 'Submitting...'),
('de', 'bank_transfer.submitting', 'Senden...'),

('tr', 'bank_transfer.submit_notification', 'Bildirimi Gönder'),
('en', 'bank_transfer.submit_notification', 'Submit Notification'),
('de', 'bank_transfer.submit_notification', 'Benachrichtigung senden'),

('tr', 'bank_transfer.review_info', 'Transferiniz ekibimiz tarafından incelenecek ve onaylandıktan sonra 24 saat içinde bakiyeniz güncellenecektir.'),
('en', 'bank_transfer.review_info', 'Your transfer will be reviewed by our team and your balance will be updated within 24 hours after approval.'),
('de', 'bank_transfer.review_info', 'Ihre Überweisung wird von unserem Team überprüft und Ihr Guthaben wird innerhalb von 24 Stunden nach Genehmigung aktualisiert.')

ON DUPLICATE KEY UPDATE value = VALUES(value);
