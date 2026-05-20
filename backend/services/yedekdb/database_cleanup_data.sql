-- ============================================
-- VERİTABANI TEMİZLEME SCRIPTİ
-- Proje Satın Almalar, Mesajlar, Ticketler, Faturalar
-- ============================================
-- 
-- UYARI: Bu script aşağıdaki tabloları TAMAMEN TEMİZLEYECEKTİR!
-- - Siparişler (orders, order_items)
-- - Mesajlar (contact_messages, messages)
-- - Ticketler (tickets, ticket_replies)
-- - Faturalar (invoices)
-- - İşlemler (transactions, payment_logs)
-- 
-- ÇALIŞTIRMADAN ÖNCE YEDEK ALIN!
-- ============================================

USE `teknopro`;

-- Foreign key kontrollerini geçici olarak kapat
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- 1. FATURALAR VE İŞLEMLER (Önce silinmeli)
-- ============================================

-- Ödeme logları
DELETE FROM `payment_logs` WHERE 1=1;
ALTER TABLE `payment_logs` AUTO_INCREMENT = 1;

-- İşlemler (transactions)
DELETE FROM `transactions` WHERE 1=1;
ALTER TABLE `transactions` AUTO_INCREMENT = 1;

-- Faturalar
DELETE FROM `invoices` WHERE 1=1;
ALTER TABLE `invoices` AUTO_INCREMENT = 1;

-- ============================================
-- 2. SİPARİŞLER (order_items önce, sonra orders)
-- ============================================

-- Sipariş kalemleri
DELETE FROM `order_items` WHERE 1=1;
ALTER TABLE `order_items` AUTO_INCREMENT = 1;

-- Siparişler
DELETE FROM `orders` WHERE 1=1;
ALTER TABLE `orders` AUTO_INCREMENT = 1;

-- ============================================
-- 3. TICKETLER (ticket_replies önce, sonra tickets)
-- ============================================

-- Ticket yanıtları
DELETE FROM `ticket_replies` WHERE 1=1;
ALTER TABLE `ticket_replies` AUTO_INCREMENT = 1;

-- Ticket ekleri (varsa)
DELETE FROM `ticket_attachments` WHERE 1=1;
ALTER TABLE `ticket_attachments` AUTO_INCREMENT = 1;

-- Ticketler
DELETE FROM `tickets` WHERE 1=1;
ALTER TABLE `tickets` AUTO_INCREMENT = 1;

-- ============================================
-- 4. MESAJLAR
-- ============================================

-- İletişim formu mesajları
DELETE FROM `contact_messages` WHERE 1=1;
ALTER TABLE `contact_messages` AUTO_INCREMENT = 1;

-- Mesajlar (varsa)
DELETE FROM `messages` WHERE 1=1;
ALTER TABLE `messages` AUTO_INCREMENT = 1;

-- Lead mesajları (varsa)
DELETE FROM `leads` WHERE 1=1;
ALTER TABLE `leads` AUTO_INCREMENT = 1;

-- ============================================
-- 5. İLGİLİ DİĞER VERİLER
-- ============================================

-- Kullanıcı erişim logları (satın alınan ürünler)
DELETE FROM `user_accesses` WHERE 1=1;
ALTER TABLE `user_accesses` AUTO_INCREMENT = 1;

-- Sepet içeriği (varsa)
DELETE FROM `cart` WHERE 1=1;
ALTER TABLE `cart` AUTO_INCREMENT = 1;

-- Foreign key kontrollerini tekrar aç
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- TEMİZLEME TAMAMLANDI
-- ============================================
SELECT 'Temizleme işlemi tamamlandı!' AS mesaj;

