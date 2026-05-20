
INSERT INTO translations (language_code, `key`, value, `group`) VALUES 
('tr', 'transactions.show_details', 'Detayları Göster', 'transactions'),
('en', 'transactions.show_details', 'Show Details', 'transactions'),
('de', 'transactions.show_details', 'Details anzeigen', 'transactions'),

('tr', 'transactions.hide_details', 'Detayları Gizle', 'transactions'),
('en', 'transactions.hide_details', 'Hide Details', 'transactions'),
('de', 'transactions.hide_details', 'Details verbergen', 'transactions'),

('tr', 'transactions.transaction_id', 'İşlem ID', 'transactions'),
('en', 'transactions.transaction_id', 'Transaction ID', 'transactions'),
('de', 'transactions.transaction_id', 'Transaktions-ID', 'transactions'),

('tr', 'transactions.date', 'Tarih', 'transactions'),
('en', 'transactions.date', 'Date', 'transactions'),
('de', 'transactions.date', 'Datum', 'transactions'),

('tr', 'transactions.type', 'İşlem Tipi', 'transactions'),
('en', 'transactions.type', 'Transaction Type', 'transactions'),
('de', 'transactions.type', 'Transaktionstyp', 'transactions'),

('tr', 'transactions.amount', 'Tutar', 'transactions'),
('en', 'transactions.amount', 'Amount', 'transactions'),
('de', 'transactions.amount', 'Betrag', 'transactions'),

('tr', 'transactions.description', 'Açıklama', 'transactions'),
('en', 'transactions.description', 'Description', 'transactions'),
('de', 'transactions.description', 'Beschreibung', 'transactions'),

('tr', 'transactions.order', 'Sipariş', 'transactions'),
('en', 'transactions.order', 'Order', 'transactions'),
('de', 'transactions.order', 'Bestellung', 'transactions'),

('tr', 'transactions.types.deposit', 'Para Yükleme', 'transactions'),
('en', 'transactions.types.deposit', 'Deposit', 'transactions'),
('de', 'transactions.types.deposit', 'Einzahlung', 'transactions'),

('tr', 'transactions.types.purchase', 'Satın Alma', 'transactions'),
('en', 'transactions.types.purchase', 'Purchase', 'transactions'),
('de', 'transactions.types.purchase', 'Kauf', 'transactions'),

('tr', 'transactions.types.sale', 'Satış', 'transactions'),
('en', 'transactions.types.sale', 'Sale', 'transactions'),
('de', 'transactions.types.sale', 'Verkauf', 'transactions'),

('tr', 'transactions.types.commission', 'Komisyon', 'transactions'),
('en', 'transactions.types.commission', 'Commission', 'transactions'),
('de', 'transactions.types.commission', 'Provision', 'transactions'),

('tr', 'transactions.types.payout', 'Ödeme Alma', 'transactions'),
('en', 'transactions.types.payout', 'Payout', 'transactions'),
('de', 'transactions.types.payout', 'Auszahlung', 'transactions'),

('tr', 'transactions.types.refund', 'İade', 'transactions'),
('en', 'transactions.types.refund', 'Refund', 'transactions'),
('de', 'transactions.types.refund', 'Rückerstattung', 'transactions'),

('tr', 'transactions.types.donation', 'Bağış', 'transactions'),
('en', 'transactions.types.donation', 'Donation', 'transactions'),
('de', 'transactions.types.donation', 'Spende', 'transactions'),

('tr', 'transactions.status.completed', 'Tamamlandı', 'transactions'),
('en', 'transactions.status.completed', 'Completed', 'transactions'),
('de', 'transactions.status.completed', 'Abgeschlossen', 'transactions'),

('tr', 'transactions.status.pending', 'Bekliyor', 'transactions'),
('en', 'transactions.status.pending', 'Pending', 'transactions'),
('de', 'transactions.status.pending', 'Ausstehend', 'transactions'),

('tr', 'transactions.status.failed', 'Başarısız', 'transactions'),
('en', 'transactions.status.failed', 'Failed', 'transactions'),
('de', 'transactions.status.failed', 'Fehlgeschlagen', 'transactions'),

('tr', 'transactions.status.cancelled', 'İptal Edildi', 'transactions'),
('en', 'transactions.status.cancelled', 'Cancelled', 'transactions'),
('de', 'transactions.status.cancelled', 'Storniert', 'transactions')

ON DUPLICATE KEY UPDATE value = VALUES(value);
