-- ============================================
-- menu_items Tablosuna Çok Dilli Destek Ekleme
-- ============================================

-- menu_items tablosuna çok dilli destek için yeni kolonlar ekle
-- MySQL'de IF NOT EXISTS desteklenmediği için önce kontrol edip ekleyelim
-- Eğer kolonlar zaten varsa hata alırsınız, o zaman MODIFY kullanın

-- Kolonları ekle (eğer yoksa)
ALTER TABLE `menu_items` 
ADD COLUMN `title_tr` VARCHAR(255) NULL AFTER `title`,
ADD COLUMN `title_en` VARCHAR(255) NULL AFTER `title_tr`,
ADD COLUMN `title_de` VARCHAR(255) NULL AFTER `title_en`;

-- Hata alırsanız (kolon zaten varsa), aşağıdaki komutları kullanın:
-- ALTER TABLE `menu_items` MODIFY COLUMN `title_tr` VARCHAR(255) NULL;
-- ALTER TABLE `menu_items` MODIFY COLUMN `title_en` VARCHAR(255) NULL;
-- ALTER TABLE `menu_items` MODIFY COLUMN `title_de` VARCHAR(255) NULL;

-- Mevcut title değerlerini title_tr'ye kopyala
UPDATE `menu_items` SET `title_tr` = `title` WHERE `title_tr` IS NULL;

-- menu_type enum'una 'topbar' ekle (eğer yoksa)
-- Önce mevcut enum değerlerini kontrol edin
ALTER TABLE `menu_items` MODIFY COLUMN `menu_type` ENUM('header','footer','corporate','topbar') NOT NULL DEFAULT 'header';

-- Topbar menü öğeleri için örnek veri
INSERT INTO `menu_items` (`menu_type`, `title`, `title_tr`, `title_en`, `title_de`, `url`, `icon`, `order`, `status`) VALUES
('topbar', 'Destek', 'Destek', 'Support', 'Support', '/tickets', 'FiHeadphones', 1, 'active'),
('topbar', 'İletişim', 'İletişim', 'Contact', 'Kontakt', '/contact', 'FiCreditCard', 2, 'active')
ON DUPLICATE KEY UPDATE 
    `title_tr` = VALUES(`title_tr`),
    `title_en` = VALUES(`title_en`),
    `title_de` = VALUES(`title_de`);

-- Alternatif: content_translations tablosunu kullan (daha esnek)
-- menu_items için content_translations kullanımı
-- Bu yaklaşım daha esnek çünkü yeni diller eklemek kolay
-- INSERT INTO `content_translations` (`content_id`, `content_type`, `language_code`, `title`, `description`) 
-- SELECT id, 'menu_item', 'tr', title, NULL FROM menu_items WHERE menu_type = 'topbar'
-- ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);
