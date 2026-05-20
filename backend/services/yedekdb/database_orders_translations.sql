-- Orders Page Translations
-- TR, EN, DE

INSERT INTO translations (language_code, `key`, `value`, `group`) VALUES
-- Header
('tr', 'orders.title', 'Siparişlerim', 'orders'),
('en', 'orders.title', 'My Orders', 'orders'),
('de', 'orders.title', 'Meine Bestellungen', 'orders'),

('tr', 'orders.refresh', 'Yenile', 'orders'),
('en', 'orders.refresh', 'Refresh', 'orders'),
('de', 'orders.refresh', 'Aktualisieren', 'orders'),

('tr', 'orders.loading', 'Yükleniyor...', 'orders'),
('en', 'orders.loading', 'Loading...', 'orders'),
('de', 'orders.loading', 'Wird geladen...', 'orders'),

-- Filters
('tr', 'orders.filters.all', 'Tümü', 'orders'),
('en', 'orders.filters.all', 'All', 'orders'),
('de', 'orders.filters.all', 'Alle', 'orders'),

('tr', 'orders.filters.pending', 'Beklemede', 'orders'),
('en', 'orders.filters.pending', 'Pending', 'orders'),
('de', 'orders.filters.pending', 'Ausstehend', 'orders'),

('tr', 'orders.filters.processing', 'İşleniyor', 'orders'),
('en', 'orders.filters.processing', 'Processing', 'orders'),
('de', 'orders.filters.processing', 'In Bearbeitung', 'orders'),

('tr', 'orders.filters.completed', 'Tamamlandı', 'orders'),
('en', 'orders.filters.completed', 'Completed', 'orders'),
('de', 'orders.filters.completed', 'Abgeschlossen', 'orders'),

('tr', 'orders.filters.cancelled', 'İptal', 'orders'),
('en', 'orders.filters.cancelled', 'Cancelled', 'orders'),
('de', 'orders.filters.cancelled', 'Storniert', 'orders'),

-- Status
('tr', 'orders.status.pending', 'Beklemede', 'orders'),
('en', 'orders.status.pending', 'Pending', 'orders'),
('de', 'orders.status.pending', 'Ausstehend', 'orders'),

('tr', 'orders.status.processing', 'İşleniyor', 'orders'),
('en', 'orders.status.processing', 'Processing', 'orders'),
('de', 'orders.status.processing', 'In Bearbeitung', 'orders'),

('tr', 'orders.status.completed', 'Tamamlandı', 'orders'),
('en', 'orders.status.completed', 'Completed', 'orders'),
('de', 'orders.status.completed', 'Abgeschlossen', 'orders'),

('tr', 'orders.status.cancelled', 'İptal Edildi', 'orders'),
('en', 'orders.status.cancelled', 'Cancelled', 'orders'),
('de', 'orders.status.cancelled', 'Storniert', 'orders'),

('tr', 'orders.status.refunded', 'İade Edildi', 'orders'),
('en', 'orders.status.refunded', 'Refunded', 'orders'),
('de', 'orders.status.refunded', 'Erstattet', 'orders'),

('tr', 'orders.paid', 'Ödendi', 'orders'),
('en', 'orders.paid', 'Paid', 'orders'),
('de', 'orders.paid', 'Bezahlt', 'orders'),

-- Table Headers
('tr', 'orders.table.order_no', 'Sipariş No', 'orders'),
('en', 'orders.table.order_no', 'Order No', 'orders'),
('de', 'orders.table.order_no', 'Bestellnummer', 'orders'),

('tr', 'orders.table.date', 'Tarih', 'orders'),
('en', 'orders.table.date', 'Date', 'orders'),
('de', 'orders.table.date', 'Datum', 'orders'),

('tr', 'orders.table.items', 'Ürünler', 'orders'),
('en', 'orders.table.items', 'Items', 'orders'),
('de', 'orders.table.items', 'Artikel', 'orders'),

('tr', 'orders.table.total', 'Toplam', 'orders'),
('en', 'orders.table.total', 'Total', 'orders'),
('de', 'orders.table.total', 'Gesamt', 'orders'),

