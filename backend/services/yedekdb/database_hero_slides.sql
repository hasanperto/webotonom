-- Hero Slider Öğeleri Tablosu
CREATE TABLE IF NOT EXISTS `hero_slides` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `section_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `subtitle` text DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `gradient` varchar(255) DEFAULT NULL,
  `link` varchar(255) DEFAULT NULL,
  `button_text` varchar(100) DEFAULT NULL,
  `button_link` varchar(255) DEFAULT NULL,
  `button_text_2` varchar(100) DEFAULT NULL,
  `button_link_2` varchar(255) DEFAULT NULL,
  `order` int(11) NOT NULL DEFAULT 0,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `section_id` (`section_id`),
  CONSTRAINT `hero_slides_ibfk_1` FOREIGN KEY (`section_id`) REFERENCES `home_sections` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Varsayılan hero slide'ları ekle (hero section için)
INSERT INTO `hero_slides` (`section_id`, `title`, `subtitle`, `image`, `gradient`, `button_text`, `button_link`, `button_text_2`, `button_link_2`, `order`, `status`) VALUES
(1, 'Dijital Projelerinizi Dünyaya Açın', 'TeknoProje ile yazılım projelerinizi sergileyin, lisanslayın ve abonelik modeliyle sunun.', 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=1200&h=600&fit=crop', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 'Projeleri Keşfet', '/projects', 'Ücretsiz Başla', '/register', 1, 'active'),
(1, 'Modern Teknoloji Çözümleri', 'AI destekli, güvenli ve hızlı platform ile projelerinizi yönetin.', 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&h=600&fit=crop', 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', 'Projeleri Keşfet', '/projects', 'Ücretsiz Başla', '/register', 2, 'active'),
(1, 'Geliştiriciler İçin Platform', 'Binlerce başarılı proje ve mutlu geliştirici topluluğu.', 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&h=600&fit=crop', 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', 'Projeleri Keşfet', '/projects', 'Ücretsiz Başla', '/register', 3, 'active');

