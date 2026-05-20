-- Sidebar Translations
-- TR, EN, DE

INSERT INTO translations (language_code, `key`, `value`, `group`) VALUES
-- Sidebar Title
('tr', 'sidebar.title', 'Kullanıcı Paneli', 'sidebar'),
('en', 'sidebar.title', 'User Panel', 'sidebar'),
('de', 'sidebar.title', 'Benutzerpanel', 'sidebar'),

-- Menu Items
('tr', 'sidebar.dashboard', 'Dashboard', 'sidebar'),
('en', 'sidebar.dashboard', 'Dashboard', 'sidebar'),
('de', 'sidebar.dashboard', 'Dashboard', 'sidebar'),

('tr', 'sidebar.orders', 'Siparişlerim', 'sidebar'),
('en', 'sidebar.orders', 'My Orders', 'sidebar'),
('de', 'sidebar.orders', 'Meine Bestellungen', 'sidebar'),

('tr', 'sidebar.transactions', 'İşlemlerim', 'sidebar'),
('en', 'sidebar.transactions', 'My Transactions', 'sidebar'),
('de', 'sidebar.transactions', 'Meine Transaktionen', 'sidebar'),

('tr', 'sidebar.favorites', 'Favorilerim', 'sidebar'),
('en', 'sidebar.favorites', 'My Favorites', 'sidebar'),
('de', 'sidebar.favorites', 'Meine Favoriten', 'sidebar'),

('tr', 'sidebar.downloads', 'İndirmelerim', 'sidebar'),
('en', 'sidebar.downloads', 'My Downloads', 'sidebar'),
('de', 'sidebar.downloads', 'Meine Downloads', 'sidebar'),

('tr', 'sidebar.donations', 'Bağışlarım', 'sidebar'),
('en', 'sidebar.donations', 'My Donations', 'sidebar'),
('de', 'sidebar.donations', 'Meine Spenden', 'sidebar'),

('tr', 'sidebar.messages', 'Mesajlarım', 'sidebar'),
('en', 'sidebar.messages', 'My Messages', 'sidebar'),
('de', 'sidebar.messages', 'Meine Nachrichten', 'sidebar'),

('tr', 'sidebar.support', 'Destek', 'sidebar'),
('en', 'sidebar.support', 'Support', 'sidebar'),
('de', 'sidebar.support', 'Support', 'sidebar'),

('tr', 'sidebar.profile', 'Profilim', 'sidebar'),
('en', 'sidebar.profile', 'My Profile', 'sidebar'),
('de', 'sidebar.profile', 'Mein Profil', 'sidebar'),

('tr', 'sidebar.settings', 'Ayarlar', 'sidebar'),
('en', 'sidebar.settings', 'Settings', 'sidebar'),
('de', 'sidebar.settings', 'Einstellungen', 'sidebar'),

-- Actions
('tr', 'sidebar.logout', 'Çıkış Yap', 'sidebar'),
('en', 'sidebar.logout', 'Logout', 'sidebar'),
('de', 'sidebar.logout', 'Abmelden', 'sidebar'),

('tr', 'sidebar.close_menu', 'Menüyü Kapat', 'sidebar'),
('en', 'sidebar.close_menu', 'Close Menu', 'sidebar'),
('de', 'sidebar.close_menu', 'Menü Schließen', 'sidebar'),

('tr', 'sidebar.open_menu', 'Menüyü Aç', 'sidebar'),
('en', 'sidebar.open_menu', 'Open Menu', 'sidebar'),
('de', 'sidebar.open_menu', 'Menü Öffnen', 'sidebar'),

('tr', 'sidebar.user', 'Kullanıcı', 'sidebar'),
('en', 'sidebar.user', 'User', 'sidebar'),
('de', 'sidebar.user', 'Benutzer', 'sidebar')
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `group` = VALUES(`group`);

