-- Yasak notu kolonu ekleme
-- Eğer kolon zaten varsa hata vermez

-- Önce kolonun var olup olmadığını kontrol et
SET @dbname = DATABASE();
SET @tablename = 'users';
SET @columnname = 'ban_note';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' TEXT NULL DEFAULT NULL COMMENT ''Yasaklama nedeni veya notları'' AFTER status')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

