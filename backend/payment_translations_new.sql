
-- --------------------------------------------------------
-- Pending Payments Translations
-- --------------------------------------------------------
INSERT INTO `translations` (`language_code`, `key`, `value`, `group`, `created_at`, `updated_at`) VALUES
('tr', 'pending_payments.title', 'Bekleyen Ödeme İşlemleri', 'pending_payments', NOW(), NOW()),
('en', 'pending_payments.title', 'Pending Payment Transactions', 'pending_payments', NOW(), NOW()),
('de', 'pending_payments.title', 'Ausstehende Zahlungsvorgänge', 'pending_payments', NOW(), NOW()),

('tr', 'pending_payments.note_save_error', 'Not kaydedilemedi', 'pending_payments', NOW(), NOW()),
('en', 'pending_payments.note_save_error', 'Note could not be saved', 'pending_payments', NOW(), NOW()),
('de', 'pending_payments.note_save_error', 'Notiz konnte nicht gespeichert werden', 'pending_payments', NOW(), NOW()),

('tr', 'pending_payments.status.pending', 'Beklemede', 'pending_payments', NOW(), NOW()),
('en', 'pending_payments.status.pending', 'Pending', 'pending_payments', NOW(), NOW()),
('de', 'pending_payments.status.pending', 'Ausstehend', 'pending_payments', NOW(), NOW()),

('tr', 'pending_payments.status.processing', 'İşleniyor', 'pending_payments', NOW(), NOW()),
('en', 'pending_payments.status.processing', 'Processing', 'pending_payments', NOW(), NOW()),
('de', 'pending_payments.status.processing', 'In Bearbeitung', 'pending_payments', NOW(), NOW()),

('tr', 'pending_payments.status.pending_approval', 'Onay Bekliyor', 'pending_payments', NOW(), NOW()),
('en', 'pending_payments.status.pending_approval', 'Waiting for Approval', 'pending_payments', NOW(), NOW()),
('de', 'pending_payments.status.pending_approval', 'Warten auf Genehmigung', 'pending_payments', NOW(), NOW()),

('tr', 'pending_payments.status.completed', 'Tamamlandı', 'pending_payments', NOW(), NOW()),
('en', 'pending_payments.status.completed', 'Completed', 'pending_payments', NOW(), NOW()),
('de', 'pending_payments.status.completed', 'Abgeschlossen', 'pending_payments', NOW(), NOW()),

('tr', 'pending_payments.status.failed', 'Başarısız', 'pending_payments', NOW(), NOW()),
('en', 'pending_payments.status.failed', 'Failed', 'pending_payments', NOW(), NOW()),
('de', 'pending_payments.status.failed', 'Fehlgeschlagen', 'pending_payments', NOW(), NOW()),

('tr', 'pending_payments.status.cancelled', 'İptal Edildi', 'pending_payments', NOW(), NOW()),
('en', 'pending_payments.status.cancelled', 'Cancelled', 'pending_payments', NOW(), NOW()),
('de', 'pending_payments.status.cancelled', 'Storniert', 'pending_payments', NOW(), NOW()),

('tr', 'pending_payments.method.card', 'Kredi Kartı', 'pending_payments', NOW(), NOW()),
('en', 'pending_payments.method.card', 'Credit Card', 'pending_payments', NOW(), NOW()),
('de', 'pending_payments.method.card', 'Kreditkarte', 'pending_payments', NOW(), NOW()),

('tr', 'pending_payments.method.bank_transfer', 'Banka Havalesi', 'pending_payments', NOW(), NOW()),
('en', 'pending_payments.method.bank_transfer', 'Bank Transfer', 'pending_payments', NOW(), NOW()),
('de', 'pending_payments.method.bank_transfer', 'Banküberweisung', 'pending_payments', NOW(), NOW()),

