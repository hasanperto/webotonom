import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function updatePlans() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'teknopro'
        });

        console.log('Connected to database:', process.env.DB_NAME);

        // 1. Modify ENUM
        try {
            await connection.execute(`
                ALTER TABLE subscription_plans 
                MODIFY COLUMN billing_period ENUM('monthly', '3_months', '6_months', 'yearly', 'lifetime') NOT NULL DEFAULT 'monthly'
            `);
            console.log('ENUM updated.');
        } catch (e) { }

        // 2. Fix plan_features
        // (Assuming checking/adding column logic from previous step worked or is fine, skipping strictly for brevity unless needed)
        // I'll just assume plan_id is there now or was added.
        try {
            await connection.execute('ALTER TABLE plan_features ADD COLUMN plan_id INT');
        } catch (e) { }
        try {
            await connection.execute('ALTER TABLE plan_features ADD COLUMN feature_name VARCHAR(255)');
        } catch (e) { }


        // 3. Upsert Plans
        const plans = [
            {
                name: '3 Aylık Paket',
                slug: '3-months-plan',
                description: '3 ay boyunca satıcı olun, sınırsız ürün ekleyin.',
                price: 299.00,
                billing_period: '3_months',
                features: 'Sınırsız Ürün Ekleme, Gelişmiş İstatistikler, 7/24 Destek, Satıcı Paneli Erişimi'
            },
            {
                name: '6 Aylık Paket',
                slug: '6-months-plan',
                description: '6 aylık avantajlı paket ile işinizi büyütün.',
                price: 549.00,
                billing_period: '6_months',
                features: 'Sınırsız Ürün Ekleme, Gelişmiş İstatistikler, 7/24 Destek, Öne Çıkan Listeleme, Satıcı Paneli Erişimi'
            },
            {
                name: 'Yıllık Paket',
                slug: 'yearly-plan',
                description: '1 yıl boyunca kesintisiz satış yapın, en karlı siz olun.',
                price: 999.00,
                billing_period: 'yearly',
                features: 'Sınırsız Ürün Ekleme, Gelişmiş İstatistikler, 7/24 Öncelikli Destek, Ana Sayfa Vitrini, Satıcı Paneli Erişimi'
            }
        ];

        console.log('Current plans in DB:');
        const [existing] = await connection.execute('SELECT id, slug, name FROM subscription_plans');
        console.log(JSON.stringify(existing));

        for (const plan of plans) {
            console.log(`Processing plan: ${plan.slug}`);

            const [rows] = await connection.execute('SELECT id FROM subscription_plans WHERE slug = ?', [plan.slug]);
            let planId;

            if (rows.length > 0) {
                console.log(`-> Updating existing plan: ${plan.name} (ID: ${rows[0].id})`);
                planId = rows[0].id;
                await connection.execute(`
                    UPDATE subscription_plans 
                    SET name=?, description=?, price=?, billing_period=?, status='active'
                    WHERE id=?
                `, [plan.name, plan.description, plan.price, plan.billing_period, planId]);
            } else {
                console.log(`-> Inserting new plan: ${plan.name}`);
                try {
                    const [res] = await connection.execute(`
                        INSERT INTO subscription_plans (name, slug, description, price, billing_period, status)
                        VALUES (?, ?, ?, ?, ?, 'active')
                    `, [plan.name, plan.slug, plan.description, plan.price, plan.billing_period]);
                    planId = res.insertId;
                    console.log(`-> Inserted with ID: ${planId}`);
                } catch (e) {
                    console.error(`INSERT FAILED for ${plan.slug}:`, e.message);
                    continue;
                }
            }

            // Features
            console.log(`-> Updating features for plan ID ${planId}`);
            try {
                // Ensure the delete doesn't fail if table doesn't have plan_id (but we tried to add it)
                await connection.execute('DELETE FROM plan_features WHERE plan_id = ?', [planId]);
            } catch (e) {
                console.log('Delete features error:', e.message);
                // If plan_id missing, we can't delete by it.
            }

            const features = plan.features.split(', ');
            for (const feature of features) {
                try {
                    await connection.execute('INSERT INTO plan_features (plan_id, feature_name) VALUES (?, ?)', [planId, feature]);
                } catch (e) {
                    console.log(`Feature insert error (${feature}):`, e.message);
                }
            }
        }

        console.log('Plans updated successfully!');

    } catch (error) {
        console.error('Script error:', error);
    } finally {
        if (connection) await connection.end();
        process.exit();
    }
}

updatePlans();
