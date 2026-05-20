-- User Transactions Page Translations
-- TR, EN, DE

INSERT INTO translations (`language_code`, `key`, `value`, `group`) VALUES
-- Page Title
('tr', 'transactions.title', 'İşlem Geçmişim', 'transactions'),
('en', 'transactions.title', 'Transaction History', 'transactions'),
('de', 'transactions.title', 'Transaktionsverlauf', 'transactions'),

-- Subtitle
('tr', 'transactions.subtitle', '{count} toplam işlem', 'transactions'),
('en', 'transactions.subtitle', '{count} total transactions', 'transactions'),
('de', 'transactions.subtitle', '{count} Transaktionen insgesamt', 'transactions'),

-- Stats
('tr', 'transactions.stats.spent', 'Harcama', 'transactions'),
('en', 'transactions.stats.spent', 'Spent', 'transactions'),
('de', 'transactions.stats.spent', 'Ausgaben', 'transactions'),

('tr', 'transactions.stats.earned', 'Kazanç', 'transactions'),
('en', 'transactions.stats.earned', 'Earned', 'transactions'),
('de', 'transactions.stats.earned', 'Verdient', 'transactions'),

('tr', 'transactions.stats.donated', 'Bağış', 'transactions'),
('en', 'transactions.stats.donated', 'Donated', 'transactions'),
('de', 'transactions.stats.donated', 'Gespendet', 'transactions'),

-- Search
('tr', 'transactions.search.placeholder', 'Ara...', 'transactions'),
('en', 'transactions.search.placeholder', 'Search...', 'transactions'),
('de', 'transactions.search.placeholder', 'Suchen...', 'transactions'),

-- Filter Types
('tr', 'transactions.filters.all_types', 'Tüm Tipler', 'transactions'),
('en', 'transactions.filters.all_types', 'All Types', 'transactions'),
('de', 'transactions.filters.all_types', 'Alle Typen', 'transactions'),

('tr', 'transactions.filters.all_statuses', 'Tüm Durumlar', 'transactions'),
('en', 'transactions.filters.all_statuses', 'All Statuses', 'transactions'),
('de', 'transactions.filters.all_statuses', 'Alle Status', 'transactions'),

-- Transaction Types
('tr', 'transactions.types.purchase', 'Satın Alma', 'transactions'),
('en', 'transactions.types.purchase', 'Purchase', 'transactions'),
('de', 'transactions.types.purchase', 'Kauf', 'transactions'),

('tr', 'transactions.types.sale', 'Satış', 'transactions'),
('en', 'transactions.types.sale', 'Sale', 'transactions'),
('de', 'transactions.types.sale', 'Verkauf', 'transactions'),

('tr', 'transactions.types.commission', 'Komisyon', 'transactions'),
('en', 'transactions.types.commission', 'Commission', 'transactions'),
('de', 'transactions.types.commission', 'Provision', 'transactions'),

('tr', 'transactions.types.payout', 'Ödeme', 'transactions'),
('en', 'transactions.types.payout', 'Payout', 'transactions'),
('de', 'transactions.types.payout', 'Auszahlung', 'transactions'),

('tr', 'transactions.types.refund', 'İade', 'transactions'),
('en', 'transactions.types.refund', 'Refund', 'transactions'),
('de', 'transactions.types.refund', 'Rückerstattung', 'transactions'),

('tr', 'transactions.types.donation', 'Bağış', 'transactions'),
('en', 'transactions.types.donation', 'Donation', 'transactions'),
('de', 'transactions.types.donation', 'Spende', 'transactions'),

-- Transaction Status
('tr', 'transactions.status.pending', 'Beklemede', 'transactions'),
('en', 'transactions.status.pending', 'Pending', 'transactions'),
('de', 'transactions.status.pending', 'Ausstehend', 'transactions'),

('tr', 'transactions.status.completed', 'Tamamlandı', 'transactions'),
('en', 'transactions.status.completed', 'Completed', 'transactions'),
('de', 'transactions.status.completed', 'Abgeschlossen', 'transactions'),

