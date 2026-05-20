import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import pool from '../config/database.js';
import { authenticate, isAdmin } from '../middleware/auth.js';
import { checkImageLimit } from '../utils/limitsUtils.js';
import { checkFileSizeLimit } from '../middleware/dynamicUpload.js';
import { listNewsBotPosts, SOURCE_CATEGORY_FILTERS } from '../services/newsBotScraper.js';
import { importNewsBotArticle } from '../services/newsBotImport.js';

const router = express.Router();

// Multer yapılandırması (blog için)
const blogStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const blogDir = path.join(process.cwd(), 'public', 'uploads', 'blog');
        if (!fs.existsSync(blogDir)) {
            fs.mkdirSync(blogDir, { recursive: true });
        }
        cb(null, blogDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'cover-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Multer yapılandırması (slider için)
const sliderStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const sliderDir = path.join(process.cwd(), 'public', 'uploads', 'slider');
        if (!fs.existsSync(sliderDir)) {
            fs.mkdirSync(sliderDir, { recursive: true });
        }
        cb(null, sliderDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'slider-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const sliderUpload = multer({
    storage: sliderStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Sadece resim dosyaları yüklenebilir!'));
        }
    }
});

// Multer yapılandırması (references için)
const referenceStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const refDir = path.join(process.cwd(), 'public', 'uploads', 'references');
        if (!fs.existsSync(refDir)) {
            fs.mkdirSync(refDir, { recursive: true });
        }
        cb(null, refDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'ref-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const referenceUpload = multer({
    storage: referenceStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Sadece resim dosyaları yüklenebilir!'));
        }
    }
});

// Multer yapılandırması (sponsors için)
const sponsorStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const sponsorDir = path.join(process.cwd(), 'public', 'uploads', 'sponsors');
        if (!fs.existsSync(sponsorDir)) {
            fs.mkdirSync(sponsorDir, { recursive: true });
        }
        cb(null, sponsorDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'sponsor-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const sponsorUpload = multer({
    storage: sponsorStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Sadece resim dosyaları yüklenebilir!'));
        }
    }
});

const blogUpload = multer({
    storage: blogStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Sadece resim dosyaları yüklenebilir!'));
        }
    }
});

// Multer yapılandırması (logo için)
const logoStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const logoDir = path.join(process.cwd(), 'public', 'uploads', 'logo');
        if (!fs.existsSync(logoDir)) {
            fs.mkdirSync(logoDir, { recursive: true });
        }
        cb(null, logoDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const logoUpload = multer({
    storage: logoStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype) || file.mimetype === 'image/svg+xml';
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Sadece resim dosyaları yüklenebilir!'));
        }
    }
});

// Multer yapılandırması (projeler için)
const projectStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const tempDir = path.join(process.cwd(), 'public', 'uploads', 'temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        cb(null, tempDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const projectUpload = multer({
    storage: projectStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Sadece resim dosyaları yüklenebilir!'));
        }
    }
});

// Tüm route'lar admin yetkisi gerektirir
router.use(authenticate);
router.use(isAdmin);

// Dashboard istatistikleri - Gelişmiş Detaylı
router.get('/dashboard', async (req, res) => {
    try {
        // Kullanıcı İstatistikleri
        const [userStats] = await pool.execute(`
            SELECT 
                COUNT(*) as total,
                COALESCE(SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END), 0) as active,
                COALESCE(SUM(CASE WHEN status = 'pending' OR status = 'inactive' OR status = 'pending_verification' THEN 1 ELSE 0 END), 0) as pending,
                COALESCE(SUM(CASE WHEN status = 'banned' THEN 1 ELSE 0 END), 0) as banned
            FROM users
        `);

        // Proje İstatistikleri
        const [projectStats] = await pool.execute(`
            SELECT 
                COUNT(*) as total,
                COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0) as pending,
                COALESCE(SUM(CASE WHEN status = 'approved' OR status = 'active' THEN 1 ELSE 0 END), 0) as active,
                COALESCE(SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END), 0) as rejected
            FROM projects
        `);

        // Sipariş İstatistikleri
        const [orderStats] = await pool.execute(`
            SELECT 
                COUNT(*) as total,
                COALESCE(SUM(CASE WHEN order_status = 'pending' OR order_status = 'awaiting_payment' THEN 1 ELSE 0 END), 0) as pending,
                COALESCE(SUM(CASE WHEN order_status = 'processing' OR order_status = 'paid' OR order_status = 'preparing' THEN 1 ELSE 0 END), 0) as processing,
                COALESCE(SUM(CASE WHEN order_status = 'completed' OR order_status = 'delivered' OR order_status = 'shipped' THEN 1 ELSE 0 END), 0) as completed,
                COALESCE(SUM(CASE WHEN order_status = 'cancelled' OR order_status = 'failed' OR order_status = 'refunded' OR order_status = 'rejected' THEN 1 ELSE 0 END), 0) as cancelled
            FROM orders
        `);

        // Ödeme Talebi İstatistikleri - Sadece havale ödeme bildirimleri
        // 1. bank_transfer_notifications: Sipariş bazlı havale ödeme bildirimleri
        // 2. payment_requests: Havale ile bakiye yükleme talepleri (payment_method = 'bank_transfer')
        // Kredi kartı ve mobil ödemeler otomatik işlenir, buraya gelmez
        let paymentStats = [{ total: 0, pending: 0, completed: 0, failed: 0 }];
        try {
            // bank_transfer_notifications tablosundan istatistikler (sadece order bazlı olanlar)
            let btnStats = { total: 0, pending: 0, completed: 0, failed: 0 };
            try {
                const [btnResults] = await pool.execute(`
                    SELECT 
                        COUNT(*) as total,
                        COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0) as pending,
                        COALESCE(SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END), 0) as completed,
                        COALESCE(SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END), 0) as failed
                    FROM bank_transfer_notifications
                    WHERE payment_request_id IS NULL
                `);
                btnStats = btnResults[0] || btnStats;
            } catch (e) {
                console.warn('Bank transfer notifications stats error:', e.message);
            }
            
            // payment_requests tablosundan sadece havale ile bakiye yükleme talepleri
            let prStats = { total: 0, pending: 0, completed: 0, failed: 0 };
            try {
                const [prResults] = await pool.execute(`
                    SELECT 
                        COUNT(*) as total,
                        COALESCE(SUM(CASE WHEN status = 'pending' OR status = 'pending_approval' THEN 1 ELSE 0 END), 0) as pending,
                        COALESCE(SUM(CASE WHEN status = 'completed' OR status = 'paid' OR status = 'approved' THEN 1 ELSE 0 END), 0) as completed,
                        COALESCE(SUM(CASE WHEN status = 'failed' OR status = 'rejected' OR status = 'cancelled' THEN 1 ELSE 0 END), 0) as failed
                    FROM payment_requests
                    WHERE payment_method = 'bank_transfer'
                `);
                prStats = prResults[0] || prStats;
            } catch (e) {
                console.warn('Payment requests stats error:', e.message);
            }
            
            // İki tablodan gelen istatistikleri birleştir
            paymentStats = [{
                total: (btnStats.total || 0) + (prStats.total || 0),
                pending: (btnStats.pending || 0) + (prStats.pending || 0),
                completed: (btnStats.completed || 0) + (prStats.completed || 0),
                failed: (btnStats.failed || 0) + (prStats.failed || 0)
            }];
        } catch (error) {
            console.error('Payment stats error:', error);
            // Hata durumunda boş istatistik döndür
        }

        // Bağış İstatistikleri
        const [donationStats] = await pool.execute(`
            SELECT 
                COUNT(*) as total,
                COALESCE(SUM(CASE WHEN status = 'pending' OR status = 'pending_payment' THEN 1 ELSE 0 END), 0) as pending,
                COALESCE(SUM(CASE WHEN status = 'completed' OR status = 'paid' THEN 1 ELSE 0 END), 0) as completed,
                COALESCE(SUM(CASE WHEN status = 'cancelled' OR status = 'failed' OR status = 'rejected' THEN 1 ELSE 0 END), 0) as cancelled
            FROM project_donations
        `);

        // Para Çekme İstatistikleri (Withdrawals) - Tablo yoksa boş döndür
        let withdrawalStats = [{ total: 0, pending: 0, completed: 0, rejected: 0 }];
        try {
            const [withdrawalCheck] = await pool.execute(`
                SELECT COUNT(*) as exists_table
                FROM information_schema.tables 
                WHERE table_schema = DATABASE() 
                AND table_name = 'withdrawals'
            `);
            if (withdrawalCheck[0].exists_table > 0) {
                [withdrawalStats] = await pool.execute(`
                    SELECT 
                        COUNT(*) as total,
                        COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0) as pending,
                        COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0) as completed,
                        COALESCE(SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END), 0) as rejected
                    FROM withdrawals
                `);
            }
        } catch (e) {
            console.warn('Withdrawals table not found, skipping');
        }

        // Toplam Satış Hacmi (Ciro) - Ödenen siparişler
        const [revenue] = await pool.execute(
            `SELECT COALESCE(SUM(final_amount), 0) as total 
             FROM orders 
             WHERE payment_status = 'paid' AND order_status IN ('completed', 'processing', 'delivered')`
        );

        // Site Komisyon Geliri (Net) - transactions tablosundan
        const [commission] = await pool.execute(
            `SELECT COALESCE(SUM(amount), 0) as total 
             FROM transactions 
             WHERE type = 'commission' AND status = 'completed'`
        );

        // Abonelik Geliri - Tamamlanan abonelik ödemeleri
        const [subscriptionRevenue] = await pool.execute(
            `SELECT COALESCE(SUM(amount), 0) as total 
             FROM subscription_transactions 
             WHERE status = 'completed'`
        );

        // Toplam Vergi (KDV) - Siparişlerden hesapla
        // KDV oranını settings'den al (varsayılan %18)
        let vatRate = 18;
        try {
            const [vatSetting] = await pool.execute("SELECT value FROM settings WHERE `key` = 'vat_rate' LIMIT 1");
            if (vatSetting.length > 0) {
                vatRate = parseFloat(vatSetting[0].value) || 18;
            }
        } catch (e) {
            console.warn('VAT rate fetch error:', e);
        }

        // Siparişlerden hesapla: KDV = final_amount * (vatRate / (100 + vatRate))
        // Örnek: %18 KDV için: final_amount * (18/118) = final_amount * 0.152542...
        const vatMultiplier = vatRate / (100 + vatRate);
        const [taxRevenue] = await pool.execute(
            `SELECT COALESCE(SUM(o.final_amount * ?), 0) as total 
             FROM orders o
             WHERE o.payment_status = 'paid' 
             AND o.order_status IN ('completed', 'processing', 'delivered')
             AND o.final_amount > 0`,
            [vatMultiplier]
        );

        // Admin Proje Gelirleri - Admin'e ait projelerin satışları
        const [adminProjectRevenue] = await pool.execute(
            `SELECT COALESCE(SUM(oi.price), 0) as total 
             FROM order_items oi
             INNER JOIN projects p ON oi.project_id = p.id
             INNER JOIN users u ON p.user_id = u.id
             INNER JOIN orders o ON oi.order_id = o.id
             WHERE (u.role_id = 1 OR u.role_id = (SELECT id FROM user_roles WHERE slug = 'admin' LIMIT 1))
             AND o.payment_status = 'paid'
             AND o.order_status IN ('completed', 'processing', 'delivered')`
        );

        // Bağış Gelirleri - Tamamlanan tüm bağışlar
        const [adminDonationRevenue] = await pool.execute(
            `SELECT COALESCE(SUM(amount), 0) as total 
             FROM project_donations 
             WHERE status = 'completed'`
        );

        // Gerçek Toplam Gelir (Net) = Komisyon + Vergi + Abonelik + Admin Proje Gelirleri + Bağışlar
        const totalNetRevenue =
            (parseFloat(commission[0]?.total) || 0) +
            (parseFloat(taxRevenue[0]?.total) || 0) +
            (parseFloat(subscriptionRevenue[0]?.total) || 0) +
            (parseFloat(adminProjectRevenue[0]?.total) || 0) +
            (parseFloat(adminDonationRevenue[0]?.total) || 0);

        // Müşteri Bakiyesi (Emanet) - Kullanıcıların cüzdanlarındaki toplam para (Admin hariç)
        const [userBalances] = await pool.execute(
            `SELECT COALESCE(SUM(u.balance), 0) as total 
             FROM users u
             LEFT JOIN user_roles ur ON u.role_id = ur.id
             WHERE u.status = 'active' AND (ur.slug != 'admin' OR ur.slug IS NULL)`
        );

        // Toplam Harcanan Bakiye - Cüzdan ile ödenen siparişler
        // Eğer transactions tablosu kullanılıyorsa oradan daha detaylı çekilebilir
        let spentBalanceTotal = 0;
        try {
            // Transactions tablosunu kontrol et
            const [spent] = await pool.execute(
                `SELECT COALESCE(SUM(amount), 0) as total 
                 FROM transactions 
                 WHERE (type = 'payment' OR type = 'purchase') 
                 AND status = 'completed'
                 AND payment_method = 'wallet'`
            );
            spentBalanceTotal = spent[0]?.total || 0;

            // Eğer transaction'dan sonuç gelmezse orders tablosuna bak (alternatif)
            if (spentBalanceTotal === 0) {
                const [ordersSpent] = await pool.execute(
                    `SELECT COALESCE(SUM(final_amount), 0) as total 
                     FROM orders 
                     WHERE payment_method = 'wallet' 
                     AND payment_status = 'paid'`
                );
                spentBalanceTotal = ordersSpent[0]?.total || 0;
            }
        } catch (e) {
            console.warn('Spent balance calulation error:', e.message);
        }

        res.json({
            users: userStats[0] || { total: 0, active: 0, pending: 0, banned: 0 },
            projects: projectStats[0] || { total: 0, pending: 0, active: 0, rejected: 0 },
            orders: orderStats[0] || { total: 0, pending: 0, processing: 0, completed: 0, cancelled: 0 },
            payments: paymentStats[0] || { total: 0, pending: 0, completed: 0, failed: 0 },
            donations: donationStats[0] || { total: 0, pending: 0, completed: 0, cancelled: 0 },
            withdrawals: withdrawalStats[0] || { total: 0, pending: 0, completed: 0, rejected: 0 },
            revenue: totalNetRevenue,
            userBalances: userBalances[0]?.total || 0,
            spentBalance: spentBalanceTotal,
            commission: commission[0]?.total || 0,
            subscriptionRevenue: subscriptionRevenue[0]?.total || 0,
            taxRevenue: taxRevenue[0]?.total || 0,
            adminProjectRevenue: adminProjectRevenue[0]?.total || 0,
            adminDonationRevenue: adminDonationRevenue[0]?.total || 0
        });
    } catch (error) {
        console.error('Get dashboard error:', error);
        res.status(500).json({
            error: 'Sunucu hatası',
            details: error.message
        });
    }
});

