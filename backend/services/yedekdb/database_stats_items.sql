-- Stats Section Items Tablosu
CREATE TABLE IF NOT EXISTS `stats_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `section_id` int(11) NOT NULL,
  `number` varchar(50) NOT NULL COMMENT 'İstatistik sayısı (örn: 2,500+, ₺5M+)',
  `label` varchar(255) NOT NULL COMMENT 'İstatistik etiketi (örn: Aktif Proje)',
  `icon` varchar(100) DEFAULT NULL COMMENT 'Icon class name (e.g., FiTrendingUp, FiUsers)',
  `color` varchar(50) DEFAULT '#667eea' COMMENT 'Kart rengi (hex)',
  `order` int(11) NOT NULL DEFAULT 0,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `section_id` (`section_id`),
  KEY `status` (`status`),
  CONSTRAINT `stats_items_ibfk_1` FOREIGN KEY (`section_id`) REFERENCES `home_sections` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Varsayılan istatistikler ekle (stats section için)
INSERT INTO `stats_items` (`section_id`, `number`, `label`, `icon`, `color`, `order`, `status`) 
SELECT id, '2,500+', 'Aktif Proje', 'FiTrendingUp', '#667eea', 1, 'active' 
FROM `home_sections` WHERE `key` = 'stats' 
ON DUPLICATE KEY UPDATE number = VALUES(number);

INSERT INTO `stats_items` (`section_id`, `number`, `label`, `icon`, `color`, `order`, `status`) 
SELECT id, '15K+', 'Geliştirici', 'FiUsers', '#f093fb', 2, 'active' 
FROM `home_sections` WHERE `key` = 'stats' 
ON DUPLICATE KEY UPDATE number = VALUES(number);

INSERT INTO `stats_items` (`section_id`, `number`, `label`, `icon`, `color`, `order`, `status`) 
SELECT id, '₺5M+', 'Toplam Satış', 'FiCreditCard', '#4facfe', 3, 'active' 
FROM `home_sections` WHERE `key` = 'stats' 
ON DUPLICATE KEY UPDATE number = VALUES(number);

INSERT INTO `stats_items` (`section_id`, `number`, `label`, `icon`, `color`, `order`, `status`) 
SELECT id, '50K+', 'Mutlu Müşteri', 'FiStar', '#43e97b', 4, 'active' 
FROM `home_sections` WHERE `key` = 'stats' 
ON DUPLICATE KEY UPDATE number = VALUES(number);

