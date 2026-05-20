-- User Favorites Page Translations
-- TR, EN, DE

INSERT INTO translations (`language_code`, `key`, `value`, `group`) VALUES
-- Page Title
('tr', 'favorites.title', 'Favorilerim', 'favorites'),
('en', 'favorites.title', 'My Favorites', 'favorites'),
('de', 'favorites.title', 'Meine Favoriten', 'favorites'),

-- Subtitle
('tr', 'favorites.subtitle', 'Beğendiğiniz {count} proje', 'favorites'),
('en', 'favorites.subtitle', '{count} favorite projects', 'favorites'),
('de', 'favorites.subtitle', '{count} Lieblingsprojekte', 'favorites'),

-- Loading
('tr', 'favorites.loading', 'Yükleniyor...', 'favorites'),
('en', 'favorites.loading', 'Loading...', 'favorites'),
('de', 'favorites.loading', 'Wird geladen...', 'favorites'),

-- Price
('tr', 'favorites.price.free', 'Ücretsiz', 'favorites'),
('en', 'favorites.price.free', 'Free', 'favorites'),
('de', 'favorites.price.free', 'Kostenlos', 'favorites'),

-- Actions
('tr', 'favorites.actions.view_details', 'Detayları Gör', 'favorites'),
('en', 'favorites.actions.view_details', 'View Details', 'favorites'),
('de', 'favorites.actions.view_details', 'Details anzeigen', 'favorites'),

('tr', 'favorites.actions.add_to_cart', 'Sepete Ekle', 'favorites'),
('en', 'favorites.actions.add_to_cart', 'Add to Cart', 'favorites'),
('de', 'favorites.actions.add_to_cart', 'In den Warenkorb', 'favorites'),

('tr', 'favorites.actions.remove', 'Favorilerden Çıkar', 'favorites'),
('en', 'favorites.actions.remove', 'Remove from Favorites', 'favorites'),
('de', 'favorites.actions.remove', 'Aus Favoriten entfernen', 'favorites'),

-- Empty State
('tr', 'favorites.empty.title', 'Henüz favori projeniz yok', 'favorites'),
('en', 'favorites.empty.title', 'No favorite projects yet', 'favorites'),
('de', 'favorites.empty.title', 'Noch keine Lieblingsprojekte', 'favorites'),

('tr', 'favorites.empty.description', 'Beğendiğiniz projeleri favorilerinize ekleyin!', 'favorites'),
('en', 'favorites.empty.description', 'Add projects you like to your favorites!', 'favorites'),
('de', 'favorites.empty.description', 'Fügen Sie Projekte, die Ihnen gefallen, zu Ihren Favoriten hinzu!', 'favorites'),

('tr', 'favorites.empty.explore_projects', 'Projeleri Keşfet', 'favorites'),
('en', 'favorites.empty.explore_projects', 'Explore Projects', 'favorites'),
('de', 'favorites.empty.explore_projects', 'Projekte erkunden', 'favorites'),

-- No Description
('tr', 'favorites.no_description', 'Açıklama bulunmamaktadır.', 'favorites'),
('en', 'favorites.no_description', 'No description available.', 'favorites'),
('de', 'favorites.no_description', 'Keine Beschreibung verfügbar.', 'favorites'),

-- Confirmations
('tr', 'favorites.confirm.remove', 'Bu projeyi favorilerden çıkarmak istediğinize emin misiniz?', 'favorites'),
('en', 'favorites.confirm.remove', 'Are you sure you want to remove this project from your favorites?', 'favorites'),
('de', 'favorites.confirm.remove', 'Möchten Sie dieses Projekt wirklich aus Ihren Favoriten entfernen?', 'favorites'),

-- Success Messages
('tr', 'favorites.success.removed', 'Favorilerden çıkarıldı.', 'favorites'),
('en', 'favorites.success.removed', 'Removed from favorites.', 'favorites'),
('de', 'favorites.success.removed', 'Aus Favoriten entfernt.', 'favorites'),

('tr', 'favorites.success.added_to_cart', 'Sepete eklendi!', 'favorites'),
('en', 'favorites.success.added_to_cart', 'Added to cart!', 'favorites'),
('de', 'favorites.success.added_to_cart', 'In den Warenkorb gelegt!', 'favorites'),

-- Error Messages
('tr', 'favorites.errors.load_failed', 'Favoriler yüklenirken bir hata oluştu.', 'favorites'),
('en', 'favorites.errors.load_failed', 'An error occurred while loading favorites.', 'favorites'),
('de', 'favorites.errors.load_failed', 'Beim Laden der Favoriten ist ein Fehler aufgetreten.', 'favorites'),

('tr', 'favorites.errors.remove_failed', 'Favori kaldırılırken bir hata oluştu.', 'favorites'),
('en', 'favorites.errors.remove_failed', 'An error occurred while removing favorite.', 'favorites'),
('de', 'favorites.errors.remove_failed', 'Beim Entfernen des Favoriten ist ein Fehler aufgetreten.', 'favorites'),

('tr', 'favorites.errors.add_to_cart_failed', 'Sepete eklenirken bir hata oluştu.', 'favorites'),
('en', 'favorites.errors.add_to_cart_failed', 'An error occurred while adding to cart.', 'favorites'),
('de', 'favorites.errors.add_to_cart_failed', 'Beim Hinzufügen zum Warenkorb ist ein Fehler aufgetreten.', 'favorites')

ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `group` = VALUES(`group`);

