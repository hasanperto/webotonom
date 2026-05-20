import express from 'express';
import pool from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Kullanıcı profil bilgileri
router.get('/profile', authenticate, async (req, res) => {
    try {
        const [users] = await pool.execute(
            'SELECT u.*, ur.name as role_name FROM users u LEFT JOIN user_roles ur ON u.role_id = ur.id WHERE u.id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
        }

        const user = users[0];
        delete user.password;

        res.json({ user });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Kullanıcı istatistikleri
// Kullanıcı istatistikleri
router.get('/stats', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;

        // Siparişler - Toplam ve Durum Bazlı
        const [orderStats] = await pool.execute(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN order_status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN order_status = 'processing' THEN 1 ELSE 0 END) as processing,
                SUM(CASE WHEN order_status = 'completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN order_status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
            FROM orders WHERE user_id = ?
        `, [userId]);

        const [favorites] = await pool.execute('SELECT COUNT(*) as total FROM favorites WHERE user_id = ?', [userId]);

        // Okunmamış mesaj sayısı
        const [messages] = await pool.execute(
            `SELECT COUNT(*) as total 
             FROM messages 
             WHERE receiver_id = ? 
               AND is_read = 0 
               AND (is_deleted_receiver = 0 OR is_deleted_receiver IS NULL)`,
            [userId]
        );

        // Bağışlar - Toplam ve Durum Bazlı
        // Bağışlar - Toplam ve Durum Bazlı
        const [donationStats] = await pool.execute(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
            FROM project_donations WHERE user_id = ?
        `, [userId]);

        // Destek Talepleri - Toplam ve Durum Bazlı
        const [ticketStats] = await pool.execute(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open,
                SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN status IN ('resolved', 'closed') THEN 1 ELSE 0 END) as resolved
            FROM tickets WHERE user_id = ?
        `, [userId]);

        // Kullanıcı bakiyesini getir
        let balance = 0;
        try {
            const [userData] = await pool.execute('SELECT balance FROM users WHERE id = ?', [userId]);
            if (userData.length > 0 && userData[0].balance !== null && userData[0].balance !== undefined) {
                balance = parseFloat(userData[0].balance || 0);
            }
        } catch (balanceError) {
            console.warn('Balance fetch error (column may not exist):', balanceError.message);
            balance = 0;
        }

        res.json({
            orders: orderStats[0].total,
            orders_details: {
                pending: parseInt(orderStats[0].pending || 0),
                processing: parseInt(orderStats[0].processing || 0),
                completed: parseInt(orderStats[0].completed || 0),
                cancelled: parseInt(orderStats[0].cancelled || 0)
            },
            favorites: favorites[0].total,
            unread_messages: messages[0].total,
            donations: donationStats[0].total,
            donations_details: {
                pending: parseInt(donationStats[0].pending || 0),
                completed: parseInt(donationStats[0].completed || 0),
                failed: parseInt(donationStats[0].failed || 0)
            },
            tickets: ticketStats[0].total,
            tickets_details: {
                open: parseInt(ticketStats[0].open || 0),
                in_progress: parseInt(ticketStats[0].in_progress || 0),
                resolved: parseInt(ticketStats[0].resolved || 0)
            },
            balance: balance,
            downloads: 0
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Siparişler
router.get('/orders', authenticate, async (req, res) => {
    try {
        const [orders] = await pool.execute(
            `SELECT o.*, GROUP_CONCAT(p.title) as project_titles
             FROM orders o
             LEFT JOIN order_items oi ON o.id = oi.order_id
             LEFT JOIN projects p ON oi.project_id = p.id
             WHERE o.user_id = ?
             GROUP BY o.id
             ORDER BY o.created_at DESC`,
            [req.user.id]
        );

        res.json({ orders });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Favoriler
router.get('/favorites', authenticate, async (req, res) => {
    try {
        const lang = req.query.lang || 'tr';

        const [favorites] = await pool.execute(
            `SELECT p.*, u.username, c.name as category_name,
             COALESCE(ct.title, p.title) as title,
             COALESCE(ct.short_description, p.short_description) as short_description,
             (SELECT image_path FROM project_images WHERE project_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
             FROM favorites f
             INNER JOIN projects p ON f.project_id = p.id
             LEFT JOIN users u ON p.user_id = u.id
             LEFT JOIN categories c ON p.category_id = c.id
             LEFT JOIN content_translations ct ON ct.content_id = p.id 
                 AND ct.content_type = 'project' 
                 AND ct.language_code = ?
             WHERE f.user_id = ?
             ORDER BY f.created_at DESC`,
            [lang, req.user.id]
        );

        // URL'leri düzelt
        favorites.forEach(fav => {
            if (fav.primary_image) {
                fav.primary_image = `/uploads/${fav.primary_image}`;
            }
        });

        res.json({ favorites });
    } catch (error) {
        console.error('Get favorites error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Favori ekle/çıkar
router.post('/favorites/:projectId', authenticate, async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.user.id;

        // Favori kontrolü
        const [existing] = await pool.execute(
            'SELECT id FROM favorites WHERE user_id = ? AND project_id = ?',
            [userId, projectId]
        );

        if (existing.length > 0) {
            // Favoriden çıkar
            await pool.execute('DELETE FROM favorites WHERE user_id = ? AND project_id = ?', [userId, projectId]);
            res.json({ message: 'Favorilerden çıkarıldı', is_favorite: false });
        } else {
            // Favoriye ekle
            await pool.execute('INSERT INTO favorites (user_id, project_id) VALUES (?, ?)', [userId, projectId]);
            res.json({ message: 'Favorilere eklendi', is_favorite: true });
        }
    } catch (error) {
        console.error('Toggle favorite error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// İşlemler (Transactions) ve Bağışlar
router.get('/transactions', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { type, status, limit, offset } = req.query;

        // Base Query wrapping UNION
        let query = `
            SELECT * FROM (
                SELECT 
                    t.id as id,
                    t.user_id,
                    t.type,
                    t.amount,
                    t.status,
                    t.created_at,
                    t.description,
                    t.transaction_id,
                    t.payment_method,
                    o.id as order_id,
                    o.order_number,
                    GROUP_CONCAT(DISTINCT p.title) as project_titles
                FROM transactions t
                LEFT JOIN orders o ON t.order_id = o.id
                LEFT JOIN order_items oi ON o.id = oi.order_id
                LEFT JOIN projects p ON oi.project_id = p.id
                WHERE t.user_id = ?
        `;

        const params = [userId];

        // Filter Transactions
        if (type && type !== 'all') {
            if (type === 'donation') {
                // If looking for donations, usually transactions table doesn't have them (unless legacy).
                // We can allow it to return nothing or filter strictly.
                // Let's allow it just in case.
                query += ' AND t.type = ?';
                params.push(type);
            } else {
                query += ' AND t.type = ?';
                params.push(type);
            }
        }
        if (status && status !== 'all') {
            query += ' AND t.status = ?';
            params.push(status);
        }

        query += ` GROUP BY t.id 
                   UNION ALL
                   SELECT 
                       (pd.id * -1) as id, -- Negative ID for donations to avoid collision
                       pd.user_id,
                       'donation' as type,
                       pd.amount,
                       pd.status,
                       pd.created_at,
                       pd.message as description,
                       pd.transaction_id,
                       pd.payment_method,
                       NULL as order_id,
                       NULL as order_number,
                       pr.title as project_titles
                   FROM project_donations pd
                   LEFT JOIN projects pr ON pd.project_id = pr.id
                   WHERE pd.user_id = ?
        `;

        params.push(userId);

        // Filter Donations
        if (type && type !== 'all') {
            if (type !== 'donation') {
                // User wants specific type that IS NOT donation, so filter out all donations
                query += ' AND 1=0';
            }
            // If type IS donation, no extra filter needed (since all here are donations)
        }
        if (status && status !== 'all') {
            query += ' AND pd.status = ?';
            params.push(status);
        }

        query += ` ) combined_results ORDER BY created_at DESC`;

        // Limit and Offset
        if (limit) {
            query += ' LIMIT ?';
            params.push(parseInt(limit));
            if (offset) {
                query += ' OFFSET ?';
                params.push(parseInt(offset));
            }
        }

        const [transactions] = await pool.execute(query, params);

        // İstatistikleri hesapla (Hem transactions hem project_donations)
        const [stats] = await pool.execute(
            `SELECT 
                (SELECT COUNT(*) FROM transactions WHERE user_id = ?) + 
                (SELECT COUNT(*) FROM project_donations WHERE user_id = ?) as total,
                
                (SELECT COALESCE(SUM(amount), 0) FROM transactions 
                 WHERE user_id = ? AND type = 'purchase' AND status = 'completed') as total_spent,
                
                (SELECT COALESCE(SUM(amount), 0) FROM transactions 
                 WHERE user_id = ? AND type IN ('deposit', 'sale', 'commission', 'payout', 'refund') AND status = 'completed') as total_earned,
                
                (SELECT COALESCE(SUM(amount), 0) FROM project_donations 
                 WHERE user_id = ? AND status = 'completed') as total_donated
            `,
            [userId, userId, userId, userId, userId]
        );

        res.json({
            transactions,
            stats: stats[0] || {
                total: 0,
                total_spent: 0,
                total_earned: 0,
                total_donated: 0
            }
        });
    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Mesajlar - Konuşmaları getir
router.get('/messages', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;

        // Kullanıcının gönderdiği veya aldığı mesajları grupla (konuşmalar)
        const [conversations] = await pool.execute(
            `SELECT 
                CASE 
                    WHEN m.sender_id = ? THEN m.receiver_id 
                    ELSE m.sender_id 
                END as other_user_id,
                u.username as other_user_name,
                u.email as other_user_email,
                MAX(m.created_at) as last_message_time
             FROM messages m
             INNER JOIN users u ON (
                 CASE 
                     WHEN m.sender_id = ? THEN u.id = m.receiver_id 
                     ELSE u.id = m.sender_id 
                 END
             )
             WHERE (m.sender_id = ? OR m.receiver_id = ?)
               AND (m.is_deleted_sender = 0 OR m.sender_id != ?)
               AND (m.is_deleted_receiver = 0 OR m.receiver_id != ?)
             GROUP BY other_user_id, u.username, u.email
             ORDER BY last_message_time DESC`,
            [userId, userId, userId, userId, userId, userId]
        );

        // Her konuşma için son mesajı ve okunmamış sayısını getir
        for (let conv of conversations) {
            // Son mesaj
            const [lastMsg] = await pool.execute(
                `SELECT message FROM messages 
                 WHERE ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))
                   AND (is_deleted_sender = 0 OR sender_id != ?)
                   AND (is_deleted_receiver = 0 OR receiver_id != ?)
                 ORDER BY created_at DESC LIMIT 1`,
                [userId, conv.other_user_id, conv.other_user_id, userId, userId, userId]
            );
            conv.last_message = lastMsg[0]?.message || null;

            // Okunmamış mesaj sayısı
            const [unread] = await pool.execute(
                `SELECT COUNT(*) as count FROM messages 
                 WHERE receiver_id = ? AND sender_id = ? AND is_read = 0 AND is_deleted_receiver = 0`,
                [userId, conv.other_user_id]
            );
            conv.unread_count = unread[0]?.count || 0;
        }

        // Her konuşma için mesajları getir
        for (let conv of conversations) {
            const [messages] = await pool.execute(
                `SELECT m.*, 
                        u_sender.username as sender_name,
                        u_receiver.username as receiver_name,
                        CASE WHEN m.sender_id = ? THEN 1 ELSE 0 END as is_sender
                 FROM messages m
                 LEFT JOIN users u_sender ON m.sender_id = u_sender.id
                 LEFT JOIN users u_receiver ON m.receiver_id = u_receiver.id
                 WHERE ((m.sender_id = ? AND m.receiver_id = ?) 
                    OR (m.sender_id = ? AND m.receiver_id = ?))
                   AND (m.is_deleted_sender = 0 OR m.sender_id != ?)
                   AND (m.is_deleted_receiver = 0 OR m.receiver_id != ?)
                 ORDER BY m.created_at ASC`,
                [userId, userId, conv.other_user_id, conv.other_user_id, userId, userId, userId]
            );
            conv.messages = messages;
        }

        res.json({ conversations });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Mesaj gönder
router.post('/messages', authenticate, async (req, res) => {
    try {
        const { receiver_id, message, subject } = req.body;
        const senderId = req.user.id;

        if (!receiver_id || !message) {
            return res.status(400).json({ error: 'Alıcı ve mesaj gereklidir' });
        }

        // Alıcı kontrolü
        const [receiver] = await pool.execute('SELECT id FROM users WHERE id = ?', [receiver_id]);
        if (receiver.length === 0) {
            return res.status(404).json({ error: 'Alıcı bulunamadı' });
        }

        // Mesaj gönder
        const [result] = await pool.execute(
            `INSERT INTO messages (sender_id, receiver_id, subject, message, is_read, is_deleted_sender, is_deleted_receiver) 
             VALUES (?, ?, ?, ?, 0, 0, 0)`,
            [senderId, receiver_id, subject || null, message]
        );

        console.log(`Message sent: ID=${result.insertId}, From=${senderId}, To=${receiver_id}`);

        res.json({
            message: 'Mesaj gönderildi',
            message_id: result.insertId
        });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Mesajları okundu olarak işaretle
router.put('/messages/:conversationId/read', authenticate, async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user.id;

        await pool.execute(
            `UPDATE messages 
             SET is_read = 1, read_at = NOW() 
             WHERE receiver_id = ? 
               AND sender_id = ? 
               AND is_read = 0`,
            [userId, conversationId]
        );

        res.json({ message: 'Mesajlar okundu olarak işaretlendi' });
    } catch (error) {
        console.error('Mark messages read error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Kullanıcının bekleyen ödeme taleplerini getir
// ÖNEMLİ: Bu route /:id'den ÖNCE tanımlanmalı, aksi halde "payment-requests" bir ID olarak algılanır
router.get('/payment-requests', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;

        const [requests] = await pool.execute(
            `SELECT pr.*, 
                    btn.sender_name, btn.bank_name, btn.created_at as notification_date
             FROM payment_requests pr
             LEFT JOIN bank_transfer_notifications btn ON pr.id = btn.payment_request_id
             WHERE pr.user_id = ?
             ORDER BY pr.created_at DESC
             LIMIT 20`,
            [userId]
        );

        res.json({ payment_requests: requests });
    } catch (error) {
        console.error('Get payment requests error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Payment request notu güncelle
router.put('/payment-requests/:id/note', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { note } = req.body;
        const userId = req.user.id;

        console.log(`[UPDATE NOTE] ID: ${id}, Note: ${note}, UserID: ${userId}`);

        // Verify this payment request belongs to the user
        const [requests] = await pool.execute(
            'SELECT id FROM payment_requests WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (requests.length === 0) {
            console.log(`[UPDATE NOTE] ERROR: Payment request not found for user. ID: ${id}`);
            return res.status(404).json({ error: 'Ödeme talebi bulunamadı' });
        }

        // Update the note
        await pool.execute(
            'UPDATE payment_requests SET user_note = ? WHERE id = ?',
            [note || null, id]
        );

        console.log(`[UPDATE NOTE] SUCCESS: Note updated for ID: ${id}`);

        res.json({ success: true, message: 'Not güncellendi' });
    } catch (error) {
        console.error('[UPDATE NOTE] SERVER ERROR:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Sadakat Programı Durumu
router.get('/loyalty/status', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;

        // Kullanıcı puanını getir
        const [users] = await pool.execute('SELECT loyalty_points FROM users WHERE id = ?', [userId]);
        const points = users[0]?.loyalty_points || 0;

        // Aktif ödülleri getir
        const [rewards] = await pool.execute('SELECT * FROM loyalty_rewards WHERE is_active = 1 ORDER BY required_points ASC');

        // Sonraki ödülü bul
        let nextReward = null;
        for (const reward of rewards) {
            if (reward.required_points > points) {
                nextReward = reward;
                break;
            }
        }

        // Eğer tüm ödüller kazanılmışsa veya hiç ödül yoksa
        if (!nextReward && rewards.length > 0) {
            nextReward = rewards[rewards.length - 1];
        }

        res.json({
            current_points: points,
            next_reward: nextReward,
            all_rewards: rewards
        });
    } catch (error) {
        // Tablo yoksa
        if (error.code === 'ER_NO_SUCH_TABLE' || (error.code === 'ER_BAD_FIELD_ERROR' && error.sqlMessage.includes('loyalty_points'))) {
            return res.json({
                current_points: 0,
                next_reward: null,
                all_rewards: []
            });
        }
        console.error('Get loyalty status error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Kullanıcı bilgisi getir (ID ile) - EN SONDA olmalı çünkü /:id genel bir route
router.get('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const [users] = await pool.execute(
            'SELECT id, username, email, created_at FROM users WHERE id = ?',
            [id]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
        }

        const user = users[0];
        res.json({ user });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

export default router;

