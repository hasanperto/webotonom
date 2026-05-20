-- Referanslar ve Sponsorlar Tabloları
-- ============================================

-- Referanslar tablosu (eğer yoksa oluştur)
CREATE TABLE IF NOT EXISTS `references` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `image` varchar(500) DEFAULT NULL,
  `link` varchar(500) DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `status` (`status`),
  KEY `sort_order` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sponsorlar tablosu (eğer yoksa oluştur, varsa AUTO_INCREMENT ekle)
CREATE TABLE IF NOT EXISTS `sponsors` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `logo` varchar(255) NOT NULL,
  `link_url` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `status` (`status`),
  KEY `sort_order` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Eğer sponsors tablosu zaten varsa AUTO_INCREMENT ekle
ALTER TABLE `sponsors` MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

-- Örnek referans verileri (opsiyonel)
INSERT INTO `references` (`title`, `slug`, `description`, `image`, `link`, `status`, `sort_order`) VALUES
('Örnek Referans 1', 'ornek-referans-1', 'Bu bir örnek referans açıklamasıdır.', NULL, 'https://example.com', 'active', 1),
('Örnek Referans 2', 'ornek-referans-2', 'Bu bir örnek referans açıklamasıdır.', NULL, 'https://example.com', 'active', 2)
ON DUPLICATE KEY UPDATE title=VALUES(title);

-- Örnek sponsor verileri (opsiyonel)
INSERT INTO `sponsors` (`name`, `logo`, `link_url`, `description`, `status`, `sort_order`) VALUES
('Örnek Sponsor 1', '/uploads/sponsors/logo1.png', 'https://example.com', 'Bu bir örnek sponsor açıklamasıdır.', 'active', 1),
('Örnek Sponsor 2', '/uploads/sponsors/logo2.png', 'https://example.com', 'Bu bir örnek sponsor açıklamasıdır.', 'active', 2)
ON DUPLICATE KEY UPDATE name=VALUES(name);

