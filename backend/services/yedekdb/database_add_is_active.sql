-- is_active kolonunu projects tablosuna ekle
-- Eğer kolon zaten varsa hata vermez (IF NOT EXISTS kullanılamaz ALTER TABLE'da)
-- Bu yüzden önce kontrol edin veya manuel olarak çalıştırın

ALTER TABLE `projects` 
ADD COLUMN `is_active` tinyint(1) NOT NULL DEFAULT 1 AFTER `status`;

-- Index ekle (opsiyonel)
ALTER TABLE `projects` 
ADD INDEX `idx_is_active` (`is_active`);
