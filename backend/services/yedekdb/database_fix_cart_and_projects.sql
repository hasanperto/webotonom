-- Cart: abonelik planı + opsiyonel proje
ALTER TABLE `cart`
  ADD COLUMN IF NOT EXISTS `plan_id` int(11) DEFAULT NULL AFTER `project_id`;

-- MariaDB 10.5.2+ IF NOT EXISTS için; eski sürümde script kullanın: fix-schema-cart-projects.js

ALTER TABLE `cart`
  MODIFY COLUMN `project_id` int(11) DEFAULT NULL;

ALTER TABLE `projects`
  ADD COLUMN IF NOT EXISTS `completion_status` enum('completed','in_progress') NOT NULL DEFAULT 'completed' AFTER `status`,
  ADD COLUMN IF NOT EXISTS `deadline` date DEFAULT NULL AFTER `donation_received`,
  ADD COLUMN IF NOT EXISTS `source_url` varchar(500) DEFAULT NULL AFTER `version`,
  ADD COLUMN IF NOT EXISTS `timeline` text DEFAULT NULL AFTER `source_url`;

ALTER TABLE `content_translations`
  ADD COLUMN IF NOT EXISTS `short_description` varchar(500) DEFAULT NULL AFTER `description`;
