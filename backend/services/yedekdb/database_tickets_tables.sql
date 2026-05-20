-- ============================================
-- TICKET SİSTEMİ VERİTABANI TABLOLARI
-- ============================================

-- Ana Ticket Tablosu
CREATE TABLE IF NOT EXISTS `tickets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ticket_number` varchar(50) NOT NULL,
  `user_id` int(11) NOT NULL,
  `department_id` int(11) DEFAULT NULL,
  `subject` varchar(255) NOT NULL,
  `message` text DEFAULT NULL,
  `category` varchar(50) DEFAULT 'general',
  `priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
  `status` enum('open','in_progress','resolved','closed') NOT NULL DEFAULT 'open',
  `waiting` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ticket_number` (`ticket_number`),
  KEY `user_id` (`user_id`),
  KEY `department_id` (`department_id`),
  KEY `status` (`status`),
  KEY `priority` (`priority`),
  CONSTRAINT `tickets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `tickets_ibfk_2` FOREIGN KEY (`department_id`) REFERENCES `support_departments` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ticket Yanıtları/Mesajları Tablosu
CREATE TABLE IF NOT EXISTS `ticket_replies` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ticket_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `message` text NOT NULL,
  `is_admin` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `ticket_id` (`ticket_id`),
  KEY `user_id` (`user_id`),
  KEY `created_at` (`created_at`),
  CONSTRAINT `ticket_replies_ibfk_1` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ticket_replies_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Destek Departmanları Tablosu
CREATE TABLE IF NOT EXISTS `support_departments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `icon` varchar(50) DEFAULT NULL,
  `color` varchar(20) DEFAULT '#696cff',
  `email` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `allowed_roles` JSON DEFAULT NULL COMMENT 'Hangi roller bu departmana erişebilir: ["user","seller","admin"]',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ticket Ekleri Tablosu (Opsiyonel)
CREATE TABLE IF NOT EXISTS `ticket_attachments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ticket_id` int(11) DEFAULT NULL,
  `reply_id` int(11) DEFAULT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_size` int(11) NOT NULL,
  `file_type` varchar(50) DEFAULT NULL,
  `uploaded_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `ticket_id` (`ticket_id`),
  KEY `reply_id` (`reply_id`),
  KEY `uploaded_by` (`uploaded_by`),
  CONSTRAINT `ticket_attachments_ibfk_1` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ticket_attachments_ibfk_2` FOREIGN KEY (`reply_id`) REFERENCES `ticket_replies` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ticket_attachments_ibfk_3` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ticket İşlem Logları Tablosu (Opsiyonel)
CREATE TABLE IF NOT EXISTS `ticket_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ticket_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `action` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `old_value` varchar(255) DEFAULT NULL,
  `new_value` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `ticket_id` (`ticket_id`),
  KEY `user_id` (`user_id`),
  KEY `action` (`action`),
  CONSTRAINT `ticket_logs_ibfk_1` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ticket_logs_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- FAQ Tablosu (Sıkça Sorulan Sorular)
CREATE TABLE IF NOT EXISTS `faqs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `question` text NOT NULL,
  `answer` text NOT NULL,
  `category` varchar(50) DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `views` int(11) NOT NULL DEFAULT 0,
  `helpful` int(11) NOT NULL DEFAULT 0,
  `not_helpful` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `category` (`category`),
  KEY `status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TRIGGER: Otomatik Ticket Numarası Oluşturma
-- ============================================

DELIMITER $$

-- Eski trigger varsa sil
DROP TRIGGER IF EXISTS `generate_ticket_number`$$

-- Yeni trigger oluştur
CREATE TRIGGER `generate_ticket_number` 
BEFORE INSERT ON `tickets`
FOR EACH ROW
BEGIN
    IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
        SET NEW.ticket_number = CONCAT(
            'TK-', 
            DATE_FORMAT(NOW(), '%Y%m%d'), 
            '-', 
            LPAD(
                (SELECT IFNULL(MAX(CAST(SUBSTRING_INDEX(ticket_number, '-', -1) AS UNSIGNED)), 0) + 1 
                 FROM tickets 
                 WHERE DATE(created_at) = CURDATE()), 
                4, 
                '0'
            )
        );
    END IF;
END$$

DELIMITER ;

-- ============================================
-- ÖRNEK VERİLER (Opsiyonel)
-- ============================================

-- Destek Departmanları Örnek Verileri
INSERT INTO `support_departments` (`name`, `slug`, `description`, `icon`, `color`, `is_active`, `sort_order`, `allowed_roles`) VALUES
('Genel Destek', 'genel-destek', 'Genel sorular ve destek talepleri', 'FiHelpCircle', '#3b82f6', 1, 1, '["user","seller","admin"]'),
('Teknik Destek', 'teknik-destek', 'Teknik sorunlar ve hata raporları', 'FiSettings', '#10b981', 1, 2, '["user","seller","admin"]'),
('Hesap Yönetimi', 'hesap-yonetimi', 'Hesap, ödeme ve abonelik sorunları', 'FiUser', '#f59e0b', 1, 3, '["user","seller","admin"]'),
('Satıcı Desteği', 'satici-destegi', 'Satıcılar için özel destek', 'FiShoppingBag', '#8b5cf6', 1, 4, '["seller","admin"]')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- ============================================
-- NOTLAR
-- ============================================
-- 
-- 1. tickets tablosu:
--    - ticket_number: Otomatik oluşturulur (TK-YYYYMMDD-0001 formatında)
--    - message: Ticket oluşturulurken yazılan ilk mesaj
--    - department_id: Hangi departmana ait olduğu
--    - category: Ticket kategorisi (account, technical, billing, vb.)
--    - priority: Öncelik seviyesi
--    - status: Ticket durumu
--
-- 2. ticket_replies tablosu:
--    - ticket_id: Hangi ticket'a ait olduğu
--    - user_id: Mesajı yazan kullanıcı
--    - message: Mesaj içeriği (HTML olabilir)
--    - is_admin: Admin yanıtı mı? (1 = Admin, 0 = Kullanıcı)
--
-- 3. support_departments tablosu:
--    - allowed_roles: JSON formatında hangi rollerin erişebileceği
--    - Örnek: '["user","seller","admin"]'
--
-- 4. ticket_attachments tablosu:
--    - Ticket veya yanıta eklenen dosyalar için
--    - ticket_id veya reply_id'den biri dolu olmalı
--
-- 5. ticket_logs tablosu:
--    - Ticket üzerinde yapılan işlemlerin logları
--    - Durum değişiklikleri, öncelik değişiklikleri vb.
--
-- ============================================

