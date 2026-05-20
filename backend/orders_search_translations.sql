
INSERT INTO translations (language_code, `key`, value, `group`) VALUES 
('tr', 'orders.search.advanced', 'Detaylı Arama', 'orders'),
('en', 'orders.search.advanced', 'Advanced Search', 'orders'),
('de', 'orders.search.advanced', 'Erweiterte Suche', 'orders'),

('tr', 'orders.search.placeholder', 'Sipariş No, Müşteri Adı veya Tutar ile ara...', 'orders'),
('en', 'orders.search.placeholder', 'Search by Order No, Customer Name or Amount...', 'orders'),
('de', 'orders.search.placeholder', 'Suche nach Bestell-Nr, Kundenname oder Betrag...', 'orders')
ON DUPLICATE KEY UPDATE value = VALUES(value);
