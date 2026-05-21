-- Mobil menü çevirileri (header.menu, preferences, language, theme, ...)
-- mysql -u teknopro -p teknopro < database_header_mobile_menu_translations.sql

USE `teknopro`;

INSERT INTO `translations` (`language_code`, `key`, `value`, `group`) VALUES
-- Türkçe
('tr', 'header.menu', 'Menü', 'header'),
('tr', 'header.close_menu', 'Menüyü kapat', 'header'),
('tr', 'header.preferences', 'Tercihler', 'header'),
('tr', 'header.language', 'Dil', 'header'),
('tr', 'header.theme', 'Tema', 'header'),
('tr', 'header.seller_menu', 'Satıcı menüsü', 'header'),
('tr', 'header.user_menu', 'Kullanıcı menüsü', 'header'),

-- İngilizce
('en', 'header.menu', 'Menu', 'header'),
('en', 'header.close_menu', 'Close menu', 'header'),
('en', 'header.preferences', 'Preferences', 'header'),
('en', 'header.language', 'Language', 'header'),
('en', 'header.theme', 'Theme', 'header'),
('en', 'header.seller_menu', 'Seller menu', 'header'),
('en', 'header.user_menu', 'User menu', 'header'),

-- Almanca
('de', 'header.menu', 'Menü', 'header'),
('de', 'header.close_menu', 'Menü schließen', 'header'),
('de', 'header.preferences', 'Einstellungen', 'header'),
('de', 'header.language', 'Sprache', 'header'),
('de', 'header.theme', 'Design', 'header'),
('de', 'header.seller_menu', 'Verkäufermenü', 'header'),
('de', 'header.user_menu', 'Benutzermenü', 'header')

ON DUPLICATE KEY UPDATE `value` = VALUES(`value`);
