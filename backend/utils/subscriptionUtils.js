import pool from '../config/database.js';

/**
 * Kullanıcının belirli bir işlem için limiti olup olmadığını kontrol eder.
 * @param {number} userId - Kullanıcı ID
 * @param {string} limitKey - Limit anahtarı (örn: 'project_limit')
 * @returns {Promise<boolean>} - Limit dahilindeyse true, değilse false
 */
export const checkSubscriptionLimit = async (userId, limitKey) => {
    try {
        // 1. Kullanıcının aktif aboneliğini bul
        const [subscriptions] = await pool.execute(
            `SELECT us.plan_id 
             FROM user_subscriptions us
             WHERE us.user_id = ? AND us.status = 'active' AND (us.end_date > NOW() OR us.end_date IS NULL)
             ORDER BY us.created_at DESC LIMIT 1`,
            [userId]
        );

        // Eğer aktif abonelik yoksa ve işlem limit gerektiriyorsa (örn: proje yükleme), varsayılan limitleri kontrol et
        // Varsayılan limit: Ücretsiz kullanıcılar için limit yoksa 0 veya belirli bir sayı olabilir.
        // Şimdilik aboneliği olmayan satıcı olamaz varsayımıyla false dönüyoruz, ama admin ise limit yok.
        
        // Admin kontrolü (role_id = 1 = admin)
        const [users] = await pool.execute('SELECT role_id FROM users WHERE id = ?', [userId]);
        if (users.length > 0 && users[0].role_id === 1) {
            return true; // Admin limitsiz
        }

        if (subscriptions.length === 0) {
            // Aktif abonelik yok. Varsayılan limit var mı?
            // "project_limit" için varsayılan 0 olsun.
            return false; 
        }

        const planId = subscriptions[0].plan_id;

        // 2. Plan limitini getir
        const [limits] = await pool.execute(
            'SELECT limit_value FROM plan_limits WHERE plan_id = ? AND limit_key = ?',
            [planId, limitKey]
        );

        if (limits.length === 0) {
            // Limit tanımlanmamışsa sınırsız varsayılabilir veya kısıtlı.
            // Genelde "project_limit" yoksa sınırsızdır.
            return true;
        }

        const limitValue = parseInt(limits[0].limit_value);
        if (limitValue === -1) return true; // -1 sınırsız demek olsun

        // 3. Mevcut kullanım miktarını hesapla
        let currentUsage = 0;
        if (limitKey === 'project_limit') {
            const [usage] = await pool.execute(
                'SELECT COUNT(*) as count FROM projects WHERE user_id = ? AND status != "deleted"',
                [userId]
            );
            currentUsage = usage[0].count;
        } 
        // Başka limitler eklenebilir (örn: 'storage_limit', 'support_ticket_limit')

        return currentUsage < limitValue;

    } catch (error) {
        console.error('Check subscription limit error:', error);
        return false; // Hata durumunda işlem yapma
    }
};

/**
 * Kullanıcının abonelik süresini kontrol eder ve süresi dolmuşsa rolünü 'user' yapar.
 * @param {number} userId 
 */
export const checkAndDowngradeRole = async (userId) => {
    try {
        // Kullanıcı admin ise dokunma (role_id = 1 = admin)
        const [users] = await pool.execute('SELECT role_id FROM users WHERE id = ?', [userId]);
        if (users.length === 0 || users[0].role_id === 1) return;

        // Aktif aboneliği var mı kontrol et
        const [activeSubs] = await pool.execute(
            `SELECT id FROM user_subscriptions 
             WHERE user_id = ? AND status = 'active' AND (end_date > NOW() OR end_date IS NULL)`,
            [userId]
        );

        if (activeSubs.length > 0) {
            // Aktif abonelik var, bir şey yapma (belki süresi dolan eski abonelikleri 'expired' yapabiliriz)
            await pool.execute(
                `UPDATE user_subscriptions SET status = 'expired' 
                 WHERE user_id = ? AND status = 'active' AND end_date <= NOW()`,
                [userId]
            );
            return;
        }

        // Aktif abonelik yok. Süresi dolmuş abonelikleri 'expired' yap.
        await pool.execute(
            `UPDATE user_subscriptions SET status = 'expired' 
             WHERE user_id = ? AND status = 'active' AND end_date <= NOW()`,
            [userId]
        );

        // Kullanıcı rolünü 'seller' (role_id = 3) ise 'user' (role_id = 2) yap
        if (users[0].role_id === 3) {
            await pool.execute('UPDATE users SET role_id = 2 WHERE id = ?', [userId]);
            console.log(`User ${userId} downgraded to 'user' role due to expired subscription.`);
        }

    } catch (error) {
        console.error('Check and downgrade role error:', error);
    }
};
