-- ============================================
-- Users tablosuna balance kolonu ekleme
-- ============================================

USE `teknopro`;

-- Users tablosuna balance kolonu ekle (eğer yoksa)
-- MySQL'de IF NOT EXISTS desteklenmediği için önce kontrol ediyoruz
SET @dbname = DATABASE();
SET @tablename = 'users';
SET @columnname = 'balance';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1', -- Kolon varsa hiçbir şey yapma
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER role_id')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Mevcut kullanıcılara varsayılan bakiye atama (eğer NULL ise)
UPDATE users SET balance = 0.00 WHERE balance IS NULL;

