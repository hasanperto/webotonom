-- ============================================
-- Bank Accounts (Banka Hesapları) Tablosu
-- ============================================

CREATE TABLE IF NOT EXISTS `bank_accounts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `bank_name` varchar(255) NOT NULL COMMENT 'Banka Adı',
  `iban` varchar(34) NOT NULL COMMENT 'IBAN',
  `account_holder` varchar(255) NOT NULL COMMENT 'Hesap Sahibi',
  `account_number` varchar(50) DEFAULT NULL COMMENT 'Hesap Numarası (Opsiyonel)',
  `branch_name` varchar(255) DEFAULT NULL COMMENT 'Şube Adı (Opsiyonel)',
  `swift_code` varchar(11) DEFAULT NULL COMMENT 'SWIFT Kodu (Opsiyonel)',
  `currency` varchar(3) DEFAULT 'TRY' COMMENT 'Para Birimi',
  `is_active` tinyint(1) DEFAULT 1 COMMENT 'Aktif mi?',
  `sort_order` int(11) DEFAULT 0 COMMENT 'Sıralama',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_sort_order` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Örnek veri
INSERT INTO `bank_accounts` (`bank_name`, `iban`, `account_holder`, `account_number`, `currency`, `is_active`, `sort_order`) VALUES
('Örnek Bank', 'TR12 3456 7890 1234 5678 9012 34', 'TeknoProje A.Ş.', '12345678', 'TRY', 1, 1);
