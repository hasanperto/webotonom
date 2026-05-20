-- ============================================
-- Sponsor ve Referanslar Bölümlerini Ekle
-- Ana sayfaya sponsor ve referanslar bölümlerini ekler
-- ============================================

-- Sponsorlar bölümü ekle
INSERT INTO `home_sections` (`key`, `title`, `isActive`, `order`) 
VALUES ('sponsors', 'Sponsorlar', 1, 9)
ON DUPLICATE KEY UPDATE 
    `title` = VALUES(`title`),
    `isActive` = VALUES(`isActive`),
    `order` = VALUES(`order`);

-- Referanslar bölümü ekle
INSERT INTO `home_sections` (`key`, `title`, `isActive`, `order`) 
VALUES ('references', 'Referanslar', 1, 10)
ON DUPLICATE KEY UPDATE 
    `title` = VALUES(`title`),
    `isActive` = VALUES(`isActive`),
    `order` = VALUES(`order`);

-- Contact bölümünün order'ını güncelle (11 yap)
UPDATE `home_sections` 
SET `order` = 11 
WHERE `key` = 'contact';

