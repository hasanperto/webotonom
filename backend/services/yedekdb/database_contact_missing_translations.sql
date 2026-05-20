-- ============================================
-- Contact Sayfası Eksik Çevirileri
-- ============================================

INSERT INTO `translations` (`language_code`, `key`, `value`, `group`) VALUES
-- Türkçe
('tr', 'contact.working_hours', 'Çalışma Saatleri', 'contact'),
('tr', 'contact.contact_us', 'Bize Ulaşın', 'contact'),
('tr', 'contact.form_description', 'Formu doldurun, size en kısa sürede dönüş yapalım.', 'contact'),
('tr', 'contact.our_location', 'Konumumuz', 'contact'),
('tr', 'contact.name_placeholder', 'Adınız Soyadınız', 'contact'),
('tr', 'contact.email_placeholder', 'ornek@email.com', 'contact'),
('tr', 'contact.phone_placeholder', '+90 555 123 4567', 'contact'),
('tr', 'contact.message_placeholder', 'Mesajınızı buraya yazın...', 'contact'),

-- İngilizce
('en', 'contact.working_hours', 'Working Hours', 'contact'),
('en', 'contact.contact_us', 'Contact Us', 'contact'),
('en', 'contact.form_description', 'Fill out the form, we will get back to you as soon as possible.', 'contact'),
('en', 'contact.our_location', 'Our Location', 'contact'),
('en', 'contact.name_placeholder', 'Your Full Name', 'contact'),
('en', 'contact.email_placeholder', 'example@email.com', 'contact'),
('en', 'contact.phone_placeholder', '+1 555 123 4567', 'contact'),
('en', 'contact.message_placeholder', 'Write your message here...', 'contact'),

-- Almanca
('de', 'contact.working_hours', 'Arbeitszeiten', 'contact'),
('de', 'contact.contact_us', 'Kontaktieren Sie uns', 'contact'),
('de', 'contact.form_description', 'Füllen Sie das Formular aus, wir werden uns so schnell wie möglich bei Ihnen melden.', 'contact'),
('de', 'contact.our_location', 'Unser Standort', 'contact'),
('de', 'contact.name_placeholder', 'Ihr vollständiger Name', 'contact'),
('de', 'contact.email_placeholder', 'beispiel@email.com', 'contact'),
('de', 'contact.phone_placeholder', '+49 555 123 4567', 'contact'),
('de', 'contact.message_placeholder', 'Schreiben Sie Ihre Nachricht hier...', 'contact')

ON DUPLICATE KEY UPDATE `value` = VALUES(`value`);
