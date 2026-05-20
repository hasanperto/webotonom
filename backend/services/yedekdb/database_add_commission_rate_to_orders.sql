-- orders tablosuna commission_rate kolonu ekle
-- MySQL'de IF NOT EXISTS desteklenmediği için, önce kolonun varlığını kontrol edin
-- Eğer kolon zaten varsa bu sorguyu çalıştırmayın

-- Kolon kontrolü için (manuel kontrol gerekli):
-- SHOW COLUMNS FROM `orders` LIKE 'commission_rate';

-- Kolon yoksa çalıştırın:
ALTER TABLE `orders` 
ADD COLUMN `commission_rate` DECIMAL(5,2) DEFAULT NULL COMMENT 'Sipariş oluşturulduğundaki komisyon oranı (%)' 
AFTER `coupon_code`;

-- Eski siparişler için varsayılan değer atama (opsiyonel - sadece NULL olanlar için)
-- UPDATE orders SET commission_rate = 15 WHERE commission_rate IS NULL;

