-- Deposit transaction type translations
INSERT INTO translations (language_code, `key`, value) VALUES
('tr', 'transactions.types.deposit', 'Bakiye Yükleme'),
('en', 'transactions.types.deposit', 'Deposit'),
('de', 'transactions.types.deposit', 'Einzahlung')
ON DUPLICATE KEY UPDATE value = VALUES(value);