// Kullanıcıları listele
router.get('/users', async (req, res) => {
    try {
        const [users] = await pool.execute(
            'SELECT u.*, ur.name as role_name, ur.slug as role_slug FROM users u LEFT JOIN user_roles ur ON u.role_id = ur.id ORDER BY u.created_at DESC'
        );
        res.json({ users });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Müşteri Yönetimi - Engellenen Kullanıcılar (ÖNEMLİ: /users/:id'den ÖNCE olmalı!)
router.get('/users/banned', async (req, res) => {
    try {
        const [users] = await pool.execute(
            `SELECT u.*, ur.name as role_name, ur.slug as role_slug 
             FROM users u 
             LEFT JOIN user_roles ur ON u.role_id = ur.id 
             WHERE u.status = ? 
             ORDER BY u.updated_at DESC`,
            ['banned']
        );

        console.log(`[Admin] Found ${users.length} banned users`);
        res.json({ users });
    } catch (error) {
        console.error('[Admin] Get banned users error:', error);
        console.error('[Admin] Error details:', {
            message: error.message,
            code: error.code,
            sqlState: error.sqlState,
            sqlMessage: error.sqlMessage
        });
        res.status(500).json({
            error: 'Sunucu hatası',
            details: error.message
        });
    }
});

// Müşteri Yönetimi - Rehber (ÖNEMLİ: /users/:id'den ÖNCE olmalı!)
router.get('/users/contacts', async (req, res) => {
    try {
        const { role, search } = req.query;

        // Önce user_contacts tablosundan verileri çek
        let contactsQuery = `
            SELECT 
                uc.*,
                'contact' as source_type,
                NULL as role_id,
                NULL as role_name,
                NULL as role_slug,
                NULL as username,
                NULL as status
            FROM user_contacts uc
            WHERE 1=1
        `;
        const contactsParams = [];

        if (search) {
            contactsQuery += ` AND (
                uc.name LIKE ? OR 
                uc.email LIKE ? OR 
                uc.phone LIKE ? OR 
                uc.notes LIKE ?
            )`;
            const searchPattern = `%${search}%`;
            contactsParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
        }

        contactsQuery += ' ORDER BY uc.created_at DESC';

        const [contacts] = await pool.execute(contactsQuery, contactsParams);

        // Şimdi users tablosundan verileri çek (rol bazlı)
        let usersQuery = `
            SELECT 
                u.id,
                u.username as name,
                u.email,
                u.phone,
                u.bio as notes,
                'user' as source_type,
                u.role_id,
                ur.name as role_name,
                ur.slug as role_slug,
                u.username,
                u.status,
                u.created_at
            FROM users u
            LEFT JOIN user_roles ur ON u.role_id = ur.id
            WHERE u.status = 'active'
        `;
        const usersParams = [];

        if (role && role !== 'all') {
            usersQuery += ` AND ur.slug = ?`;
            usersParams.push(role);
        }

        if (search) {
            usersQuery += ` AND (
                u.username LIKE ? OR 
                u.email LIKE ? OR 
                u.phone LIKE ? OR 
                u.first_name LIKE ? OR 
                u.last_name LIKE ? OR
                u.bio LIKE ?
            )`;
            const searchPattern = `%${search}%`;
            usersParams.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
        }

        usersQuery += ' ORDER BY u.created_at DESC';

        const [users] = await pool.execute(usersQuery, usersParams);

        // Her iki kaynağı birleştir
        const allContacts = [
            ...contacts.map(c => ({ ...c, is_contact: true })),
            ...users.map(u => ({ ...u, is_contact: false }))
        ];

        res.json({ contacts: allContacts });
    } catch (error) {
        if (error.code === 'ER_NO_SUCH_TABLE') {
            // Eğer user_contacts tablosu yoksa sadece users'ı döndür
            try {
                const { role, search } = req.query;
                let usersQuery = `
                    SELECT 
                        u.id,
                        u.username as name,
                        u.email,
                        u.phone,
                        u.bio as notes,
                        'user' as source_type,
                        u.role_id,
                        ur.name as role_name,
                        ur.slug as role_slug,
                        u.username,
                        u.status,
                        u.created_at
                    FROM users u
                    LEFT JOIN user_roles ur ON u.role_id = ur.id
                    WHERE u.status = 'active'
                `;
                const usersParams = [];

                if (role && role !== 'all') {
                    usersQuery += ` AND ur.slug = ?`;
                    usersParams.push(role);
                }

                if (search) {
                    usersQuery += ` AND (
                        u.username LIKE ? OR 
                        u.email LIKE ? OR 
                        u.phone LIKE ? OR 
                        u.first_name LIKE ? OR 
                        u.last_name LIKE ? OR
                        u.bio LIKE ?
                    )`;
                    const searchPattern = `%${search}%`;
                    usersParams.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
                }

                usersQuery += ' ORDER BY u.created_at DESC';
                const [users] = await pool.execute(usersQuery, usersParams);
                res.json({ contacts: users.map(u => ({ ...u, is_contact: false })) });
            } catch (err) {
                console.error('Get users error:', err);
                res.json({ contacts: [] });
            }
        } else {
            console.error('Get contacts error:', error);
            res.status(500).json({ error: 'Sunucu hatası' });
        }
    }
});

router.post('/users/contacts', async (req, res) => {
    try {
        const { name, email, phone, notes } = req.body;
        const [result] = await pool.execute(
            'INSERT INTO user_contacts (name, email, phone, notes) VALUES (?, ?, ?, ?)',
            [name, email || null, phone || null, notes || null]
        );
        res.json({ message: 'İletişim eklendi', id: result.insertId });
    } catch (error) {
        if (error.code === 'ER_NO_SUCH_TABLE') {
            res.status(400).json({ error: 'user_contacts tablosu bulunamadı. Lütfen database_missing_tables.sql dosyasını çalıştırın.' });
        } else {
            console.error('Add contact error:', error);
            res.status(500).json({ error: 'Sunucu hatası' });
        }
    }
});

router.delete('/users/contacts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.execute('DELETE FROM user_contacts WHERE id = ?', [id]);
        res.json({ message: 'İletişim silindi' });
    } catch (error) {
        console.error('Delete contact error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Müşteri Yönetimi - Toplu E-Mail (ÖNEMLİ: /users/:id'den ÖNCE olmalı!)
router.post('/users/bulk-email', async (req, res) => {
    try {
        const { subject, message, userFilter, roleId, sendToContacts } = req.body;
        // Bu endpoint gerçek e-posta gönderimi için entegre edilmeli
        // Şimdilik sadece başarı mesajı döndürüyoruz
        res.json({ message: 'E-posta gönderildi', sent_count: 0 });
    } catch (error) {
        console.error('Bulk email error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Müşteri Yönetimi - Toplu SMS (ÖNEMLİ: /users/:id'den ÖNCE olmalı!)
router.post('/users/bulk-sms', async (req, res) => {
    try {
        const { message, userFilter, roleId, sendToContacts } = req.body;
        // Bu endpoint gerçek SMS gönderimi için entegre edilmeli
        res.json({ message: 'SMS gönderildi', sent_count: 0 });
    } catch (error) {
        console.error('Bulk SMS error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Müşteri Yönetimi - Bildirim Şablonları (ÖNEMLİ: /users/:id'den ÖNCE olmalı!)
router.get('/users/notification-templates', async (req, res) => {
    try {
        const [templates] = await pool.execute('SELECT * FROM notification_templates ORDER BY created_at DESC');
        res.json({ templates });
    } catch (error) {
        if (error.code === 'ER_NO_SUCH_TABLE') {
            res.json({ templates: [] });
        } else {
            console.error('Get templates error:', error);
            res.status(500).json({ error: 'Sunucu hatası' });
        }
    }
});

router.post('/users/notification-templates', async (req, res) => {
    try {
        const { name, type, subject, body } = req.body;
        const [result] = await pool.execute(
            'INSERT INTO notification_templates (name, type, subject, body) VALUES (?, ?, ?, ?)',
            [name, type, subject || null, body]
        );
        res.json({ message: 'Şablon eklendi', id: result.insertId });
    } catch (error) {
        if (error.code === 'ER_NO_SUCH_TABLE') {
            res.status(400).json({ error: 'notification_templates tablosu bulunamadı. Lütfen database_missing_tables.sql dosyasını çalıştırın.' });
        } else {
            console.error('Add template error:', error);
            res.status(500).json({ error: 'Sunucu hatası' });
        }
    }
});

router.put('/users/notification-templates/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, type, subject, body } = req.body;
        await pool.execute(
            'UPDATE notification_templates SET name = ?, type = ?, subject = ?, body = ? WHERE id = ?',
            [name, type, subject || null, body, id]
        );
        res.json({ message: 'Şablon güncellendi' });
    } catch (error) {
        console.error('Update template error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

router.delete('/users/notification-templates/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.execute('DELETE FROM notification_templates WHERE id = ?', [id]);
        res.json({ message: 'Şablon silindi' });
    } catch (error) {
        console.error('Delete template error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Kullanıcı detayı getir (GENEL ROUTE - EN SONDA OLMALI!)
router.get('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [users] = await pool.execute(
            'SELECT u.*, ur.name as role_name, ur.slug as role_slug FROM users u LEFT JOIN user_roles ur ON u.role_id = ur.id WHERE u.id = ?',
            [id]
        );
        if (users.length === 0) {
            return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
        }
        res.json({ user: users[0] });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Kullanıcı projeleri
router.get('/users/:id/projects', async (req, res) => {
    try {
        const { id } = req.params;
        const [projects] = await pool.execute(
            `SELECT p.*, c.name as category_name,
             (SELECT COUNT(*) FROM order_items oi WHERE oi.project_id = p.id) as sales_count,
             (SELECT SUM(oi.price) FROM order_items oi WHERE oi.project_id = p.id) as total_revenue
             FROM projects p
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE p.user_id = ?
             ORDER BY p.created_at DESC`,
            [id]
        );
        res.json({ projects });
    } catch (error) {
        console.error('Get user projects error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Kullanıcı siparişleri
router.get('/users/:id/orders', async (req, res) => {
    try {
        const { id } = req.params;
        const [orders] = await pool.execute(
            `SELECT o.*, 
             COUNT(oi.id) as item_count,
             GROUP_CONCAT(
                 CASE 
                     WHEN oi.plan_id IS NOT NULL THEN sp.name
                     ELSE p.title
                 END SEPARATOR ', '
             ) as item_titles
             FROM orders o
             LEFT JOIN order_items oi ON o.id = oi.order_id
             LEFT JOIN projects p ON oi.project_id = p.id
             LEFT JOIN subscription_plans sp ON oi.plan_id = sp.id
             WHERE o.user_id = ?
             GROUP BY o.id
             ORDER BY o.created_at DESC`,
            [id]
        );
        res.json({ orders });
    } catch (error) {
        console.error('Get user orders error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Kullanıcı satışları (seller ise)
router.get('/users/:id/sales', async (req, res) => {
    try {
        const { id } = req.params;
        const [sales] = await pool.execute(
            `SELECT oi.*, o.order_number, o.created_at as order_date, o.order_status,
             p.title as project_title, p.slug as project_slug,
             u.username as buyer_username, u.email as buyer_email
             FROM order_items oi
             INNER JOIN orders o ON oi.order_id = o.id
             INNER JOIN projects p ON oi.project_id = p.id
             INNER JOIN users u ON o.user_id = u.id
             WHERE p.user_id = ?
             ORDER BY o.created_at DESC`,
            [id]
        );
        res.json({ sales });
    } catch (error) {
        console.error('Get user sales error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Kullanıcı işlemleri
router.get('/users/:id/transactions', async (req, res) => {
    try {
        const { id } = req.params;
        const [transactions] = await pool.execute(
            `SELECT t.*, 
             o.order_number,
             GROUP_CONCAT(DISTINCT p.title) as project_titles
             FROM transactions t
             LEFT JOIN orders o ON t.order_id = o.id
             LEFT JOIN order_items oi ON o.id = oi.order_id
             LEFT JOIN projects p ON oi.project_id = p.id
             WHERE t.user_id = ?
             GROUP BY t.id
             ORDER BY t.created_at DESC
             LIMIT 100`,
            [id]
        );
        res.json({ transactions });
    } catch (error) {
        console.error('Get user transactions error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Kullanıcı istatistikleri
router.get('/users/:id/stats', async (req, res) => {
    try {
        const { id } = req.params;

        // Proje istatistikleri
        const [projectStats] = await pool.execute(
            `SELECT 
             COUNT(*) as total_projects,
             SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_projects,
             SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_projects,
             SUM(views) as total_views,
             SUM(downloads) as total_downloads
             FROM projects WHERE user_id = ?`,
            [id]
        );

        // Sipariş istatistikleri
        const [orderStats] = await pool.execute(
            `SELECT 
             COUNT(*) as total_orders,
             SUM(final_amount) as total_spent,
             SUM(CASE WHEN order_status = 'completed' THEN final_amount ELSE 0 END) as completed_orders_total
             FROM orders WHERE user_id = ?`,
            [id]
        );

        // Satış istatistikleri (seller ise)
        const [salesStats] = await pool.execute(
            `SELECT 
             COUNT(DISTINCT oi.order_id) as total_sales,
             SUM(oi.price) as total_revenue,
             SUM(oi.commission_amount) as total_commission
             FROM order_items oi
             INNER JOIN projects p ON oi.project_id = p.id
             WHERE p.user_id = ?`,
            [id]
        );

        // İşlem istatistikleri
        const [transactionStats] = await pool.execute(
            `SELECT 
             COUNT(*) as total_transactions,
             SUM(CASE WHEN type = 'purchase' AND status = 'completed' THEN amount ELSE 0 END) as total_spent,
             SUM(CASE WHEN type IN ('sale', 'commission') AND status = 'completed' THEN amount ELSE 0 END) as total_earned,
             SUM(CASE WHEN type = 'donation' AND status = 'completed' THEN amount ELSE 0 END) as total_donated
             FROM transactions WHERE user_id = ?`,
            [id]
        );

        res.json({
            projects: projectStats[0] || {},
            orders: orderStats[0] || {},
            sales: salesStats[0] || {},
            transactions: transactionStats[0] || {}
        });
    } catch (error) {
        console.error('Get user stats error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Kullanıcı güncelle
router.put('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            username, email, first_name, last_name, phone, role_id, status,
            balance, bio, website, location, email_verified, two_factor_enabled
        } = req.body;

        // Önce mevcut kullanıcıyı kontrol et
        const [existing] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
        }

        // Güncelleme sorgusu - sadece gönderilen alanları güncelle
        const updateFields = [];
        const updateValues = [];

        if (username !== undefined) { updateFields.push('username = ?'); updateValues.push(username); }
        if (email !== undefined) { updateFields.push('email = ?'); updateValues.push(email); }
        if (first_name !== undefined) { updateFields.push('first_name = ?'); updateValues.push(first_name || null); }
        if (last_name !== undefined) { updateFields.push('last_name = ?'); updateValues.push(last_name || null); }
        if (phone !== undefined) { updateFields.push('phone = ?'); updateValues.push(phone || null); }
        if (role_id !== undefined) { updateFields.push('role_id = ?'); updateValues.push(role_id); }
        if (status !== undefined) { updateFields.push('status = ?'); updateValues.push(status); }
        if (balance !== undefined) { updateFields.push('balance = ?'); updateValues.push(balance); }
        if (bio !== undefined) { updateFields.push('bio = ?'); updateValues.push(bio || null); }
        if (website !== undefined) { updateFields.push('website = ?'); updateValues.push(website || null); }
        if (location !== undefined) { updateFields.push('location = ?'); updateValues.push(location || null); }
        if (email_verified !== undefined) { updateFields.push('email_verified = ?'); updateValues.push(email_verified ? 1 : 0); }
        if (two_factor_enabled !== undefined) { updateFields.push('two_factor_enabled = ?'); updateValues.push(two_factor_enabled ? 1 : 0); }
        if (req.body.ban_note !== undefined) { updateFields.push('ban_note = ?'); updateValues.push(req.body.ban_note || null); }

        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'Güncellenecek alan bulunamadı' });
        }

        updateValues.push(id);
        const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;

        await pool.execute(query, updateValues);
        res.json({ message: 'Kullanıcı güncellendi' });
    } catch (error) {
        console.error('Update user error:', error);
        console.error('Update user error details:', {
            message: error.message,
            code: error.code,
            sqlState: error.sqlState,
            sqlMessage: error.sqlMessage,
            query: query,
            values: updateValues
        });
        res.status(500).json({
            error: 'Sunucu hatası',
            details: error.message,
            code: error.code
        });
    }
});

// Kullanıcı sil
router.delete('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // Önce kullanıcının admin olup olmadığını kontrol et
        const [users] = await pool.execute('SELECT role_id FROM users WHERE id = ?', [id]);
        if (users.length === 0) {
            return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
        }
        // Admin kullanıcıları silinemez (güvenlik)
        const [roles] = await pool.execute('SELECT slug FROM user_roles WHERE id = ?', [users[0].role_id]);
        if (roles.length > 0 && roles[0].slug === 'admin') {
            return res.status(400).json({ error: 'Admin kullanıcıları silinemez' });
        }
        await pool.execute('DELETE FROM users WHERE id = ?', [id]);
        res.json({ message: 'Kullanıcı silindi' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Kullanıcı durumu güncelle
router.put('/users/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        await pool.execute('UPDATE users SET status = ? WHERE id = ?', [status, id]);
        res.json({ message: 'Kullanıcı durumu güncellendi' });
    } catch (error) {
        console.error('Update user status error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Projeleri listele (onay bekleyenler dahil)
router.get('/projects', async (req, res) => {
    try {
        const [projects] = await pool.execute(
            `SELECT p.*, u.username, c.name as category_name
             FROM projects p
             LEFT JOIN users u ON p.user_id = u.id
             LEFT JOIN categories c ON p.category_id = c.id
             ORDER BY p.created_at DESC`
        );
        res.json({ projects });
    } catch (error) {
        console.error('Get projects error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Proje onayla/reddet
router.put('/projects/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'approved' veya 'rejected'

        await pool.execute('UPDATE projects SET status = ? WHERE id = ?', [status, id]);
        res.json({ message: 'Proje durumu güncellendi' });
    } catch (error) {
        console.error('Update project status error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Proje detayı (Admin - tüm projeleri görebilir)
router.get('/projects/:id', async (req, res) => {
    try {
        const projectId = req.params.id;

        // Proje bilgilerini getir
        const [projects] = await pool.execute(
            `SELECT p.*, u.username, c.name as category_name
             FROM projects p
             LEFT JOIN users u ON p.user_id = u.id
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE p.id = ?`,
            [projectId]
        );

        if (projects.length === 0) {
            return res.status(404).json({ error: 'Proje bulunamadı' });
        }

        const project = projects[0];

        // Proje görsellerini getir
        let images = [];
        try {
            const [imageRows] = await pool.execute(
                'SELECT id, image_path, is_primary, sort_order FROM project_images WHERE project_id = ? ORDER BY is_primary DESC, sort_order ASC',
                [projectId]
            );
            images = imageRows.map(img => {
                let imagePath = img.image_path;
                // Eğer zaten /uploads/ ile başlıyorsa olduğu gibi döndür
                if (imagePath && !imagePath.startsWith('/uploads/') && !imagePath.startsWith('http')) {
                    imagePath = `/uploads/${imagePath}`;
                }
                return {
                    id: img.id,
                    image_path: imagePath,
                    is_primary: img.is_primary,
                    sort_order: img.sort_order
                };
            });
        } catch (err) {
            console.warn('Project images not available:', err.message);
        }

        // Proje etiketlerini getir
        let tags = [];
        try {
            const [tagRows] = await pool.execute(
                `SELECT t.id, t.name, t.slug 
                 FROM tags t
                 INNER JOIN project_tags pt ON t.id = pt.tag_id
                 WHERE pt.project_id = ?`,
                [projectId]
            );
            tags = tagRows;
        } catch (err) {
            console.warn('Project tags not available:', err.message);
        }

        // Çok dilli içerikleri getir
        let translations = {};
        try {
            const [translationRows] = await pool.execute(
                `SELECT language_code, title, description, short_description 
                 FROM content_translations 
                 WHERE content_id = ? AND content_type = 'project'`,
                [projectId]
            );
            translationRows.forEach(t => {
                translations[t.language_code] = {
                    title: t.title,
                    description: t.description,
                    short_description: t.short_description
                };
            });
        } catch (err) {
            console.warn('Content translations not available:', err.message);
        }

        // Primary image URL'ini düzelt
        if (images.length > 0) {
            const primaryImg = images.find(img => img.is_primary === 1);
            project.primary_image = primaryImg ? primaryImg.image_path : images[0].image_path;
        }

        res.json({
            project: {
                ...project,
                images,
                tags,
                translations
            }
        });
    } catch (error) {
        console.error('Get project detail error:', error);
        res.status(500).json({ error: 'Sunucu hatası', details: error.message });
    }
});

// Proje güncelle (Admin - tüm projeleri düzenleyebilir)
router.put('/projects/:id', projectUpload.fields([
    { name: 'primary_image', maxCount: 1 },
    { name: 'gallery_images', maxCount: 20 }
]), checkFileSizeLimit, async (req, res) => {
    try {
        const projectId = req.params.id;
        const isFormData = req.headers['content-type']?.includes('multipart/form-data');

        let projectData = {};
        if (isFormData) {
            projectData = {
                title_tr: req.body.title_tr || '',
                short_description_tr: req.body.short_description_tr || '',
                description_tr: req.body.description_tr || '',
                title_en: req.body.title_en || '',
                short_description_en: req.body.short_description_en || '',
                description_en: req.body.description_en || '',
                title_de: req.body.title_de || '',
                short_description_de: req.body.short_description_de || '',
                description_de: req.body.description_de || '',
                category_id: req.body.category_id || '',
                price: req.body.price || '',
                discount_price: req.body.discount_price || '',
                currency: req.body.currency || 'TRY',
                tags: req.body.tags || '',
                status: req.body.status || 'pending',
                is_active: req.body.is_active,
                primary_image_index: req.body.primary_image_index || null,
                deleted_image_ids: req.body.deleted_image_ids || '',
                demo_url: req.body.demo_url || '',
                admin_demo_url: req.body.admin_demo_url || '',
                demo_username: req.body.demo_username || '',
                demo_password: req.body.demo_password || '',
                admin_username: req.body.admin_username || '',
                admin_password: req.body.admin_password || '',
                video_url: req.body.video_url || '',
                license_type: req.body.license_type || '',
                requirements: req.body.requirements || '',
                version: req.body.version || '1.0.0',
                // Proje durumu alanları
                completion_status: req.body.completion_status || 'completed',
                completion_percentage: req.body.completion_percentage || 100,
                donation_target: req.body.donation_target || '',
                deadline: req.body.deadline || '',
                source_url: req.body.source_url || ''
            };
        } else {
            projectData = req.body;
        }

        // Projenin varlığını kontrol et (admin tüm projeleri düzenleyebilir)
        const [existing] = await pool.execute(
            'SELECT id FROM projects WHERE id = ?',
            [projectId]
        );

        if (existing.length === 0) {
            return res.status(404).json({ error: 'Proje bulunamadı' });
        }

        // Seller endpoint'indeki güncelleme mantığını kullan
        // (Aynı kod, sadece user_id kontrolü yok)
        const {
            title, title_tr, title_en, title_de,
            description, description_tr, description_en, description_de,
            short_description, short_description_tr, short_description_en, short_description_de,
            category_id, price, discount_price, currency, tags, status, is_active,
            demo_url, admin_demo_url, demo_username, demo_password,
            admin_username, admin_password, video_url, license_type, requirements, version,
            completion_status, completion_percentage, donation_target, deadline, source_url
        } = projectData;

        const updates = [];
        const values = [];

        const finalTitle = title_tr || title;
        if (finalTitle !== undefined) {
            updates.push('title = ?');
            values.push(finalTitle);
            const slug = finalTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            updates.push('slug = ?');
            values.push(slug);
        }

        const finalDescription = description_tr || description;
        if (finalDescription !== undefined) {
            updates.push('description = ?');
            values.push(finalDescription);
        }

        const finalShortDescription = short_description_tr || short_description;
        if (finalShortDescription !== undefined) {
            updates.push('short_description = ?');
            values.push(finalShortDescription);
        }
        if (category_id !== undefined) {
            updates.push('category_id = ?');
            values.push(category_id);
        }
        if (price !== undefined) {
            updates.push('price = ?');
            values.push(price);
        }
        if (discount_price !== undefined) {
            updates.push('discount_price = ?');
            values.push(discount_price);
        }
        if (currency !== undefined) {
            updates.push('currency = ?');
            values.push(currency);
        }
        if (status !== undefined) {
            updates.push('status = ?');
            values.push(status);
        }
        // is_active güncellemesi
        if (is_active !== undefined) {
            updates.push('is_active = ?');
            const isActiveValue = typeof is_active === 'string'
                ? (is_active === '1' || is_active === 'true' || is_active.toLowerCase() === 'true')
                : Boolean(is_active);
            values.push(isActiveValue ? 1 : 0);
        }
        if (demo_url !== undefined) {
            updates.push('demo_url = ?');
            values.push(demo_url || null);
        }
        if (admin_demo_url !== undefined) {
            updates.push('admin_demo_url = ?');
            values.push(admin_demo_url || null);
        }
        if (demo_username !== undefined) {
            updates.push('demo_username = ?');
            values.push(demo_username || null);
        }
        if (demo_password !== undefined) {
            updates.push('demo_password = ?');
            values.push(demo_password || null);
        }
        if (admin_username !== undefined) {
            updates.push('admin_username = ?');
            values.push(admin_username || null);
        }
        if (admin_password !== undefined) {
            updates.push('admin_password = ?');
            values.push(admin_password || null);
        }
        if (video_url !== undefined) {
            updates.push('video_url = ?');
            values.push(video_url || null);
        }
        if (license_type !== undefined) {
            updates.push('license_type = ?');
            values.push(license_type || null);
        }
        if (requirements !== undefined) {
            updates.push('requirements = ?');
            values.push(requirements || null);
        }
        if (version !== undefined) {
            updates.push('version = ?');
            values.push(version || '1.0.0');
        }
        // Proje durumu alanları
        if (completion_status !== undefined) {
            updates.push('completion_status = ?');
            values.push(completion_status);
        }
        if (completion_percentage !== undefined) {
            updates.push('completion_percentage = ?');
            values.push(parseInt(completion_percentage) || 0);
        }
        if (donation_target !== undefined) {
            updates.push('donation_target = ?');
            values.push(donation_target || null);
        }
        if (deadline !== undefined) {
            updates.push('deadline = ?');
            values.push(deadline && deadline !== '' ? deadline : null);
        }
        if (source_url !== undefined) {
            updates.push('source_url = ?');
            values.push(source_url || null);
        }

        // Eğer hiçbir alan güncellenmiyorsa ama resim yükleme varsa devam et
        if (updates.length === 0 && (!req.files || (!req.files.primary_image && (!req.files.gallery_images || req.files.gallery_images.length === 0)))) {
            return res.status(400).json({ error: 'Güncellenecek alan belirtilmedi' });
        }

        // Eğer güncellenecek alan varsa UPDATE sorgusu çalıştır
        if (updates.length > 0) {
            updates.push('updated_at = NOW()');
            values.push(projectId);

            await pool.execute(
                `UPDATE projects SET ${updates.join(', ')} WHERE id = ?`,
                values
            );
        }

        // Tags güncellemesi
        if (tags !== undefined) {
            await pool.execute('DELETE FROM project_tags WHERE project_id = ?', [projectId]);

            if (tags) {
                let tagNames = [];
                if (typeof tags === 'string') {
                    tagNames = tags.split(',').map(t => t.trim()).filter(t => t);
                } else if (Array.isArray(tags)) {
                    tagNames = tags;
                }

                for (const tagName of tagNames) {
                    if (!tagName) continue;

                    const tagSlug = tagName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

                    const [existingTags] = await pool.execute(
                        'SELECT id FROM tags WHERE slug = ?',
                        [tagSlug]
                    );

                    let tagId;
                    if (existingTags.length > 0) {
                        tagId = existingTags[0].id;
                    } else {
                        const [newTag] = await pool.execute(
                            'INSERT INTO tags (name, slug) VALUES (?, ?)',
                            [tagName, tagSlug]
                        );
                        tagId = newTag.insertId;
                    }

                    await pool.execute(
                        `INSERT IGNORE INTO project_tags (project_id, tag_id) VALUES (?, ?)`,
                        [projectId, tagId]
                    );
                }
            }
        }

        // Silinen resimleri sil
        if (projectData.deleted_image_ids) {
            const deletedIds = typeof projectData.deleted_image_ids === 'string'
                ? projectData.deleted_image_ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
                : Array.isArray(projectData.deleted_image_ids)
                    ? projectData.deleted_image_ids.map(id => parseInt(id)).filter(id => !isNaN(id))
                    : [];

            if (deletedIds.length > 0) {
                // Placeholder'ları dinamik oluştur
                const placeholders = deletedIds.map(() => '?').join(',');

                // Önce silinecek resimlerin dosya yollarını al
                const [imagesToDelete] = await pool.execute(
                    `SELECT image_path FROM project_images WHERE id IN (${placeholders}) AND project_id = ?`,
                    [...deletedIds, projectId]
                );

                // Veritabanından sil
                await pool.execute(
                    `DELETE FROM project_images WHERE id IN (${placeholders}) AND project_id = ?`,
                    [...deletedIds, projectId]
                );

                // Dosyaları da sil
                const fsPromises = fs.promises;
                for (const img of imagesToDelete) {
                    try {
                        const filePath = path.join(process.cwd(), 'public', 'uploads', img.image_path);
                        if (fs.existsSync(filePath)) {
                            await fsPromises.unlink(filePath);
                        }
                    } catch (err) {
                        console.warn(`Failed to delete image file: ${img.image_path}`, err.message);
                    }
                }
            }
        }

        // Çok dilli içerikleri güncelle (undefined → null, mysql2 bind hatası önlenir)
        const sqlText = (v) => (v === undefined || v === null || v === '' ? null : v);

        const trTitle = sqlText(title_tr ?? title);
        const trDesc = sqlText(description_tr ?? description);
        const trShort = sqlText(short_description_tr ?? short_description);
        if (trTitle || trDesc || trShort) {
            await pool.execute(
                `INSERT INTO content_translations (content_id, content_type, language_code, title, description, short_description)
                 VALUES (?, 'project', 'tr', ?, ?, ?)
                 ON DUPLICATE KEY UPDATE title = COALESCE(?, title), description = COALESCE(?, description), short_description = COALESCE(?, short_description)`,
                [projectId, trTitle, trDesc, trShort, trTitle, trDesc, trShort]
            );
        }

        const enTitle = sqlText(title_en);
        const enDesc = sqlText(description_en);
        const enShort = sqlText(short_description_en);
        if (enTitle || enDesc || enShort) {
            await pool.execute(
                `INSERT INTO content_translations (content_id, content_type, language_code, title, description, short_description)
                 VALUES (?, 'project', 'en', ?, ?, ?)
                 ON DUPLICATE KEY UPDATE title = COALESCE(?, title), description = COALESCE(?, description), short_description = COALESCE(?, short_description)`,
                [projectId, enTitle, enDesc, enShort, enTitle, enDesc, enShort]
            );
        }

        const deTitle = sqlText(title_de);
        const deDesc = sqlText(description_de);
        const deShort = sqlText(short_description_de);
        if (deTitle || deDesc || deShort) {
            await pool.execute(
                `INSERT INTO content_translations (content_id, content_type, language_code, title, description, short_description)
                 VALUES (?, 'project', 'de', ?, ?, ?)
                 ON DUPLICATE KEY UPDATE title = COALESCE(?, title), description = COALESCE(?, description), short_description = COALESCE(?, short_description)`,
                [projectId, deTitle, deDesc, deShort, deTitle, deDesc, deShort]
            );
        }

        // Resim yükleme işlemleri (yeni resimler varsa)
        if (req.files) {
            const fsPromises = fs.promises;
            const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'projects');

            // Upload dizinini oluştur
            await fsPromises.mkdir(uploadDir, { recursive: true });

            // Primary image
            const primaryFile = req.files.primary_image ?
                (Array.isArray(req.files.primary_image) ? req.files.primary_image[0] : req.files.primary_image) : null;

            // Galeri resimleri
            const galleryFiles = req.files.gallery_images ?
                (Array.isArray(req.files.gallery_images) ? req.files.gallery_images : [req.files.gallery_images]) : [];

            // GÖRSEL SAYISI LİMİT KONTROLÜ (Admin güncelleme)
            const totalNewImages = (primaryFile ? 1 : 0) + galleryFiles.length;
            if (totalNewImages > 0) {
                const imageLimit = await checkImageLimit(projectId, totalNewImages);
                if (!imageLimit.allowed) {
                    // Yüklenen dosyaları sil
                    const fsPromises = fs.promises;
                    if (primaryFile) {
                        try { await fsPromises.unlink(primaryFile.path); } catch (e) { }
                    }
                    for (const file of galleryFiles) {
                        try { await fsPromises.unlink(file.path); } catch (e) { }
                    }
                    return res.status(403).json({
                        error: `Görsel limitine ulaşıldı. Mevcut: ${imageLimit.current}/${imageLimit.max} görsel. Maksimum ${imageLimit.max} görsel eklenebilir.`
                    });
                }
            }

            // Mevcut resimlerin sort_order'ını al
            const [existingImages] = await pool.execute(
                'SELECT MAX(sort_order) as max_order FROM project_images WHERE project_id = ?',
                [projectId]
            );
            let sortOrder = (existingImages[0]?.max_order || 0) + 1;

            // Primary image'i yükle
            if (primaryFile) {
                // Önce mevcut primary image'i kaldır
                await pool.execute(
                    'UPDATE project_images SET is_primary = 0 WHERE project_id = ?',
                    [projectId]
                );

                const primaryExt = path.extname(primaryFile.originalname);
                const primaryFileName = `primary_${projectId}_${Date.now()}${primaryExt}`;
                const primaryFilePath = path.join(uploadDir, primaryFileName);
                await fsPromises.rename(primaryFile.path, primaryFilePath);

                const relativePath = `projects/${primaryFileName}`;
                await pool.execute(
                    `INSERT INTO project_images (project_id, image_path, is_primary, sort_order) VALUES (?, ?, 1, ?)`,
                    [projectId, relativePath, sortOrder++]
                );
            }

            // Galeri resimlerini yükle
            for (const file of galleryFiles) {
                const ext = path.extname(file.originalname);
                const fileName = `gallery_${projectId}_${Date.now()}_${Math.random().toString(36).substring(7)}${ext}`;
                const filePath = path.join(uploadDir, fileName);
                await fsPromises.rename(file.path, filePath);

                const relativePath = `projects/${fileName}`;
                await pool.execute(
                    `INSERT INTO project_images (project_id, image_path, is_primary, sort_order) VALUES (?, ?, 0, ?)`,
                    [projectId, relativePath, sortOrder++]
                );
            }

            // Mevcut resimlerden vitrin resmi değiştirme (primary_image_index varsa)
            if (projectData.primary_image_index !== null && projectData.primary_image_index !== undefined && !primaryFile) {
                const primaryIndex = parseInt(projectData.primary_image_index);
                const [allImages] = await pool.execute(
                    'SELECT id FROM project_images WHERE project_id = ? ORDER BY is_primary DESC, sort_order ASC',
                    [projectId]
                );

                if (allImages[primaryIndex]) {
                    // Önce tüm resimlerin is_primary'ini 0 yap
                    await pool.execute(
                        'UPDATE project_images SET is_primary = 0 WHERE project_id = ?',
                        [projectId]
                    );

                    // Seçilen resmi primary yap
                    await pool.execute(
                        'UPDATE project_images SET is_primary = 1 WHERE id = ?',
                        [allImages[primaryIndex].id]
                    );
                }
            }
        }

        res.json({ message: 'Proje güncellendi' });
    } catch (error) {
        console.error('Update project error:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            projectId: req.params.id,
            body: req.body
        });
        res.status(500).json({ error: 'Sunucu hatası', details: error.message });
    }
});

// Proje sil (Admin)
router.delete('/projects/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Projenin varlığını kontrol et
        const [projects] = await pool.execute('SELECT id FROM projects WHERE id = ?', [id]);
        if (projects.length === 0) {
            return res.status(404).json({ error: 'Proje bulunamadı' });
        }

        // İlişkili kayıtları önce sil (CASCADE yoksa)
        try {
            // RESTRICT olan tabloları önce kontrol et ve NULL yap
            // Order items (RESTRICT - sipariş kayıtlarını korumak için NULL yap)
            await pool.execute('UPDATE order_items SET project_id = NULL WHERE project_id = ?', [id]);

            // Sales orders (RESTRICT - sipariş kayıtlarını korumak için NULL yap)
            await pool.execute('UPDATE sales_orders SET product_id = NULL WHERE product_id = ?', [id]);

            // Quote requests (varsa)
            try {
                await pool.execute('DELETE FROM quote_requests WHERE project_id = ?', [id]);
            } catch (e) {
                console.warn('quote_requests table may not exist:', e.message);
            }

            // CASCADE olan tablolar (otomatik silinecek ama manuel de silebiliriz)
            // Project images
            await pool.execute('DELETE FROM project_images WHERE project_id = ?', [id]);
            // Project tags
            await pool.execute('DELETE FROM project_tags WHERE project_id = ?', [id]);
            // Reviews
            await pool.execute('DELETE FROM reviews WHERE project_id = ?', [id]);
            // Donations
            await pool.execute('DELETE FROM donations WHERE project_id = ?', [id]);
            // Project donations (eğer ayrı tablo varsa)
            try {
                await pool.execute('DELETE FROM project_donations WHERE project_id = ?', [id]);
            } catch (e) {
                console.warn('project_donations table may not exist:', e.message);
            }
            // Favorites
            await pool.execute('DELETE FROM favorites WHERE project_id = ?', [id]);
            // Downloads
            try {
                await pool.execute('DELETE FROM downloads WHERE project_id = ?', [id]);
            } catch (e) {
                console.warn('downloads table may not exist:', e.message);
            }
            // User accesses
            try {
                await pool.execute('DELETE FROM user_accesses WHERE product_id = ?', [id]);
            } catch (e) {
                console.warn('user_accesses table may not exist:', e.message);
            }
            // Product packages
            try {
                await pool.execute('DELETE FROM product_packages WHERE product_id = ?', [id]);
            } catch (e) {
                console.warn('product_packages table may not exist:', e.message);
            }
            // Content translations
            await pool.execute('DELETE FROM content_translations WHERE content_id = ? AND content_type = ?', [id, 'project']);
            // Project files
            try {
                await pool.execute('DELETE FROM project_files WHERE project_id = ?', [id]);
            } catch (e) {
                console.warn('project_files table may not exist:', e.message);
            }
        } catch (relError) {
            console.warn('Error deleting related records (continuing):', relError.message);
            // Devam et, ana projeyi silmeye çalış
        }

        // Projeyi sil
        await pool.execute('DELETE FROM projects WHERE id = ?', [id]);

        res.json({ message: 'Proje silindi' });
    } catch (error) {
        console.error('Delete project error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error sqlState:', error.sqlState);

        // Foreign key constraint hatası
        if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.code === 'ER_ROW_IS_REFERENCED' || error.sqlState === '23000') {
            return res.status(400).json({
                error: 'Proje silinemiyor',
                details: 'Bu proje başka kayıtlarla ilişkili (sipariş, yorum vb.). Önce ilişkili kayıtları silin.'
            });
        }

        res.status(500).json({
            error: 'Sunucu hatası',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Proje silinirken bir hata oluştu'
        });
    }
});

// Dil Yönetimi
router.get('/languages', async (req, res) => {
    try {
        const [languages] = await pool.execute(
            'SELECT * FROM languages ORDER BY sort_order ASC, name ASC'
        );
        res.json({ languages });
    } catch (error) {
        console.error('Get languages error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

router.post('/languages', async (req, res) => {
    try {
        const { code, name, native_name, rtl, is_default, status, sort_order } = req.body;

        // Eğer varsayılan dil seçildiyse, diğer dilleri varsayılan yapma
        if (is_default) {
            await pool.execute('UPDATE languages SET is_default = 0');
        }

        await pool.execute(
            'INSERT INTO languages (code, name, native_name, rtl, is_default, status, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [code, name, native_name, rtl ? 1 : 0, is_default ? 1 : 0, status, sort_order || 0]
        );
        res.json({ message: 'Dil eklendi' });
    } catch (error) {
        console.error('Add language error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

router.put('/languages/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { code, name, native_name, rtl, is_default, status, sort_order } = req.body;

        // Eğer varsayılan dil seçildiyse, diğer dilleri varsayılan yapma
        if (is_default) {
            await pool.execute('UPDATE languages SET is_default = 0 WHERE id != ?', [id]);
        }

        await pool.execute(
            'UPDATE languages SET code = ?, name = ?, native_name = ?, rtl = ?, is_default = ?, status = ?, sort_order = ? WHERE id = ?',
            [code, name, native_name, rtl ? 1 : 0, is_default ? 1 : 0, status, sort_order || 0, id]
        );
        res.json({ message: 'Dil güncellendi' });
    } catch (error) {
        console.error('Update language error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

router.delete('/languages/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.execute('DELETE FROM languages WHERE id = ?', [id]);
        res.json({ message: 'Dil silindi' });
    } catch (error) {
        console.error('Delete language error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

router.put('/languages/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        await pool.execute('UPDATE languages SET status = ? WHERE id = ?', [status, id]);
        res.json({ message: 'Dil durumu güncellendi' });
    } catch (error) {
        console.error('Update language status error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Siparişler
router.get('/orders', async (req, res) => {
    try {
        const [orders] = await pool.execute(
            `SELECT o.*, u.username,
             COUNT(oi.id) as item_count,
             GROUP_CONCAT(
                 CASE 
                     WHEN oi.plan_id IS NOT NULL THEN CONCAT('Abonelik: ', sp.name)
                     ELSE p.title
                 END SEPARATOR ', '
             ) as item_summary
             FROM orders o
             LEFT JOIN users u ON o.user_id = u.id
             LEFT JOIN order_items oi ON o.id = oi.order_id
             LEFT JOIN projects p ON oi.project_id = p.id
             LEFT JOIN subscription_plans sp ON oi.plan_id = sp.id
             GROUP BY o.id
             ORDER BY o.created_at DESC`
        );
        res.json({ orders });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Sipariş detayı (Admin)
router.get('/orders/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Sipariş bilgisi (commission_rate kolonunu da dahil et)
        let orders;
        try {
            [orders] = await pool.execute(
                `SELECT o.*, u.username, u.email, u.phone, u.first_name, u.last_name
                 FROM orders o
                 LEFT JOIN users u ON o.user_id = u.id
                 WHERE o.id = ?`,
                [id]
            );
        } catch (error) {
            // Eğer commission_rate kolonu yoksa, kolon olmadan sorgu çalıştır
            if (error.code === 'ER_BAD_FIELD_ERROR' || error.message.includes('commission_rate')) {
                console.warn('commission_rate kolonu bulunamadı. Lütfen database_add_commission_rate_to_orders.sql dosyasını çalıştırın.');
                [orders] = await pool.execute(
                    `SELECT o.*, u.username, u.email, u.phone, u.first_name, u.last_name
                     FROM orders o
                     LEFT JOIN users u ON o.user_id = u.id
                     WHERE o.id = ?`,
                    [id]
                );
            } else {
                throw error;
            }
        }

        if (orders.length === 0) {
            return res.status(404).json({ error: 'Sipariş bulunamadı' });
        }

        const order = orders[0];

        // Sipariş kalemleri (Hem projeler hem planlar)
        let orderItems = [];
        try {
            // Önce temel sorguyu çalıştır
            const [orderItemsResult] = await pool.execute(
                `SELECT oi.*, 
                        p.title as project_title, p.slug as project_slug, p.price as project_price,
                        sp.name as plan_name, sp.slug as plan_slug, sp.billing_period, sp.price as plan_price
                 FROM order_items oi
                 LEFT JOIN projects p ON oi.project_id = p.id
                 LEFT JOIN subscription_plans sp ON oi.plan_id = sp.id
                 WHERE oi.order_id = ?`,
                [id]
            );
            orderItems = orderItemsResult || [];

            // Her bir item için işlem yap
            for (let item of orderItems) {
                if (item.project_id) {
                    // Proje için title, slug ve image
                    item.title = item.project_title;
                    item.slug = item.project_slug;
                    item.type = 'project';

                    try {
                        const [images] = await pool.execute(
                            'SELECT image_path FROM project_images WHERE project_id = ? AND is_primary = 1 LIMIT 1',
                            [item.project_id]
                        );
                        if (images.length > 0 && images[0].image_path) {
                            item.image = `/uploads/${images[0].image_path}`;
                        }
                    } catch (e) {
                        if (e.code !== 'ER_NO_SUCH_TABLE') {
                            console.error('Get image error for project', item.project_id, ':', e);
                        }
                    }
                } else if (item.plan_id) {
                    // Plan için title ve slug
                    item.title = item.plan_name;
                    item.slug = item.plan_slug;
                    item.type = 'subscription';
                }
            }
        } catch (error) {
            console.error('Get order items error:', error);
            orderItems = [];
        }

        // Transaction bilgisi
        let transactions = [];
        try {
            const [transactionsResult] = await pool.execute(
                `SELECT t.*, u.username as transaction_user
                 FROM transactions t
                 LEFT JOIN users u ON t.user_id = u.id
                 WHERE t.order_id = ? 
                 ORDER BY t.created_at DESC`,
                [id]
            );
            transactions = transactionsResult;
        } catch (error) {
            if (error.code !== 'ER_NO_SUCH_TABLE') {
                console.error('Get transactions error:', error);
            }
        }

        // Fatura bilgisi (varsa)
        let invoices = [];
        try {
            const [invoicesResult] = await pool.execute(
                `SELECT i.*, u.username as invoice_user
                 FROM invoices i
                 LEFT JOIN users u ON i.user_id = u.id
                 WHERE i.order_id = ?`,
                [id]
            );
            invoices = invoicesResult;
        } catch (error) {
            if (error.code !== 'ER_NO_SUCH_TABLE') {
                console.error('Get invoices error:', error);
            }
        }

        // Billing info (eğer orders tablosunda varsa)
        let billingInfo = null;
        if (order.billing_info) {
            try {
                billingInfo = typeof order.billing_info === 'string'
                    ? JSON.parse(order.billing_info)
                    : order.billing_info;
            } catch (e) {
                console.error('Billing info parse error:', e);
            }
        }

        // Komisyon ve KDV hesaplamaları
        const finalAmount = parseFloat(order.final_amount) || 0;
        const totalAmount = parseFloat(order.total_amount) || 0;

        // Komisyon oranını belirle:
        // 1. Önce siparişte kayıtlı oranı kullan (varsa - yeni siparişler için)
        // 2. Yoksa settings'den al (eski siparişler için)
        let commissionRate = 15; // Varsayılan

        if (order.commission_rate !== null && order.commission_rate !== undefined) {
            // Siparişte kayıtlı oran var, onu kullan
            commissionRate = parseFloat(order.commission_rate) || 15;
        } else {
            // Eski sipariş - settings'den al
            try {
                const [settings] = await pool.execute(
                    "SELECT value FROM settings WHERE `key` = 'commission_rate' AND (`group` = 'general' OR `group` = 'financial') ORDER BY CASE WHEN `group` = 'general' THEN 1 ELSE 2 END LIMIT 1"
                );
                if (settings.length > 0) {
                    commissionRate = parseFloat(settings[0].value) || 15;
                }
            } catch (e) {
                console.warn('Commission rate fetch error:', e.message);
            }
        }

        // KDV oranı (varsayılan %18)
        const taxRate = 18; // KDV oranı

        // Hesaplamalar
        // KDV dahil tutar üzerinden hesaplama
        const amountWithoutTax = finalAmount / (1 + taxRate / 100);
        const taxAmount = finalAmount - amountWithoutTax;

        // Komisyon hesaplama (KDV hariç tutar üzerinden)
        const commissionAmount = amountWithoutTax * (commissionRate / 100);

        // Yönetim komisyonu (platform komisyonu) = komisyon tutarı
        const adminCommission = commissionAmount;

        // Satıcıya kalan (KDV hariç tutar - komisyon)
        const sellerAmount = amountWithoutTax - commissionAmount;

        // Fiyat detayları
        const priceBreakdown = {
            subtotal: totalAmount,
            discount: parseFloat(order.discount_amount) || 0,
            subtotal_after_discount: finalAmount,
            tax_rate: taxRate,
            tax_amount: parseFloat(taxAmount.toFixed(2)),
            amount_without_tax: parseFloat(amountWithoutTax.toFixed(2)),
            commission_rate: commissionRate,
            commission_amount: parseFloat(commissionAmount.toFixed(2)),
            admin_commission: parseFloat(adminCommission.toFixed(2)),
            seller_amount: parseFloat(sellerAmount.toFixed(2)),
            total: finalAmount
        };

        res.json({
            order: {
                ...order,
                items: orderItems || [],
                transactions: transactions || [],
                invoices: invoices || [],
                billing_info: billingInfo,
                price_breakdown: priceBreakdown
            }
        });
    } catch (error) {
        console.error('Get order detail error:', error);
        res.status(500).json({ error: 'Sunucu hatası', details: error.message });
    }
});

// Sipariş durumu güncelle (Admin) - Komisyon, Vergi Dağıtımı ve Abonelik Aktivasyonu
router.put('/orders/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { order_status, payment_status } = req.body;

        if (!order_status && !payment_status) {
            return res.status(400).json({ error: 'En az bir durum güncellenmeli' });
        }

        // Mevcut sipariş bilgisini al
        const [orders] = await pool.execute('SELECT * FROM orders WHERE id = ?', [id]);
        if (orders.length === 0) {
            return res.status(404).json({ error: 'Sipariş bulunamadı' });
        }
        const order = orders[0];
        const userId = order.user_id;

        const updates = [];
        const values = [];

        if (order_status) {
            updates.push('order_status = ?');
            values.push(order_status);
        }

        if (payment_status) {
            updates.push('payment_status = ?');
            values.push(payment_status);
        }

        if (updates.length > 0) {
            values.push(id);
            await pool.execute(
                `UPDATE orders SET ${updates.join(', ')} WHERE id = ?`,
                values
            );
        }

        const finalPaymentStatus = payment_status || order.payment_status;
        const finalOrderStatus = order_status || order.order_status;

        // 1. DAĞITIM MANTIĞI (Projeler için)
        if (finalOrderStatus === 'completed') {
            console.log(`[DISTRIBUTION] Starting distribution for Order ID: ${id}`);

            // Sipariş kalemlerini getir
            const [orderItems] = await pool.execute('SELECT * FROM order_items WHERE order_id = ?', [id]);
            console.log(`[DISTRIBUTION] Found ${orderItems.length} items.`);

            // Ayarları getir (KDV ve Komisyon)
            let vatRate = 18;
            try {
                const [vatSetting] = await pool.execute("SELECT value FROM settings WHERE `key` = 'vat_rate' LIMIT 1");
                if (vatSetting.length > 0) vatRate = parseFloat(vatSetting[0].value) || 18;
            } catch (e) { }

            let commissionRate = 15;
            if (order.commission_rate) {
                commissionRate = parseFloat(order.commission_rate);
            } else {
                try {
                    const [commSetting] = await pool.execute("SELECT value FROM settings WHERE `key` = 'commission_rate' LIMIT 1");
                    if (commSetting.length > 0) commissionRate = parseFloat(commSetting[0].value) || 15;
                } catch (e) { }
            }

            // Admin kullanıcısını bul
            let adminUserId = null;
            try {
                const [adminRoles] = await pool.execute("SELECT id FROM user_roles WHERE slug = 'admin' LIMIT 1");
                if (adminRoles.length > 0) {
                    const [admins] = await pool.execute("SELECT id FROM users WHERE role_id = ? ORDER BY id ASC LIMIT 1", [adminRoles[0].id]);
                    if (admins.length > 0) adminUserId = admins[0].id;
                }
                if (!adminUserId) {
                    const [backupAdmins] = await pool.execute("SELECT id FROM users WHERE role_id = 1 ORDER BY id ASC LIMIT 1");
                    if (backupAdmins.length > 0) adminUserId = backupAdmins[0].id;
                }
            } catch (adminErr) {
                console.error('[DISTRIBUTION] Admin user find error:', adminErr.message);
            }

            const roundMoney = (amount) => Math.round(amount * 100) / 100;

            for (const item of orderItems) {
                if (!item.project_id) continue;

                const [projects] = await pool.execute("SELECT user_id, title FROM projects WHERE id = ?", [item.project_id]);
                if (projects.length === 0) continue;
                const sellerId = projects[0].user_id;
                const projectTitle = projects[0].title;

                const itemTotal = parseFloat(item.subtotal || 0);
                let effectiveItemTotal = itemTotal;
                if (order.total_amount > 0 && order.discount_amount > 0) {
                    effectiveItemTotal = itemTotal - ((itemTotal / order.total_amount) * order.discount_amount);
                }
                effectiveItemTotal = roundMoney(effectiveItemTotal);

                const netAmount = roundMoney(effectiveItemTotal / (1 + (vatRate / 100)));
                const vatAmount = roundMoney(effectiveItemTotal - netAmount);
                const commissionAmount = roundMoney((netAmount * commissionRate) / 100);
                const sellerShare = roundMoney(netAmount - commissionAmount);

                // A) Satıcıya Ödeme (Eğer daha önce ödenmemişse)
                const [existingSellerTrans] = await pool.execute(
                    `SELECT id FROM transactions WHERE order_id = ? AND user_id = ? AND type = 'sale' AND description LIKE ?`,
                    [id, sellerId, `%${projectTitle}%`]
                );

                if (existingSellerTrans.length === 0 && sellerShare > 0) {
                    // Sipariş tarihinden 7 gün sonra çekilebilir olacak
                    // Sipariş tarihini orders tablosundan al
                    const orderDate = new Date(order.created_at);
                    const unblockDate = new Date(orderDate);
                    unblockDate.setDate(unblockDate.getDate() + 7); // Sipariş tarihinden 7 gün sonra
                    
                    // blocked_balance kolonunu kontrol et ve ekle
                    try {
                        await pool.execute("UPDATE users SET blocked_balance = COALESCE(blocked_balance, 0) + ? WHERE id = ?", [sellerShare, sellerId]);
                    } catch (blockedError) {
                        // Eğer blocked_balance kolonu yoksa balance'a ekle (geriye dönük uyumluluk)
                        console.warn('blocked_balance kolonu bulunamadı, balance kullanılıyor:', blockedError.message);
                        await pool.execute("UPDATE users SET balance = balance + ? WHERE id = ?", [sellerShare, sellerId]);
                    }
                    
                    // Transaction kaydı oluştur (unblock_date ile - sipariş tarihinden 7 gün sonra)
                    await pool.execute(
                        `INSERT INTO transactions (user_id, order_id, type, amount, currency, status, description, unblock_date)
                         VALUES (?, ?, 'sale', ?, ?, 'completed', ?, ?)`,
                        [sellerId, id, sellerShare, order.currency, `Proje Satışı: ${projectTitle} (#${order.order_number})`, unblockDate]
                    );
                }

                // B) Admin'e Ödeme (KDV + Komisyon) - Eğer daha önce ödenmemişse
                if (adminUserId) {
                    const [existingAdminTrans] = await pool.execute(
                        `SELECT id FROM transactions WHERE order_id = ? AND user_id = ? AND (type = 'commission' OR type = 'tax') AND description LIKE ?`,
                        [id, adminUserId, `%${projectTitle}%`]
                    );

                    if (existingAdminTrans.length === 0) {
                        const totalAdminEarnings = roundMoney(commissionAmount + vatAmount);
                        if (totalAdminEarnings > 0) {
                            await pool.execute("UPDATE users SET balance = balance + ? WHERE id = ?", [totalAdminEarnings, adminUserId]);
                            
                            // Komisyon transaction
                            if (commissionAmount > 0) {
                                await pool.execute(
                                    `INSERT INTO transactions (user_id, order_id, type, amount, currency, status, description)
                                     VALUES (?, ?, 'commission', ?, ?, 'completed', ?)`,
                                    [adminUserId, id, commissionAmount, order.currency, `Satış Komisyonu (%${commissionRate}): ${projectTitle}`]
                                );
                            }
                            
                            // KDV transaction
                            if (vatAmount > 0) {
                                await pool.execute(
                                    `INSERT INTO transactions (user_id, order_id, type, amount, currency, status, description)
                                     VALUES (?, ?, 'tax', ?, ?, 'completed', ?)`,
                                    [adminUserId, id, vatAmount, order.currency, `KDV Geliri (%${vatRate}): ${projectTitle}`]
                                );
                            }
                        }
                    }
                }
            }
        }

        // 2. ABONELİK AKTİVASYONU (Planlar için)
        if (finalPaymentStatus === 'paid' && finalOrderStatus === 'completed') {
            const [orderItems] = await pool.execute(
                'SELECT plan_id, price FROM order_items WHERE order_id = ? AND plan_id IS NOT NULL',
                [id]
            );

            if (orderItems.length > 0) {
                for (const item of orderItems) {
                    if (!item.plan_id) continue;

                    const [plans] = await pool.execute('SELECT id, billing_period FROM subscription_plans WHERE id = ?', [item.plan_id]);
                    if (plans.length > 0) {
                        const plan = plans[0];
                        const startDate = new Date();
                        const endDate = new Date(startDate);

                        if (plan.billing_period === 'monthly') endDate.setMonth(endDate.getMonth() + 1);
                        else if (plan.billing_period === 'yearly') endDate.setFullYear(endDate.getFullYear() + 1);
                        else endDate.setFullYear(endDate.getFullYear() + 99);

                        await pool.execute(`UPDATE user_subscriptions SET status = 'cancelled', end_date = NOW() WHERE user_id = ? AND status = 'active'`, [userId]);

                        const [subResult] = await pool.execute(
                            `INSERT INTO user_subscriptions (user_id, plan_id, start_date, end_date, status, payment_method)
                             VALUES (?, ?, ?, ?, 'active', ?)`,
                            [userId, plan.id, startDate, endDate, order.payment_method || 'credit_card']
                        );

                        try {
                            await pool.execute(
                                `INSERT INTO subscription_transactions (subscription_id, amount, status, payment_method)
                                 VALUES (?, ?, 'completed', ?)`,
                                [subResult.insertId, item.price, order.payment_method || 'credit_card']
                            );
                        } catch (e) { }

                        await pool.execute('UPDATE users SET role_id = 3 WHERE id = ?', [userId]);
                    }
                }
            }
        }

        res.json({ message: 'Sipariş durumu güncellendi' });
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({ error: 'Sunucu hatası', details: error.message });
    }
});

// Admin - Bloke bakiyeleri kontrol et ve aktar (Manuel)
router.post('/unblock-balances', async (req, res) => {
    try {
        console.log('🔄 Bloke bakiyeler kontrol ediliyor (Manuel)...');

        // Sipariş tarihinden 7 gün geçmiş sale transaction'ları bul
        const [expiredTransactions] = await pool.execute(
            `SELECT t.id, t.user_id, t.amount, t.order_id, t.description, t.unblock_date, o.created_at as order_date, u.username
             FROM transactions t
             INNER JOIN orders o ON t.order_id = o.id
             INNER JOIN users u ON t.user_id = u.id
             WHERE t.type = 'sale'
             AND t.status = 'completed'
             AND t.unblock_date IS NOT NULL
             AND DATE_ADD(o.created_at, INTERVAL 7 DAY) <= NOW()
             AND t.unblock_date <= NOW()`
        );

        console.log(`📊 ${expiredTransactions.length} adet transaction'ın bloke süresi doldu`);

        let totalUnblocked = 0;
        const processedUsers = new Set();
        const results = [];

        for (const transaction of expiredTransactions) {
            const userId = transaction.user_id;
            const amount = parseFloat(transaction.amount);

            // Kullanıcının bloke bakiyesini kontrol et
            const [user] = await pool.execute('SELECT blocked_balance, balance FROM users WHERE id = ?', [userId]);
            
            if (user.length === 0) continue;

            const currentBlocked = parseFloat(user[0].blocked_balance || 0);
            const currentBalance = parseFloat(user[0].balance || 0);

            // Bloke bakiyeden çıkar, çekilebilir bakiyeye ekle
            const newBlocked = Math.max(0, currentBlocked - amount);
            const newBalance = currentBalance + amount;

            await pool.execute(
                'UPDATE users SET blocked_balance = ?, balance = ? WHERE id = ?',
                [newBlocked, newBalance, userId]
            );

            totalUnblocked += amount;
            processedUsers.add(userId);

            results.push({
                user_id: userId,
                username: transaction.username,
                amount: amount,
                order_id: transaction.order_id,
                order_date: transaction.order_date,
                unblock_date: transaction.unblock_date
            });
        }

        res.json({
            message: 'Bloke bakiyeler kontrol edildi ve aktarıldı',
            processed_count: expiredTransactions.length,
            affected_users: processedUsers.size,
            total_unblocked: Math.round(totalUnblocked * 100) / 100,
            results: results
        });
    } catch (error) {
        console.error('Unblock balances error:', error);
        res.status(500).json({ error: 'Sunucu hatası', details: error.message });
    }
});

// Kuponlar
router.get('/coupons', async (req, res) => {
    try {
        const [coupons] = await pool.execute(
            'SELECT * FROM coupons ORDER BY created_at DESC'
        );
        res.json({ coupons });
    } catch (error) {
        console.error('Get coupons error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

router.post('/coupons', async (req, res) => {
    try {
        const { code, discount_type, discount_value, min_amount, max_amount, usage_limit, one_time_use, start_date, expires_at, status, description } = req.body;

        await pool.execute(
            'INSERT INTO coupons (code, discount_type, discount_value, min_amount, max_amount, usage_limit, one_time_use, start_date, expires_at, status, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [code, discount_type, discount_value, min_amount || null, max_amount || null, usage_limit || null, one_time_use ? 1 : 0, start_date || null, expires_at || null, status, description || null]
        );
        res.json({ message: 'Kupon eklendi' });
    } catch (error) {
        console.error('Add coupon error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

router.put('/coupons/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { code, discount_type, discount_value, min_amount, max_amount, usage_limit, one_time_use, start_date, expires_at, status, description } = req.body;

        await pool.execute(
            'UPDATE coupons SET code = ?, discount_type = ?, discount_value = ?, min_amount = ?, max_amount = ?, usage_limit = ?, one_time_use = ?, start_date = ?, expires_at = ?, status = ?, description = ? WHERE id = ?',
            [code, discount_type, discount_value, min_amount || null, max_amount || null, usage_limit || null, one_time_use ? 1 : 0, start_date || null, expires_at || null, status, description || null, id]
        );
        res.json({ message: 'Kupon güncellendi' });
    } catch (error) {
        console.error('Update coupon error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

router.delete('/coupons/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.execute('DELETE FROM coupons WHERE id = ?', [id]);
        res.json({ message: 'Kupon silindi' });
    } catch (error) {
        console.error('Delete coupon error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// İşlemler
router.get('/transactions', async (req, res) => {
    try {
        const [transactions] = await pool.execute(
            `SELECT t.*, u.username 
             FROM transactions t
             LEFT JOIN users u ON t.user_id = u.id
             ORDER BY t.created_at DESC`
        );
        res.json({ transactions });
    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Ödeme Talepleri (Payment Requests)
router.get('/payment-requests', async (req, res) => {
    try {
        const { status } = req.query;
        
        // Payment requests tablosundan gelenler (tablo yoksa boş array döndür)
        let paymentRequests = [];
        try {
            let paymentRequestsQuery = `
                SELECT 
                    pr.*, 
                    u.username, 
                    u.email,
                    CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) as full_name,
                    btn.sender_name, 
                    btn.bank_name, 
                    btn.receipt_image,
                    btn.receipt_file,
                    btn.receipt_number,
                    btn.notes,
                    btn.admin_notes,
                    'payment_request' as source_type
                FROM payment_requests pr
                LEFT JOIN users u ON pr.user_id = u.id
                LEFT JOIN bank_transfer_notifications btn ON pr.id = btn.payment_request_id
                WHERE pr.payment_method = 'bank_transfer'
            `;

            const paymentRequestsParams = [];
            if (status && status !== 'all') {
                if (status === 'pending_actions') {
                    // pending_actions için tüm pending status'leri dahil et
                    paymentRequestsQuery += ' AND (pr.status = ? OR pr.status = ?)';
                    paymentRequestsParams.push('pending', 'pending_approval');
                } else if (status === 'pending_review' || status === 'pending_approval') {
                    paymentRequestsQuery += ' AND (pr.status = ? OR pr.status = ?)';
                    paymentRequestsParams.push('pending', 'pending_approval');
                } else if (status === 'approved' || status === 'completed') {
                    paymentRequestsQuery += ' AND (pr.status = ? OR pr.status = ? OR pr.status = ?)';
                    paymentRequestsParams.push('completed', 'paid', 'approved');
                } else if (status === 'rejected' || status === 'failed') {
                    paymentRequestsQuery += ' AND (pr.status = ? OR pr.status = ?)';
                    paymentRequestsParams.push('failed', 'rejected');
                } else {
                    paymentRequestsQuery += ' AND pr.status = ?';
                    paymentRequestsParams.push(status);
                }
            }

            paymentRequestsQuery += ' ORDER BY pr.created_at DESC';

            const [prResults] = await pool.execute(paymentRequestsQuery, paymentRequestsParams);
            paymentRequests = prResults || [];
        } catch (prError) {
            console.warn('Payment requests query error (table may not exist):', prError.message);
            paymentRequests = [];
        }
        
        // Bank transfer notifications (order bazlı) - payment_request_id NULL olanlar
        let bankTransfers = [];
        try {
            let bankTransferQuery = `
                SELECT 
                    btn.id,
                    btn.order_id,
                    btn.user_id,
                    btn.receipt_number,
                    btn.reference_number,
                    btn.receipt_file,
                    btn.notes,
                    btn.status,
                    btn.admin_notes,
                    btn.created_at,
                    btn.updated_at,
                    o.order_number,
                    o.final_amount as total_amount,
                    o.currency,
                    o.payment_method,
                u.username,
                u.email,
                CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) as full_name,
                    'bank_transfer_order' as source_type
                FROM bank_transfer_notifications btn
                INNER JOIN orders o ON btn.order_id = o.id
                INNER JOIN users u ON btn.user_id = u.id
                WHERE btn.payment_request_id IS NULL
            `;

            const bankTransferParams = [];
            // Status filtresi yoksa tüm pending bildirimleri getir
            // Status varsa ve 'pending_review', 'pending_approval' veya 'pending_actions' ise 'pending' status'ünü filtrele
            if (status && status !== 'all') {
                if (status === 'pending_review' || status === 'pending_approval' || status === 'pending_actions') {
                    bankTransferQuery += ' AND btn.status = ?';
                    bankTransferParams.push('pending'); // Backend'de 'pending' olarak saklanıyor
                } else if (status === 'approved' || status === 'completed') {
                    bankTransferQuery += ' AND btn.status = ?';
                    bankTransferParams.push('approved');
                } else if (status === 'rejected' || status === 'failed') {
                    bankTransferQuery += ' AND btn.status = ?';
                    bankTransferParams.push('rejected');
                } else {
                    bankTransferQuery += ' AND btn.status = ?';
                    bankTransferParams.push(status);
                }
            }

            bankTransferQuery += ' ORDER BY btn.created_at DESC';

            const [btResults] = await pool.execute(bankTransferQuery, bankTransferParams);
            bankTransfers = btResults || [];
        } catch (btError) {
            console.error('Bank transfer notifications query error:', btError);
            console.error('Error details:', btError.message, btError.sqlMessage);
            bankTransfers = [];
        }
        
        // İki sonucu birleştir ve normalize et
        const allRequests = [
            ...paymentRequests.map(pr => ({
                id: pr.id,
                user_id: pr.user_id,
                username: pr.username,
                email: pr.email,
                full_name: pr.full_name,
                total_amount: pr.total_amount,
                currency: pr.currency || 'TRY',
                payment_method: pr.payment_method,
                status: pr.status,
                reference_number: pr.reference_number,
                created_at: pr.created_at,
                source_type: pr.source_type,
                sender_name: pr.sender_name,
                bank_name: pr.bank_name,
                receipt_image: pr.receipt_image,
                receipt_file: pr.receipt_file || pr.receipt_image,
                receipt_number: pr.receipt_number || null,
                user_note: pr.user_note || null
            })),
            ...bankTransfers.map(bt => ({
                id: `bt_${bt.id}`, // Unique ID için prefix ekle
                order_id: bt.order_id,
                user_id: bt.user_id,
                username: bt.username,
                email: bt.email,
                full_name: bt.full_name,
                total_amount: bt.total_amount,
                currency: bt.currency || 'TRY',
                payment_method: 'bank_transfer',
                status: bt.status === 'pending' ? 'pending_review' : (bt.status === 'approved' ? 'approved' : (bt.status === 'rejected' ? 'rejected' : bt.status)), // Status mapping
                reference_number: bt.reference_number,
                receipt_number: bt.receipt_number,
                receipt_file: bt.receipt_file,
                notes: bt.notes,
                admin_notes: bt.admin_notes,
                order_number: bt.order_number,
                bank_name: bt.bank_name || null,
                sender_name: bt.sender_name || null,
                created_at: bt.created_at,
                updated_at: bt.updated_at,
                source_type: bt.source_type
            }))
        ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); // Tarihe göre sırala

        res.json({ requests: allRequests });
    } catch (error) {
        console.error('Get payment requests error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ 
            error: 'Sunucu hatası', 
            details: error.message,
            sqlMessage: error.sqlMessage || null,
            code: error.code || null
        });
    }
});

// Ödeme Talebi Durum Güncelleme (Onay/Red)
router.put('/payment-requests/:id/status', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params;
        const { status, note } = req.body; // status: completed, failed, cancelled

        // Mevcut talebi getir
        const [requests] = await connection.execute(
            'SELECT * FROM payment_requests WHERE id = ? FOR UPDATE',
            [id]
        );

        if (requests.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Ödeme talebi bulunamadı' });
        }

        const request = requests[0];

        // Zaten tamamlanmışsa işlem yapma
        if (request.status === 'completed') {
            await connection.rollback();
            return res.status(400).json({ error: 'Bu işlem zaten tamamlanmış' });
        }

        // Durumu güncelle
        await connection.execute(
            'UPDATE payment_requests SET status = ?, user_note = COALESCE(?, user_note) WHERE id = ?',
            [status, note || null, id]
        );

        // Eğer onaylandıysa (completed) bakiyeye ekle
        if (status === 'completed') {
            const amount = parseFloat(request.total_amount);

            // 1. Kullanıcı bakiyesini güncelle
            await connection.execute(
                'UPDATE users SET balance = balance + ? WHERE id = ?',
                [amount, request.user_id]
            );

            // 2. Transaction kaydı oluştur
            const refNumber = request.reference_number || `REF-${Date.now()}`;
            await connection.execute(
                'INSERT INTO transactions (user_id, type, amount, currency, status, description, reference_number) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [request.user_id, 'deposit', amount, 'TRY', 'completed', 'Bakiye Yükleme (Admin Onayı)', refNumber]
            );
        }

        await connection.commit();
        res.json({ message: 'Ödeme talebi güncellendi' });
    } catch (error) {
        await connection.rollback();
        console.error('Update payment request status error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    } finally {
        connection.release();
    }
});

// Bağışlar
router.get('/donations', async (req, res) => {
    try {
        const [donations] = await pool.execute(
            `SELECT d.*, u.username, p.title as project_title, p.slug as project_slug
             FROM project_donations d
             LEFT JOIN users u ON d.user_id = u.id
             LEFT JOIN projects p ON d.project_id = p.id
             ORDER BY d.created_at DESC`
        );

        // Her bağış için kupon bilgisini getir
        const donationsWithCoupons = await Promise.all(
            donations.map(async (donation) => {
                // Eğer üye olmayan kullanıcı veya user_id yoksa kupon aramaya gerek yok
                if (!donation.user_id) return donation;

                try {
                    // Kupon kodu formatı: DONATE-{projectId}-{userId}-{timestamp}
                    const couponCodePattern = `DONATE-${donation.project_id}-${donation.user_id}-%`;

                    const couponQuery = `
                        SELECT code, discount_value, status 
                        FROM coupons 
                        WHERE code LIKE ? 
                        ORDER BY created_at DESC
                        LIMIT 1
                    `;

                    const [coupons] = await pool.execute(couponQuery, [couponCodePattern]);

                    if (coupons.length > 0) {
                        donation.coupon = {
                            code: coupons[0].code,
                            discount_value: coupons[0].discount_value,
                            status: coupons[0].status
                        };
                    }
                } catch (couponError) {
                    console.warn('Coupon fetch error for donation:', donation.id, couponError.message);
                }

                return donation;
            })
        );

        res.json({ donations: donationsWithCoupons });
    } catch (error) {
        console.error('Get donations error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Abonelikler
router.get('/subscriptions/plans', async (req, res) => {
    try {
        const [plans] = await pool.execute(
            'SELECT * FROM subscription_plans ORDER BY sort_order ASC'
        );
        res.json({ plans });
    } catch (error) {
        console.error('Get subscription plans error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

router.post('/subscriptions/plans', async (req, res) => {
    try {
        const { name, slug, description, price, currency, billing_period, is_featured, status, sort_order } = req.body;

        await pool.execute(
            'INSERT INTO subscription_plans (name, slug, description, price, currency, billing_period, is_featured, status, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [name, slug, description, price, currency, billing_period, is_featured ? 1 : 0, status, sort_order || 0]
        );
        res.json({ message: 'Plan eklendi' });
    } catch (error) {
        console.error('Add subscription plan error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

router.put('/subscriptions/plans/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, slug, description, price, currency, billing_period, is_featured, status, sort_order } = req.body;

        await pool.execute(
            'UPDATE subscription_plans SET name = ?, slug = ?, description = ?, price = ?, currency = ?, billing_period = ?, is_featured = ?, status = ?, sort_order = ? WHERE id = ?',
            [name, slug, description, price, currency, billing_period, is_featured ? 1 : 0, status, sort_order || 0, id]
        );
        res.json({ message: 'Plan güncellendi' });
    } catch (error) {
        console.error('Update subscription plan error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

router.get('/subscriptions/active', async (req, res) => {
    try {
        const [subscriptions] = await pool.execute(
            `SELECT us.*, u.username, sp.name as plan_name
             FROM user_subscriptions us
             LEFT JOIN users u ON us.user_id = u.id
             LEFT JOIN subscription_plans sp ON us.plan_id = sp.id
             WHERE us.status = 'active'
             ORDER BY us.created_at DESC`
        );
        res.json({ subscriptions });
    } catch (error) {
        console.error('Get active subscriptions error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

router.get('/subscriptions/stats', async (req, res) => {
    try {
        const [totalPlans] = await pool.execute('SELECT COUNT(*) as total FROM subscription_plans');
        const [activeSubs] = await pool.execute("SELECT COUNT(*) as total FROM user_subscriptions WHERE status = 'active'");
        const [monthlyRevenue] = await pool.execute(
            `SELECT SUM(sp.price) as total 
             FROM user_subscriptions us
             LEFT JOIN subscription_plans sp ON us.plan_id = sp.id
             WHERE us.status = 'active' AND sp.billing_period = 'monthly'`
        );

        res.json({
            total_plans: totalPlans[0].total,
            active_subscriptions: activeSubs[0].total,
            monthly_revenue: monthlyRevenue[0].total || 0
        });
    } catch (error) {
        console.error('Get subscription stats error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Blog
router.get('/blog', async (req, res) => {
    try {
        const [posts] = await pool.execute(
            `SELECT bp.*, u.username 
             FROM blog_posts bp
             LEFT JOIN users u ON bp.user_id = u.id
             ORDER BY bp.created_at DESC`
        );
        res.json({ posts });
    } catch (error) {
        console.error('Get blog posts error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Blog Kategorileri (blog/:id'den önce olmalı)
router.get('/blog/categories', async (req, res) => {
    try {
        const [categories] = await pool.execute(
            'SELECT * FROM blog_categories WHERE status = "active" ORDER BY id ASC, sort_order ASC, name ASC'
        );
        res.json({ categories });
    } catch (error) {
        console.error('Get blog categories error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

router.post('/blog/categories', async (req, res) => {
    try {
        const { name, description, parent_id, sort_order } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Kategori adı gerekli' });
        }

        const slug = name.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

        // Slug'un benzersiz olduğunu kontrol et
        const [existing] = await pool.execute(
            'SELECT id FROM blog_categories WHERE slug = ?',
            [slug]
        );

        let finalSlug = slug;
        if (existing.length > 0) {
            finalSlug = `${slug}-${Date.now()}`;
        }

        await pool.execute(
            'INSERT INTO blog_categories (name, slug, description, parent_id, sort_order, status) VALUES (?, ?, ?, ?, ?, ?)',
            [name, finalSlug, description || null, parent_id || null, sort_order || 0, 'active']
        );
        res.json({ message: 'Blog kategorisi eklendi' });
    } catch (error) {
        console.error('Add blog category error:', error);
        res.status(500).json({ error: 'Sunucu hatası', details: error.message });
    }
});

// Haber Botu — fullprogramlarindir.net
router.get('/blog/news-bot/categories', (_req, res) => {
    res.json({ categories: SOURCE_CATEGORY_FILTERS });
});

router.get('/blog/news-bot/list', async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const categoryPath = String(req.query.category || '').trim();
        const items = await listNewsBotPosts(page, categoryPath);

        const [existing] = await pool.execute('SELECT title FROM blog_posts');
        const titleSet = new Set(
            existing.map((row) => (row.title || '').trim().toLowerCase())
        );

        const enriched = items.map((item) => ({
            ...item,
            exists: titleSet.has(item.title.trim().toLowerCase()),
        }));

        res.json({ items: enriched, page, category: categoryPath });
    } catch (error) {
        console.error('News bot list error:', error);
        res.status(500).json({
            error: 'Kaynak siteden liste alınamadı',
            details: error.message,
        });
    }
});

router.post('/blog/news-bot/import', async (req, res) => {
    try {
        const { url, status = 'draft' } = req.body;
        if (!url) {
            return res.status(400).json({ error: 'URL gerekli' });
        }

        const userId = req.user?.id || 1;
        const result = await importNewsBotArticle(userId, url, status);

        res.json({
            message: 'Blog yazısı içe aktarıldı',
            ...result,
        });
    } catch (error) {
        if (error.code === 'DUPLICATE') {
            return res.status(409).json({
                error: error.message,
                existing_id: error.existing_id,
                title: error.title,
            });
        }
        console.error('News bot import error:', error);
        res.status(500).json({
            error: 'İçe aktarma başarısız',
            details: error.message,
        });
    }
});

router.post('/blog/:id/retranslate', async (req, res) => {
    try {
        const { id } = req.params;
        const langs = (req.body.langs || ['en', 'de']).filter((l) => l !== 'tr');

        const { ensureBlogLanguage } = await import('../services/blogTranslationStore.js');
        for (const lang of langs) {
            await ensureBlogLanguage(id, lang);
        }

        res.json({ message: 'Çeviriler güncellendi', langs });
    } catch (error) {
        console.error('Blog retranslate error:', error);
        res.status(500).json({ error: 'Çeviri başarısız', details: error.message });
    }
});

router.post('/blog/news-bot/import-bulk', async (req, res) => {
    try {
        const { urls, status = 'draft' } = req.body;
        if (!Array.isArray(urls) || urls.length === 0) {
            return res.status(400).json({ error: 'En az bir URL gerekli' });
        }

        const userId = req.user?.id || 1;
        const results = { success: [], skipped: [], failed: [] };

        for (const url of urls) {
            try {
                const data = await importNewsBotArticle(userId, url, status);
                results.success.push({ url, ...data });
            } catch (error) {
                if (error.code === 'DUPLICATE') {
                    results.skipped.push({ url, title: error.title, reason: error.message });
                } else {
                    results.failed.push({ url, error: error.message });
                }
            }
        }

        res.json({
            message: `${results.success.length} yazı eklendi, ${results.skipped.length} atlandı, ${results.failed.length} hata`,
            ...results,
        });
    } catch (error) {
        console.error('News bot bulk import error:', error);
        res.status(500).json({ error: 'Toplu içe aktarma başarısız', details: error.message });
    }
});

router.get('/blog/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [posts] = await pool.execute(
            `SELECT bp.*, u.username, bc.name as category_name
             FROM blog_posts bp
             LEFT JOIN users u ON bp.user_id = u.id
             LEFT JOIN blog_categories bc ON bp.category_id = bc.id
             WHERE bp.id = ?`,
            [id]
        );

        if (posts.length === 0) {
            return res.status(404).json({ error: 'Blog yazısı bulunamadı' });
        }

        const post = posts[0];

        // Çok dilli içerikleri getir
        let translations = [];
        try {
            [translations] = await pool.execute(
                `SELECT language_code, title, description, short_description 
                 FROM content_translations 
                 WHERE content_id = ? AND content_type = 'blog'`,
                [post.id]
            );
        } catch (err) {
            console.warn('Content translations table not available or error:', err.message);
            translations = [];
        }

        post.translations = {};
        translations.forEach(t => {
            post.translations[t.language_code] = {
                title: t.title,
                description: t.description,
                short_description: t.short_description
            };
        });

        res.json({ post });
    } catch (error) {
        console.error('Get blog post error:', error);
        res.status(500).json({ error: 'Sunucu hatası', details: error.message });
    }
});

router.post('/blog', blogUpload.single('cover_image'), async (req, res) => {
    try {
        const userId = req.user?.id || 1; // Admin user
        const {
            title, title_tr, title_en, title_de,
            excerpt, excerpt_tr, excerpt_en, excerpt_de,
            content, content_tr, content_en, content_de,
            category_id, status, is_featured,
            meta_title, meta_description, meta_keywords,
            cover_image, published_at
        } = req.body;

        if (!title && !title_tr) {
            return res.status(400).json({ error: 'Başlık gerekli' });
        }

        const finalTitle = title_tr || title;
        const slug = finalTitle.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

        // Slug'un benzersiz olduğunu kontrol et
        const [existing] = await pool.execute(
            'SELECT id FROM blog_posts WHERE slug = ?',
            [slug]
        );

        let finalSlug = slug;
        if (existing.length > 0) {
            finalSlug = `${slug}-${Date.now()}`;
        }

        const finalContent = content_tr || content || '';
        const finalExcerpt = excerpt_tr || excerpt || '';

        const [result] = await pool.execute(
            `INSERT INTO blog_posts (
                user_id, title, slug, excerpt, content, category_id, status, 
                is_featured, meta_title, meta_description, meta_keywords, 
                cover_image, published_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                userId,
                finalTitle,
                finalSlug,
                finalExcerpt,
                finalContent,
                category_id || null,
                status || 'draft',
                is_featured ? 1 : 0,
                meta_title || null,
                meta_description || null,
                meta_keywords || null,
                req.file ? `blog/${req.file.filename}` : (cover_image || null),
                published_at || (status === 'published' ? new Date() : null)
            ]
        );

        const postId = result.insertId;

        // Çok dilli içerikleri kaydet
        if (title_tr || content_tr || excerpt_tr) {
            await pool.execute(
                `INSERT INTO content_translations (content_id, content_type, language_code, title, description, short_description)
                 VALUES (?, 'blog', 'tr', ?, ?, ?)
                 ON DUPLICATE KEY UPDATE title = COALESCE(?, title), description = COALESCE(?, description), short_description = COALESCE(?, short_description)`,
                [postId, title_tr || title, content_tr || content, excerpt_tr || excerpt,
                    title_tr || title, content_tr || content, excerpt_tr || excerpt]
            );
        }

        if (title_en || content_en || excerpt_en) {
            await pool.execute(
                `INSERT INTO content_translations (content_id, content_type, language_code, title, description, short_description)
                 VALUES (?, 'blog', 'en', ?, ?, ?)
                 ON DUPLICATE KEY UPDATE title = COALESCE(?, title), description = COALESCE(?, description), short_description = COALESCE(?, short_description)`,
                [postId, title_en, content_en, excerpt_en,
                    title_en, content_en, excerpt_en]
            );
        }

        if (title_de || content_de || excerpt_de) {
            await pool.execute(
                `INSERT INTO content_translations (content_id, content_type, language_code, title, description, short_description)
                 VALUES (?, 'blog', 'de', ?, ?, ?)
                 ON DUPLICATE KEY UPDATE title = COALESCE(?, title), description = COALESCE(?, description), short_description = COALESCE(?, short_description)`,
                [postId, title_de, content_de, excerpt_de,
                    title_de, content_de, excerpt_de]
            );
        }

        res.json({ message: 'Blog yazısı eklendi', post_id: postId });
    } catch (error) {
        console.error('Add blog post error:', error);
        res.status(500).json({ error: 'Sunucu hatası', details: error.message });
    }
});

router.put('/blog/:id', blogUpload.single('cover_image'), async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title, title_tr, title_en, title_de,
            excerpt, excerpt_tr, excerpt_en, excerpt_de,
            content, content_tr, content_en, content_de,
            category_id, status, is_featured,
            meta_title, meta_description, meta_keywords,
            cover_image, published_at
        } = req.body;

        // Projenin varlığını kontrol et
        const [existing] = await pool.execute(
            'SELECT id FROM blog_posts WHERE id = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ error: 'Blog yazısı bulunamadı' });
        }

        const updates = [];
        const values = [];

        const finalTitle = title_tr || title;
        if (finalTitle !== undefined) {
            updates.push('title = ?');
            values.push(finalTitle);
            const slug = finalTitle.toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');
            updates.push('slug = ?');
            values.push(slug);
        }

        const finalExcerpt = excerpt_tr || excerpt;
        if (finalExcerpt !== undefined) {
            updates.push('excerpt = ?');
            values.push(finalExcerpt);
        }

        const finalContent = content_tr || content;
        if (finalContent !== undefined) {
            updates.push('content = ?');
            values.push(finalContent);
        }

        if (category_id !== undefined) {
            updates.push('category_id = ?');
            values.push(category_id || null);
        }

        if (status !== undefined) {
            updates.push('status = ?');
            values.push(status);
        }

        if (is_featured !== undefined) {
            updates.push('is_featured = ?');
            values.push(is_featured ? 1 : 0);
        }

        if (meta_title !== undefined) {
            updates.push('meta_title = ?');
            values.push(meta_title || null);
        }

        if (meta_description !== undefined) {
            updates.push('meta_description = ?');
            values.push(meta_description || null);
        }

        if (meta_keywords !== undefined) {
            updates.push('meta_keywords = ?');
            values.push(meta_keywords || null);
        }

        if (req.file || cover_image !== undefined) {
            updates.push('cover_image = ?');
            values.push(req.file ? `blog/${req.file.filename}` : (cover_image || null));
        }

        if (published_at !== undefined) {
            updates.push('published_at = ?');
            values.push(published_at || (status === 'published' ? new Date() : null));
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'Güncellenecek alan belirtilmedi' });
        }

        updates.push('updated_at = NOW()');
        values.push(id);

        await pool.execute(
            `UPDATE blog_posts SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        // Çok dilli içerikleri güncelle
        if (title_tr || content_tr || excerpt_tr) {
            await pool.execute(
                `INSERT INTO content_translations (content_id, content_type, language_code, title, description, short_description)
                 VALUES (?, 'blog', 'tr', ?, ?, ?)
                 ON DUPLICATE KEY UPDATE title = COALESCE(?, title), description = COALESCE(?, description), short_description = COALESCE(?, short_description)`,
                [id, title_tr || title, content_tr || content, excerpt_tr || excerpt,
                    title_tr || title, content_tr || content, excerpt_tr || excerpt]
            );
        }

        if (title_en || content_en || excerpt_en) {
            await pool.execute(
                `INSERT INTO content_translations (content_id, content_type, language_code, title, description, short_description)
                 VALUES (?, 'blog', 'en', ?, ?, ?)
                 ON DUPLICATE KEY UPDATE title = COALESCE(?, title), description = COALESCE(?, description), short_description = COALESCE(?, short_description)`,
                [id, title_en, content_en, excerpt_en,
                    title_en, content_en, excerpt_en]
            );
        }

        if (title_de || content_de || excerpt_de) {
            await pool.execute(
                `INSERT INTO content_translations (content_id, content_type, language_code, title, description, short_description)
                 VALUES (?, 'blog', 'de', ?, ?, ?)
                 ON DUPLICATE KEY UPDATE title = COALESCE(?, title), description = COALESCE(?, description), short_description = COALESCE(?, short_description)`,
                [id, title_de, content_de, excerpt_de,
                    title_de, content_de, excerpt_de]
            );
        }

        res.json({ message: 'Blog yazısı güncellendi' });
    } catch (error) {
        console.error('Update blog post error:', error);
        res.status(500).json({ error: 'Sunucu hatası', details: error.message });
    }
});

router.delete('/blog/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.execute('DELETE FROM blog_posts WHERE id = ?', [id]);
        res.json({ message: 'Yazı silindi' });
    } catch (error) {
        console.error('Delete blog post error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Kategoriler (projeler için - eski endpoint)
router.get('/categories', async (req, res) => {
    try {
        const [categories] = await pool.execute(
            'SELECT * FROM categories ORDER BY sort_order ASC, name ASC'
        );
        res.json({ categories });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

router.post('/categories', async (req, res) => {
    try {
        const { name, slug, description, parent_id, icon, sort_order, status } = req.body;

        await pool.execute(
            'INSERT INTO categories (name, slug, description, parent_id, icon, sort_order, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, slug, description || null, parent_id || null, icon || null, sort_order || 0, status]
        );
        res.json({ message: 'Kategori eklendi' });
    } catch (error) {
        console.error('Add category error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

router.put('/categories/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, slug, description, parent_id, icon, sort_order, status } = req.body;

        await pool.execute(
            'UPDATE categories SET name = ?, slug = ?, description = ?, parent_id = ?, icon = ?, sort_order = ?, status = ? WHERE id = ?',
            [name, slug, description || null, parent_id || null, icon || null, sort_order || 0, status, id]
        );
        res.json({ message: 'Kategori güncellendi' });
    } catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

router.delete('/categories/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.execute('DELETE FROM categories WHERE id = ?', [id]);
        res.json({ message: 'Kategori silindi' });
    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Sayfalar
router.get('/pages', async (req, res) => {
    try {
        const [pages] = await pool.execute(
            'SELECT * FROM pages ORDER BY created_at DESC'
        );
        res.json({ pages });
    } catch (error) {
        console.error('Get pages error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

router.get('/pages/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [pages] = await pool.execute(
            'SELECT * FROM pages WHERE id = ?',
            [id]
        );

        if (pages.length === 0) {
            return res.status(404).json({ error: 'Sayfa bulunamadı' });
        }

        const page = pages[0];

        // Çevirileri yükle
        let translations = {};
        try {
            const [transRows] = await pool.execute(
                `SELECT language_code, title, description, extra_data 
                 FROM content_translations 
                 WHERE content_id = ? AND content_type = 'page'`,
                [id]
            );
            transRows.forEach(t => {
                let extraData = {};
                try {
                    extraData = t.extra_data ? JSON.parse(t.extra_data) : {};
                } catch (e) {
                    console.warn('Failed to parse extra_data:', e);
                }
                translations[t.language_code] = {
                    title: t.title,
                    description: t.description,
                    extra_data: extraData
                };
            });
        } catch (err) {
            console.warn('Content translations table not available or error:', err.message);
        }

        res.json({ page, translations });
    } catch (error) {
        console.error('Get page error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

router.post('/pages', async (req, res) => {
    try {
        const {
            title, slug, content, meta_title, meta_description, status,
            title_tr, content_tr, title_en, content_en, title_de, content_de
        } = req.body;

        const {
            slug_tr, meta_title_tr, meta_description_tr,
            slug_en, meta_title_en, meta_description_en,
            slug_de, meta_title_de, meta_description_de
        } = req.body;

        const [result] = await pool.execute(
            'INSERT INTO pages (title, slug, content, meta_title, meta_description, status) VALUES (?, ?, ?, ?, ?, ?)',
            [title || title_tr, slug || slug_tr, content || content_tr, meta_title || meta_title_tr || null, meta_description || meta_description_tr || null, status]
        );

        const pageId = result.insertId;

        // Çok dilli içerik kaydet
        if (title_tr || content_tr) {
            try {
                const extraDataTr = JSON.stringify({
                    slug: slug_tr || null,
                    meta_title: meta_title_tr || null,
                    meta_description: meta_description_tr || null
                });
                await pool.execute(
                    `INSERT INTO content_translations (content_id, content_type, language_code, title, description, extra_data)
                     VALUES (?, 'page', 'tr', ?, ?, ?)
                     ON DUPLICATE KEY UPDATE title = COALESCE(?, title), description = COALESCE(?, description), extra_data = ?`,
                    [pageId, title_tr || title, content_tr || content, extraDataTr, title_tr || title, content_tr || content, extraDataTr]
                );
            } catch (err) {
                console.warn('TR translation save error:', err.message);
            }
        }

        if (title_en || content_en) {
            try {
                const extraDataEn = JSON.stringify({
                    slug: slug_en || null,
                    meta_title: meta_title_en || null,
                    meta_description: meta_description_en || null
                });
                await pool.execute(
                    `INSERT INTO content_translations (content_id, content_type, language_code, title, description, extra_data)
                     VALUES (?, 'page', 'en', ?, ?, ?)
                     ON DUPLICATE KEY UPDATE title = COALESCE(?, title), description = COALESCE(?, description), extra_data = ?`,
                    [pageId, title_en, content_en, extraDataEn, title_en, content_en, extraDataEn]
                );
            } catch (err) {
                console.warn('EN translation save error:', err.message);
            }
        }

        if (title_de || content_de) {
            try {
                const extraDataDe = JSON.stringify({
                    slug: slug_de || null,
                    meta_title: meta_title_de || null,
                    meta_description: meta_description_de || null
                });
                await pool.execute(
                    `INSERT INTO content_translations (content_id, content_type, language_code, title, description, extra_data)
                     VALUES (?, 'page', 'de', ?, ?, ?)
                     ON DUPLICATE KEY UPDATE title = COALESCE(?, title), description = COALESCE(?, description), extra_data = ?`,
                    [pageId, title_de, content_de, extraDataDe, title_de, content_de, extraDataDe]
                );
            } catch (err) {
                console.warn('DE translation save error:', err.message);
            }
        }

        res.json({ message: 'Sayfa eklendi', id: pageId });
    } catch (error) {
        console.error('Add page error:', error);
        res.status(500).json({ error: 'Sunucu hatası', details: error.message });
    }
});

router.put('/pages/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title, slug, content, meta_title, meta_description, status,
            title_tr, content_tr, title_en, content_en, title_de, content_de,
            slug_tr, meta_title_tr, meta_description_tr,
            slug_en, meta_title_en, meta_description_en,
            slug_de, meta_title_de, meta_description_de
        } = req.body;

        await pool.execute(
            'UPDATE pages SET title = ?, slug = ?, content = ?, meta_title = ?, meta_description = ?, status = ? WHERE id = ?',
            [title || title_tr, slug || slug_tr, content || content_tr, meta_title || meta_title_tr || null, meta_description || meta_description_tr || null, status, id]
        );

        // Çok dilli içerik güncelle
        if (title_tr || content_tr) {
            try {
                await pool.execute(
                    `INSERT INTO content_translations (content_id, content_type, language_code, title, description)
                     VALUES (?, 'page', 'tr', ?, ?)
                     ON DUPLICATE KEY UPDATE title = COALESCE(?, title), description = COALESCE(?, description)`,
                    [id, title_tr || title, content_tr || content, title_tr || title, content_tr || content]
                );
            } catch (err) {
                console.warn('TR translation update error:', err.message);
            }
        }

        if (title_en || content_en) {
            try {
                await pool.execute(
                    `INSERT INTO content_translations (content_id, content_type, language_code, title, description)
                     VALUES (?, 'page', 'en', ?, ?)
                     ON DUPLICATE KEY UPDATE title = COALESCE(?, title), description = COALESCE(?, description)`,
                    [id, title_en, content_en, title_en, content_en]
                );
            } catch (err) {
                console.warn('EN translation update error:', err.message);
            }
        }

        if (title_de || content_de) {
            try {
                await pool.execute(
                    `INSERT INTO content_translations (content_id, content_type, language_code, title, description)
                     VALUES (?, 'page', 'de', ?, ?)
                     ON DUPLICATE KEY UPDATE title = COALESCE(?, title), description = COALESCE(?, description)`,
                    [id, title_de, content_de, title_de, content_de]
                );
            } catch (err) {
                console.warn('DE translation update error:', err.message);
            }
        }

        res.json({ message: 'Sayfa güncellendi' });
    } catch (error) {
        console.error('Update page error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

router.delete('/pages/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.execute('DELETE FROM pages WHERE id = ?', [id]);
        res.json({ message: 'Sayfa silindi' });
    } catch (error) {
        console.error('Delete page error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Menüler (menu_items tablosu kullanarak)
router.get('/menus/:type', async (req, res) => {
    try {
        const { type } = req.params;
        const language = req.query.lang || 'tr'; // Dil parametresi
        
        const [items] = await pool.execute(
            'SELECT * FROM menu_items WHERE menu_type = ? ORDER BY `order` ASC',
            [type]
        );

        // Her menü öğesi için sayfa çevirilerini yükle
        const itemsWithTranslations = await Promise.all(items.map(async (item) => {
            // URL'den slug çıkar (örn: /hakkimizda -> hakkimizda)
            const urlPath = item.url?.replace(/^\//, '') || '';
            if (!urlPath || urlPath.startsWith('http')) {
                return { ...item, translated_title: item.title };
            }

            try {
                // Önce pages tablosundan slug'a göre sayfayı bul
                const [pages] = await pool.execute(
                    'SELECT id FROM pages WHERE slug = ? AND status = ?',
                    [urlPath, 'active']
                );

                let pageId = null;
                
                if (pages.length > 0) {
                    pageId = pages[0].id;
                } else {
                    // extra_data'dan slug kontrolü yap (tüm çevirileri kontrol et)
                    const [allTrans] = await pool.execute(
                        `SELECT ct.content_id, ct.extra_data 
                         FROM content_translations ct
                         INNER JOIN pages p ON ct.content_id = p.id
                         WHERE ct.content_type = 'page' AND p.status = ?`,
                        ['active']
                    );
                    
                    for (const trans of allTrans) {
                        if (trans.extra_data) {
                            try {
                                const extraData = typeof trans.extra_data === 'string' 
                                    ? JSON.parse(trans.extra_data) 
                                    : trans.extra_data;
                                if (extraData.slug === urlPath) {
                                    pageId = trans.content_id;
                                    break;
                                }
                            } catch (e) {
                                // JSON parse hatası, devam et
                            }
                        }
                    }
                }
                
                if (!pageId) {
                    return { ...item, translated_title: item.title };
                }

                // Çeviriyi yükle
                const [transRows] = await pool.execute(
                    `SELECT title 
                     FROM content_translations 
                     WHERE content_id = ? AND content_type = 'page' AND language_code = ?`,
                    [pageId, language]
                );

                if (transRows.length > 0 && transRows[0].title) {
                    return { ...item, translated_title: transRows[0].title };
                }

                // Fallback: TR çevirisi
                const [trRows] = await pool.execute(
                    `SELECT title FROM content_translations 
                     WHERE content_id = ? AND content_type = 'page' AND language_code = 'tr'`,
                    [pageId]
                );

                if (trRows.length > 0 && trRows[0].title) {
                    return { ...item, translated_title: trRows[0].title };
                }
                
                // Fallback: pages tablosundan başlık
                const [pageRows] = await pool.execute(
                    'SELECT title FROM pages WHERE id = ?',
                    [pageId]
                );
                
                if (pageRows.length > 0 && pageRows[0].title) {
                    return { ...item, translated_title: pageRows[0].title };
                }
            } catch (err) {
                console.warn('Menu translation load error for item:', item.id, err.message);
            }

            return { ...item, translated_title: item.title };
        }));

        res.json({ items: itemsWithTranslations });
    } catch (error) {
        // Eğer tablo yoksa boş dizi döndür
        if (error.code === 'ER_NO_SUCH_TABLE') {
            res.json({ items: [] });
        } else {
            console.error('Get menu items error:', error);
            res.status(500).json({ error: 'Sunucu hatası' });
        }
    }
});

router.post('/menus/:type', async (req, res) => {
    try {
        const { type } = req.params;
        const { title, url, icon, order, parent_id, target, status } = req.body;

        await pool.execute(
            'INSERT INTO menu_items (menu_type, title, url, icon, `order`, parent_id, target, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [type, title, url, icon || null, order || 0, parent_id || null, target || '_self', status || 'active']
        );
        res.json({ message: 'Menü öğesi eklendi' });
    } catch (error) {
        if (error.code === 'ER_NO_SUCH_TABLE') {
            res.status(400).json({ error: 'menu_items tablosu bulunamadı. Lütfen database_admin_tables.sql dosyasını çalıştırın.' });
        } else {
            console.error('Add menu item error:', error);
            res.status(500).json({ error: 'Sunucu hatası' });
        }
    }
});

router.put('/menus/:type/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, url, icon, order, parent_id, target, status } = req.body;

        await pool.execute(
            'UPDATE menu_items SET title = ?, url = ?, icon = ?, `order` = ?, parent_id = ?, target = ?, status = ? WHERE id = ?',
            [title, url, icon || null, order || 0, parent_id || null, target || '_self', status || 'active', id]
        );
        res.json({ message: 'Menü öğesi güncellendi' });
    } catch (error) {
        if (error.code === 'ER_NO_SUCH_TABLE') {
            res.status(400).json({ error: 'menu_items tablosu bulunamadı. Lütfen database_admin_tables.sql dosyasını çalıştırın.' });
        } else {
            console.error('Update menu item error:', error);
            res.status(500).json({ error: 'Sunucu hatası' });
        }
    }
});

router.delete('/menus/:type/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.execute('DELETE FROM menu_items WHERE id = ?', [id]);
        res.json({ message: 'Menü öğesi silindi' });
    } catch (error) {
        if (error.code === 'ER_NO_SUCH_TABLE') {
            res.status(400).json({ error: 'menu_items tablosu bulunamadı. Lütfen database_admin_tables.sql dosyasını çalıştırın.' });
        } else {
            console.error('Delete menu item error:', error);
            res.status(500).json({ error: 'Sunucu hatası' });
        }
    }
});

router.put('/menus/:type/:id/move', async (req, res) => {
    try {
        const { id } = req.params;
        const { direction } = req.body;

        // Sıralama mantığı - basit implementasyon
        const [current] = await pool.execute('SELECT `order` FROM menu_items WHERE id = ?', [id]);
        if (current.length === 0) {
            return res.status(404).json({ error: 'Menü öğesi bulunamadı' });
        }

        const currentOrder = current[0].order;
        const newOrder = direction === 'up' ? currentOrder - 1 : currentOrder + 1;

        // Diğer öğenin sırasını değiştir
        await pool.execute('UPDATE menu_items SET `order` = ? WHERE `order` = ? AND id != ?', [currentOrder, newOrder, id]);
        // Mevcut öğenin sırasını güncelle
        await pool.execute('UPDATE menu_items SET `order` = ? WHERE id = ?', [newOrder, id]);

        res.json({ message: 'Menü öğesi taşındı' });
    } catch (error) {
        if (error.code === 'ER_NO_SUCH_TABLE') {
            res.status(400).json({ error: 'menu_items tablosu bulunamadı. Lütfen database_admin_tables.sql dosyasını çalıştırın.' });
        } else {
            console.error('Move menu item error:', error);
            res.status(500).json({ error: 'Sunucu hatası' });
        }
    }
});

router.put('/menus/:type/reorder', async (req, res) => {
    try {
        const { type } = req.params;
        const { items } = req.body; // [{id, order, parent_id}, ...]

        // Transaction başlat
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            for (const item of items) {
                await connection.execute(
                    'UPDATE menu_items SET `order` = ?, parent_id = ? WHERE id = ? AND menu_type = ?',
                    [item.order, item.parent_id || null, item.id, type]
                );
            }

            await connection.commit();
            res.json({ message: 'Menü sıralaması güncellendi' });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Reorder menu items error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

router.put('/users/:id/unban', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.execute('UPDATE users SET status = ?, ban_note = NULL WHERE id = ?', ['active', id]);
        res.json({ message: 'Kullanıcı yasağı kaldırıldı' });
    } catch (error) {
        console.error('Unban user error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Muhasebe - Bekleyen Faturalar
router.get('/accounting/pending-invoices', async (req, res) => {
    try {
        // Önce mevcut faturaları çek
        let invoicesQuery = `
            SELECT 
                i.*, 
                u.username,
                o.order_number,
                o.payment_status,
                o.order_status,
                'invoice' as source_type
            FROM invoices i 
            LEFT JOIN users u ON i.user_id = u.id 
            LEFT JOIN orders o ON i.order_id = o.id
            WHERE i.status IN ('draft', 'sent') 
            ORDER BY i.created_at DESC
        `;
        const [invoices] = await pool.execute(invoicesQuery);

        // Şimdi fatura oluşturulmamış siparişleri çek (bunlar da bekleyen fatura olarak gösterilecek)
        let ordersQuery = `
            SELECT 
                o.id as order_id,
                o.order_number as invoice_number,
                o.user_id,
                u.username,
                o.final_amount as total_amount,
                o.currency,
                o.payment_status,
                o.order_status,
                o.created_at as invoice_date,
                o.created_at,
                'pending' as status,
                'order' as source_type,
                NULL as invoice_id,
                GROUP_CONCAT(DISTINCT p.title SEPARATOR ', ') as project_titles,
                COUNT(DISTINCT oi.id) as item_count
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN projects p ON oi.project_id = p.id
            WHERE o.payment_status = 'paid' 
            AND o.order_status IN ('completed', 'processing')
            AND NOT EXISTS (
                SELECT 1 FROM invoices i WHERE i.order_id = o.id
            )
            GROUP BY o.id
            ORDER BY o.created_at DESC
        `;
        const [orders] = await pool.execute(ordersQuery);

        // Her iki kaynağı birleştir
        const allInvoices = [
            ...invoices.map(inv => ({ ...inv, source_type: 'invoice' })),
            ...orders.map(ord => ({
                ...ord,
                id: ord.order_id, // order_id'yi id olarak kullan
                order_id: ord.order_id, // order_id'yi de koru (frontend için)
                source_type: 'order',
                invoice_number: ord.invoice_number || `ORD-${ord.order_id}`,
                total_amount: parseFloat(ord.total_amount) || 0
            }))
        ];

        res.json({ invoices: allInvoices });
    } catch (error) {
        if (error.code === 'ER_NO_SUCH_TABLE') {
            // Eğer invoices tablosu yoksa sadece siparişleri döndür
            try {
                const [orders] = await pool.execute(
                    `SELECT 
                        o.id as order_id,
                        o.order_number as invoice_number,
                        o.user_id,
                        u.username,
                        o.final_amount as total_amount,
                        o.currency,
                        o.payment_status,
                        o.order_status,
                        o.created_at as invoice_date,
                        o.created_at,
                        'pending' as status,
                        'order' as source_type,
                        GROUP_CONCAT(DISTINCT p.title SEPARATOR ', ') as project_titles,
                        COUNT(DISTINCT oi.id) as item_count
                    FROM orders o
                    LEFT JOIN users u ON o.user_id = u.id
                    LEFT JOIN order_items oi ON o.id = oi.order_id
                    LEFT JOIN projects p ON oi.project_id = p.id
                    WHERE o.payment_status = 'paid' 
                    AND o.order_status IN ('completed', 'processing')
                    GROUP BY o.id
                    ORDER BY o.created_at DESC`
                );
                res.json({
                    invoices: orders.map(ord => ({
                        ...ord,
                        id: ord.order_id,
                        order_id: ord.order_id, // order_id'yi de koru (frontend için)
                        source_type: 'order',
                        invoice_number: ord.invoice_number || `ORD-${ord.order_id}`
                    }))
                });
            } catch (err) {
                console.error('Get orders error:', err);
                res.json({ invoices: [] });
            }
        } else {
            console.error('Get pending invoices error:', error);
            res.status(500).json({ error: 'Sunucu hatası' });
        }
    }
});

// Muhasebe - Onaylanan Faturalar
router.get('/accounting/approved-invoices', async (req, res) => {
    try {
        const { status } = req.query;
        let query = `SELECT i.*, u.username 
                     FROM invoices i 
                     LEFT JOIN users u ON i.user_id = u.id 
                     WHERE i.status IN ('paid', 'overdue', 'sent')`;
        const params = [];

        if (status && status !== 'all') {
            query += ' AND i.status = ?';
            params.push(status);
        }

        query += ' ORDER BY i.created_at DESC';

        const [invoices] = await pool.execute(query, params);
        res.json({ invoices });
    } catch (error) {
        if (error.code === 'ER_NO_SUCH_TABLE') {
            res.json({ invoices: [] });
        } else {
            console.error('Get approved invoices error:', error);
            res.status(500).json({ error: 'Sunucu hatası' });
        }
    }
});

router.put('/accounting/invoices/:id/approve', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.execute('UPDATE invoices SET status = ? WHERE id = ?', ['paid', id]);
        res.json({ message: 'Fatura onaylandı' });
    } catch (error) {
        console.error('Approve invoice error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

router.put('/accounting/invoices/:id/reject', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.execute('UPDATE invoices SET status = ? WHERE id = ?', ['cancelled', id]);
        res.json({ message: 'Fatura reddedildi' });
    } catch (error) {
        console.error('Reject invoice error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Fatura detayı
router.get('/accounting/invoices/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Faturayı getir
        const [invoices] = await pool.execute(
            `SELECT i.*, u.username, u.email, u.phone,
                    o.order_number, o.final_amount as order_amount, o.currency as order_currency,
                    o.payment_status, o.order_status
             FROM invoices i
             LEFT JOIN users u ON i.user_id = u.id
             LEFT JOIN orders o ON i.order_id = o.id
             WHERE i.id = ?`,
            [id]
        );

        if (invoices.length === 0) {
            return res.status(404).json({ error: 'Fatura bulunamadı' });
        }

        const invoice = invoices[0];

        // Sipariş kalemlerini getir (eğer sipariş varsa)
        let orderItems = [];
        if (invoice.order_id) {
            try {
                const [items] = await pool.execute(
                    `SELECT oi.*, p.title as project_title, p.image_url as project_image
                     FROM order_items oi
                     LEFT JOIN projects p ON oi.project_id = p.id
                     WHERE oi.order_id = ?
                     ORDER BY oi.id`,
                    [invoice.order_id]
                );
                orderItems = items;
            } catch (err) {
                console.error('Get order items error:', err);
            }
        }

        res.json({
            invoice: {
                ...invoice,
                order_items: orderItems
            }
        });
    } catch (error) {
        console.error('Get invoice detail error:', error);
        res.status(500).json({ error: 'Sunucu hatası', details: error.message });
    }
});

// Siparişten fatura oluştur
router.post('/accounting/invoices/create-from-order', async (req, res) => {
    try {
        const { order_id } = req.body;

        if (!order_id) {
            console.error('Create invoice error: order_id eksik', req.body);
            return res.status(400).json({ error: 'Sipariş ID gerekli', received: req.body });
        }

        // Siparişi kontrol et
        const [orders] = await pool.execute(
            `SELECT o.*, u.username 
             FROM orders o
             LEFT JOIN users u ON o.user_id = u.id
             WHERE o.id = ?`,
            [order_id]
        );

        if (orders.length === 0) {
            return res.status(404).json({ error: 'Sipariş bulunamadı' });
        }

        const order = orders[0];

        // Zaten fatura var mı kontrol et
        const [existingInvoices] = await pool.execute(
            'SELECT id FROM invoices WHERE order_id = ?',
            [order_id]
        );

        if (existingInvoices.length > 0) {
            return res.status(400).json({ error: 'Bu sipariş için zaten fatura oluşturulmuş' });
        }

        // Fatura numarası oluştur
        const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        // KDV hesapla (%18)
        const taxRate = 0.18;
        const amount = parseFloat(order.final_amount);
        const taxAmount = amount * taxRate;
        const totalAmount = amount + taxAmount;

        // Fatura oluştur
        const [result] = await pool.execute(
            `INSERT INTO invoices (
                invoice_number, order_id, user_id, amount, tax_amount, total_amount, 
                currency, invoice_date, due_date, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 'draft')`,
            [
                invoiceNumber,
                order_id,
                order.user_id,
                amount,
                taxAmount,
                totalAmount,
                order.currency || 'TRY'
            ]
        );

        res.json({
            message: 'Fatura başarıyla oluşturuldu',
            invoice_id: result.insertId,
            invoice_number: invoiceNumber
        });
    } catch (error) {
        if (error.code === 'ER_NO_SUCH_TABLE') {
            res.status(400).json({ error: 'invoices tablosu bulunamadı. Lütfen database_missing_tables.sql dosyasını çalıştırın.' });
        } else {
            console.error('Create invoice from order error:', error);
            res.status(500).json({ error: 'Sunucu hatası', details: error.message });
        }
    }
});

// Settings Routes
router.get('/settings/:group', async (req, res) => {
    try {
        const { group } = req.params;

        // Eğer 'general' grubu ise, 'financial' grubundaki commission_rate'leri de dahil et
        let settings = [];
        if (group === 'general') {
            // 'general' grubundaki ayarları al
            const [generalSettings] = await pool.execute(
                'SELECT `key`, `value`, `type` FROM settings WHERE `group` = ?',
                [group]
            );
            settings = generalSettings;

            // 'financial' grubundaki komisyon oranlarını da ekle
            const [financialSettings] = await pool.execute(
                "SELECT `key`, `value`, `type` FROM settings WHERE `group` = 'financial' AND `key` IN ('commission_rate', 'commission_rate_silver', 'commission_rate_gold', 'commission_rate_platinum')",
                []
            );
            settings = [...settings, ...financialSettings];
        } else {
            const [groupSettings] = await pool.execute(
                'SELECT `key`, `value`, `type` FROM settings WHERE `group` = ?',
                [group]
            );
            settings = groupSettings;
        }

        const result = {};
        settings.forEach(setting => {
            if (setting.type === 'boolean') {
                result[setting.key] = setting.value === '1' || setting.value === 'true';
            } else if (setting.type === 'number') {
                result[setting.key] = parseFloat(setting.value) || 0;
            } else {
                result[setting.key] = setting.value;
            }
        });

        // Logo path'ini olduğu gibi bırak - frontend getImageUrl fonksiyonu doğru URL'i oluşturacak
        // Sadece http ile başlamıyorsa ve zaten uploads/ ile başlamıyorsa kontrol et
        if (result.logo && !result.logo.startsWith('http') && !result.logo.startsWith('uploads/')) {
            // Eğer sadece dosya adı varsa uploads/logo/ ekle
            if (!result.logo.includes('/')) {
                result.logo = `uploads/logo/${result.logo}`;
            }
        }

        res.json(result);
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Maintenance settings için özel endpoint (çok dilli destek)
router.get('/settings/maintenance', async (req, res) => {
    try {
        const [settings] = await pool.execute(
            'SELECT `key`, `value`, `type` FROM settings WHERE `group` = ?',
            ['maintenance']
        );

        const result = {
            enabled: false,
            message_tr: 'Site bakımda. Lütfen daha sonra tekrar deneyin.',
            message_en: 'Site is under maintenance. Please try again later.',
            message_de: 'Die Website befindet sich im Wartungsmodus. Bitte versuchen Sie es später erneut.',
            allowedIps: '',
            access_password: '' // Şifre döndürülmez, sadece varlığı kontrol edilir
        };

        settings.forEach(setting => {
            if (setting.type === 'boolean') {
                result[setting.key] = setting.value === '1' || setting.value === 'true';
            } else {
                result[setting.key] = setting.value;
            }
        });

        res.json(result);
    } catch (error) {
        console.error('Get maintenance settings error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

router.put('/settings/:group', logoUpload.single('logo_file'), async (req, res) => {
    try {
        const { group } = req.params;
        const settings = req.body;

        // Logo dosyası yüklendiyse
        if (req.file && group === 'general') {
            const logoPath = `uploads/logo/${req.file.filename}`;
            // settings objesine logo ekle
            settings.logo = logoPath;
            req.body.logo = logoPath;
            console.log('✅ Logo yüklendi:', logoPath);
        }

        // FormData'dan gelen verileri işle
        const allSettings = { ...settings, ...req.body };
        
        // Debug: Logo path'ini kontrol et
        if (allSettings.logo) {
            console.log('📸 Logo path kaydediliyor:', allSettings.logo);
        }
        
        for (const [key, value] of Object.entries(allSettings)) {
            if (value === undefined || value === null || key === 'logo_file') continue;
            
            // Bakım modu şifresi özel işleme
            if (group === 'maintenance' && key === 'access_password' && value) {
                const bcrypt = (await import('bcryptjs')).default;
                const hashedPassword = await bcrypt.hash(String(value), 10);
                await pool.execute(
                    'INSERT INTO settings (`key`, `value`, `type`, `group`) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE `value` = ?, `updated_at` = NOW()',
                    [key, hashedPassword, 'text', group, hashedPassword]
                );
                continue;
            }
            
            const stringValue = typeof value === 'boolean' ? (value ? '1' : '0') : String(value);

            // Abonelik bazlı komisyon oranları
            if (key === 'commission_rate_silver' && group === 'general') {
                await pool.execute(
                    'INSERT INTO settings (`key`, `value`, `type`, `group`) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE `value` = ?, `updated_at` = NOW()',
                    [key, stringValue, 'number', 'financial', stringValue]
                );
            } else if (key === 'commission_rate_gold' && group === 'general') {
                await pool.execute(
                    'INSERT INTO settings (`key`, `value`, `type`, `group`) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE `value` = ?, `updated_at` = NOW()',
                    [key, stringValue, 'number', 'financial', stringValue]
                );
            } else if (key === 'commission_rate_platinum' && group === 'general') {
                await pool.execute(
                    'INSERT INTO settings (`key`, `value`, `type`, `group`) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE `value` = ?, `updated_at` = NOW()',
                    [key, stringValue, 'number', 'financial', stringValue]
                );
            } else if (key === 'commission_rate' && group === 'general') {
                // Eski uyumluluk için
                await pool.execute(
                    'INSERT INTO settings (`key`, `value`, `type`, `group`) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE `value` = ?, `updated_at` = NOW()',
                    [key, stringValue, 'number', 'general', stringValue]
                );
                await pool.execute(
                    'INSERT INTO settings (`key`, `value`, `type`, `group`) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE `value` = ?, `updated_at` = NOW()',
                    [key, stringValue, 'number', 'financial', stringValue]
                );
            } else {
                await pool.execute(
                    'INSERT INTO settings (`key`, `value`, `type`, `group`) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE `value` = ?, `updated_at` = NOW()',
                    [key, stringValue, typeof value === 'boolean' ? 'boolean' : typeof value === 'number' ? 'number' : 'text', group, stringValue]
                );
            }
        }

        res.json({ message: 'Ayarlar kaydedildi' });
    } catch (error) {
        console.error('Save settings error:', error);
        res.status(500).json({ error: 'Sunucu hatası', details: error.message });
    }
});

// Döviz kurlarını güncelle
router.post('/settings/currency/update-rates', authenticate, async (req, res) => {
    try {
        // ExchangeRateAPI'den güncel kurları çek
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/TRY');
        
        if (!response.ok) {
            throw new Error('Döviz kuru API\'sine erişilemedi');
        }

        const data = await response.json();
        const rates = data.rates || {};

        // Kurları veritabanına kaydet (settings tablosuna)
        const ratesJson = JSON.stringify(rates);
        await pool.execute(
            'INSERT INTO settings (`key`, `value`, `type`, `group`, `description`) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE `value` = ?, `updated_at` = NOW()',
            ['exchange_rates', ratesJson, 'json', 'financial', 'Döviz kurları (TRY bazlı)', ratesJson]
        );

        // Son güncelleme tarihini kaydet
        await pool.execute(
            'INSERT INTO settings (`key`, `value`, `type`, `group`, `description`) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE `value` = ?, `updated_at` = NOW()',
            ['exchange_rates_updated_at', new Date().toISOString(), 'text', 'financial', 'Döviz kurları son güncelleme tarihi', new Date().toISOString()]
        );

        res.json({ 
            message: 'Döviz kurları başarıyla güncellendi',
            rates: rates,
            updatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Update exchange rates error:', error);
        res.status(500).json({ 
            error: 'Döviz kurları güncellenirken hata oluştu', 
            details: error.message 
        });
    }
});

// Döviz kurlarını getir
router.get('/settings/currency/rates', authenticate, async (req, res) => {
    try {
        const [settings] = await pool.execute(
            'SELECT `value` FROM settings WHERE `key` = ? AND `group` = ?',
            ['exchange_rates', 'financial']
        );

        const [updatedAt] = await pool.execute(
            'SELECT `value` FROM settings WHERE `key` = ? AND `group` = ?',
            ['exchange_rates_updated_at', 'financial']
        );

        if (settings.length > 0) {
            res.json({
                rates: JSON.parse(settings[0].value),
                updatedAt: updatedAt.length > 0 ? updatedAt[0].value : null
            });
        } else {
            res.json({
                rates: {},
                updatedAt: null
            });
        }
    } catch (error) {
        console.error('Get exchange rates error:', error);
        res.status(500).json({ error: 'Döviz kurları alınırken hata oluştu' });
    }
});

// Email Şablonları Yönetimi
router.get('/settings/email/templates', authenticate, async (req, res) => {
    try {
        const [templates] = await pool.execute(
            'SELECT * FROM notification_templates WHERE type = ? ORDER BY created_at DESC',
            ['email']
        );
        res.json({ templates });
    } catch (error) {
        if (error.code === 'ER_NO_SUCH_TABLE') {
            res.json({ templates: [] });
        } else {
            console.error('Get email templates error:', error);
            res.status(500).json({ error: 'Sunucu hatası' });
        }
    }
});

router.get('/settings/email/templates/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const [templates] = await pool.execute(
            'SELECT * FROM notification_templates WHERE id = ? AND type = ?',
            [id, 'email']
        );
        if (templates.length === 0) {
            return res.status(404).json({ error: 'Şablon bulunamadı' });
        }
        res.json({ template: templates[0] });
    } catch (error) {
        console.error('Get email template error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

router.post('/settings/email/templates', authenticate, async (req, res) => {
    try {
        const { name, subject, body, variables } = req.body;
        const [result] = await pool.execute(
            'INSERT INTO notification_templates (name, type, subject, body) VALUES (?, ?, ?, ?)',
            [name, 'email', subject || null, body || '']
        );
        res.json({ message: 'Şablon eklendi', id: result.insertId });
    } catch (error) {
        if (error.code === 'ER_NO_SUCH_TABLE') {
            res.status(400).json({ error: 'notification_templates tablosu bulunamadı. Lütfen database_missing_tables.sql dosyasını çalıştırın.' });
        } else {
            console.error('Add email template error:', error);
            res.status(500).json({ error: 'Sunucu hatası' });
        }
    }
});

router.put('/settings/email/templates/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, subject, body, variables } = req.body;
        await pool.execute(
            'UPDATE notification_templates SET name = ?, subject = ?, body = ? WHERE id = ? AND type = ?',
            [name, subject || null, body || '', id, 'email']
        );
        res.json({ message: 'Şablon güncellendi' });
    } catch (error) {
        console.error('Update email template error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

router.delete('/settings/email/templates/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        await pool.execute('DELETE FROM notification_templates WHERE id = ? AND type = ?', [id, 'email']);
        res.json({ message: 'Şablon silindi' });
    } catch (error) {
        console.error('Delete email template error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Slider Yönetimi
router.get('/sliders', authenticate, async (req, res) => {
    try {
        const [sliders] = await pool.execute(
            'SELECT * FROM sliders ORDER BY `order` ASC, created_at DESC'
        );
        res.json({ sliders });
    } catch (error) {
        console.error('Get sliders error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

router.get('/sliders/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const [sliders] = await pool.execute(
            'SELECT * FROM sliders WHERE id = ?',
            [id]
        );
        if (sliders.length === 0) {
            return res.status(404).json({ error: 'Slider bulunamadı' });
        }
        res.json({ slider: sliders[0] });
    } catch (error) {
        console.error('Get slider error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

router.post('/sliders', authenticate, isAdmin, sliderUpload.single('image'), async (req, res) => {
    try {
        const { title, link, order, status } = req.body;

        if (!title || !req.file) {
            return res.status(400).json({ error: 'Başlık ve resim gerekli' });
        }

        const imagePath = `slider/${req.file.filename}`;
        const [result] = await pool.execute(
            'INSERT INTO sliders (title, image, link, `order`, status) VALUES (?, ?, ?, ?, ?)',
            [title, imagePath, link || null, order || 0, status || 'active']
        );

        res.json({ message: 'Slider eklendi', slider_id: result.insertId });
    } catch (error) {
        console.error('Add slider error:', error);
        res.status(500).json({ error: 'Sunucu hatası', details: error.message });
    }
});

router.put('/sliders/:id', authenticate, isAdmin, sliderUpload.single('image'), async (req, res) => {
    try {
        const { id } = req.params;
        const { title, link, order, status, image } = req.body;

        const updates = [];
        const values = [];

        if (title !== undefined) {
            updates.push('title = ?');
            values.push(title);
        }

        if (req.file) {
            updates.push('image = ?');
            values.push(`slider/${req.file.filename}`);
        } else if (image !== undefined) {
            updates.push('image = ?');
            values.push(image || null);
        }

        if (link !== undefined) {
            updates.push('link = ?');
            values.push(link || null);
        }

        if (order !== undefined) {
            updates.push('`order` = ?');
            values.push(order || 0);
        }

        if (status !== undefined) {
            updates.push('status = ?');
            values.push(status);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'Güncellenecek alan belirtilmedi' });
        }

        updates.push('updated_at = NOW()');
        values.push(id);

        await pool.execute(
            `UPDATE sliders SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        res.json({ message: 'Slider güncellendi' });
    } catch (error) {
        console.error('Update slider error:', error);
        res.status(500).json({ error: 'Sunucu hatası', details: error.message });
    }
});

router.delete('/sliders/:id', authenticate, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await pool.execute('DELETE FROM sliders WHERE id = ?', [id]);
        res.json({ message: 'Slider silindi' });
    } catch (error) {
        console.error('Delete slider error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

router.put('/sliders/bulk/status', authenticate, isAdmin, async (req, res) => {
    try {
        const { ids, status } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'Geçerli ID listesi gerekli' });
        }

        const placeholders = ids.map(() => '?').join(',');
        await pool.execute(
            `UPDATE sliders SET status = ?, updated_at = NOW() WHERE id IN (${placeholders})`,
            [status, ...ids]
        );

        res.json({ message: 'Slider durumları güncellendi' });
    } catch (error) {
        console.error('Bulk update slider status error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

router.delete('/sliders/bulk', authenticate, isAdmin, async (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'Geçerli ID listesi gerekli' });
        }

        const placeholders = ids.map(() => '?').join(',');
        await pool.execute(
            `DELETE FROM sliders WHERE id IN (${placeholders})`,
            ids
        );

        res.json({ message: 'Sliderlar silindi' });
    } catch (error) {
        console.error('Bulk delete sliders error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Referanslar API
router.get('/references', authenticate, async (req, res) => {
    try {
        const [references] = await pool.execute(
            'SELECT * FROM `references` ORDER BY sort_order ASC, id ASC'
        );
        res.json({ references });
    } catch (error) {
        if (error.code === 'ER_NO_SUCH_TABLE') {
            res.json({ references: [] });
        } else {
            console.error('Get references error:', error);
            res.status(500).json({ error: 'Sunucu hatası' });
        }
    }
});

router.post('/references', authenticate, referenceUpload.single('image'), async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const { title, slug, description, link, status, sort_order } = req.body;
        const image = req.file ? `/uploads/references/${req.file.filename}` : null;

        if (!title || !slug) {
            return res.status(400).json({ error: 'Başlık ve slug gerekli' });
        }

        const [result] = await pool.execute(
            'INSERT INTO `references` (title, slug, description, image, link, status, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [title, slug, description || null, image, link || null, status || 'active', sort_order || 0]
        );
        res.json({ message: 'Referans eklendi', id: result.insertId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: 'Bu slug zaten kullanılıyor' });
        } else if (error.code === 'ER_NO_SUCH_TABLE') {
            res.status(400).json({ error: 'references tablosu bulunamadı' });
        } else {
            console.error('Add reference error:', error);
            res.status(500).json({ error: 'Sunucu hatası' });
        }
    }
});

router.put('/references/:id', authenticate, async (req, res) => {
    // Eğer multipart/form-data ise multer middleware'ini kullan
    const contentType = req.headers['content-type'] || '';
    if (contentType.includes('multipart/form-data')) {
        return referenceUpload.single('image')(req, res, (err) => {
            if (err) {
                return res.status(400).json({ error: 'Dosya yükleme hatası: ' + err.message });
            }
            handleReferenceUpdate(req, res).catch(error => {
                console.error('Error in handleReferenceUpdate:', error);
                res.status(500).json({ error: 'Sunucu hatası: ' + error.message });
            });
        });
    }
    // JSON isteği ise direkt işle
    handleReferenceUpdate(req, res).catch(error => {
        console.error('Error in handleReferenceUpdate:', error);
        res.status(500).json({ error: 'Sunucu hatası: ' + error.message });
    });
});

const handleReferenceUpdate = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const { id } = req.params;

        // Debug: req.body'yi logla
        console.log('PUT /references/:id - req.body:', req.body);
        console.log('PUT /references/:id - Content-Type:', req.headers['content-type']);

        // Eğer sadece status güncelleniyorsa (toggle için)
        if (req.body && req.body.status && Object.keys(req.body).length === 1) {
            try {
                await pool.execute(
                    'UPDATE `references` SET status = ? WHERE id = ?',
                    [req.body.status, id]
                );
                return res.json({ message: 'Referans durumu güncellendi' });
            } catch (dbError) {
                console.error('Database error in status update:', dbError);
                if (dbError.code === 'ER_NO_SUCH_TABLE') {
                    return res.status(400).json({ error: 'references tablosu bulunamadı. Lütfen database_references_sponsors.sql dosyasını çalıştırın.' });
                }
                throw dbError;
            }
        }

        // Mevcut referansı al
        let existing;
        try {
            [existing] = await pool.execute('SELECT * FROM `references` WHERE id = ?', [id]);
        } catch (dbError) {
            console.error('Database error in SELECT:', dbError);
            if (dbError.code === 'ER_NO_SUCH_TABLE') {
                return res.status(400).json({ error: 'references tablosu bulunamadı. Lütfen database_references_sponsors.sql dosyasını çalıştırın.' });
            }
            throw dbError;
        }

        if (existing.length === 0) {
            return res.status(404).json({ error: 'Referans bulunamadı' });
        }

        const current = existing[0];
        const { title, slug, description, image, link, status, sort_order } = req.body;

        // Eğer yeni resim yüklendiyse onu kullan, yoksa mevcut resmi koru
        let imagePath = image || current.image;
        if (req.file) {
            imagePath = `/uploads/references/${req.file.filename}`;
            // Eski resmi sil (opsiyonel)
            if (current.image && current.image.startsWith('/uploads/references/')) {
                const oldImagePath = path.join(process.cwd(), 'public', current.image);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
        }

        await pool.execute(
            'UPDATE `references` SET title = ?, slug = ?, description = ?, image = ?, link = ?, status = ?, sort_order = ? WHERE id = ?',
            [
                title || current.title,
                slug || current.slug,
                description !== undefined ? description : current.description,
                imagePath,
                link !== undefined ? link : current.link,
                status || current.status,
                sort_order !== undefined ? sort_order : current.sort_order,
                id
            ]
        );
        res.json({ message: 'Referans güncellendi' });
    } catch (error) {
        console.error('Update reference error - Full error:', error);
        console.error('Update reference error - Stack:', error.stack);
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: 'Bu slug zaten kullanılıyor' });
        } else if (error.code === 'ER_NO_SUCH_TABLE') {
            res.status(400).json({ error: 'references tablosu bulunamadı. Lütfen database_references_sponsors.sql dosyasını çalıştırın.' });
        } else {
            res.status(500).json({
                error: 'Sunucu hatası: ' + error.message,
                code: error.code,
                sqlMessage: error.sqlMessage || null
            });
        }
    }
};

router.delete('/references/:id', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const { id } = req.params;
        await pool.execute('DELETE FROM `references` WHERE id = ?', [id]);
        res.json({ message: 'Referans silindi' });
    } catch (error) {
        console.error('Delete reference error - Full error:', error);
        console.error('Delete reference error - Stack:', error.stack);
        if (error.code === 'ER_NO_SUCH_TABLE') {
            res.status(400).json({ error: 'references tablosu bulunamadı. Lütfen database_references_sponsors.sql dosyasını çalıştırın.' });
        } else {
            res.status(500).json({
                error: 'Sunucu hatası: ' + error.message,
                code: error.code,
                sqlMessage: error.sqlMessage || null
            });
        }
    }
});

router.put('/references/order', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const { references } = req.body;
        if (!Array.isArray(references)) {
            return res.status(400).json({ error: 'Geçersiz veri formatı' });
        }

        for (const ref of references) {
            await pool.execute(
                'UPDATE `references` SET sort_order = ? WHERE id = ?',
                [ref.sort_order, ref.id]
            );
        }
        res.json({ message: 'Sıralama güncellendi' });
    } catch (error) {
        console.error('Update references order error:', error);
        if (error.code === 'ER_NO_SUCH_TABLE') {
            res.status(400).json({ error: 'references tablosu bulunamadı. Lütfen database_references_sponsors.sql dosyasını çalıştırın.' });
        } else {
            res.status(500).json({ error: 'Sunucu hatası: ' + error.message, code: error.code });
        }
    }
});

// Sponsorlar API
router.get('/sponsors', authenticate, async (req, res) => {
    try {
        const [sponsors] = await pool.execute(
            'SELECT * FROM sponsors ORDER BY sort_order ASC, id ASC'
        );
        res.json({ sponsors });
    } catch (error) {
        if (error.code === 'ER_NO_SUCH_TABLE') {
            res.json({ sponsors: [] });
        } else {
            console.error('Get sponsors error:', error);
            res.status(500).json({ error: 'Sunucu hatası' });
        }
    }
});

router.post('/sponsors', authenticate, sponsorUpload.single('logo'), async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const { name, logo, link_url, description, status, sort_order } = req.body;
        const logoPath = req.file ? `/uploads/sponsors/${req.file.filename}` : logo;

        if (!name || !logoPath) {
            return res.status(400).json({ error: 'İsim ve logo gerekli' });
        }

        const [result] = await pool.execute(
            'INSERT INTO sponsors (name, logo, link_url, description, status, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
            [name, logoPath, link_url || null, description || null, status || 'active', sort_order || 0]
        );
        res.json({ message: 'Sponsor eklendi', id: result.insertId });
    } catch (error) {
        if (error.code === 'ER_NO_SUCH_TABLE') {
            res.status(400).json({ error: 'sponsors tablosu bulunamadı. Lütfen database_references_sponsors.sql dosyasını çalıştırın.' });
        } else {
            console.error('Add sponsor error:', error);
            res.status(500).json({ error: 'Sunucu hatası: ' + error.message });
        }
    }
});

router.put('/sponsors/:id', authenticate, async (req, res) => {
    // Eğer multipart/form-data ise multer middleware'ini kullan
    const contentType = req.headers['content-type'] || '';
    if (contentType.includes('multipart/form-data')) {
        return sponsorUpload.single('logo')(req, res, (err) => {
            if (err) {
                return res.status(400).json({ error: 'Dosya yükleme hatası: ' + err.message });
            }
            handleSponsorUpdate(req, res).catch(error => {
                console.error('Error in handleSponsorUpdate:', error);
                res.status(500).json({ error: 'Sunucu hatası: ' + error.message });
            });
        });
    }
    // JSON isteği ise direkt işle
    handleSponsorUpdate(req, res).catch(error => {
        console.error('Error in handleSponsorUpdate:', error);
        res.status(500).json({ error: 'Sunucu hatası: ' + error.message });
    });
});

const handleSponsorUpdate = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const { id } = req.params;

        // Debug: req.body'yi logla
        console.log('PUT /sponsors/:id - req.body:', req.body);
        console.log('PUT /sponsors/:id - Content-Type:', req.headers['content-type']);

        // Eğer sadece status güncelleniyorsa (toggle için)
        if (req.body && req.body.status && Object.keys(req.body).length === 1) {
            try {
                await pool.execute(
                    'UPDATE sponsors SET status = ? WHERE id = ?',
                    [req.body.status, id]
                );
                return res.json({ message: 'Sponsor durumu güncellendi' });
            } catch (dbError) {
                console.error('Database error in status update:', dbError);
                if (dbError.code === 'ER_NO_SUCH_TABLE') {
                    return res.status(400).json({ error: 'sponsors tablosu bulunamadı. Lütfen database_references_sponsors.sql dosyasını çalıştırın.' });
                }
                throw dbError;
            }
        }

        // Mevcut sponsoru al
        let existing;
        try {
            [existing] = await pool.execute('SELECT * FROM sponsors WHERE id = ?', [id]);
        } catch (dbError) {
            console.error('Database error in SELECT:', dbError);
            if (dbError.code === 'ER_NO_SUCH_TABLE') {
                return res.status(400).json({ error: 'sponsors tablosu bulunamadı. Lütfen database_references_sponsors.sql dosyasını çalıştırın.' });
            }
            throw dbError;
        }

        if (existing.length === 0) {
            return res.status(404).json({ error: 'Sponsor bulunamadı' });
        }

        const current = existing[0];
        const { name, logo, link_url, description, status, sort_order } = req.body;

        // Eğer yeni logo yüklendiyse onu kullan, yoksa mevcut logoyu koru
        let logoPath = logo || current.logo;
        if (req.file) {
            logoPath = `/uploads/sponsors/${req.file.filename}`;
            // Eski logoyu sil (opsiyonel)
            if (current.logo && current.logo.startsWith('/uploads/sponsors/')) {
                const oldLogoPath = path.join(process.cwd(), 'public', current.logo);
                if (fs.existsSync(oldLogoPath)) {
                    fs.unlinkSync(oldLogoPath);
                }
            }
        }

        await pool.execute(
            'UPDATE sponsors SET name = ?, logo = ?, link_url = ?, description = ?, status = ?, sort_order = ? WHERE id = ?',
            [
                name || current.name,
                logoPath,
                link_url !== undefined ? link_url : current.link_url,
                description !== undefined ? description : current.description,
                status || current.status,
                sort_order !== undefined ? sort_order : current.sort_order,
                id
            ]
        );
        res.json({ message: 'Sponsor güncellendi' });
    } catch (error) {
        console.error('Update sponsor error - Full error:', error);
        console.error('Update sponsor error - Stack:', error.stack);
        if (error.code === 'ER_NO_SUCH_TABLE') {
            res.status(400).json({ error: 'sponsors tablosu bulunamadı. Lütfen database_references_sponsors.sql dosyasını çalıştırın.' });
        } else {
            res.status(500).json({
                error: 'Sunucu hatası: ' + error.message,
                code: error.code,
                sqlMessage: error.sqlMessage || null
            });
        }
    }
};

router.delete('/sponsors/:id', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const { id } = req.params;
        await pool.execute('DELETE FROM sponsors WHERE id = ?', [id]);
        res.json({ message: 'Sponsor silindi' });
    } catch (error) {
        console.error('Delete sponsor error - Full error:', error);
        console.error('Delete sponsor error - Stack:', error.stack);
        if (error.code === 'ER_NO_SUCH_TABLE') {
            res.status(400).json({ error: 'sponsors tablosu bulunamadı. Lütfen database_references_sponsors.sql dosyasını çalıştırın.' });
        } else {
            res.status(500).json({
                error: 'Sunucu hatası: ' + error.message,
                code: error.code,
                sqlMessage: error.sqlMessage || null
            });
        }
    }
});

router.put('/sponsors/order', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const { sponsors } = req.body;
        if (!Array.isArray(sponsors)) {
            return res.status(400).json({ error: 'Geçersiz veri formatı' });
        }

        for (const sponsor of sponsors) {
            await pool.execute(
                'UPDATE sponsors SET sort_order = ? WHERE id = ?',
                [sponsor.sort_order, sponsor.id]
            );
        }
        res.json({ message: 'Sıralama güncellendi' });
    } catch (error) {
        console.error('Update sponsors order error:', error);
        if (error.code === 'ER_NO_SUCH_TABLE') {
            res.status(400).json({ error: 'sponsors tablosu bulunamadı. Lütfen database_references_sponsors.sql dosyasını çalıştırın.' });
        } else {
            res.status(500).json({ error: 'Sunucu hatası: ' + error.message, code: error.code });
        }
    }
});

// --- Sadakat Programı (Loyalty Rewards) ---
router.get('/loyalty-rewards', async (req, res) => {
    try {
        const [rewards] = await pool.execute('SELECT * FROM loyalty_rewards ORDER BY required_points ASC');
        res.json({ rewards });
    } catch (error) {
        // Tablo yoksa boş dizi dön (ilk kurulumda hata vermemesi için)
        if (error.code === 'ER_NO_SUCH_TABLE') {
            return res.json({ rewards: [] });
        }
        console.error('Get loyalty rewards error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

router.post('/loyalty-rewards', async (req, res) => {
    try {
        const { required_points, reward_type, reward_value, description, is_active } = req.body;

        await pool.execute(
            'INSERT INTO loyalty_rewards (required_points, reward_type, reward_value, description, is_active) VALUES (?, ?, ?, ?, ?)',
            [required_points, reward_type, reward_value, description, is_active ? 1 : 0]
        );

        res.json({ message: 'Ödül kuralı eklendi' });
    } catch (error) {
        console.error('Add loyalty reward error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

router.put('/loyalty-rewards/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { required_points, reward_type, reward_value, description, is_active } = req.body;

        await pool.execute(
            'UPDATE loyalty_rewards SET required_points = ?, reward_type = ?, reward_value = ?, description = ?, is_active = ? WHERE id = ?',
            [required_points, reward_type, reward_value, description, is_active ? 1 : 0, id]
        );

        res.json({ message: 'Ödül kuralı güncellendi' });
    } catch (error) {
        console.error('Update loyalty reward error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

router.delete('/loyalty-rewards/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.execute('DELETE FROM loyalty_rewards WHERE id = ?', [id]);
        res.json({ message: 'Ödül kuralı silindi' });
    } catch (error) {
        console.error('Delete loyalty reward error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});


// ----------------------------------------------------------------------
// PARA ÇEKME YÖNETİMİ (WITHDRAWALS)
// ----------------------------------------------------------------------

// Para çekme taleplerini listele
router.get('/withdrawals', async (req, res) => {
    try {
        const { status } = req.query;
        let query = `
            SELECT w.*, u.first_name, u.last_name, u.email 
            FROM withdrawals w
            INNER JOIN users u ON w.user_id = u.id
        `;
        const params = [];

        if (status && status !== 'all') {
            query += ` WHERE w.status = ?`;
            params.push(status);
        }

        query += ` ORDER BY w.created_at DESC`;

        const [withdrawals] = await pool.execute(query, params);

        res.json(withdrawals);
    } catch (error) {
        console.error('Get withdrawals error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Para çekme talebi güncelle (Onayla/Reddet)
router.put('/withdrawals/:id', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params;
        const { status, transaction_id, admin_note } = req.body;

        if (!['completed', 'rejected', 'pending'].includes(status)) {
            await connection.rollback();
            return res.status(400).json({ error: 'Geçersiz durum' });
        }

        const [existing] = await connection.execute('SELECT * FROM withdrawals WHERE id = ?', [id]);
        if (existing.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Talep bulunamadı' });
        }

        const withdrawal = existing[0];
        const oldStatus = withdrawal.status;
        const userId = withdrawal.user_id;
        const amount = parseFloat(withdrawal.amount);

        // Status güncelle
        await connection.execute(
            `UPDATE withdrawals 
             SET status = ?, transaction_id = ?, admin_note = ?, updated_at = NOW() 
             WHERE id = ?`,
            [status, transaction_id || null, admin_note || null, id]
        );

        // Balance işlemleri
        if (status === 'completed' && oldStatus === 'pending') {
            // Onaylandığında: Balance'dan düş
            await connection.execute(
                'UPDATE users SET balance = balance - ? WHERE id = ?',
                [amount, userId]
            );

            // Transaction kaydı oluştur
            await connection.execute(
                `INSERT INTO transactions (user_id, type, amount, currency, status, description) 
                 VALUES (?, 'withdrawal', ?, 'TRY', 'completed', ?)`,
                [userId, -amount, `Para Çekme - Onaylandı (Talep #${id})${transaction_id ? ' - İşlem Kodu: ' + transaction_id : ''}`]
            );
        } else if (status === 'rejected' && oldStatus === 'completed') {
            // Eğer completed'den rejected'e dönüştürülüyorsa, balance'a geri yükle
            await connection.execute(
                'UPDATE users SET balance = balance + ? WHERE id = ?',
                [amount, userId]
            );

            // Transaction kaydı oluştur (geri ödeme)
            await connection.execute(
                `INSERT INTO transactions (user_id, type, amount, currency, status, description) 
                 VALUES (?, 'withdrawal_refund', ?, 'TRY', 'completed', ?)`,
                [userId, amount, `Para Çekme İptali - Reddedildi (Talep #${id})${admin_note ? ' - Sebep: ' + admin_note : ''}`]
            );
        } else if (status === 'rejected' && oldStatus === 'pending') {
            // Pending'den rejected'e: Balance'a geri yüklemeye gerek yok çünkü pending olduğunda balance'dan düşmemiş
            // Sadece transaction kaydı oluştur (log için)
            await connection.execute(
                `INSERT INTO transactions (user_id, type, amount, currency, status, description) 
                 VALUES (?, 'withdrawal_rejected', ?, 'TRY', 'completed', ?)`,
                [userId, 0, `Para Çekme Talebi Reddedildi (Talep #${id})${admin_note ? ' - Sebep: ' + admin_note : ''}`]
            );
        }

        await connection.commit();
        res.json({ 
            message: 'Talep başarıyla güncellendi',
            withdrawal: {
                ...withdrawal,
                status,
                transaction_id: transaction_id || null,
                admin_note: admin_note || null
            }
        });
    } catch (error) {
        await connection.rollback();
        console.error('Update withdrawal error:', error);
        res.status(500).json({ error: 'Sunucu hatası: ' + error.message });
    } finally {
        connection.release();
    }
});

// Mükerrer blok temizlendi. Tekil endpoint yukarıda tanımlıdır.

// ============================================
// Bank Transfer Notifications (Banka Havalesi Bildirimleri) Yönetimi
// ============================================

// Beklemede olan banka havalesi bildirimlerini listele
router.get('/bank-transfer-notifications', authenticate, isAdmin, async (req, res) => {
    try {
        const { status = 'pending' } = req.query;

        const [notifications] = await pool.execute(
            `SELECT 
                btn.*,
                o.order_number,
                o.final_amount,
                o.currency,
                o.payment_status as order_payment_status,
                o.order_status,
                u.username,
                u.email,
                CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) as full_name
             FROM bank_transfer_notifications btn
             INNER JOIN orders o ON btn.order_id = o.id
             INNER JOIN users u ON btn.user_id = u.id
             WHERE btn.status = ?
             ORDER BY btn.created_at DESC`,
            [status]
        );

        res.json({
            notifications: notifications || []
        });
    } catch (error) {
        console.error('Get bank transfer notifications error:', error);
        res.status(500).json({ error: 'Sunucu hatası', details: error.message });
    }
});

// Banka havalesi bildirimini onayla
router.put('/bank-transfer-notifications/:id/approve', authenticate, isAdmin, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params;
        const { admin_notes } = req.body;

        // Bildirimi getir
        const [notifications] = await connection.execute(
            `SELECT btn.*, o.order_number, o.final_amount, o.currency, o.payment_status, o.order_status
             FROM bank_transfer_notifications btn
             INNER JOIN orders o ON btn.order_id = o.id
             WHERE btn.id = ? AND btn.status = 'pending'`,
            [id]
        );

        if (notifications.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Bildirim bulunamadı veya zaten işleme alınmış' });
        }

        const notification = notifications[0];
        const orderId = notification.order_id;

        // Bildirimi onayla
        await connection.execute(
            `UPDATE bank_transfer_notifications 
             SET status = 'approved', admin_notes = ?, updated_at = NOW() 
             WHERE id = ?`,
            [admin_notes || null, id]
        );

        // Sipariş ödeme durumunu güncelle
        await connection.execute(
            `UPDATE orders 
             SET payment_status = 'paid', order_status = 'processing', updated_at = NOW() 
             WHERE id = ?`,
            [orderId]
        );

        // Transaction kaydı oluştur
        await connection.execute(
            `INSERT INTO transactions (user_id, order_id, type, amount, currency, status, payment_method, description)
             VALUES (?, ?, 'purchase', ?, ?, 'completed', 'bank_transfer', ?)`,
            [
                notification.user_id,
                orderId,
                notification.final_amount,
                notification.currency || 'TRY',
                `Sipariş #${notification.order_number} - Banka Havalesi Onaylandı`
            ]
        );

        await connection.commit();
        res.json({
            message: 'Banka havalesi bildirimi onaylandı ve sipariş güncellendi',
            notification: {
                ...notification,
                status: 'approved',
                admin_notes: admin_notes || null
            }
        });
    } catch (error) {
        await connection.rollback();
        console.error('Approve bank transfer notification error:', error);
        res.status(500).json({ error: 'Sunucu hatası', details: error.message });
    } finally {
        connection.release();
    }
});

// Banka havalesi bildirimini reddet
router.put('/bank-transfer-notifications/:id/reject', authenticate, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { admin_notes } = req.body;

        // Bildirimi getir
        const [notifications] = await pool.execute(
            `SELECT * FROM bank_transfer_notifications WHERE id = ? AND status = 'pending'`,
            [id]
        );

        if (notifications.length === 0) {
            return res.status(404).json({ error: 'Bildirim bulunamadı veya zaten işleme alınmış' });
        }

        // Bildirimi reddet
        await pool.execute(
            `UPDATE bank_transfer_notifications 
             SET status = 'rejected', admin_notes = ?, updated_at = NOW() 
             WHERE id = ?`,
            [admin_notes || null, id]
        );

        // Sipariş ödeme durumunu 'pending' olarak bırak (kullanıcı tekrar deneyebilir)

        res.json({
            message: 'Banka havalesi bildirimi reddedildi',
            notification: {
                ...notifications[0],
                status: 'rejected',
                admin_notes: admin_notes || null
            }
        });
    } catch (error) {
        console.error('Reject bank transfer notification error:', error);
        res.status(500).json({ error: 'Sunucu hatası', details: error.message });
    }
});

// ============================================
// Bank Accounts (Banka Hesapları) Yönetimi
// ============================================

// Banka hesaplarını listele
router.get('/bank-accounts', authenticate, isAdmin, async (req, res) => {
    try {
        const [accounts] = await pool.execute(
            'SELECT * FROM bank_accounts ORDER BY sort_order ASC, id ASC'
        );
        res.json({ accounts });
    } catch (error) {
        if (error.code === 'ER_NO_SUCH_TABLE') {
            return res.json({ accounts: [] });
        }
        console.error('Get bank accounts error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Banka hesabı ekle
router.post('/bank-accounts', authenticate, isAdmin, async (req, res) => {
    try {
        const { bank_name, iban, account_holder, account_number, branch_name, swift_code, currency, is_active, sort_order } = req.body;

        console.log('📥 Bank account POST request:', { bank_name, iban, account_holder, account_number, branch_name, swift_code, currency, is_active, sort_order });

        if (!bank_name || !iban || !account_holder) {
            return res.status(400).json({ error: 'Banka adı, IBAN ve hesap sahibi zorunludur' });
        }

        // IBAN'dan boşlukları temizle (eğer gelmişse)
        const cleanedIban = iban.replace(/\s/g, '').toUpperCase();
        const cleanedSwift = swift_code ? swift_code.replace(/\s/g, '').toUpperCase() : null;

        console.log('🧹 Temizlenmiş veriler:', { cleanedIban, cleanedSwift });

        // sort_order'ı sayıya çevir
        const sortOrderValue = sort_order !== undefined && sort_order !== null && sort_order !== '' 
            ? parseInt(sort_order, 10) 
            : 0;

        console.log('💾 Veritabanına kaydedilecek veriler:', {
            bank_name,
            iban: cleanedIban,
            account_holder,
            account_number: account_number || null,
            branch_name: branch_name || null,
            swift_code: cleanedSwift,
            currency: currency || 'TRY',
            is_active: is_active !== undefined ? (is_active ? 1 : 0) : 1,
            sort_order: sortOrderValue
        });

        const [result] = await pool.execute(
            `INSERT INTO bank_accounts 
            (bank_name, iban, account_holder, account_number, branch_name, swift_code, currency, is_active, sort_order) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                bank_name,
                cleanedIban,
                account_holder,
                account_number || null,
                branch_name || null,
                cleanedSwift,
                currency || 'TRY',
                is_active !== undefined ? (is_active ? 1 : 0) : 1,
                sortOrderValue
            ]
        );

        console.log('✅ Bank account eklendi:', result.insertId);
        res.json({ message: 'Banka hesabı eklendi', id: result.insertId });
    } catch (error) {
        console.error('❌ Add bank account error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ 
            error: 'Sunucu hatası', 
            details: error.message,
            code: error.code,
            sqlMessage: error.sqlMessage
        });
    }
});

// Banka hesabı güncelle
router.put('/bank-accounts/:id', authenticate, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { bank_name, iban, account_holder, account_number, branch_name, swift_code, currency, is_active, sort_order } = req.body;

        if (!bank_name || !iban || !account_holder) {
            return res.status(400).json({ error: 'Banka adı, IBAN ve hesap sahibi zorunludur' });
        }

        // IBAN'dan boşlukları temizle (eğer gelmişse)
        const cleanedIban = iban.replace(/\s/g, '').toUpperCase();
        const cleanedSwift = swift_code ? swift_code.replace(/\s/g, '').toUpperCase() : null;

        await pool.execute(
            `UPDATE bank_accounts 
            SET bank_name = ?, iban = ?, account_holder = ?, account_number = ?, 
                branch_name = ?, swift_code = ?, currency = ?, is_active = ?, sort_order = ?,
                updated_at = NOW()
            WHERE id = ?`,
            [
                bank_name,
                cleanedIban,
                account_holder,
                account_number || null,
                branch_name || null,
                cleanedSwift,
                currency || 'TRY',
                is_active !== undefined ? (is_active ? 1 : 0) : 1,
                sort_order || 0,
                id
            ]
        );

        res.json({ message: 'Banka hesabı güncellendi' });
    } catch (error) {
        console.error('Update bank account error:', error);
        res.status(500).json({ 
            error: 'Sunucu hatası', 
            details: error.message,
            code: error.code,
            sqlMessage: error.sqlMessage
        });
    }
});

// Banka hesabı sil
router.delete('/bank-accounts/:id', authenticate, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        await pool.execute('DELETE FROM bank_accounts WHERE id = ?', [id]);

        res.json({ message: 'Banka hesabı silindi' });
    } catch (error) {
        console.error('Delete bank account error:', error);
        res.status(500).json({ error: 'Sunucu hatası', details: error.message });
    }
});

export default router;
