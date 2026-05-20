-- FAQ Items tablosu (home_sections ile ilişkili)
CREATE TABLE IF NOT EXISTS `faq_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `section_id` INT NOT NULL,
  `question` VARCHAR(500) NOT NULL,
  `answer` TEXT NOT NULL,
  `category` VARCHAR(50) DEFAULT NULL,
  `order` INT DEFAULT 0,
  `status` ENUM('active', 'inactive') DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`section_id`) REFERENCES `home_sections`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Örnek FAQ items ekle (eğer 'faq' section varsa)
INSERT INTO `faq_items` (`section_id`, `question`, `answer`, `category`, `order`, `status`)
SELECT id, 'TeknoProje nedir?', 'TeknoProje, yazılım projelerinizi sergileyen ve satmanız için bir platformdur.', 'general', 1, 'active' FROM `home_sections` WHERE `key` = 'faq'
ON DUPLICATE KEY UPDATE question=VALUES(question);

INSERT INTO `faq_items` (`section_id`, `question`, `answer`, `category`, `order`, `status`)
SELECT id, 'Nasıl proje yüklerim?', 'Panelinizdeki "Yeni Proje" butonuna tıklayarak projenizi yükleyebilirsiniz.', 'general', 2, 'active' FROM `home_sections` WHERE `key` = 'faq'
ON DUPLICATE KEY UPDATE question=VALUES(question);

INSERT INTO `faq_items` (`section_id`, `question`, `answer`, `category`, `order`, `status`)
SELECT id, 'Ödeme ne kadar sürede yapılır?', 'Ödeme işlemi 24-48 saat içinde yapılır.', 'payment', 3, 'active' FROM `home_sections` WHERE `key` = 'faq'
ON DUPLICATE KEY UPDATE question=VALUES(question);

