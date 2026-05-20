-- ============================================
-- Bank Transfer Notifications (Banka Havalesi Bildirimleri) Tablosu
-- ============================================

CREATE TABLE IF NOT EXISTS `bank_transfer_notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL COMMENT 'Sipariş ID',
  `user_id` int(11) NOT NULL COMMENT 'Kullanıcı ID',
  `receipt_number` varchar(100) NOT NULL COMMENT 'Dekont Numarası',
  `reference_number` varchar(100) DEFAULT NULL COMMENT 'Referans Numarası (CS)',
  `receipt_file` varchar(255) DEFAULT NULL COMMENT 'Dekont Dosyası Yolu',
  `notes` text DEFAULT NULL COMMENT 'Ek Notlar',
  `status` enum('pending','approved','rejected') DEFAULT 'pending' COMMENT 'Durum',
  `admin_notes` text DEFAULT NULL COMMENT 'Admin Notları',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_bank_notification_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_bank_notification_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
