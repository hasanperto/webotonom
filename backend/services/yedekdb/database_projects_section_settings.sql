-- Projects Section Settings Tablosu
CREATE TABLE IF NOT EXISTS `projects_section_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `section_id` int(11) NOT NULL,
  `display_count` int(11) NOT NULL DEFAULT 6,
  `display_type` enum('featured','selected','category','all') NOT NULL DEFAULT 'featured',
  `category_ids` text DEFAULT NULL COMMENT 'JSON array of category IDs',
  `selected_project_ids` text DEFAULT NULL COMMENT 'JSON array of project IDs',
  `sort_by` enum('latest','popular','price_asc','price_desc','rating') NOT NULL DEFAULT 'latest',
  `show_filters` tinyint(1) NOT NULL DEFAULT 1,
  `show_view_all` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `section_id` (`section_id`),
  CONSTRAINT `projects_section_settings_ibfk_1` FOREIGN KEY (`section_id`) REFERENCES `home_sections` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Varsayılan ayarları ekle (projects section için)
INSERT INTO `projects_section_settings` (`section_id`, `display_count`, `display_type`, `sort_by`, `show_filters`, `show_view_all`) 
SELECT id, 6, 'featured', 'latest', 1, 1 
FROM `home_sections` 
WHERE `key` = 'projects' 
LIMIT 1;

