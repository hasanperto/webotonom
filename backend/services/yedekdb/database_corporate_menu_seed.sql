-- Kurumsal menü + eksik sayfa slugları
-- Tam içerik: database_default_pages.sql (önce onu çalıştırın)

INSERT INTO `pages` (`title`, `slug`, `content`, `meta_title`, `meta_description`, `status`) VALUES
('Kullanım Koşulları', 'kullanim-kosullari',
'<div class="page-content"><h2>Kullanım Koşulları</h2><p>Son güncelleme: 2024</p><h3>1. Kabul</h3><p>TeknoProje platformunu kullanarak bu koşulları kabul etmiş sayılırsınız.</p></div>',
'Kullanım Koşulları - TeknoProje', 'TeknoProje kullanım koşulları.', 'active'),
('Gizlilik Politikası', 'gizlilik-politikasi',
'<div class="page-content"><h2>Gizlilik Politikası</h2><p>Kişisel verileriniz KVKK kapsamında korunur.</p></div>',
'Gizlilik Politikası - TeknoProje', 'TeknoProje gizlilik politikası.', 'active')
ON DUPLICATE KEY UPDATE
  `title` = VALUES(`title`),
  `content` = VALUES(`content`),
  `meta_title` = VALUES(`meta_title`),
  `meta_description` = VALUES(`meta_description`),
  `status` = VALUES(`status`);

SET @page_kullanim = (SELECT id FROM pages WHERE slug = 'kullanim-kosullari' LIMIT 1);

INSERT INTO `content_translations` (`content_id`, `content_type`, `language_code`, `title`, `description`) VALUES
(@page_kullanim, 'page', 'tr', 'Kullanım Koşulları', '<div class="page-content"><h2>Kullanım Koşulları</h2></div>'),
(@page_kullanim, 'page', 'en', 'Terms of Use', '<div class="page-content"><h2>Terms of Use</h2></div>'),
(@page_kullanim, 'page', 'de', 'Nutzungsbedingungen', '<div class="page-content"><h2>Nutzungsbedingungen</h2></div>')
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`), `description` = VALUES(`description`);

SET @page_gizlilik_kisa = (SELECT id FROM pages WHERE slug = 'gizlilik-politikasi' LIMIT 1);

INSERT INTO `content_translations` (`content_id`, `content_type`, `language_code`, `title`, `description`) VALUES
(@page_gizlilik_kisa, 'page', 'tr', 'Gizlilik Politikası', '<div class="page-content"><h2>Gizlilik Politikası</h2></div>'),
(@page_gizlilik_kisa, 'page', 'en', 'Privacy Policy', '<div class="page-content"><h2>Privacy Policy</h2></div>'),
(@page_gizlilik_kisa, 'page', 'de', 'Datenschutz', '<div class="page-content"><h2>Datenschutz</h2></div>')
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`), `description` = VALUES(`description`);

DELETE FROM `menu_items` WHERE `menu_type` = 'corporate';

INSERT INTO `menu_items` (`menu_type`, `title`, `url`, `icon`, `order`, `status`, `target`) VALUES
('corporate', 'Hakkımızda', '/hakkimizda', 'FiGlobe', 1, 'active', '_self'),
('corporate', 'Gizlilik Politikası', '/gizlilik-politikasi', 'FiTarget', 2, 'active', '_self'),
('corporate', 'Kullanım Koşulları', '/kullanim-kosullari', 'FiHelpCircle', 3, 'active', '_self'),
('corporate', 'Misyon & Vizyon', '/misyon-vizyon', 'FiGrid', 4, 'active', '_self'),
('corporate', 'Gizlilik Politikamız', '/gizlilik-politikamiz', 'FiShield', 5, 'active', '_self'),
('corporate', 'Kalite Politikamız', '/kalite-politikamiz', 'FiTrendingUp', 6, 'active', '_self'),
('corporate', 'Teslimat ve İade Şartları', '/teslimat-ve-iade-sartlari', 'FiShoppingCart', 7, 'active', '_self'),
('corporate', 'Lisans Politikası', '/lisans-politikasi', 'FiLink', 8, 'active', '_self');
