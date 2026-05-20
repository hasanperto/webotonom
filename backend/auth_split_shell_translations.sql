-- Auth split shell: sekme etiketleri + görsel slogan (i18n)
-- MySQL: language_code + key benzersiz

INSERT INTO translations (language_code, `key`, `value`, `group`) VALUES
('tr', 'auth.split_tagline', 'Projelerinizi güvenle yönetin ve keşfedin.', 'auth'),
('tr', 'auth.segment_label', 'Giriş veya kayıt', 'auth'),
('tr', 'auth.login_tab', 'Giriş', 'auth'),
('tr', 'auth.register_tab', 'Kayıt', 'auth'),
('en', 'auth.split_tagline', 'Manage and discover your projects with confidence.', 'auth'),
('en', 'auth.segment_label', 'Sign in or register', 'auth'),
('en', 'auth.login_tab', 'Sign in', 'auth'),
('en', 'auth.register_tab', 'Register', 'auth'),
('de', 'auth.split_tagline', 'Verwalten und entdecken Sie Ihre Projekte sicher.', 'auth'),
('de', 'auth.segment_label', 'Anmelden oder registrieren', 'auth'),
('de', 'auth.login_tab', 'Anmelden', 'auth'),
('de', 'auth.register_tab', 'Registrieren', 'auth')
ON DUPLICATE KEY UPDATE
  value = VALUES(value),
  `group` = VALUES(`group`),
  updated_at = CURRENT_TIMESTAMP;
