-- Dil Seçim Popup Çevirileri
-- TR, EN, DE

INSERT INTO translations (`language_code`, `key`, `value`, `group`) VALUES
-- Popup Başlık
('tr', 'language_popup.title', 'Dil Seçin', 'language_popup'),
('en', 'language_popup.title', 'Choose Language', 'language_popup'),
('de', 'language_popup.title', 'Sprache Wählen', 'language_popup'),

-- Popup Alt Başlık
('tr', 'language_popup.subtitle', 'Lütfen tercih ettiğiniz dili seçin', 'language_popup'),
('en', 'language_popup.subtitle', 'Please select your preferred language', 'language_popup'),
('de', 'language_popup.subtitle', 'Bitte wählen Sie Ihre bevorzugte Sprache', 'language_popup'),

-- Onay Butonu
('tr', 'language_popup.confirm', 'Devam Et', 'language_popup'),
('en', 'language_popup.confirm', 'Continue', 'language_popup'),
('de', 'language_popup.confirm', 'Fortfahren', 'language_popup')

ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `group` = VALUES(`group`);

