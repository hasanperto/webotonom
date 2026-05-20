-- About Items tablosu (home_sections ile ilişkili)
CREATE TABLE IF NOT EXISTS `about_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `section_id` INT NOT NULL,
  `text` VARCHAR(255) NOT NULL COMMENT 'Özellik metni (örn: Güvenli ve Güvenilir)',
  `icon` VARCHAR(50) DEFAULT NULL COMMENT 'Icon class name (e.g., FiCheckCircle)',
  `order` INT DEFAULT 0,
  `status` ENUM('active', 'inactive') DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`section_id`) REFERENCES `home_sections`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Örnek About items ekle (eğer 'about' section varsa)
INSERT INTO `about_items` (`section_id`, `text`, `icon`, `order`, `status`)
SELECT id, 'Güvenli ve Güvenilir', 'FiCheckCircle', 1, 'active' FROM `home_sections` WHERE `key` = 'about'
ON DUPLICATE KEY UPDATE text=VALUES(text);

INSERT INTO `about_items` (`section_id`, `text`, `icon`, `order`, `status`)
SELECT id, 'Hızlı ve Kolay', 'FiCheckCircle', 2, 'active' FROM `home_sections` WHERE `key` = 'about'
ON DUPLICATE KEY UPDATE text=VALUES(text);

INSERT INTO `about_items` (`section_id`, `text`, `icon`, `order`, `status`)
SELECT id, 'Destek ve Yardım', 'FiCheckCircle', 3, 'active' FROM `home_sections` WHERE `key` = 'about'
ON DUPLICATE KEY UPDATE text=VALUES(text);

