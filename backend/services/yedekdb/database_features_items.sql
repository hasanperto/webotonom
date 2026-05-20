-- Features Section Items Tablosu
CREATE TABLE IF NOT EXISTS `features_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `section_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `icon` varchar(100) DEFAULT NULL COMMENT 'Icon class name (e.g., FiShield, FiZap)',
  `image` varchar(500) DEFAULT NULL COMMENT 'Optional image path',
  `link` varchar(500) DEFAULT NULL,
  `link_text` varchar(100) DEFAULT NULL,
  `order` int(11) NOT NULL DEFAULT 0,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `section_id` (`section_id`),
  KEY `status` (`status`),
  CONSTRAINT `features_items_ibfk_1` FOREIGN KEY (`section_id`) REFERENCES `home_sections` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Varsayılan özellikler ekle (features section için)
INSERT INTO `features_items` (`section_id`, `title`, `description`, `icon`, `order`, `status`) 
SELECT id, 'Güvenli Ödeme', 'Stripe ve iyzico entegrasyonu ile güvenli ödeme sistemi', 'FiShield', 1, 'active' 
FROM `home_sections` WHERE `key` = 'features' 
ON DUPLICATE KEY UPDATE title = VALUES(title);

INSERT INTO `features_items` (`section_id`, `title`, `description`, `icon`, `order`, `status`) 
SELECT id, 'Hızlı Teslimat', 'Dijital ürünler için anında indirme ve erişim', 'FiZap', 2, 'active' 
FROM `home_sections` WHERE `key` = 'features' 
ON DUPLICATE KEY UPDATE title = VALUES(title);

INSERT INTO `features_items` (`section_id`, `title`, `description`, `icon`, `order`, `status`) 
SELECT id, '7/24 Destek', 'Kesintisiz müşteri desteği ve teknik yardım', 'FiMessageCircle', 3, 'active' 
FROM `home_sections` WHERE `key` = 'features' 
ON DUPLICATE KEY UPDATE title = VALUES(title);

