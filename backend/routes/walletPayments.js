import express from 'express';
import pool from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import paymentService from '../services/paymentService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Process card payment (Stripe/Iyzico)
router.post('/card', authenticate, async (req, res) => {
    try {
        const { amount, gateway, cardToken } = req.body;
        const userId = req.user.id;

        if (!amount || amount < 10) {
            return res.status(400).json({ error: 'Minimum payment amount is 10 TL' });
        }

        const referenceNumber = paymentService.generateReferenceNumber();
        const bonusAmount = paymentService.calculateBonus(amount);
        const totalAmount = amount + bonusAmount;

        const [result] = await pool.execute(
            `INSERT INTO payment_requests 
            (user_id, amount, bonus_amount, total_amount, payment_method, gateway, reference_number, status, metadata) 
            VALUES (?, ?, ?, ?, 'card', ?, ?, 'processing', ?)`,
            [userId, amount, bonusAmount, totalAmount, gateway || 'stripe', referenceNumber, JSON.stringify({ cardToken })]
        );

        const paymentRequestId = result.insertId;
        let paymentResult;

        // Önce settings'i yükle
        await paymentService.loadPaymentSettings();
        
        if (gateway === 'iyzico') {
            paymentResult = await paymentService.processIyzicoPayment(amount, { token: cardToken, cardNumber: req.body.cardNumber }, req.user);
        } else if (gateway === 'paypal') {
            paymentResult = await paymentService.processPayPalPayment(amount, 'TRY', { token: cardToken });
        } else {
            paymentResult = await paymentService.processStripePayment(amount, 'try', { cardNumber: req.body.cardNumber, cardToken }, { userId, paymentRequestId, referenceNumber });
        }

        const newStatus = paymentResult.success ? 'completed' : 'failed';
        await pool.execute(
            `UPDATE payment_requests SET status = ?, transaction_id = ?, response_data = ?, updated_at = NOW() WHERE id = ?`,
            [newStatus, paymentResult.transactionId, JSON.stringify(paymentResult), paymentRequestId]
        );

        if (paymentResult.success) {
            await pool.execute('UPDATE users SET balance = COALESCE(balance, 0) + ? WHERE id = ?', [totalAmount, userId]);
            await pool.execute(
                `INSERT INTO transactions (user_id, type, amount, status, description) 
                VALUES (?, 'deposit', ?, 'completed', ?)`,
                [userId, totalAmount, `Bakiye Yükleme (${gateway}) - Ref: ${referenceNumber}`]
            );
        }

        res.json({
            success: paymentResult.success,
            paymentRequestId,
            referenceNumber,
            amount,
            bonusAmount,
            totalAmount,
            clientSecret: paymentResult.clientSecret,
            transactionId: paymentResult.transactionId,
            message: paymentResult.message || (paymentResult.success ? 'Payment processed successfully' : 'Payment failed'),
            simulationMode: paymentResult.simulationMode
        });

    } catch (error) {
        console.error('Card payment error:', error);
        res.status(500).json({ error: 'Payment processing failed' });
    }
});

// Bank transfer - initiate
router.post('/bank-transfer/initiate', authenticate, async (req, res) => {
    try {
        const { amount } = req.body;
        const userId = req.user.id;

        if (!amount || amount < 10) {
            return res.status(400).json({ error: 'Minimum payment amount is 10 TL' });
        }

        const referenceNumber = paymentService.generateBankTransferReference(userId, amount);
        const bonusAmount = paymentService.calculateBonus(amount);
        const totalAmount = amount + bonusAmount;

        const [result] = await pool.execute(
            `INSERT INTO payment_requests (user_id, amount, bonus_amount, total_amount, payment_method, reference_number, status, metadata) 
            VALUES (?, ?, ?, ?, 'bank_transfer', ?, 'pending', ?)`,
            [userId, amount, bonusAmount, totalAmount, referenceNumber, JSON.stringify({ initiated: true })]
        );

        const bankAccounts = [
            { bankName: 'Ziraat Bankası', accountName: 'TeknoProjes A.Ş.', iban: 'TR33 0001 0000 0000 0000 0000 01', accountNumber: '12345678' },
            { bankName: 'Garanti BBVA', accountName: 'TeknoProjes A.Ş.', iban: 'TR33 0006 2000 0000 0000 0000 01', accountNumber: '87654321' }
        ];

        res.json({
            success: true,
            paymentRequestId: result.insertId,
            referenceNumber,
            amount,
            bonusAmount,
            totalAmount,
            bankAccounts,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });

    } catch (error) {
        console.error('Bank transfer initiation error:', error);
        res.status(500).json({ error: 'Failed to initiate bank transfer' });
    }
});

