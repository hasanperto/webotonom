-- ============================================
-- Destek Sistemi - Departman Yapısı
-- ============================================

USE `teknopro`;

-- Destek Departmanları Tablosu
CREATE TABLE IF NOT EXISTS `support_departments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `description` text,
  `icon` varchar(50) DEFAULT NULL,
  `color` varchar(20) DEFAULT '#696cff',
  `email` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `allowed_roles` JSON DEFAULT NULL COMMENT 'Hangi roller bu departmana erişebilir: ["user","seller","admin"]',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tickets tablosuna department_id ekle
-- Önce mevcut constraint'leri kontrol et ve sil
SET @constraint_exists = (
    SELECT COUNT(*) 
    FROM information_schema.TABLE_CONSTRAINTS 
    WHERE CONSTRAINT_SCHEMA = 'teknopro' 
    AND TABLE_NAME = 'tickets' 
    AND CONSTRAINT_NAME = 'tickets_ibfk_department'
);

SET @sql = IF(@constraint_exists > 0, 
    'ALTER TABLE `tickets` DROP FOREIGN KEY `tickets_ibfk_department`;',
    'SELECT "Constraint does not exist, skipping drop";'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Kolonları ekle (eğer yoksa)
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = 'teknopro' 
    AND TABLE_NAME = 'tickets' 
    AND COLUMN_NAME = 'department_id'
);

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE `tickets` ADD COLUMN `department_id` int(11) DEFAULT NULL AFTER `user_id`;',
    'SELECT "Column department_id already exists";'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = 'teknopro' 
    AND TABLE_NAME = 'tickets' 
    AND COLUMN_NAME = 'message'
);

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE `tickets` ADD COLUMN `message` text DEFAULT NULL AFTER `subject`;',
    'SELECT "Column message already exists";'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = 'teknopro' 
    AND TABLE_NAME = 'tickets' 
    AND COLUMN_NAME = 'category'
);

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE `tickets` ADD COLUMN `category` varchar(50) DEFAULT "general" AFTER `priority`;',
    'SELECT "Column category already exists";'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Index ekle (eğer yoksa)
SET @index_exists = (
    SELECT COUNT(*) 
    FROM information_schema.STATISTICS 
    WHERE TABLE_SCHEMA = 'teknopro' 
    AND TABLE_NAME = 'tickets' 
    AND INDEX_NAME = 'department_id'
);

SET @sql = IF(@index_exists = 0, 
    'ALTER TABLE `tickets` ADD KEY `department_id` (`department_id`);',
    'SELECT "Index department_id already exists";'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Foreign key constraint ekle
ALTER TABLE `tickets` 
ADD CONSTRAINT `tickets_ibfk_department` 
FOREIGN KEY (`department_id`) 
REFERENCES `support_departments` (`id`) 
ON DELETE SET NULL;

-- Ticket numarası otomatik oluşturma için trigger (eğer yoksa)
DELIMITER //
CREATE TRIGGER IF NOT EXISTS `generate_ticket_number` 
BEFORE INSERT ON `tickets`
FOR EACH ROW
BEGIN
    IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
        SET NEW.ticket_number = CONCAT('TK-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD((SELECT IFNULL(MAX(CAST(SUBSTRING_INDEX(ticket_number, '-', -1) AS UNSIGNED)), 0) + 1 FROM tickets WHERE DATE(created_at) = CURDATE()), 4, '0'));
    END IF;
END//
DELIMITER ;

-- Örnek Departmanlar
INSERT INTO `support_departments` (`name`, `slug`, `description`, `icon`, `color`, `email`, `allowed_roles`, `sort_order`) VALUES
('Genel Destek', 'general-support', 'Genel sorular ve destek talepleri için', '💬', '#696cff', 'support@teknoproje.com', '["user","seller","admin"]', 1),
('Teknik Destek', 'technical-support', 'Teknik sorunlar ve hata bildirimleri için', '🔧', '#03c3ec', 'technical@teknoproje.com', '["user","seller","admin"]', 2),
('Satış ve Faturalama', 'sales-billing', 'Satış, ödeme ve fatura soruları için', '💳', '#10b981', 'sales@teknoproje.com', '["user","seller","admin"]', 3),
('Satıcı Desteği', 'seller-support', 'Satıcılar için özel destek departmanı', '👨‍💼', '#f59e0b', 'seller@teknoproje.com', '["seller","admin"]', 4),
('Yönetici Desteği', 'admin-support', 'Yöneticiler için özel destek departmanı', '👑', '#8b5cf6', 'admin@teknoproje.com', '["admin"]', 5)
ON DUPLICATE KEY UPDATE name=name;

