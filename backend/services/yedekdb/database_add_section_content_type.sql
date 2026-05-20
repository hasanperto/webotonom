-- Section için content_translations tablosuna content_type ekle
ALTER TABLE `content_translations` 
MODIFY COLUMN `content_type` enum('project','blog','page','hero_slide','section') NOT NULL DEFAULT 'project';

