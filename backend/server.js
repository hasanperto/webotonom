import express from 'express';
import compression from 'compression';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import userRoutes from './routes/users.js';
import adminRoutes from './routes/admin.js';
import sellerRoutes from './routes/seller.js';
import donationsRoutes from './routes/donations.js';
import reviewsRoutes from './routes/reviews.js';
import cartRoutes from './routes/cart.js';
import subscriptionsRoutes from './routes/subscriptions.js';
import leadsRoutes from './routes/leads.js';
import ticketsRoutes from './routes/tickets.js';
import blogRoutes from './routes/blog.js';
import couponsRoutes from './routes/coupons.js';
import ordersRoutes from './routes/orders.js';
import paymentsRoutes from './routes/payments.js';
import walletPaymentsRoutes from './routes/walletPayments.js';
import userAddressesRoutes from './routes/userAddresses.js';
import userPaymentCardsRoutes from './routes/userPaymentCards.js';
import sectionsRoutes from './routes/sections.js';
import i18nRoutes from './routes/i18n.js';
import salesRoutes from './routes/sales.js';
import menusRoutes from './routes/menus.js';
import publicSettingsRoutes from './routes/publicSettings.js';
import pagesRoutes from './routes/pages.js';
import bankAccountsRoutes from './routes/bankAccounts.js';
import { checkMaintenanceMode } from './middleware/maintenance.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// CORS Configuration - Basitleştirilmiş ve daha güvenilir
const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
    : process.env.NODE_ENV === 'production'
        ? [
            process.env.FRONTEND_URL || 'https://hpdemos.hopto.org',
            process.env.FRONTEND_URL?.replace('https://', 'https://www.') || 'https://www.hpdemos.hopto.org'
        ]
        : [
            'http://localhost:3000',
            'http://localhost:5173',
            process.env.FRONTEND_URL || 'https://hpdemos.hopto.org'
        ];

