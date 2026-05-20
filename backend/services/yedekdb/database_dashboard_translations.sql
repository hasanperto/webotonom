-- Dashboard Translations
-- TR, EN, DE

INSERT INTO translations (language_code, `key`, `value`, `group`) VALUES
-- Header
('tr', 'dashboard.welcome', 'Hoş Geldiniz, {username}!', 'dashboard'),
('en', 'dashboard.welcome', 'Welcome, {username}!', 'dashboard'),
('de', 'dashboard.welcome', 'Willkommen, {username}!', 'dashboard'),

('tr', 'dashboard.subtitle', 'Hesabınızın genel görünümü', 'dashboard'),
('en', 'dashboard.subtitle', 'Overview of your account', 'dashboard'),
('de', 'dashboard.subtitle', 'Übersicht über Ihr Konto', 'dashboard'),

('tr', 'dashboard.notifications', 'Bildirimler', 'dashboard'),
('en', 'dashboard.notifications', 'Notifications', 'dashboard'),
('de', 'dashboard.notifications', 'Benachrichtigungen', 'dashboard'),

('tr', 'dashboard.loading', 'Yükleniyor...', 'dashboard'),
('en', 'dashboard.loading', 'Loading...', 'dashboard'),
('de', 'dashboard.loading', 'Wird geladen...', 'dashboard'),

-- Balance Section
('tr', 'dashboard.balance', 'Bakiye', 'dashboard'),
('en', 'dashboard.balance', 'Balance', 'dashboard'),
('de', 'dashboard.balance', 'Guthaben', 'dashboard'),

('tr', 'dashboard.load_money', 'Para Yükle', 'dashboard'),
('en', 'dashboard.load_money', 'Load Money', 'dashboard'),
('de', 'dashboard.load_money', 'Geld Aufladen', 'dashboard'),

('tr', 'dashboard.transactions', 'İşlemler', 'dashboard'),
('en', 'dashboard.transactions', 'Transactions', 'dashboard'),
('de', 'dashboard.transactions', 'Transaktionen', 'dashboard'),

-- Stats
('tr', 'dashboard.stats.orders', 'Sipariş', 'dashboard'),
('en', 'dashboard.stats.orders', 'Order', 'dashboard'),
('de', 'dashboard.stats.orders', 'Bestellung', 'dashboard'),

('tr', 'dashboard.stats.favorites', 'Favori', 'dashboard'),
('en', 'dashboard.stats.favorites', 'Favorite', 'dashboard'),
('de', 'dashboard.stats.favorites', 'Favorit', 'dashboard'),

('tr', 'dashboard.stats.messages', 'Mesaj', 'dashboard'),
('en', 'dashboard.stats.messages', 'Message', 'dashboard'),
('de', 'dashboard.stats.messages', 'Nachricht', 'dashboard'),

('tr', 'dashboard.stats.donations', 'Bağış', 'dashboard'),
('en', 'dashboard.stats.donations', 'Donation', 'dashboard'),
('de', 'dashboard.stats.donations', 'Spende', 'dashboard'),

('tr', 'dashboard.stats.downloads', 'İndirme', 'dashboard'),
('en', 'dashboard.stats.downloads', 'Download', 'dashboard'),
('de', 'dashboard.stats.downloads', 'Download', 'dashboard'),

-- Quick Actions
('tr', 'dashboard.quick_actions.title', 'Hızlı İşlemler', 'dashboard'),
('en', 'dashboard.quick_actions.title', 'Quick Actions', 'dashboard'),
('de', 'dashboard.quick_actions.title', 'Schnellaktionen', 'dashboard'),

('tr', 'dashboard.quick_actions.explore_projects', 'Projeleri Keşfet', 'dashboard'),
('en', 'dashboard.quick_actions.explore_projects', 'Explore Projects', 'dashboard'),
('de', 'dashboard.quick_actions.explore_projects', 'Projekte Erkunden', 'dashboard'),

('tr', 'dashboard.quick_actions.my_orders', 'Siparişlerim', 'dashboard'),
('en', 'dashboard.quick_actions.my_orders', 'My Orders', 'dashboard'),
('de', 'dashboard.quick_actions.my_orders', 'Meine Bestellungen', 'dashboard'),

('tr', 'dashboard.quick_actions.my_favorites', 'Favorilerim', 'dashboard'),
('en', 'dashboard.quick_actions.my_favorites', 'My Favorites', 'dashboard'),
('de', 'dashboard.quick_actions.my_favorites', 'Meine Favoriten', 'dashboard'),

('tr', 'dashboard.quick_actions.my_messages', 'Mesajlarım', 'dashboard'),
('en', 'dashboard.quick_actions.my_messages', 'My Messages', 'dashboard'),
('de', 'dashboard.quick_actions.my_messages', 'Meine Nachrichten', 'dashboard'),

('tr', 'dashboard.quick_actions.my_donations', 'Bağışlarım', 'dashboard'),
('en', 'dashboard.quick_actions.my_donations', 'My Donations', 'dashboard'),
('de', 'dashboard.quick_actions.my_donations', 'Meine Spenden', 'dashboard'),

('tr', 'dashboard.quick_actions.support_tickets', 'Destek Talepleri', 'dashboard'),
('en', 'dashboard.quick_actions.support_tickets', 'Support Tickets', 'dashboard'),
('de', 'dashboard.quick_actions.support_tickets', 'Support-Tickets', 'dashboard'),

('tr', 'dashboard.quick_actions.my_profile', 'Profilim', 'dashboard'),
('en', 'dashboard.quick_actions.my_profile', 'My Profile', 'dashboard'),
('de', 'dashboard.quick_actions.my_profile', 'Mein Profil', 'dashboard'),

('tr', 'dashboard.quick_actions.settings', 'Ayarlar', 'dashboard'),
('en', 'dashboard.quick_actions.settings', 'Settings', 'dashboard'),
('de', 'dashboard.quick_actions.settings', 'Einstellungen', 'dashboard'),

('tr', 'dashboard.quick_actions.my_cart', 'Sepetim', 'dashboard'),
('en', 'dashboard.quick_actions.my_cart', 'My Cart', 'dashboard'),
('de', 'dashboard.quick_actions.my_cart', 'Mein Warenkorb', 'dashboard'),

('tr', 'dashboard.quick_actions.my_downloads', 'İndirmelerim', 'dashboard'),
('en', 'dashboard.quick_actions.my_downloads', 'My Downloads', 'dashboard'),
('de', 'dashboard.quick_actions.my_downloads', 'Meine Downloads', 'dashboard'),

('tr', 'dashboard.quick_actions.bookmarked_projects', 'Kayıtlı Projeler', 'dashboard'),
('en', 'dashboard.quick_actions.bookmarked_projects', 'Bookmarked Projects', 'dashboard'),
('de', 'dashboard.quick_actions.bookmarked_projects', 'Gespeicherte Projekte', 'dashboard'),

('tr', 'dashboard.quick_actions.my_shares', 'Paylaşımlarım', 'dashboard'),
('en', 'dashboard.quick_actions.my_shares', 'My Shares', 'dashboard'),
('de', 'dashboard.quick_actions.my_shares', 'Meine Freigaben', 'dashboard')
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `group` = VALUES(`group`);

