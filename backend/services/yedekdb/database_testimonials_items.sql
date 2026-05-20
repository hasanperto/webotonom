-- Testimonials Section Items Table
CREATE TABLE IF NOT EXISTS `testimonials_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `section_id` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `role` VARCHAR(255),
  `comment` TEXT NOT NULL,
  `rating` INT DEFAULT 5,
  `avatar` VARCHAR(255),
  `company` VARCHAR(255),
  `order` INT DEFAULT 0,
  `status` ENUM('active', 'inactive') DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`section_id`) REFERENCES `home_sections`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Testimonials Section Settings Table
CREATE TABLE IF NOT EXISTS `testimonials_section_settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `section_id` INT NOT NULL,
  `display_type` ENUM('all', 'featured', 'selected') DEFAULT 'all',
  `display_count` INT DEFAULT 3,
  `show_rating` TINYINT(1) DEFAULT 1,
  `show_avatar` TINYINT(1) DEFAULT 1,
  `show_company` TINYINT(1) DEFAULT 1,
  `slider_enabled` TINYINT(1) DEFAULT 1,
  `auto_play` TINYINT(1) DEFAULT 1,
  `auto_play_interval` INT DEFAULT 5000,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`section_id`) REFERENCES `home_sections`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_section` (`section_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default testimonials items
INSERT INTO `testimonials_items` (`section_id`, `name`, `role`, `comment`, `rating`, `avatar`, `company`, `order`, `status`)
SELECT id, 'Ahmet Yılmaz', 'Yazılım Geliştirici', 'TeknoProje sayesinde projelerim dünyayla paylaşabiliyorum. Harika bir platform!', 5, 'https://i.pravatar.cc/150?img=12', 'TechCorp', 1, 'active' FROM `home_sections` WHERE `key` = 'testimonials'
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO `testimonials_items` (`section_id`, `name`, `role`, `comment`, `rating`, `avatar`, `company`, `order`, `status`)
SELECT id, 'Ayşe Kaya', 'UI/UX Tasarımcı', 'Harika bir platform, satışlarım 3 katına çıktı. Kesinlikle tavsiye ederim!', 5, 'https://i.pravatar.cc/150?img=47', 'Design Studio', 2, 'active' FROM `home_sections` WHERE `key` = 'testimonials'
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO `testimonials_items` (`section_id`, `name`, `role`, `comment`, `rating`, `avatar`, `company`, `order`, `status`)
SELECT id, 'Mehmet Demir', 'Proje Yöneticisi', 'Destek ekibi çok yardımcı, tavsiye ederim. Profesyonel bir hizmet!', 5, 'https://i.pravatar.cc/150?img=33', 'Project Inc', 3, 'active' FROM `home_sections` WHERE `key` = 'testimonials'
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Insert default settings
INSERT INTO `testimonials_section_settings` (`section_id`, `display_type`, `display_count`, `show_rating`, `show_avatar`, `show_company`, `slider_enabled`, `auto_play`, `auto_play_interval`)
SELECT id, 'all', 3, 1, 1, 1, 1, 1, 5000 FROM `home_sections` WHERE `key` = 'testimonials'
ON DUPLICATE KEY UPDATE display_type=VALUES(display_type);

