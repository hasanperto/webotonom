-- Ana sayfa Projects bölümü: öne çıkan / ızgara başlıkları (i18n)
-- MySQL: language_code + key benzersiz

INSERT INTO translations (language_code, `key`, `value`, `group`) VALUES
('tr', 'home.projects.featured_section_title', 'Öne Çıkan Projeler', 'home'),
('tr', 'home.projects.featured_section_subtitle', 'Editör seçimi ve öne çıkarılan projeleri keşfedin.', 'home'),
('tr', 'home.projects.grid_section_title', 'Tüm Projeler', 'home'),
('en', 'home.projects.featured_section_title', 'Featured Projects', 'home'),
('en', 'home.projects.featured_section_subtitle', 'Discover our hand-picked featured projects.', 'home'),
('en', 'home.projects.grid_section_title', 'All Projects', 'home'),
('de', 'home.projects.featured_section_title', 'Hervorgehobene Projekte', 'home'),
('de', 'home.projects.featured_section_subtitle', 'Entdecken Sie unsere handverlesenen, hervorgehobenen Projekte.', 'home'),
('de', 'home.projects.grid_section_title', 'Alle Projekte', 'home')
ON DUPLICATE KEY UPDATE
  value = VALUES(value),
  `group` = VALUES(`group`),
  updated_at = CURRENT_TIMESTAMP;
