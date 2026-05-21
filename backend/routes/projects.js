import express from 'express';
import pool from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { enrichProjectsList } from '../utils/projectListEnrich.js';

const router = express.Router();

// Tüm projeleri getir
router.get('/', async (req, res) => {
    try {
        const { category, search, page = 1, limit = 20, lang = 'tr' } = req.query;
        const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
        const offset = (page - 1) * safeLimit;

        let query = `
            SELECT p.id, p.title, p.slug, p.short_description,
            LEFT(p.description, 600) AS description,
            p.price, p.discount_price, p.currency, p.status,
            p.completion_percentage, p.donation_target, p.created_at, p.updated_at,
            p.user_id, p.category_id, p.view_count, p.download_count,
            p.rating, p.rating_count, p.featured, p.demo_url, p.video_url,
            p.license_type, p.version,
            u.username, c.name as category_name,
            (SELECT image_path FROM project_images WHERE project_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
            FROM projects p
            LEFT JOIN users u ON p.user_id = u.id
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.status IN ('approved', 'active')
        `;
        const params = [];

        if (category) {
            query += ' AND c.slug = ?';
            params.push(category);
        }

        if (search) {
            query += ' AND (p.title LIKE ? OR p.description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
        params.push(safeLimit, offset);

        const [projects] = await pool.execute(query, params);
        await enrichProjectsList(projects, lang);

        // Toplam sayı
        let countQuery = 'SELECT COUNT(*) as total FROM projects p LEFT JOIN categories c ON p.category_id = c.id WHERE p.status IN (?, ?)';
        const countParams = ['approved', 'active'];

        if (category) {
            countQuery += ' AND c.slug = ?';
            countParams.push(category);
        }

        if (search) {
            countQuery += ' AND (p.title LIKE ? OR p.description LIKE ?)';
            countParams.push(`%${search}%`, `%${search}%`);
        }

        const [countResult] = await pool.execute(countQuery, countParams);
        const total = countResult[0].total;

        res.json({
            projects,
            pagination: {
                page: parseInt(page),
                limit: safeLimit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get projects error:', error);
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        console.error('Error stack:', error.stack);

        // MySQL bağlantı hatası kontrolü
        if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
            return res.status(500).json({
                error: 'Veritabanı bağlantı hatası',
                details: 'MySQL sunucusuna bağlanılamıyor. Lütfen DB_HOST, DB_USER, DB_PASSWORD ve DB_NAME değerlerini kontrol edin.',
                code: error.code
            });
        }

        if (error.code === 'ER_ACCESS_DENIED_ERROR' || error.code === 'ER_BAD_DB_ERROR') {
            return res.status(500).json({
                error: 'Veritabanı erişim hatası',
                details: 'MySQL kullanıcı adı, şifre veya veritabanı adı hatalı.',
                code: error.code
            });
        }

        res.status(500).json({
            error: 'Sunucu hatası',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Bilinmeyen bir hata oluştu',
            code: error.code || 'UNKNOWN'
        });
    }
});

// Kategorileri getir (/:id'den önce olmalı)
router.get('/categories/list', async (req, res) => {
    try {
        const [categories] = await pool.execute(
            'SELECT * FROM categories WHERE status = ? ORDER BY sort_order ASC',
            ['active']
        );
        res.json({ categories });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Referans Takibi (Ziyaretçi Takip)
router.post('/track-visit', async (req, res) => {
    try {
        const { projectId, refCode, visitorIp, fingerprint } = req.body;
        const ip = visitorIp || req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

        // Referans kodundan user_id çözümle (USER123 -> 123 veya direkt ID)
        // Eğer format "USER123" ise
        let referrerId = null;
        if (refCode && refCode.toString().startsWith('USER')) {
            referrerId = parseInt(refCode.replace('USER', ''));
        } else if (refCode) {
            referrerId = parseInt(refCode);
        }

        if (!referrerId || isNaN(referrerId)) {
            return res.json({ status: 'ignored', reason: 'invalid_ref' });
        }

        // Kendi kendine tıklama kontrolü (Eğer istekte user token varsa kontrol edilebilir ama public olduğu için zor)
        // IP Bazlı Kontrol: Bu IP'den son 24 saat içinde bu kullanıcı için tıklama gelmiş mi?
        // fingerprint (cookie ID) varsa onu da kontrol et.

        // IP veya Fingerprint çakışması kontrolü
        const [existing] = await pool.execute(
            `SELECT id FROM referral_clicks 
             WHERE referrer_id = ? 
             AND (ip_address = ? OR (user_agent = ? AND user_agent IS NOT NULL))
             AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
            [referrerId, ip, fingerprint || 'unknown-fingerprint']
        );

        if (existing.length > 0) {
            return res.json({ status: 'ignored', reason: 'duplicate_visit_24h' });
        }

        // Yeni tıklamayı kaydet
        await pool.execute(
            'INSERT INTO referral_clicks (referrer_id, project_id, ip_address, user_agent) VALUES (?, ?, ?, ?)',
            [referrerId, projectId || null, ip, fingerprint || null]
        );

        // Kullanıcıya puan ver (Örn: 1 Puan)
        // Amaç: Her benzersiz ziyaret 1 puan.
        // Proje ziyareti ise 2 puan, ana sayfa ise 1 puan verebiliriz.
        const pointsToAdd = projectId ? 2 : 1;

        await pool.execute(
            'UPDATE users SET loyalty_points = loyalty_points + ? WHERE id = ?',
            [pointsToAdd, referrerId]
        );

        console.log(`[Referral] Points added to User ${referrerId}: +${pointsToAdd} (IP: ${ip})`);

        res.json({ status: 'success', points_added: pointsToAdd });
    } catch (error) {
        // Tablo yok hatası
        if (error.code === 'ER_NO_SUCH_TABLE') {
            console.warn('[Referral] referral_clicks table missing. Skipping tracking.');
            return res.json({ status: 'error', reason: 'table_missing' });
        }
        console.error('Track visit error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Etiketleri getir (/:id'den önce olmalı)
router.get('/tags/list', async (req, res) => {
    try {
        const [tags] = await pool.execute(
            'SELECT * FROM tags ORDER BY name ASC'
        );
        res.json({ tags });
    } catch (error) {
        console.error('Get tags error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Tek proje detayı (en sonda olmalı)
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [projects] = await pool.execute(
            `SELECT p.*, u.username, u.email as seller_email, c.name as category_name,
                    p.admin_demo_url, p.demo_username, p.demo_password, p.admin_username, p.admin_password
             FROM projects p
             LEFT JOIN users u ON p.user_id = u.id
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE p.id = ? AND p.status IN ('approved', 'active')`,
            [id]
        );

        if (projects.length === 0) {
            return res.status(404).json({ error: 'Proje bulunamadı' });
        }

        const project = projects[0];

        // Görselleri getir ve URL'leri düzelt
        const [images] = await pool.execute(
            'SELECT * FROM project_images WHERE project_id = ? ORDER BY sort_order ASC',
            [id]
        );
        const imagesWithUrls = images.map(img => ({
            ...img,
            image_path: img.image_path ? `/uploads/${img.image_path}` : null
        }));

        // Etiketleri getir
        const [tags] = await pool.execute(
            `SELECT t.* FROM tags t
             INNER JOIN project_tags pt ON t.id = pt.tag_id
             WHERE pt.project_id = ?`,
            [id]
        );

        // Yorumları getir
        const [reviews] = await pool.execute(
            `SELECT r.*, u.username FROM reviews r
             LEFT JOIN users u ON r.user_id = u.id
             WHERE r.project_id = ? AND r.is_approved = 1
             ORDER BY r.created_at DESC`,
            [id]
        );

        // Çevirileri getir
        const { lang = 'tr' } = req.query;
        try {
            const [transRows] = await pool.execute(
                `SELECT language_code, title, description, short_description
                 FROM content_translations
                 WHERE content_id = ? AND content_type = 'project' AND language_code = ?`,
                [id, lang]
            );
            if (transRows.length > 0) {
                applyProjectTranslation(project, transRows[0]);
            }
        } catch (err) {
            console.warn(`Translation fetch error for project ${id}:`, err.message);
        }

        // İndirilebilir dosyaları getir (project_files tablosundan)
        let downloadFiles = [];
        try {
            const [files] = await pool.execute(
                `SELECT 
                    id, file_name, file_path, file_size, file_type, version, is_latest, download_count, created_at
                 FROM project_files 
                 WHERE project_id = ? AND is_latest = 1
                 ORDER BY created_at DESC`,
                [id]
            );
            
            // Dosya boyutu formatlama fonksiyonu
            const formatFileSize = (bytes) => {
                if (!bytes || bytes === 0) return 'N/A';
                const k = 1024;
                const sizes = ['Bytes', 'KB', 'MB', 'GB'];
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
            };
            
            downloadFiles = files.map(file => ({
                id: file.id,
                name: file.file_name,
                size: formatFileSize(file.file_size),
                url: file.file_path ? `/uploads/${file.file_path}` : null,
                type: file.file_type,
                version: file.version,
                download_count: file.download_count || 0
            }));
        } catch (fileError) {
            console.warn('Project files fetch error:', fileError);
            downloadFiles = [];
        }

        // Görüntülenme sayısını artır
        await pool.execute('UPDATE projects SET view_count = view_count + 1 WHERE id = ?', [id]);

        res.json({
            ...project,
            images: imagesWithUrls,
            tags,
            reviews,
            download_files: downloadFiles
        });
    } catch (error) {
        console.error('Get project error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

export default router;