// Bank transfer - submit notification
router.post('/bank-transfer/notify', authenticate, async (req, res) => {
    try {
        const { paymentRequestId, senderName, bankName, receiptImage, notes, receiptNumber, referenceNumber } = req.body;
        const userId = req.user.id;

        const [requests] = await pool.execute(
            'SELECT * FROM payment_requests WHERE id = ? AND user_id = ? AND payment_method = "bank_transfer"',
            [paymentRequestId, userId]
        );

        if (requests.length === 0) {
            return res.status(404).json({ error: 'Payment request not found' });
        }

        // Base64 görseli dosyaya çevir ve kaydet
        let receiptFilePath = null;
        if (receiptImage && receiptImage.startsWith('data:image')) {
            try {
                // Base64 string'i parse et
                const matches = receiptImage.match(/^data:image\/(\w+);base64,(.+)$/);
                if (matches) {
                    const imageType = matches[1]; // jpeg, png, etc.
                    const base64Data = matches[2];
                    const buffer = Buffer.from(base64Data, 'base64');
                    
                    // Upload dizinini oluştur
                    const receiptsDir = path.join(__dirname, '..', 'public', 'uploads', 'receipts');
                    if (!fs.existsSync(receiptsDir)) {
                        fs.mkdirSync(receiptsDir, { recursive: true });
                    }
                    
                    // Dosya adı oluştur
                    const fileName = `receipt_${paymentRequestId}_${Date.now()}.${imageType}`;
                    receiptFilePath = path.join(receiptsDir, fileName);
                    
                    // Dosyayı kaydet
                    fs.writeFileSync(receiptFilePath, buffer);
                    
                    // Relative path oluştur
                    receiptFilePath = `/uploads/receipts/${fileName}`;
                }
            } catch (fileError) {
                console.error('File save error:', fileError);
                // Dosya kaydetme hatası durumunda devam et, sadece log'la
            }
        }

        // Tablo yapısını kontrol et ve uygun kolonları kullan
        try {
            // Önce mevcut kolonları kontrol et
            const [columns] = await pool.execute('DESCRIBE bank_transfer_notifications');
            const columnNames = columns.map(col => col.Field);
            
            // receipt_number yoksa otomatik oluştur
            const finalReceiptNumber = receiptNumber || `RECEIPT-${paymentRequestId}-${Date.now()}`;
            
            // order_id ve user_id kolonlarını kontrol et (bakiye yükleme için NULL olacak)
            // order_id kolonu varsa ama NULL olacaksa, foreign key constraint hatası olmaması için
            // kolonun NULL yapılabilir olup olmadığını kontrol et
            const hasOrderId = columnNames.includes('order_id');
            const hasUserId = columnNames.includes('user_id');
            
            // order_id kolonunun NULL yapılabilir olup olmadığını kontrol et
            let orderIdNullable = false;
            if (hasOrderId) {
                const orderIdColumn = columns.find(col => col.Field === 'order_id');
                orderIdNullable = orderIdColumn && (orderIdColumn.Null === 'YES' || orderIdColumn.Null === 'yes');
            }
            
            // Eski yapı (payment_request_id, sender_name, bank_name, receipt_image) veya yeni yapı (receipt_file) kontrolü
            if (columnNames.includes('receipt_file')) {
                // Yeni yapı: receipt_file kullan
                let insertColumns = ['payment_request_id', 'sender_name', 'bank_name', 'receipt_file', 'notes'];
                let insertValues = [paymentRequestId, senderName, bankName, receiptFilePath || receiptImage, notes];
                
                // order_id ve user_id kolonları varsa NULL olarak ekle
                // order_id sadece NULL yapılabilirse ekle (foreign key constraint hatası olmaması için)
                if (hasOrderId && orderIdNullable) {
                    insertColumns.push('order_id');
                    insertValues.push(null);
                }
                if (hasUserId) {
                    insertColumns.push('user_id');
                    insertValues.push(userId);
                }
                
                // receipt_number kolonu varsa ekle
                if (columnNames.includes('receipt_number')) {
                    insertColumns.push('receipt_number');
                    insertValues.push(finalReceiptNumber);
                }
                
                // reference_number kolonu varsa ekle
                if (columnNames.includes('reference_number')) {
                    insertColumns.push('reference_number');
                    insertValues.push(referenceNumber || null);
                }
                
                // status kolonu varsa ekle
                if (columnNames.includes('status')) {
                    insertColumns.push('status');
                    insertValues.push('pending');
                }
                
                const placeholders = insertValues.map(() => '?').join(', ');
                const insertQuery = `INSERT INTO bank_transfer_notifications (${insertColumns.join(', ')}) VALUES (${placeholders})`;
                console.log('Insert query:', insertQuery);
                console.log('Insert values:', insertValues);
                await pool.execute(insertQuery, insertValues);
            } else if (columnNames.includes('receipt_image')) {
                // Eski yapı: receipt_image kullan
                let insertColumns = ['payment_request_id', 'sender_name', 'bank_name', 'receipt_image', 'notes'];
                let insertValues = [paymentRequestId, senderName, bankName, receiptFilePath || receiptImage, notes];
                
                // order_id ve user_id kolonları varsa NULL olarak ekle
                // order_id sadece NULL yapılabilirse ekle (foreign key constraint hatası olmaması için)
                if (hasOrderId && orderIdNullable) {
                    insertColumns.push('order_id');
                    insertValues.push(null);
                }
                if (hasUserId) {
                    insertColumns.push('user_id');
                    insertValues.push(userId);
                }
                
                // receipt_number kolonu varsa ekle
                if (columnNames.includes('receipt_number')) {
                    insertColumns.push('receipt_number');
                    insertValues.push(finalReceiptNumber);
                }
                
                const placeholders = insertValues.map(() => '?').join(', ');
                const insertQuery = `INSERT INTO bank_transfer_notifications (${insertColumns.join(', ')}) VALUES (${placeholders})`;
                console.log('Insert query:', insertQuery);
                console.log('Insert values:', insertValues);
                await pool.execute(insertQuery, insertValues);
            } else {
                // Hiçbiri yoksa sadece temel alanları kullan
                let insertColumns = ['payment_request_id', 'sender_name', 'bank_name', 'notes'];
                let insertValues = [paymentRequestId, senderName, bankName, notes];
                
                // order_id ve user_id kolonları varsa NULL olarak ekle
                // order_id sadece NULL yapılabilirse ekle (foreign key constraint hatası olmaması için)
                if (hasOrderId && orderIdNullable) {
                    insertColumns.push('order_id');
                    insertValues.push(null);
                }
                if (hasUserId) {
                    insertColumns.push('user_id');
                    insertValues.push(userId);
                }
                
                const placeholders = insertValues.map(() => '?').join(', ');
                const insertQuery = `INSERT INTO bank_transfer_notifications (${insertColumns.join(', ')}) VALUES (${placeholders})`;
                console.log('Insert query:', insertQuery);
                console.log('Insert values:', insertValues);
                await pool.execute(insertQuery, insertValues);
            }
        } catch (insertError) {
            console.error('Insert error - Full details:');
            console.error('Error message:', insertError.message);
            console.error('SQL Message:', insertError.sqlMessage);
            console.error('Error code:', insertError.code);
            console.error('Error stack:', insertError.stack);
            
            // Foreign key constraint hatası ise özel mesaj
            if (insertError.code === 'ER_NO_REFERENCED_ROW_2' || insertError.message.includes('foreign key constraint')) {
                console.error('Foreign key constraint hatası tespit edildi. order_id NULL olmalı ama constraint bunu engelliyor.');
                console.error('Çözüm: backend/scripts/fix-order-id-constraint.js scriptini çalıştırın.');
            }
            
            throw insertError;
        }

        await pool.execute('UPDATE payment_requests SET status = "pending_approval", updated_at = NOW() WHERE id = ?', [paymentRequestId]);

        res.json({
            success: true,
            message: 'Bank transfer notification submitted. Awaiting admin approval.',
            status: 'pending_approval'
        });

    } catch (error) {
        console.error('Bank transfer notification error:', error);
        console.error('Error stack:', error.stack);
        console.error('Error message:', error.message);
        console.error('SQL Message:', error.sqlMessage);
        console.error('Error code:', error.code);
        console.error('Request body:', {
            paymentRequestId,
            senderName,
            bankName,
            hasReceiptImage: !!receiptImage,
            receiptImageLength: receiptImage ? receiptImage.length : 0,
            notes,
            receiptNumber,
            referenceNumber
        });
        
        res.status(500).json({ 
            error: 'Failed to submit notification',
            details: error.message,
            sqlMessage: error.sqlMessage || null,
            code: error.code || null
        });
    }
});

