-- Testimonial item için content_translations tablosuna content_type ekle
ALTER TABLE `content_translations` 
MODIFY COLUMN `content_type` enum('project','blog','page','hero_slide','section','feature','stat_item','faq_item','about_item','testimonial_item') NOT NULL DEFAULT 'project';

-- extra_data kolonu ekle (role ve company için)
-- Eğer kolon zaten varsa hata verecek ama zararsız
ALTER TABLE `content_translations` 
ADD COLUMN `extra_data` TEXT NULL AFTER `description`;