('tr', 'transactions.status.failed', 'Başarısız', 'transactions'),
('en', 'transactions.status.failed', 'Failed', 'transactions'),
('de', 'transactions.status.failed', 'Fehlgeschlagen', 'transactions'),

('tr', 'transactions.status.cancelled', 'İptal Edildi', 'transactions'),
('en', 'transactions.status.cancelled', 'Cancelled', 'transactions'),
('de', 'transactions.status.cancelled', 'Storniert', 'transactions'),

-- Date
('tr', 'transactions.date.yesterday', 'Dün', 'transactions'),
('en', 'transactions.date.yesterday', 'Yesterday', 'transactions'),
('de', 'transactions.date.yesterday', 'Gestern', 'transactions'),

-- Order
('tr', 'transactions.order', 'Sipariş', 'transactions'),
('en', 'transactions.order', 'Order', 'transactions'),
('de', 'transactions.order', 'Bestellung', 'transactions'),

-- Loading
('tr', 'transactions.loading', 'İşlemleriniz yükleniyor...', 'transactions'),
('en', 'transactions.loading', 'Loading your transactions...', 'transactions'),
('de', 'transactions.loading', 'Ihre Transaktionen werden geladen...', 'transactions'),

-- Auth Required
('tr', 'transactions.auth.required', 'Giriş Yapmanız Gerekiyor', 'transactions'),
('en', 'transactions.auth.required', 'Login Required', 'transactions'),
('de', 'transactions.auth.required', 'Anmeldung erforderlich', 'transactions'),

('tr', 'transactions.auth.description', 'İşlem geçmişinizi görüntülemek için lütfen giriş yapın.', 'transactions'),
('en', 'transactions.auth.description', 'Please log in to view your transaction history.', 'transactions'),
('de', 'transactions.auth.description', 'Bitte melden Sie sich an, um Ihren Transaktionsverlauf anzuzeigen.', 'transactions'),

('tr', 'transactions.auth.login', 'Giriş Yap', 'transactions'),
('en', 'transactions.auth.login', 'Login', 'transactions'),
('de', 'transactions.auth.login', 'Anmelden', 'transactions'),

-- Empty State
('tr', 'transactions.empty.no_transactions', 'Henüz İşleminiz Yok', 'transactions'),
('en', 'transactions.empty.no_transactions', 'No Transactions Yet', 'transactions'),
('de', 'transactions.empty.no_transactions', 'Noch keine Transaktionen', 'transactions'),

('tr', 'transactions.empty.no_results', 'Sonuç Bulunamadı', 'transactions'),
('en', 'transactions.empty.no_results', 'No Results Found', 'transactions'),
('de', 'transactions.empty.no_results', 'Keine Ergebnisse gefunden', 'transactions'),

('tr', 'transactions.empty.description', 'Henüz hiçbir finansal işlem yapmadınız. Proje satın alarak veya satış yaparak işlemlerinizi burada görebilirsiniz.', 'transactions'),
('en', 'transactions.empty.description', 'You haven\'t made any financial transactions yet. You can see your transactions here by purchasing projects or making sales.', 'transactions'),
('de', 'transactions.empty.description', 'Sie haben noch keine finanziellen Transaktionen getätigt. Sie können Ihre Transaktionen hier sehen, indem Sie Projekte kaufen oder Verkäufe tätigen.', 'transactions'),

('tr', 'transactions.empty.no_results_description', 'Arama kriterlerinize uygun işlem bulunamadı. Filtreleri değiştirmeyi deneyin.', 'transactions'),
('en', 'transactions.empty.no_results_description', 'No transactions found matching your search criteria. Try changing the filters.', 'transactions'),
('de', 'transactions.empty.no_results_description', 'Es wurden keine Transaktionen gefunden, die Ihren Suchkriterien entsprechen. Versuchen Sie, die Filter zu ändern.', 'transactions'),

('tr', 'transactions.empty.explore_projects', 'Projeleri Keşfet', 'transactions'),
('en', 'transactions.empty.explore_projects', 'Explore Projects', 'transactions'),
('de', 'transactions.empty.explore_projects', 'Projekte erkunden', 'transactions')

ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `group` = VALUES(`group`);

