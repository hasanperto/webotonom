
INSERT INTO translations (language_code, `key`, value, `group`) VALUES 
('tr', 'payment.new_card', 'Yeni Kart', 'payment'),
('en', 'payment.new_card', 'New Card', 'payment'),
('de', 'payment.new_card', 'Neue Karte', 'payment')
ON DUPLICATE KEY UPDATE value = VALUES(value);
