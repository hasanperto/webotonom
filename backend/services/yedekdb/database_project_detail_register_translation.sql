-- Proje detay: Kayıt Ol (mobil CTA / masaüstü)
INSERT INTO `translations` (`language_code`, `key`, `value`, `group`) VALUES
('tr', 'project_detail.register', 'Kayıt Ol', 'project_detail'),
('en', 'project_detail.register', 'Sign up', 'project_detail'),
('de', 'project_detail.register', 'Registrieren', 'project_detail')
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`);