('tr', 'orders.table.status', 'Durum', 'orders'),
('en', 'orders.table.status', 'Status', 'orders'),
('de', 'orders.table.status', 'Status', 'orders'),

('tr', 'orders.table.actions', 'İşlem', 'orders'),
('en', 'orders.table.actions', 'Actions', 'orders'),
('de', 'orders.table.actions', 'Aktionen', 'orders'),

-- Actions
('tr', 'orders.view', 'Görüntüle', 'orders'),
('en', 'orders.view', 'View', 'orders'),
('de', 'orders.view', 'Anzeigen', 'orders'),

('tr', 'orders.view_details', 'Detayları Gör', 'orders'),
('en', 'orders.view_details', 'View Details', 'orders'),
('de', 'orders.view_details', 'Details Anzeigen', 'orders'),

('tr', 'orders.invoice', 'Fatura', 'orders'),
('en', 'orders.invoice', 'Invoice', 'orders'),
('de', 'orders.invoice', 'Rechnung', 'orders'),

('tr', 'orders.download_invoice', 'Fatura İndir', 'orders'),
('en', 'orders.download_invoice', 'Download Invoice', 'orders'),
('de', 'orders.download_invoice', 'Rechnung Herunterladen', 'orders'),

-- Other
('tr', 'orders.items', 'ürün', 'orders'),
('en', 'orders.items', 'items', 'orders'),
('de', 'orders.items', 'Artikel', 'orders'),

('tr', 'orders.more_items', 'ürün daha', 'orders'),
('en', 'orders.more_items', 'more items', 'orders'),
('de', 'orders.more_items', 'weitere Artikel', 'orders'),

('tr', 'orders.unknown_item', 'Bilinmeyen Ürün', 'orders'),
('en', 'orders.unknown_item', 'Unknown Item', 'orders'),
('de', 'orders.unknown_item', 'Unbekannter Artikel', 'orders'),

-- Empty State
('tr', 'orders.empty.title', 'Henüz siparişiniz yok', 'orders'),
('en', 'orders.empty.title', 'No orders yet', 'orders'),
('de', 'orders.empty.title', 'Noch keine Bestellungen', 'orders'),

('tr', 'orders.empty.message', 'Projeleri keşfedin ve sipariş verin!', 'orders'),
('en', 'orders.empty.message', 'Explore projects and place an order!', 'orders'),
('de', 'orders.empty.message', 'Entdecken Sie Projekte und geben Sie eine Bestellung auf!', 'orders'),

('tr', 'orders.empty.explore', 'Projeleri Keşfet', 'orders'),
('en', 'orders.empty.explore', 'Explore Projects', 'orders'),
('de', 'orders.empty.explore', 'Projekte Erkunden', 'orders'),

-- Errors
('tr', 'orders.errors.load_failed', 'Siparişler yüklenirken bir hata oluştu.', 'orders'),
('en', 'orders.errors.load_failed', 'An error occurred while loading orders.', 'orders'),
('de', 'orders.errors.load_failed', 'Beim Laden der Bestellungen ist ein Fehler aufgetreten.', 'orders'),

-- Search
('tr', 'orders.search.placeholder', 'Sipariş no, ürün veya tutar ara...', 'orders'),
('en', 'orders.search.placeholder', 'Search order number, item or amount...', 'orders'),
('de', 'orders.search.placeholder', 'Bestellnummer, Artikel oder Betrag suchen...', 'orders'),

('tr', 'orders.search.clear', 'Temizle', 'orders'),
('en', 'orders.search.clear', 'Clear', 'orders'),
('de', 'orders.search.clear', 'Löschen', 'orders'),

('tr', 'orders.search.advanced', 'Gelişmiş Arama', 'orders'),
('en', 'orders.search.advanced', 'Advanced Search', 'orders'),
('de', 'orders.search.advanced', 'Erweiterte Suche', 'orders'),

('tr', 'orders.search.status', 'Durum', 'orders'),
('en', 'orders.search.status', 'Status', 'orders'),
('de', 'orders.search.status', 'Status', 'orders')
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `group` = VALUES(`group`);

