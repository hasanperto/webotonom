-- Cart tablosuna quantity kolonu ekle
ALTER TABLE `cart` 
ADD COLUMN `quantity` int(11) NOT NULL DEFAULT 1 AFTER `project_id`;

