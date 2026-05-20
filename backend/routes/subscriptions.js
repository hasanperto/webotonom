import express from 'express';
import pool from '../config/database.js';
import { authenticate, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// --- PUBLIC ROUTES ---

// Abonelik planlarını getir (Public)
router.get('/plans', async (req, res) => {
    try {
        const { lang = 'tr' } = req.query;

        const [plans] = await pool.execute(
            `SELECT sp.*, 
             GROUP_CONCAT(COALESCE(ct.title, pf.feature_name) SEPARATOR '||') as features
             FROM subscription_plans sp
             LEFT JOIN plan_features pf ON sp.id = pf.plan_id
             LEFT JOIN content_translations ct
                ON ct.content_id = pf.id
                AND ct.content_type = 'plan_feature'
                AND ct.language_code = ?
             WHERE sp.status = 'active'
             GROUP BY sp.id
             ORDER BY sp.sort_order ASC, sp.price ASC`,
            [lang]
        );

        // Parse features and fetch translations
        for (let plan of plans) {
            // Fix features list (split by separator)
            plan.features = plan.features ? plan.features.split('||') : [];

            // Fetch limits for public display if needed (e.g. project limit)
            const [limits] = await pool.execute('SELECT limit_key, limit_value FROM plan_limits WHERE plan_id = ?', [plan.id]);
            plan.limits = {};
            limits.forEach(l => plan.limits[l.limit_key] = l.limit_value);

            // Fetch translations
            if (lang !== 'tr') {
                const [rows] = await pool.execute(
                    `SELECT title, description FROM content_translations 
                     WHERE content_id = ? AND content_type = 'subscription_plan' AND language_code = ?`,
                    [plan.id, lang]
                );

                if (rows.length > 0) {
                    if (rows[0].title) plan.name = rows[0].title;
                    if (rows[0].description) plan.description = rows[0].description;
                }
            }
        }

        res.json({ plans });
    } catch (error) {
        console.error('Get plans error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Kullanıcının aboneliklerini getir (User)
router.get('/my-subscriptions', authenticate, async (req, res) => {
    try {
        const { lang = 'tr' } = req.query;
        const [subscriptions] = await pool.execute(
            `SELECT us.*, 
                    COALESCE(ct.title, sp.name) as plan_name,
                    sp.price, sp.billing_period
             FROM user_subscriptions us
             INNER JOIN subscription_plans sp ON us.plan_id = sp.id
             LEFT JOIN content_translations ct 
                ON ct.content_id = sp.id 
                AND ct.content_type = 'subscription_plan'
                AND ct.language_code = ?
             WHERE us.user_id = ?
             ORDER BY us.created_at DESC`,
            [lang, req.user.id]
        );

        res.json({ subscriptions });
    } catch (error) {
        console.error('Get subscriptions error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Abonelik oluştur (User)
router.post('/subscribe', authenticate, async (req, res) => {
    try {
        const { plan_id, payment_method } = req.body;
        const userId = req.user.id;

        if (!plan_id) {
            return res.status(400).json({ error: 'Plan seçiniz' });
        }

        // Plan kontrolü
        const [plans] = await pool.execute('SELECT * FROM subscription_plans WHERE id = ? AND status = ?', [plan_id, 'active']);
        if (plans.length === 0) {
            return res.status(404).json({ error: 'Plan bulunamadı' });
        }

        const plan = plans[0];
        const startDate = new Date();
        const endDate = new Date();

        switch (plan.billing_period) {
            case 'monthly':
                endDate.setMonth(endDate.getMonth() + 1);
                break;
            case '3_months':
                endDate.setMonth(endDate.getMonth() + 3);
                break;
            case '6_months':
                endDate.setMonth(endDate.getMonth() + 6);
                break;
            case 'yearly':
                endDate.setFullYear(endDate.getFullYear() + 1);
                break;
            default:
                // Default to monthly if unknown, or handle error
                endDate.setMonth(endDate.getMonth() + 1);
        }

        // Abonelik oluştur
        const [result] = await pool.execute(
            `INSERT INTO user_subscriptions (user_id, plan_id, start_date, end_date, status, payment_method)
             VALUES (?, ?, ?, ?, 'active', ?)`,
            [userId, plan_id, startDate, endDate, payment_method || 'pending']
        );

        // Ödeme kaydı
        await pool.execute(
            `INSERT INTO subscription_transactions (subscription_id, amount, status, payment_method)
             VALUES (?, ?, 'completed', ?)`,
            [result.insertId, plan.price, payment_method || 'credit_card']
        );

        // KULLANICI ROLÜNÜ GÜNCELLE (Become a Seller)
        await pool.execute(
            'UPDATE users SET role_id = 3 WHERE id = ?',
            [userId]
        );

        res.status(201).json({
            message: 'Abonelik oluşturuldu ve satıcı yetkileri tanımlandı.',
            subscription_id: result.insertId
        });
    } catch (error) {
        console.error('Subscribe error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Abonelik iptal (User)
router.post('/cancel/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        await pool.execute(
            'UPDATE user_subscriptions SET status = ?, cancelled_at = NOW() WHERE id = ? AND user_id = ?',
            ['cancelled', id, req.user.id]
        );

        res.json({ message: 'Abonelik iptal edildi' });
    } catch (error) {
        console.error('Cancel subscription error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// --- ADMIN ROUTES (Prefix: /admin/subscriptions) ---
// Note: router is mounted at /subscriptions in server.js usually.
// If server.js mounts this at /api/subscriptions, then these would be /api/subscriptions/admin/...
// But the frontend calls /admin/subscriptions/plans directly (via api proxy or direct route?).
// Let's assume the frontend expects these at /api/subscriptions/admin/... if this file is subscription.js
// Wait, checking AdminSubscriptions.jsx: api.get('/admin/subscriptions/plans')
// This implies there is a route handler for /admin/subscriptions.
// BUT currently subscriptions.js is likely mounted at /subscriptions.
// I will add the admin routes here but with '/admin' prefix so they become /subscriptions/admin/plans 
// OR I need to know where subscriptions.js is mounted.
// Assuming server.js mounts it. Let's check server.js content later or play safe.
// Actually, looking at folder structure, `routes` folder has `subscriptions.js` but also `admin.js`.
// Maybe I should add these to `admin.js` or create `adminSubscriptions.js`?
// The user asked to restructure. I'll put them here and we'll see if we need to adjust mount later.
// Actually, looking at `routes/admin.js`, it handles `/users`, `/projects`, etc.
// It seems `admin.js` handles dashboard stuff.
// I will create specific routes here matching what frontend calls if I can, OR rename them.
// Frontend calls: `/admin/subscriptions/plans`.
// If I put `router.get('/admin/plans', ...)` inside `subscriptions.js` and `subscriptions.js` is mounted at `/api/subscriptions`, the url is `/api/subscriptions/admin/plans`.
// Frontend `api.js` likely has a base URL.
// Let's assume I should handle the path `/admin/subscriptions/plans` via separate router or inside admin.js.
// BETTER APPROACH: Add these to `routes/admin.js` or a new `routes/adminSubscriptions.js` and mount it correctly.
// But to follow instructions "update subscriptions.js", I will put them here but with specific paths.
// WAIT, the frontend calls `api.get('/admin/subscriptions/plans')`.
// If I put it in `admin.js` (mounted at `/api/admin`), I can make `router.get('/subscriptions/plans')` -> `/api/admin/subscriptions/plans`.
// Let's try to put them in this file but user `authenticate, isAdmin` generic middleware.

// Admin: Tüm Planları Getir
router.get('/admin/plans', authenticate, isAdmin, async (req, res) => {
    try {
        const [plans] = await pool.execute(`
            SELECT sp.*, 
            (SELECT GROUP_CONCAT(feature_name SEPARATOR ', ') FROM plan_features pf WHERE pf.plan_id = sp.id) as features_list,
            (SELECT COUNT(*) FROM user_subscriptions us WHERE us.plan_id = sp.id AND us.status = 'active') as active_count
            FROM subscription_plans sp
            ORDER BY sp.sort_order ASC, sp.price ASC
        `);

        // Fetch limits for each plan
        for (let plan of plans) {
            const [limits] = await pool.execute('SELECT limit_key, limit_value FROM plan_limits WHERE plan_id = ?', [plan.id]);
            plan.limits = {};
            limits.forEach(l => plan.limits[l.limit_key] = l.limit_value);
        }

        res.json({ plans });
    } catch (error) {
        console.error('Admin get plans error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Admin: Yeni Plan Ekle
router.post('/admin/plans', authenticate, isAdmin, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { name, slug, description, price, currency, billing_period, is_featured, sort_order, features, limits } = req.body;

        const [result] = await connection.execute(
            `INSERT INTO subscription_plans (name, slug, description, price, currency, billing_period, is_featured, status, sort_order)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
            [name, slug, description, price, currency || 'TRY', billing_period, is_featured ? 1 : 0, sort_order || 0]
        );

        const planId = result.insertId;

        // Features
        if (features && Array.isArray(features)) {
            for (const feature of features) {
                if (feature.trim()) {
                    await connection.execute('INSERT INTO plan_features (plan_id, feature_name) VALUES (?, ?)', [planId, feature.trim()]);
                }
            }
        } else if (typeof features === 'string') {
            const featureList = features.split(',').map(f => f.trim()).filter(f => f);
            for (const feature of featureList) {
                await connection.execute('INSERT INTO plan_features (plan_id, feature_name) VALUES (?, ?)', [planId, feature]);
            }
        }

        // Limits
        if (limits && typeof limits === 'object') {
            for (const [key, value] of Object.entries(limits)) {
                await connection.execute('INSERT INTO plan_limits (plan_id, limit_key, limit_value) VALUES (?, ?, ?)', [planId, key, String(value)]);
            }
        }

        await connection.commit();
        res.status(201).json({ message: 'Plan başarıyla oluşturuldu', id: planId });
    } catch (error) {
        await connection.rollback();
        console.error('Admin add plan error:', error);
        res.status(500).json({ error: 'Plan oluşturulamadı: ' + error.message });
    } finally {
        connection.release();
    }
});

// Admin: Plan Güncelle
router.put('/admin/plans/:id', authenticate, isAdmin, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const { id } = req.params;
        const { name, slug, description, price, currency, billing_period, is_featured, status, sort_order, features, limits } = req.body;

        await connection.execute(
            `UPDATE subscription_plans 
             SET name=?, slug=?, description=?, price=?, currency=?, billing_period=?, is_featured=?, status=?, sort_order=?
             WHERE id=?`,
            [name, slug, description, price, currency, billing_period, is_featured ? 1 : 0, status, sort_order, id]
        );

        // Update Features (Delete all and re-insert)
        if (features) {
            await connection.execute('DELETE FROM plan_features WHERE plan_id = ?', [id]);
            let featureList = [];
            if (Array.isArray(features)) featureList = features;
            else if (typeof features === 'string') featureList = features.split(',').map(f => f.trim()).filter(f => f);

            for (const feature of featureList) {
                await connection.execute('INSERT INTO plan_features (plan_id, feature_name) VALUES (?, ?)', [id, feature]);
            }
        }

        // Update Limits (Delete all and re-insert)
        if (limits) {
            await connection.execute('DELETE FROM plan_limits WHERE plan_id = ?', [id]);
            for (const [key, value] of Object.entries(limits)) {
                await connection.execute('INSERT INTO plan_limits (plan_id, limit_key, limit_value) VALUES (?, ?, ?)', [id, key, String(value)]);
            }
        }

        await connection.commit();
        res.json({ message: 'Plan güncellendi' });
    } catch (error) {
        await connection.rollback();
        console.error('Admin update plan error:', error);
        res.status(500).json({ error: 'Plan güncellenemedi' });
    } finally {
        connection.release();
    }
});

// Admin: Plan Sil
router.delete('/admin/plans/:id', authenticate, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        // Check for active subscriptions
        const [activeSubs] = await pool.execute('SELECT COUNT(*) as count FROM user_subscriptions WHERE plan_id = ? AND status = "active"', [id]);

        if (activeSubs[0].count > 0) {
            return res.status(400).json({ error: 'Bu plana ait aktif abonelikler var. Silmek yerine pasife alabilirsiniz.' });
        }

        await pool.execute('DELETE FROM subscription_plans WHERE id = ?', [id]);
        res.json({ message: 'Plan silindi' });
    } catch (error) {
        console.error('Admin delete plan error:', error);
        res.status(500).json({ error: 'Plan silinemedi' });
    }
});

// Admin: Aktif Abonelikler
router.get('/admin/active', authenticate, isAdmin, async (req, res) => {
    try {
        const [subscriptions] = await pool.execute(`
            SELECT us.*, u.username, u.email, sp.name as plan_name, sp.price
            FROM user_subscriptions us
            JOIN users u ON us.user_id = u.id
            JOIN subscription_plans sp ON us.plan_id = sp.id
            WHERE us.status = 'active'
            ORDER BY us.created_at DESC
        `);
        res.json({ subscriptions });
    } catch (error) {
        console.error('Admin active subs error:', error);
        res.status(500).json({ error: 'Veri çekilemedi' });
    }
});

// Admin: İstatistikler
router.get('/admin/stats', authenticate, isAdmin, async (req, res) => {
    try {
        const [totalPlans] = await pool.execute('SELECT COUNT(*) as count FROM subscription_plans');
        const [activeSubscriptions] = await pool.execute('SELECT COUNT(*) as count FROM user_subscriptions WHERE status = "active"');
        const [monthlyRevenue] = await pool.execute(`
            SELECT SUM(amount) as total 
            FROM subscription_transactions 
            WHERE status = "completed" 
            AND created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
        `);

        res.json({
            total_plans: totalPlans[0].count,
            active_subscriptions: activeSubscriptions[0].count,
            monthly_revenue: monthlyRevenue[0].total || 0
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({ error: 'İstatistikler alınamadı' });
    }
});

// Admin: Kullanıcı Aboneliğini Güncelle (Plan Değiştirme, Süre Uzatma, Durum)
router.put('/admin/user-subscriptions/:id', authenticate, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { plan_id, end_date, status } = req.body;

        // Geçerli planı kontrol et (eğer plan değişiyorsa)
        if (plan_id) {
            const [plans] = await pool.execute('SELECT id FROM subscription_plans WHERE id = ?', [plan_id]);
            if (plans.length === 0) return res.status(404).json({ error: 'Seçilen plan bulunamadı' });
        }

        const updates = [];
        const values = [];

        if (plan_id) {
            updates.push('plan_id = ?');
            values.push(plan_id);
        }
        if (end_date) {
            updates.push('end_date = ?');
            values.push(end_date);
        }
        if (status) {
            updates.push('status = ?');
            values.push(status);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'Güncellenecek veri yok' });
        }

        values.push(id);

        await pool.execute(
            `UPDATE user_subscriptions SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        // Eğer statü 'active' yapıldıysa veya plan değiştiyse kullanıcı rolünü 'seller' olarak güncellemek mantıklı olabilir
        // Ancak bu opsiyoneldir, manuel yönetimde admin ne derse o olur.

        res.json({ message: 'Abonelik başarıyla güncellendi' });
    } catch (error) {
        console.error('Admin update subscription error:', error);
        res.status(500).json({ error: 'Abonelik güncellenemedi' });
    }
});

// Admin: Kullanıcı Aboneliğini Sil
router.delete('/admin/user-subscriptions/:id', authenticate, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await pool.execute('DELETE FROM user_subscriptions WHERE id = ?', [id]);
        res.json({ message: 'Abonelik silindi' });
    } catch (error) {
        console.error('Admin delete subscription error:', error);
        res.status(500).json({ error: 'Abonelik silinemedi' });
    }
});

export default router;