('tr', 'pending_payments.method.mobile', 'Mobil Ödeme', 'pending_payments', NOW(), NOW()),
('en', 'pending_payments.method.mobile', 'Mobile Payment', 'pending_payments', NOW(), NOW()),
('de', 'pending_payments.method.mobile', 'Mobiles Bezahlen', 'pending_payments', NOW(), NOW()),

('tr', 'pending_payments.reference', 'Referans No', 'pending_payments', NOW(), NOW()),
('en', 'pending_payments.reference', 'Reference No', 'pending_payments', NOW(), NOW()),
('de', 'pending_payments.reference', 'Referenznummer', 'pending_payments', NOW(), NOW()),

('tr', 'pending_payments.total_amount', 'Toplam Tutar', 'pending_payments', NOW(), NOW()),
('en', 'pending_payments.total_amount', 'Total Amount', 'pending_payments', NOW(), NOW()),
('de', 'pending_payments.total_amount', 'Gesamtbetrag', 'pending_payments', NOW(), NOW()),

('tr', 'pending_payments.created_at', 'Oluşturma Tarihi', 'pending_payments', NOW(), NOW()),
('en', 'pending_payments.created_at', 'Created At', 'pending_payments', NOW(), NOW()),
('de', 'pending_payments.created_at', 'Erstellungsdatum', 'pending_payments', NOW(), NOW()),

('tr', 'pending_payments.sender', 'Gönderen', 'pending_payments', NOW(), NOW()),
('en', 'pending_payments.sender', 'Sender', 'pending_payments', NOW(), NOW()),
('de', 'pending_payments.sender', 'Absender', 'pending_payments', NOW(), NOW()),

('tr', 'pending_payments.bank', 'Banka', 'pending_payments', NOW(), NOW()),
('en', 'pending_payments.bank', 'Bank', 'pending_payments', NOW(), NOW()),
('de', 'pending_payments.bank', 'Bank', 'pending_payments', NOW(), NOW()),

('tr', 'pending_payments.gateway', 'Ödeme Sağlayıcı', 'pending_payments', NOW(), NOW()),
('en', 'pending_payments.gateway', 'Payment Gateway', 'pending_payments', NOW(), NOW()),
('de', 'pending_payments.gateway', 'Zahlungs-Gateway', 'pending_payments', NOW(), NOW()),

('tr', 'pending_payments.note', 'Not', 'pending_payments', NOW(), NOW()),
('en', 'pending_payments.note', 'Note', 'pending_payments', NOW(), NOW()),
('de', 'pending_payments.note', 'Notiz', 'pending_payments', NOW(), NOW()),

('tr', 'pending_payments.note_placeholder', 'Not eklemek için yazın...', 'pending_payments', NOW(), NOW()),
('en', 'pending_payments.note_placeholder', 'Type to add a note...', 'pending_payments', NOW(), NOW()),
('de', 'pending_payments.note_placeholder', 'Tippen Sie, um eine Notiz hinzuzufügen...', 'pending_payments', NOW(), NOW()),

('tr', 'pending_payments.no_note', 'Henüz not eklenmedi', 'pending_payments', NOW(), NOW()),
('en', 'pending_payments.no_note', 'No note added yet', 'pending_payments', NOW(), NOW()),
('de', 'pending_payments.no_note', 'Noch keine Notiz hinzugefügt', 'pending_payments', NOW(), NOW()),

('tr', 'pending_payments.bank_transfer_info', 'Banka havalesi işlemi admin onayı bekliyor. Onaylandığında bakiyenize yansıyacaktır.', 'pending_payments', NOW(), NOW()),
('en', 'pending_payments.bank_transfer_info', 'Bank transfer transaction is waiting for admin approval. It will be reflected in your balance once approved.', 'pending_payments', NOW(), NOW()),
('de', 'pending_payments.bank_transfer_info', 'Die Banküberweisung wartet auf die Genehmigung durch den Administrator. Sobald sie genehmigt wurde, wird sie Ihrem Guthaben gutgeschrieben.', 'pending_payments', NOW(), NOW());
