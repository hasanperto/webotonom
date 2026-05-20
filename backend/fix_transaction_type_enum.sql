-- Fix transactions table type column to allow 'deposit' and 'tax'
-- Check current ENUM values
SHOW COLUMNS FROM transactions LIKE 'type';

-- If type is ENUM, alter it to include 'deposit' and 'tax'
ALTER TABLE transactions 
MODIFY COLUMN type ENUM('purchase', 'sale', 'commission', 'payout', 'refund', 'donation', 'deposit', 'tax') DEFAULT NULL;

-- Update existing blank types to 'deposit' based on description
UPDATE transactions 
SET type = 'deposit' 
WHERE (type IS NULL OR type = '') 
AND description LIKE '%Bakiye Yükleme%';
