-- Add missing columns to transactions table for wallet payments
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT NULL AFTER payment_gateway,
ADD COLUMN IF NOT EXISTS reference_number VARCHAR(100) DEFAULT NULL AFTER payment_method;

-- Add index for reference_number
ALTER TABLE transactions 
ADD INDEX IF NOT EXISTS idx_reference_number (reference_number);
