-- ============================================
-- Eksik Kolonları Eklemek İçin ALTER TABLE Komutları
-- Bu dosyayı database.sql'den sonra çalıştırın
-- Eğer kolonlar zaten varsa hata verebilir, bu normaldir
-- ============================================

USE `teknopro`;

-- Contact messages tablosuna lead özellikleri ekle
-- Hata alırsanız kolon zaten mevcut demektir, devam edebilirsiniz

-- Phone kolonu
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'teknopro' AND TABLE_NAME = 'contact_messages' AND COLUMN_NAME = 'phone');
SET @sqlstmt := IF(@exist = 0, 
  'ALTER TABLE `contact_messages` ADD COLUMN `phone` varchar(20) DEFAULT NULL AFTER `email`', 
  'SELECT "Column phone already exists"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Interest areas kolonu
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'teknopro' AND TABLE_NAME = 'contact_messages' AND COLUMN_NAME = 'interest_areas');
SET @sqlstmt := IF(@exist = 0, 
  'ALTER TABLE `contact_messages` ADD COLUMN `interest_areas` text DEFAULT NULL AFTER `message`', 
  'SELECT "Column interest_areas already exists"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Project interest kolonu
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'teknopro' AND TABLE_NAME = 'contact_messages' AND COLUMN_NAME = 'project_interest');
SET @sqlstmt := IF(@exist = 0, 
  'ALTER TABLE `contact_messages` ADD COLUMN `project_interest` varchar(255) DEFAULT NULL AFTER `interest_areas`', 
  'SELECT "Column project_interest already exists"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verification token kolonu
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'teknopro' AND TABLE_NAME = 'contact_messages' AND COLUMN_NAME = 'verification_token');
SET @sqlstmt := IF(@exist = 0, 
  'ALTER TABLE `contact_messages` ADD COLUMN `verification_token` varchar(100) DEFAULT NULL AFTER `project_interest`', 
  'SELECT "Column verification_token already exists"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Email verified kolonu
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'teknopro' AND TABLE_NAME = 'contact_messages' AND COLUMN_NAME = 'email_verified');
SET @sqlstmt := IF(@exist = 0, 
  'ALTER TABLE `contact_messages` ADD COLUMN `email_verified` tinyint(1) NOT NULL DEFAULT 0 AFTER `verification_token`', 
  'SELECT "Column email_verified already exists"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Status kolonu
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'teknopro' AND TABLE_NAME = 'contact_messages' AND COLUMN_NAME = 'status');
SET @sqlstmt := IF(@exist = 0, 
  'ALTER TABLE `contact_messages` ADD COLUMN `status` enum(\'new\',\'contacted\',\'qualified\',\'converted\',\'lost\') NOT NULL DEFAULT \'new\' AFTER `email_verified`', 
  'SELECT "Column status already exists"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Tickets tablosuna kategori ve waiting ekle
-- Category kolonu
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'teknopro' AND TABLE_NAME = 'tickets' AND COLUMN_NAME = 'category');
SET @sqlstmt := IF(@exist = 0, 
  'ALTER TABLE `tickets` ADD COLUMN `category` varchar(50) DEFAULT NULL AFTER `subject`', 
  'SELECT "Column category already exists"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Waiting kolonu
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'teknopro' AND TABLE_NAME = 'tickets' AND COLUMN_NAME = 'waiting');
SET @sqlstmt := IF(@exist = 0, 
  'ALTER TABLE `tickets` ADD COLUMN `waiting` tinyint(1) NOT NULL DEFAULT 0 AFTER `status`', 
  'SELECT "Column waiting already exists"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Orders tablosuna coupon_code ekle (eğer yoksa)
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'teknopro' AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'coupon_code');
SET @sqlstmt := IF(@exist = 0, 
  'ALTER TABLE `orders` ADD COLUMN `coupon_code` varchar(50) DEFAULT NULL AFTER `currency`, ADD KEY `coupon_code` (`coupon_code`)', 
  'SELECT "Column coupon_code already exists"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Projects tablosuna admin_demo_url ve login bilgileri ekle
-- Admin Demo URL
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'teknopro' AND TABLE_NAME = 'projects' AND COLUMN_NAME = 'admin_demo_url');
SET @sqlstmt := IF(@exist = 0, 
  'ALTER TABLE `projects` ADD COLUMN `admin_demo_url` varchar(255) DEFAULT NULL AFTER `demo_url`', 
  'SELECT "Column admin_demo_url already exists"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Demo Username
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'teknopro' AND TABLE_NAME = 'projects' AND COLUMN_NAME = 'demo_username');
SET @sqlstmt := IF(@exist = 0, 
  'ALTER TABLE `projects` ADD COLUMN `demo_username` varchar(100) DEFAULT NULL AFTER `admin_demo_url`', 
  'SELECT "Column demo_username already exists"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Demo Password
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'teknopro' AND TABLE_NAME = 'projects' AND COLUMN_NAME = 'demo_password');
SET @sqlstmt := IF(@exist = 0, 
  'ALTER TABLE `projects` ADD COLUMN `demo_password` varchar(100) DEFAULT NULL AFTER `demo_username`', 
  'SELECT "Column demo_password already exists"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Admin Username
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'teknopro' AND TABLE_NAME = 'projects' AND COLUMN_NAME = 'admin_username');
SET @sqlstmt := IF(@exist = 0, 
  'ALTER TABLE `projects` ADD COLUMN `admin_username` varchar(100) DEFAULT NULL AFTER `demo_password`', 
  'SELECT "Column admin_username already exists"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Admin Password
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'teknopro' AND TABLE_NAME = 'projects' AND COLUMN_NAME = 'admin_password');
SET @sqlstmt := IF(@exist = 0, 
  'ALTER TABLE `projects` ADD COLUMN `admin_password` varchar(100) DEFAULT NULL AFTER `admin_username`', 
  'SELECT "Column admin_password already exists"');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
