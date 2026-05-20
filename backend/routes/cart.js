import express from 'express';
import pool from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Sepete ekle
router.post('/add', authenticate, async (req, res) => {
    try {
        const { project_id, plan_id, quantity = 1 } = req.body;
        const userId = req.user.id;

        if (!project_id && !plan_id) {
            return res.status(400).json({ error: 'Proje ID veya Plan ID gereklidir' });
        }

        // --- ABONELİK PLAN KONTROLÜ ---
        if (plan_id) {
            // Plan var mı?
            const [plans] = await pool.execute('SELECT * FROM subscription_plans WHERE id = ? AND status = "active"', [plan_id]);
            if (plans.length === 0) {
                return res.status(404).json({ error: 'Plan bulunamadı' });
            }
            const newPlan = plans[0];

            // Kullanıcının mevcut aboneliğini kontrol et
            const [activeSub] = await pool.execute(
                `SELECT us.*, sp.price as current_price, sp.sort_order as current_order 
                 FROM user_subscriptions us
                 JOIN subscription_plans sp ON us.plan_id = sp.id
                 WHERE us.user_id = ? AND us.status = 'active'`,
                [userId]
            );

            if (activeSub.length > 0) {
                const currentSub = activeSub[0];
                // Eğer mevcut planın fiyatı veya sırası, yeni plandan yüksek veya eşitse (Düşürme veya Aynıyı Alma)
                // Burada sort_order kullanmak daha sağlıklı.
                if (currentSub.current_order >= newPlan.sort_order) {
                    return res.status(400).json({ error: 'Mevcut aboneliğinizden daha düşük veya aynı seviyede bir paket alamazsınız. Sadece yükseltme yapabilirsiniz.' });
                }
            }

            // Sepette zaten bir plan var mı? (Aynı anda tek plan alınabilir varsayımıyla)
            const [cartPlans] = await pool.execute('SELECT id FROM cart WHERE user_id = ? AND plan_id IS NOT NULL', [userId]);
            if (cartPlans.length > 0) {
                // Varsa güncelle
                await pool.execute('UPDATE cart SET plan_id = ?, quantity = 1 WHERE id = ?', [plan_id, cartPlans[0].id]);
                return res.json({ message: 'Sepetteki plan güncellendi' });
            }

            // Yoksa ekle
            await pool.execute(
                'INSERT INTO cart (user_id, plan_id, quantity) VALUES (?, ?, 1)',
                [userId, plan_id]
            );
            return res.status(201).json({ message: 'Abonelik paketi sepete eklendi' });
        }

        // --- PROJE KONTROLÜ ---
        if (project_id) {
            const [projects] = await pool.execute('SELECT * FROM projects WHERE id = ?', [project_id]);
            if (projects.length === 0) {
                return res.status(404).json({ error: 'Proje bulunamadı' });
            }
            
            const project = projects[0];
            if (project.status !== 'approved' && project.status !== 'active') {
                return res.status(400).json({ error: 'Bu proje sepete eklenemez' });
            }

            // Sepette var mı kontrol et
            const [existing] = await pool.execute(
                'SELECT id, quantity FROM cart WHERE user_id = ? AND project_id = ?',
                [userId, project_id]
            );

            if (existing.length > 0) {
                await pool.execute(
                    'UPDATE cart SET quantity = quantity + ? WHERE id = ?',
                    [quantity, existing[0].id]
                );
                return res.json({ message: 'Sepet güncellendi' });
            }

            await pool.execute(
                'INSERT INTO cart (user_id, project_id, quantity) VALUES (?, ?, ?)',
                [userId, project_id, quantity]
            );
            return res.status(201).json({ message: 'Sepete eklendi' });
        }

    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Sepeti getir
router.get('/', authenticate, async (req, res) => {
    try {
        const { lang = 'tr' } = req.query;
        
        // Hem projeleri hem planları getir (UNION veya LEFT JOIN ile)
        // Basitlik için iki ayrı sorgu yapıp birleştirebiliriz veya karmaşık bir join.
        // LEFT JOIN yapısı:
        const [cartItems] = await pool.execute(
            `SELECT c.*, 
                    p.title as project_title, p.price as project_price, p.discount_price, p.slug, p.currency as project_currency,
                    sp.name as plan_name, sp.price as plan_price, sp.currency as plan_currency,
                    (SELECT image_path FROM project_images WHERE project_id = p.id AND is_primary = 1 LIMIT 1) as image
             FROM cart c
             LEFT JOIN projects p ON c.project_id = p.id
             LEFT JOIN subscription_plans sp ON c.plan_id = sp.id
             WHERE c.user_id = ?`,
            [req.user.id]
        );
        
        const items = [];
        let total = 0;

        for (let item of cartItems) {
            let processedItem = {
                id: item.id,
                quantity: item.quantity || 1,
                user_id: item.user_id
            };

            if (item.project_id) {
                // Proje
                const price = parseFloat(item.discount_price || item.project_price);
                processedItem = {
                    ...processedItem,
                    type: 'project',
                    project_id: item.project_id,
                    title: item.project_title, // Çeviri eklenecek
                    price: price,
                    currency: item.project_currency,
                    image: item.image ? `/uploads/${item.image}` : null,
                    slug: item.slug
                };

                // Proje çevirisi
                try {
                    const [transRows] = await pool.execute(
                        `SELECT title FROM content_translations WHERE content_id = ? AND content_type = 'project' AND language_code = ?`,
                        [item.project_id, lang]
                    );
                    if (transRows.length > 0 && transRows[0].title) processedItem.title = transRows[0].title;
                } catch (e) {}

            } else if (item.plan_id) {
                // Plan
                processedItem = {
                    ...processedItem,
                    type: 'plan',
                    plan_id: item.plan_id,
                    title: item.plan_name, // Çeviri eklenecek
                    price: parseFloat(item.plan_price),
                    currency: item.plan_currency,
                    image: null // Plan için varsayılan ikon kullanılabilir
                };

                // Plan çevirisi
                try {
                    const [transRows] = await pool.execute(
                        `SELECT title FROM content_translations WHERE content_id = ? AND content_type = 'subscription_plan' AND language_code = ?`,
                        [item.plan_id, lang]
                    );
                    if (transRows.length > 0 && transRows[0].title) processedItem.title = transRows[0].title;
                } catch (e) {}
            }

            total += processedItem.price * processedItem.quantity;
            items.push(processedItem);
        }

        // Cart currency - ilk item'ın currency'sini kullan veya TRY
        const cartCurrency = items.length > 0 && items[0].currency ? items[0].currency : 'TRY';

        res.json({ items, total, currency: cartCurrency });
    } catch (error) {
        console.error('Get cart error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Sepet miktarını güncelle
router.put('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity } = req.body;

        if (!quantity || quantity < 1) {
            return res.status(400).json({ error: 'Geçerli bir miktar girin' });
        }

        // Sepet öğesinin kullanıcıya ait olduğunu kontrol et
        const [cartItems] = await pool.execute(
            'SELECT * FROM cart WHERE id = ? AND user_id = ?',
            [id, req.user.id]
        );

        if (cartItems.length === 0) {
            return res.status(404).json({ error: 'Sepet öğesi bulunamadı' });
        }

        // Miktarı güncelle
        await pool.execute(
            'UPDATE cart SET quantity = ? WHERE id = ?',
            [quantity, id]
        );

        res.json({ message: 'Sepet güncellendi' });
    } catch (error) {
        console.error('Update cart error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Sepetten çıkar
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        
        await pool.execute('DELETE FROM cart WHERE id = ? AND user_id = ?', [id, req.user.id]);
        
        res.json({ message: 'Sepetten çıkarıldı' });
    } catch (error) {
        console.error('Remove from cart error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Sepeti temizle
router.delete('/', authenticate, async (req, res) => {
    try {
        await pool.execute('DELETE FROM cart WHERE user_id = ?', [req.user.id]);
        res.json({ message: 'Sepet temizlendi' });
    } catch (error) {
        console.error('Clear cart error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

export default router;