// Mobile payment (Google Pay / Apple Pay)
router.post('/mobile', authenticate, async (req, res) => {
    try {
        const { amount, paymentMethod, token } = req.body;
        const userId = req.user.id;

        if (!amount || amount < 10) {
            return res.status(400).json({ error: 'Minimum payment amount is 10 TL' });
        }

        if (!['google_pay', 'apple_pay'].includes(paymentMethod)) {
            return res.status(400).json({ error: 'Invalid payment method' });
        }

        const referenceNumber = paymentService.generateReferenceNumber();
        const bonusAmount = paymentService.calculateBonus(amount);
        const totalAmount = amount + bonusAmount;

        const [result] = await pool.execute(
            `INSERT INTO payment_requests (user_id, amount, bonus_amount, total_amount, payment_method, gateway, reference_number, status, metadata) 
            VALUES (?, ?, ?, ?, 'mobile', ?, ?, 'processing', ?)`,
            [userId, amount, bonusAmount, totalAmount, paymentMethod, referenceNumber, JSON.stringify({ token })]
        );

        const paymentRequestId = result.insertId;
        const paymentResult = await paymentService.processMobilePayment(amount, paymentMethod, token);

        const newStatus = paymentResult.success ? 'completed' : 'failed';
        await pool.execute(
            `UPDATE payment_requests SET status = ?, transaction_id = ?, response_data = ?, updated_at = NOW() WHERE id = ?`,
            [newStatus, paymentResult.transactionId, JSON.stringify(paymentResult), paymentRequestId]
        );

        if (paymentResult.success) {
            await pool.execute('UPDATE users SET balance = COALESCE(balance, 0) + ? WHERE id = ?', [totalAmount, userId]);
            await pool.execute(
                `INSERT INTO transactions (user_id, type, amount, status, description) 
                VALUES (?, 'deposit', ?, 'completed', ?)`,
                [userId, totalAmount, `Bakiye Yükleme (${paymentMethod}) - Ref: ${referenceNumber}`]
            );
        }

        res.json({
            success: paymentResult.success,
            paymentRequestId,
            referenceNumber,
            amount,
            bonusAmount,
            totalAmount,
            message: paymentResult.message,
            error: paymentResult.error,
            simulationMode: paymentResult.simulationMode
        });

    } catch (error) {
        console.error('Mobile payment error:', error);
        res.status(500).json({ error: 'Mobile payment processing failed' });
    }
});

// Get payment status
router.get('/:id/status', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const [requests] = await pool.execute('SELECT * FROM payment_requests WHERE id = ? AND user_id = ?', [id, userId]);

        if (requests.length === 0) {
            return res.status(404).json({ error: 'Payment request not found' });
        }

        res.json(requests[0]);

    } catch (error) {
        console.error('Payment status error:', error);
        res.status(500).json({ error: 'Failed to get payment status' });
    }
});

export default router;