const corsOptions = {
    origin: function (origin, callback) {
        // Origin yoksa (Postman, curl, server-to-server) izin ver
        if (!origin) {
            return callback(null, true);
        }

        // İzin verilen listede ise
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        // www'siz veya www'li versiyon kontrolü
        const originWithoutWww = origin.replace(/^https?:\/\/(www\.)?/, (match, www) => {
            return match.replace('www.', '');
        });
        const originWithWww = origin.replace(/^https?:\/\//, 'https://www.');

        if (allowedOrigins.some(allowed => {
            const allowedWithoutWww = allowed.replace(/^https?:\/\/(www\.)?/, (match) => {
                return match.replace('www.', '');
            });
            return originWithoutWww.includes(allowedWithoutWww) || originWithWww.includes(allowed);
        })) {
            return callback(null, true);
        }

        // Tüm origin'lere izin ver (güvenlik riski var ama çalışması için)
        // Production'da kaldırılmalı
        if (process.env.NODE_ENV !== 'production') {
            return callback(null, true);
        }

        callback(new Error('CORS policy violation'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    optionsSuccessStatus: 200
};

// CORS middleware - TÜM isteklerden önce
app.use(cors(corsOptions));
app.use(compression());

// Hata durumlarında da CORS header'larını gönder
app.use((err, req, res, next) => {
    // CORS header'larını ekle
    const origin = req.headers.origin;
    if (origin && allowedOrigins.some(allowed => origin.includes(allowed.replace(/^https?:\/\/(www\.)?/, '')))) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Credentials', 'true');
    }

    next(err);
});
// Body parser middleware - Büyük dosyalar için limit artırıldı (base64 görseller için)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Bakım modu kontrolü - API route'larından önce (ama auth ve admin route'larından sonra)
// Not: Admin route'ları ve auth route'ları middleware içinde muaf tutuluyor
app.use(checkMaintenanceMode);

// Static dosya servisi - uploads klasörünü public yap
const uploadsPath = path.join(__dirname, 'public', 'uploads');
console.log('📁 Uploads klasörü yolu:', uploadsPath);

// Static file serving için CORS header'ları ekle
app.use('/uploads', (req, res, next) => {
    // CORS header'larını ekle
    const origin = req.headers.origin;
    if (origin && allowedOrigins.some(allowed => origin.includes(allowed.replace(/^https?:\/\/(www\.)?/, '')))) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Credentials', 'true');
    }
    next();
}, express.static(uploadsPath, {
    // Cache control headers
    maxAge: '1y',
    etag: true,
    lastModified: true
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/donations', donationsRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/coupons', couponsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/wallet/payments', walletPaymentsRoutes);
app.use('/api/user/addresses', userAddressesRoutes);
app.use('/api/user/payment-cards', userPaymentCardsRoutes);
app.use('/api/sections', sectionsRoutes);
app.use('/api/i18n', i18nRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/menus', menusRoutes);
app.use('/api/public/settings', publicSettingsRoutes);
app.use('/api/pages', pagesRoutes);
app.use('/api/bank-accounts', bankAccountsRoutes);

// Health check
app.get('/api/health', async (req, res) => {
    try {
        // Veritabanı bağlantısını test et
        const pool = (await import('./config/database.js')).default;
        await pool.execute('SELECT 1');

        res.json({
            status: 'OK',
            message: 'TeknoProje API is running',
            database: 'connected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Health check database error:', error);
        res.status(500).json({
            status: 'ERROR',
            message: 'API çalışıyor ancak veritabanı bağlantısı yok',
            database: 'disconnected',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Database connection failed',
            timestamp: new Date().toISOString()
        });
    }
});

// Uploads klasörü test endpoint'i
app.get('/api/test-uploads', (req, res) => {
    const uploadsPath = path.join(__dirname, 'public', 'uploads');
    const projectsPath = path.join(uploadsPath, 'projects');

    try {
        const uploadsExists = fs.existsSync(uploadsPath);
        const projectsExists = fs.existsSync(projectsPath);

        let files = [];
        let allFiles = [];
        if (projectsExists) {
            allFiles = fs.readdirSync(projectsPath);
            files = allFiles.slice(0, 20); // İlk 20 dosya
        }

        // Belirli bir dosyayı ara
        const searchFile = req.query.file || '';
        let fileFound = false;
        let filePath = null;
        if (searchFile) {
            const fullPath = path.join(projectsPath, searchFile);
            fileFound = fs.existsSync(fullPath);
            if (fileFound) {
                const stats = fs.statSync(fullPath);
                filePath = fullPath;
                res.json({
                    uploadsPath,
                    projectsPath,
                    uploadsExists,
                    projectsExists,
                    fileCount: allFiles.length,
                    sampleFiles: files,
                    searchFile,
                    fileFound: true,
                    filePath,
                    fileSize: stats.size,
                    fileModified: stats.mtime,
                    message: 'Dosya bulundu'
                });
                return;
            }
        }

        res.json({
            uploadsPath,
            projectsPath,
            uploadsExists,
            projectsExists,
            fileCount: allFiles.length,
            sampleFiles: files,
            allFiles: searchFile ? allFiles.filter(f => f.includes(searchFile)) : [],
            searchFile: searchFile || null,
            fileFound: false,
            message: searchFile ? 'Dosya bulunamadı' : 'Uploads klasörü kontrol edildi'
        });
    } catch (error) {
        res.status(500).json({
            error: error.message,
            uploadsPath,
            projectsPath
        });
    }
});

// Database test endpoint
app.get('/api/test-db', async (req, res) => {
    try {
        const pool = (await import('./config/database.js')).default;
        // MariaDB uyumlu sorgu - CURRENT_TIMESTAMP kullan
        const [result] = await pool.execute('SELECT 1 as test, DATABASE() as db_name, USER() as db_user, CURRENT_TIMESTAMP as db_time');

        res.json({
            status: 'OK',
            database: {
                connected: true,
                name: result[0].db_name,
                user: result[0].db_user,
                time: result[0].db_time
            },
            config: {
                host: process.env.DB_HOST || 'not set',
                user: process.env.DB_USER || 'not set',
                database: process.env.DB_NAME || 'not set',
                // Şifreyi gösterme
                password: process.env.DB_PASSWORD ? '***set***' : 'not set'
            }
        });
    } catch (error) {
        console.error('Database test error:', error);
        res.status(500).json({
            status: 'ERROR',
            error: error.message,
            code: error.code,
            config: {
                host: process.env.DB_HOST || 'not set',
                user: process.env.DB_USER || 'not set',
                database: process.env.DB_NAME || 'not set',
                password: process.env.DB_PASSWORD ? '***set***' : 'not set'
            }
        });
    }
});

// Production'da frontend build dosyalarını serve et (routes'tan sonra)
if (process.env.NODE_ENV === 'production') {
    const frontendPath = path.join(__dirname, '..', 'frontend', 'dist');
    console.log('📁 Frontend path:', frontendPath);

    // Static dosyaları serve et (CSS, JS, images vb.)
    app.use(express.static(frontendPath));

    // Tüm route'ları frontend'e yönlendir (SPA için) - API ve uploads route'ları hariç
    // Bu route EN SONDA olmalı (tüm diğer route'lardan sonra)
    app.get('*', (req, res, next) => {
        // API route'ları ve uploads route'ları için frontend'e yönlendirme yapma
        if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
            return next(); // Express'in bir sonraki middleware'ine geç
        }

        // Diğer tüm route'lar için frontend index.html'i gönder (SPA routing)
        const indexPath = path.join(frontendPath, 'index.html');
        console.log(`📄 SPA route: ${req.path} -> ${indexPath}`);
        res.sendFile(indexPath, (err) => {
            if (err) {
                console.error('❌ Frontend index.html gönderilemedi:', err);
                res.status(404).json({
                    error: 'Page not found',
                    message: 'Frontend build dosyası bulunamadı. Lütfen frontend\'i build edin.'
                });
            }
        });
    });
}

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    if (process.env.NODE_ENV === 'production') {
        console.log(`🌐 Frontend serving from: ${path.join(__dirname, '..', 'frontend', 'dist')}`);
    }
});
// Trigger restart
