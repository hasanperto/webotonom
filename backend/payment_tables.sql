-- Payment System Database Tables

-- Payment requests table
CREATE TABLE IF NOT EXISTS payment_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    bonus_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method ENUM('card', 'bank_transfer', 'mobile') NOT NULL,
    gateway VARCHAR(50), -- stripe, iyzico, google_pay, apple_pay
    status ENUM('pending', 'processing', 'completed', 'failed', 'cancelled', 'pending_approval') DEFAULT 'pending',
    reference_number VARCHAR(100) UNIQUE,
    transaction_id VARCHAR(200),
    metadata JSON,
    response_data JSON,
    user_note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_reference (reference_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bank transfer notifications table
CREATE TABLE IF NOT EXISTS bank_transfer_notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    payment_request_id INT NOT NULL,
    sender_name VARCHAR(200) NOT NULL,
    bank_name VARCHAR(100),
    receipt_image VARCHAR(500),
    notes TEXT,
    admin_notes TEXT,
    reviewed_by INT,
    reviewed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payment_request_id) REFERENCES payment_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_payment_request (payment_request_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
