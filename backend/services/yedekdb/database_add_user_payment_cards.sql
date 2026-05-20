-- Kullanıcı ödeme kartları tablosu
CREATE TABLE IF NOT EXISTS `user_payment_cards` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `card_type` enum('Visa','MasterCard','AmericanExpress','Discover','Other') NOT NULL DEFAULT 'Other',
  `card_holder` varchar(255) NOT NULL,
  `masked_number` varchar(20) NOT NULL,
  `last_four` varchar(4) NOT NULL,
  `expiry_month` varchar(2) NOT NULL,
  `expiry_year` varchar(4) NOT NULL,
  `expiry_date` varchar(7) NOT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `token` varchar(255) DEFAULT NULL COMMENT 'Güvenli token (Stripe/Iyzico)',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `is_default` (`is_default`),
  CONSTRAINT `user_payment_cards_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

