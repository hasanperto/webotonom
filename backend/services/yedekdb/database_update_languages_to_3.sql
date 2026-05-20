-- Sadece 3 dil aktif: Türkçe, İngilizce, Almanca
-- Diğer dilleri pasif yap

UPDATE `languages` SET `status` = 'inactive' WHERE `code` NOT IN ('tr', 'en', 'de');

-- Aktif dilleri kontrol et ve gerekirse oluştur
INSERT INTO `languages` (`code`, `name`, `native_name`, `rtl`, `is_default`, `status`, `sort_order`) 
VALUES 
    ('tr', 'Turkish', 'Türkçe', 0, 1, 'active', 1),
    ('en', 'English', 'English', 0, 0, 'active', 2),
    ('de', 'German', 'Deutsch', 0, 0, 'active', 3)
ON DUPLICATE KEY UPDATE 
    `status` = 'active',
    `sort_order` = VALUES(`sort_order`);

-- Türkçe'yi varsayılan dil yap
UPDATE `languages` SET `is_default` = 1 WHERE `code` = 'tr';
UPDATE `languages` SET `is_default` = 0 WHERE `code` != 'tr';

