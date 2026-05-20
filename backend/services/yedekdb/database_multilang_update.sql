-- Çok Dilli Proje Desteği için Veritabanı Güncellemeleri
-- Tarih: 2025-12-22

-- 1. content_translations tablosuna short_description alanı ekle
ALTER TABLE `content_translations` 
ADD COLUMN `short_description` VARCHAR(500) DEFAULT NULL AFTER `description`;

-- 2. content_translations tablosunda unique key kontrolü (zaten var ama emin olmak için)
-- UNIQUE KEY `content_lang` (`content_id`,`content_type`,`language_code`) zaten mevcut

-- 3. Mevcut veriler için Türkçe içerikleri de content_translations'a ekle (opsiyonel)
-- Bu sorgu mevcut projelerin Türkçe içeriklerini content_translations'a kopyalar
INSERT INTO `content_translations` (`content_id`, `content_type`, `language_code`, `title`, `description`, `short_description`)
SELECT 
    p.id,
    'project',
    'tr',
    p.title,
    p.description,
    p.short_description
FROM `projects` p
WHERE NOT EXISTS (
    SELECT 1 FROM `content_translations` ct 
    WHERE ct.content_id = p.id 
    AND ct.content_type = 'project' 
    AND ct.language_code = 'tr'
)
ON DUPLICATE KEY UPDATE 
    title = VALUES(title),
    description = VALUES(description),
    short_description = VALUES(short_description);

