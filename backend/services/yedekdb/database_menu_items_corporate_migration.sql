-- menu_items tablosuna "corporate" menu_type ekleme
-- Not: Enum güncellemesi MySQL/MariaDB'de MODIFY ile yapılır.

ALTER TABLE `menu_items`
  MODIFY COLUMN `menu_type` enum('header','footer','corporate') NOT NULL DEFAULT 'header';


