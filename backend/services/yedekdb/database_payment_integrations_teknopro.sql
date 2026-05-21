-- TeknoPro: odeme tablolari (phpMyAdmin icin; oncelik: node scripts/setup-payment-integrations.js)
-- Bozuk teknoprojes DB once kaldirilmali: DROP DATABASE IF EXISTS teknoprojes;

CREATE TABLE IF NOT EXISTS `payment_requests` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `amount` DECIMAL(10,2) NOT NULL,
    `bonus_amount` DECIMAL(10,2) DEFAULT 0,
    `total_amount` DECIMAL(10,2) NOT NULL,
    `payment_method` VARCHAR(50) NOT NULL DEFAULT 'bank_transfer',
    `gateway` VARCHAR(50) DEFAULT NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'pending',
    `reference_number` VARCHAR(100) UNIQUE,
    `transaction_id` VARCHAR(200) DEFAULT NULL,
    `metadata` JSON DEFAULT NULL,
    `response_data` JSON DEFAULT NULL,
    `user_note` TEXT DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY `idx_user_id` (`user_id`),
    KEY `idx_status` (`status`),
    KEY `idx_payment_method` (`payment_method`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
