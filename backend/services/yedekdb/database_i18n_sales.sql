-- ============================================
-- Dil Modülü (i18n) Tabloları
-- ============================================

-- Desteklenen diller
CREATE TABLE IF NOT EXISTS `languages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(5) NOT NULL,
  `name` varchar(50) NOT NULL,
  `native_name` varchar(50) NOT NULL,
  `rtl` tinyint(1) NOT NULL DEFAULT 0,
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Çeviriler
CREATE TABLE IF NOT EXISTS `translations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `language_code` varchar(5) NOT NULL,
  `key` varchar(255) NOT NULL,
  `value` text NOT NULL,
  `group` varchar(50) NOT NULL DEFAULT 'general',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `language_key` (`language_code`,`key`),
  KEY `language_code` (`language_code`),
  KEY `group` (`group`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- İçerik çevirileri
CREATE TABLE IF NOT EXISTS `content_translations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `content_id` int(11) NOT NULL,
  `content_type` enum('project','blog','page') NOT NULL DEFAULT 'project',
  `language_code` varchar(5) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `description` text,
  `content` longtext,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `content_lang` (`content_id`,`content_type`,`language_code`),
  KEY `language_code` (`language_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Kullanıcı dil tercihleri
CREATE TABLE IF NOT EXISTS `user_language_preferences` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `language_code` varchar(5) NOT NULL DEFAULT 'tr',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  KEY `language_code` (`language_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Satış Modülü Tabloları
-- ============================================

-- Teklif talepleri
CREATE TABLE IF NOT EXISTS `quote_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `company` varchar(100) DEFAULT NULL,
  `message` text,
  `project_id` int(11) DEFAULT NULL,
  `budget_range` varchar(50) DEFAULT NULL,
  `status` enum('pending','contacted','quoted','accepted','rejected') NOT NULL DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  KEY `status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Demo talepleri
CREATE TABLE IF NOT EXISTS `demo_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL,
  `message` text,
  `status` enum('pending','approved','rejected','completed') NOT NULL DEFAULT 'pending',
  `demo_url` varchar(255) DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `project_id` (`project_id`),
  KEY `status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Varsayılan Dil Verileri
-- ============================================

INSERT IGNORE INTO `languages` (`id`, `code`, `name`, `native_name`, `rtl`, `is_default`, `status`, `sort_order`) VALUES
(1, 'tr', 'Turkish', 'Türkçe', 0, 1, 'active', 1),
(2, 'en', 'English', 'English', 0, 0, 'active', 2),
(3, 'de', 'German', 'Deutsch', 0, 0, 'active', 3),
(4, 'fr', 'French', 'Français', 0, 0, 'active', 4),
(5, 'es', 'Spanish', 'Español', 0, 0, 'active', 5),
(6, 'ar', 'Arabic', 'العربية', 1, 0, 'active', 6),
(7, 'ru', 'Russian', 'Русский', 0, 0, 'active', 7);

-- ============================================
-- Varsayılan Çeviriler (Türkçe)
-- ============================================

INSERT IGNORE INTO `translations` (`language_code`, `key`, `value`, `group`) VALUES
('tr', 'home', 'Ana Sayfa', 'navigation'),
('tr', 'projects', 'Projeler', 'navigation'),
('tr', 'blog', 'Blog', 'navigation'),
('tr', 'contact', 'İletişim', 'navigation'),
('tr', 'login', 'Giriş Yap', 'auth'),
('tr', 'register', 'Kayıt Ol', 'auth'),
('tr', 'logout', 'Çıkış', 'auth'),
('tr', 'profile', 'Profil', 'user'),
('tr', 'dashboard', 'Panel', 'user'),
('tr', 'cart', 'Sepet', 'ecommerce'),
('tr', 'checkout', 'Ödeme', 'ecommerce'),
('tr', 'price', 'Fiyat', 'ecommerce'),
('tr', 'add_to_cart', 'Sepete Ekle', 'ecommerce'),
('tr', 'buy_now', 'Hemen Satın Al', 'ecommerce'),
('tr', 'view_details', 'Detayları Gör', 'projects'),
('tr', 'download', 'İndir', 'projects'),
('tr', 'rating', 'Değerlendirme', 'projects'),
('tr', 'reviews', 'Yorumlar', 'projects'),
('tr', 'search', 'Ara', 'general'),
('tr', 'filter', 'Filtrele', 'general'),
('tr', 'loading', 'Yükleniyor...', 'general'),
('tr', 'error', 'Hata', 'general'),
('tr', 'success', 'Başarılı', 'general'),
('tr', 'save', 'Kaydet', 'general'),
('tr', 'cancel', 'İptal', 'general'),
('tr', 'delete', 'Sil', 'general'),
('tr', 'edit', 'Düzenle', 'general'),
('tr', 'create', 'Oluştur', 'general'),
('tr', 'update', 'Güncelle', 'general'),
('tr', 'yes', 'Evet', 'general'),
('tr', 'no', 'Hayır', 'general'),
('tr', 'close', 'Kapat', 'general'),
('tr', 'next', 'İleri', 'general'),
('tr', 'previous', 'Geri', 'general'),
('tr', 'submit', 'Gönder', 'general'),
('tr', 'reset', 'Sıfırla', 'general');

-- ============================================
-- Varsayılan Çeviriler (İngilizce)
-- ============================================

INSERT IGNORE INTO `translations` (`language_code`, `key`, `value`, `group`) VALUES
('en', 'home', 'Home', 'navigation'),
('en', 'projects', 'Projects', 'navigation'),
('en', 'blog', 'Blog', 'navigation'),
('en', 'contact', 'Contact', 'navigation'),
('en', 'login', 'Login', 'auth'),
('en', 'register', 'Register', 'auth'),
('en', 'logout', 'Logout', 'auth'),
('en', 'profile', 'Profile', 'user'),
('en', 'dashboard', 'Dashboard', 'user'),
('en', 'cart', 'Cart', 'ecommerce'),
('en', 'checkout', 'Checkout', 'ecommerce'),
('en', 'price', 'Price', 'ecommerce'),
('en', 'add_to_cart', 'Add to Cart', 'ecommerce'),
('en', 'buy_now', 'Buy Now', 'ecommerce'),
('en', 'view_details', 'View Details', 'projects'),
('en', 'download', 'Download', 'projects'),
('en', 'rating', 'Rating', 'projects'),
('en', 'reviews', 'Reviews', 'projects'),
('en', 'search', 'Search', 'general'),
('en', 'filter', 'Filter', 'general'),
('en', 'loading', 'Loading...', 'general'),
('en', 'error', 'Error', 'general'),
('en', 'success', 'Success', 'general'),
('en', 'save', 'Save', 'general'),
('en', 'cancel', 'Cancel', 'general'),
('en', 'delete', 'Delete', 'general'),
('en', 'edit', 'Edit', 'general'),
('en', 'create', 'Create', 'general'),
('en', 'update', 'Update', 'general'),
('en', 'yes', 'Yes', 'general'),
('en', 'no', 'No', 'general'),
('en', 'close', 'Close', 'general'),
('en', 'next', 'Next', 'general'),
('en', 'previous', 'Previous', 'general'),
('en', 'submit', 'Submit', 'general'),
('en', 'reset', 'Reset', 'general');

