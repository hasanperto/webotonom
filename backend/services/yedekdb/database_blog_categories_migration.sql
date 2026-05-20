-- ============================================
-- Blog Kategorileri Migration
-- blog_posts.category_id'yi blog_categories tablosuna bağlar
-- ============================================

USE `teknopro`;

-- Adım 1: Mevcut foreign key'i kaldır (eğer varsa)
-- Not: Eğer foreign key yoksa bu komut hata verecektir, bu normaldir
-- Hata alırsanız bir sonraki adıma geçebilirsiniz
ALTER TABLE `blog_posts` DROP FOREIGN KEY `blog_posts_ibfk_2`;

-- Adım 2: Yeni foreign key'i blog_categories tablosuna bağla
ALTER TABLE `blog_posts` 
ADD CONSTRAINT `blog_posts_ibfk_2` 
FOREIGN KEY (`category_id`) REFERENCES `blog_categories` (`id`) ON DELETE SET NULL;
