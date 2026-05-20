-- Home Contact Section Translations
-- TR, EN, DE

INSERT INTO translations (language_code, `key`, `value`, `group`) VALUES
-- Form Labels
('tr', 'home.contact.form.name', 'Ad Soyad', 'home'),
('en', 'home.contact.form.name', 'Full Name', 'home'),
('de', 'home.contact.form.name', 'Vollständiger Name', 'home'),

('tr', 'home.contact.form.email', 'E-posta', 'home'),
('en', 'home.contact.form.email', 'Email', 'home'),
('de', 'home.contact.form.email', 'E-Mail', 'home'),

('tr', 'home.contact.form.phone', 'Telefon', 'home'),
('en', 'home.contact.form.phone', 'Phone', 'home'),
('de', 'home.contact.form.phone', 'Telefon', 'home'),

('tr', 'home.contact.form.subject', 'Konu', 'home'),
('en', 'home.contact.form.subject', 'Subject', 'home'),
('de', 'home.contact.form.subject', 'Betreff', 'home'),

('tr', 'home.contact.form.message', 'Mesajınız', 'home'),
('en', 'home.contact.form.message', 'Your Message', 'home'),
('de', 'home.contact.form.message', 'Ihre Nachricht', 'home'),

-- Form Placeholders
('tr', 'home.contact.form.name_placeholder', 'Adınız ve Soyadınız', 'home'),
('en', 'home.contact.form.name_placeholder', 'Your Full Name', 'home'),
('de', 'home.contact.form.name_placeholder', 'Ihr vollständiger Name', 'home'),

('tr', 'home.contact.form.email_placeholder', 'ornek@email.com', 'home'),
('en', 'home.contact.form.email_placeholder', 'example@email.com', 'home'),
('de', 'home.contact.form.email_placeholder', 'beispiel@email.com', 'home'),

('tr', 'home.contact.form.phone_placeholder', '(5XX) XXX XX XX', 'home'),
('en', 'home.contact.form.phone_placeholder', '(XXX) XXX XXXX', 'home'),
('de', 'home.contact.form.phone_placeholder', '(XXX) XXX XXXX', 'home'),

('tr', 'home.contact.form.subject_placeholder', 'Mesaj konusu (opsiyonel)', 'home'),
('en', 'home.contact.form.subject_placeholder', 'Message subject (optional)', 'home'),
('de', 'home.contact.form.subject_placeholder', 'Nachrichtenbetreff (optional)', 'home'),

('tr', 'home.contact.form.message_placeholder', 'Mesajınızı buraya yazın...', 'home'),
('en', 'home.contact.form.message_placeholder', 'Write your message here...', 'home'),
('de', 'home.contact.form.message_placeholder', 'Schreiben Sie hier Ihre Nachricht...', 'home'),

-- Form Buttons
('tr', 'home.contact.form.submit', 'Mesaj Gönder', 'home'),
('en', 'home.contact.form.submit', 'Send Message', 'home'),
('de', 'home.contact.form.submit', 'Nachricht Senden', 'home'),

('tr', 'home.contact.form.sending', 'Gönderiliyor...', 'home'),
('en', 'home.contact.form.sending', 'Sending...', 'home'),
('de', 'home.contact.form.sending', 'Wird gesendet...', 'home'),

-- Default Subject
('tr', 'home.contact.default_subject', 'İletişim Formu', 'home'),
('en', 'home.contact.default_subject', 'Contact Form', 'home'),
('de', 'home.contact.default_subject', 'Kontaktformular', 'home'),

-- Error Messages
('tr', 'home.contact.errors.name_required', 'Ad Soyad gereklidir', 'home'),
('en', 'home.contact.errors.name_required', 'Full name is required', 'home'),
('de', 'home.contact.errors.name_required', 'Vollständiger Name ist erforderlich', 'home'),

('tr', 'home.contact.errors.email_required', 'E-posta gereklidir', 'home'),
('en', 'home.contact.errors.email_required', 'Email is required', 'home'),
('de', 'home.contact.errors.email_required', 'E-Mail ist erforderlich', 'home'),

('tr', 'home.contact.errors.email_invalid', 'Geçerli bir e-posta adresi giriniz', 'home'),
('en', 'home.contact.errors.email_invalid', 'Please enter a valid email address', 'home'),
('de', 'home.contact.errors.email_invalid', 'Bitte geben Sie eine gültige E-Mail-Adresse ein', 'home'),

('tr', 'home.contact.errors.phone_invalid', 'Geçerli bir telefon numarası giriniz', 'home'),
('en', 'home.contact.errors.phone_invalid', 'Please enter a valid phone number', 'home'),
('de', 'home.contact.errors.phone_invalid', 'Bitte geben Sie eine gültige Telefonnummer ein', 'home'),

('tr', 'home.contact.errors.message_required', 'Mesaj gereklidir', 'home'),
('en', 'home.contact.errors.message_required', 'Message is required', 'home'),
('de', 'home.contact.errors.message_required', 'Nachricht ist erforderlich', 'home'),

('tr', 'home.contact.errors.submit_failed', 'Mesaj gönderilemedi. Lütfen tekrar deneyin.', 'home'),
('en', 'home.contact.errors.submit_failed', 'Failed to send message. Please try again.', 'home'),
('de', 'home.contact.errors.submit_failed', 'Nachricht konnte nicht gesendet werden. Bitte versuchen Sie es erneut.', 'home')

ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `group` = VALUES(`group`);
