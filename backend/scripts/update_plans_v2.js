import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function updatePlansAndLimits() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'teknopro'
        });

        console.log('Connected to database:', process.env.DB_NAME);

        // 1. Create plan_limits table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS plan_limits (
                id INT AUTO_INCREMENT PRIMARY KEY,
                plan_id INT NOT NULL,
                limit_key VARCHAR(50) NOT NULL,
                limit_value VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE CASCADE,
                UNIQUE KEY unique_plan_limit (plan_id, limit_key)
            )
        `);

        // 3. Define New Plans
        const plans = [
            {
                name: 'Bronze Paket',
                slug: 'bronze-plan',
                description: 'Başlangıç seviyesi satıcılar için ideal.',
                price: 499.00,
                billing_period: 'yearly',
                features: [
                    'Aylık 5 Proje Yayınlama Hakkı',
                    '%15 Komisyon Oranı',
                    'Temel E-posta Desteği',
                    'Standart Listeleme'
                ],
                limits: {
                    project_monthly_limit: '5',
                    commission_rate: '15',
                    support_level: 'basic',
                    featured_projects: '0'
                }
            },
            {
                name: 'Silver Paket',
                slug: 'silver-plan',
                description: 'Büyüyen satıcılar için daha fazla özellik.',
                price: 999.00,
                billing_period: 'yearly',
                // isPopular: true (logic handled in frontend usually, or we can add flag)
                features: [
                    'Aylık 20 Proje Yayınlama Hakkı',
                    '%10 Komisyon Oranı',
                    'Öncelikli E-posta Desteği',
                    'Ayda 1 Proje Öne Çıkarma',
                    'Gelişmiş İstatistikler'
                ],
                limits: {
                    project_monthly_limit: '20',
                    commission_rate: '10',
                    support_level: 'priority',
                    featured_projects: '1'
                }
            },
            {
                name: 'Gold Paket',
                slug: 'gold-plan',
                description: 'Profesyoneller için sınırsız özgürlük.',
                price: 1999.00,
                billing_period: 'yearly',
                features: [
                    'Sınırsız Proje Yayınlama',
                    '%5 Komisyon Oranı (En Düşük)',
                    '7/24 Canlı Destek & WhatsApp',
                    'Ayda 5 Proje Öne Çıkarma',
                    'Rozet: Altın Satıcı',
                    'Erken Erişim Özellikleri'
                ],
                limits: {
                    project_monthly_limit: '-1', // -1 for unlimited
                    commission_rate: '5',
                    support_level: 'vip',
                    featured_projects: '5'
                }
            }
        ];

        // 4. Upsert Plans and Limits
        for (const plan of plans) {

            const [rows] = await connection.execute('SELECT id FROM subscription_plans WHERE slug = ?', [plan.slug]);
            let planId;

            if (rows.length > 0) {
                console.log(`Updating plan: ${plan.name}`);
                planId = rows[0].id;
                await connection.execute(`
                    UPDATE subscription_plans 
                    SET name=?, description=?, price=?, billing_period=?, status='active'
                    WHERE id=?
                `, [plan.name, plan.description, plan.price, plan.billing_period, planId]);
            } else {
                // Check if name conflict with different slug? No, relying on slug.
                // Just try insert 
                console.log(`Creating plan: ${plan.name}`);
                try {
                    const [res] = await connection.execute(`
                    INSERT INTO subscription_plans (name, slug, description, price, billing_period, status)
                    VALUES (?, ?, ?, ?, ?, 'active')
                `, [plan.name, plan.slug, plan.description, plan.price, plan.billing_period]);
                    planId = res.insertId;
                } catch (e) {
                    console.log('Insert error, maybe duplicate slug but race? ', e.message);
                    const [retryRows] = await connection.execute('SELECT id FROM subscription_plans WHERE slug = ?', [plan.slug]);
                    if (retryRows.length > 0) {
                        planId = retryRows[0].id;
                    } else {
                        throw e;
                    }
                }
            }

            // Sync Features
            try {
                await connection.execute('DELETE FROM plan_features WHERE plan_id = ?', [planId]);
            } catch (e) { }

            for (const feature of plan.features) {
                await connection.execute('INSERT INTO plan_features (plan_id, feature_name) VALUES (?, ?)', [planId, feature]);
            }

            // Sync Limits
            for (const [key, value] of Object.entries(plan.limits)) {
                await connection.execute(`
                    INSERT INTO plan_limits (plan_id, limit_key, limit_value) 
                    VALUES (?, ?, ?)
                    ON DUPLICATE KEY UPDATE limit_value = VALUES(limit_value)
                `, [planId, key, value]);
            }
        }

        const slugs = plans.map(p => p.slug);
        const placeholders = slugs.map(() => '?').join(',');
        await connection.execute(`UPDATE subscription_plans SET status='inactive' WHERE slug NOT IN (${placeholders})`, slugs);
        console.log('Old plans marked inactive.');


        console.log('Plans updated successfully with Bronze/Silver/Gold structure!');

    } catch (error) {
        console.error('Script error:', error);
    } finally {
        if (connection) await connection.end();
        process.exit();
    }
}

updatePlansAndLimits();
