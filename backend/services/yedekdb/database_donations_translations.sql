-- User Donations Page Translations
-- TR, EN, DE

INSERT INTO translations (`language_code`, `key`, `value`, `group`) VALUES
-- Page Title
('tr', 'donations.title', 'Bağış Geçmişim', 'donations'),
('en', 'donations.title', 'Donation History', 'donations'),
('de', 'donations.title', 'Spendenverlauf', 'donations'),

-- Stats
('tr', 'donations.stats.total', 'Toplam Bağış', 'donations'),
('en', 'donations.stats.total', 'Total Donated', 'donations'),
('de', 'donations.stats.total', 'Gesamt gespendet', 'donations'),

('tr', 'donations.stats.count', 'Bağış Sayısı', 'donations'),
('en', 'donations.stats.count', 'Donation Count', 'donations'),
('de', 'donations.stats.count', 'Anzahl der Spenden', 'donations'),

-- Search
('tr', 'donations.search.placeholder', 'Proje adı veya mesaj ara...', 'donations'),
('en', 'donations.search.placeholder', 'Search project name or message...', 'donations'),
('de', 'donations.search.placeholder', 'Projektname oder Nachricht suchen...', 'donations'),

-- Filters
('tr', 'donations.filters.all', 'Tüm Bağışlar', 'donations'),
('en', 'donations.filters.all', 'All Donations', 'donations'),
('de', 'donations.filters.all', 'Alle Spenden', 'donations'),

-- Status
('tr', 'donations.status.completed', 'Tamamlandı', 'donations'),
('en', 'donations.status.completed', 'Completed', 'donations'),
('de', 'donations.status.completed', 'Abgeschlossen', 'donations'),

('tr', 'donations.status.pending', 'Beklemede', 'donations'),
('en', 'donations.status.pending', 'Pending', 'donations'),
('de', 'donations.status.pending', 'Ausstehend', 'donations'),

('tr', 'donations.status.failed', 'Başarısız', 'donations'),
('en', 'donations.status.failed', 'Failed', 'donations'),
('de', 'donations.status.failed', 'Fehlgeschlagen', 'donations'),

-- Loading
('tr', 'donations.loading', 'Bağışlarınız yükleniyor...', 'donations'),
('en', 'donations.loading', 'Loading your donations...', 'donations'),
('de', 'donations.loading', 'Ihre Spenden werden geladen...', 'donations'),

-- Auth Required
('tr', 'donations.auth.required', 'Giriş Yapmanız Gerekiyor', 'donations'),
('en', 'donations.auth.required', 'Login Required', 'donations'),
('de', 'donations.auth.required', 'Anmeldung erforderlich', 'donations'),

('tr', 'donations.auth.description', 'Bağış geçmişinizi görüntülemek için lütfen giriş yapın.', 'donations'),
('en', 'donations.auth.description', 'Please log in to view your donation history.', 'donations'),
('de', 'donations.auth.description', 'Bitte melden Sie sich an, um Ihren Spendenverlauf anzuzeigen.', 'donations'),

('tr', 'donations.auth.login', 'Giriş Yap', 'donations'),
('en', 'donations.auth.login', 'Login', 'donations'),
('de', 'donations.auth.login', 'Anmelden', 'donations'),

-- Empty State
('tr', 'donations.empty.no_donations', 'Henüz Bağışınız Yok', 'donations'),
('en', 'donations.empty.no_donations', 'No Donations Yet', 'donations'),
('de', 'donations.empty.no_donations', 'Noch keine Spenden', 'donations'),

('tr', 'donations.empty.no_results', 'Sonuç Bulunamadı', 'donations'),
('en', 'donations.empty.no_results', 'No Results Found', 'donations'),
('de', 'donations.empty.no_results', 'Keine Ergebnisse gefunden', 'donations'),

('tr', 'donations.empty.description', 'Projelere bağış yaparak geliştiricilere destek olun ve projelerin tamamlanmasına katkıda bulunun!', 'donations'),
('en', 'donations.empty.description', 'Support developers by donating to projects and contribute to their completion!', 'donations'),
('de', 'donations.empty.description', 'Unterstützen Sie Entwickler durch Spenden an Projekte und tragen Sie zu deren Fertigstellung bei!', 'donations'),

('tr', 'donations.empty.no_results_description', 'Arama kriterlerinize uygun bağış bulunamadı. Filtreleri değiştirmeyi deneyin.', 'donations'),
('en', 'donations.empty.no_results_description', 'No donations found matching your search criteria. Try changing the filters.', 'donations'),
('de', 'donations.empty.no_results_description', 'Es wurden keine Spenden gefunden, die Ihren Suchkriterien entsprechen. Versuchen Sie, die Filter zu ändern.', 'donations'),

('tr', 'donations.empty.explore_projects', 'Projeleri Keşfet', 'donations'),
('en', 'donations.empty.explore_projects', 'Explore Projects', 'donations'),
('de', 'donations.empty.explore_projects', 'Projekte erkunden', 'donations'),

-- Actions
('tr', 'donations.actions.view_project', 'Projeyi Gör', 'donations'),
('en', 'donations.actions.view_project', 'View Project', 'donations'),
('de', 'donations.actions.view_project', 'Projekt anzeigen', 'donations'),

-- Project
('tr', 'donations.project', 'Proje', 'donations'),
('en', 'donations.project', 'Project', 'donations'),
('de', 'donations.project', 'Projekt', 'donations'),

-- Coupon
('tr', 'donations.coupon.label', 'Hediye Kuponu', 'donations'),
('en', 'donations.coupon.label', 'Gift Coupon', 'donations'),
('de', 'donations.coupon.label', 'Geschenkgutschein', 'donations'),

('tr', 'donations.coupon.copy', 'Kopyala', 'donations'),
('en', 'donations.coupon.copy', 'Copy', 'donations'),
('de', 'donations.coupon.copy', 'Kopieren', 'donations'),

('tr', 'donations.coupon.copied', 'Kupon kodu kopyalandı!', 'donations'),
('en', 'donations.coupon.copied', 'Coupon code copied!', 'donations'),
('de', 'donations.coupon.copied', 'Gutscheincode kopiert!', 'donations'),

('tr', 'donations.coupon.discount', 'İndirim', 'donations'),
('en', 'donations.coupon.discount', 'Discount', 'donations'),
('de', 'donations.coupon.discount', 'Rabatt', 'donations'),

('tr', 'donations.coupon.project_only', 'Sadece bu projede geçerli', 'donations'),
('en', 'donations.coupon.project_only', 'Valid only for this project', 'donations'),
('de', 'donations.coupon.project_only', 'Nur für dieses Projekt gültig', 'donations')

ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `group` = VALUES(`group`);

