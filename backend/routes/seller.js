import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import pool from '../config/database.js';
import { authenticate, isSeller } from '../middleware/auth.js';
import { checkSubscriptionLimit } from '../utils/subscriptionUtils.js';
import { checkProjectLimit, checkImageLimit, getMaxFileSizeBytes } from '../utils/limitsUtils.js';
import { checkFileSizeLimit } from '../middleware/dynamicUpload.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multer yapılandırması
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Geçici dizin kullan (daha sonra proje ID'sine göre taşınacak)
        // __dirname kullanarak backend klasöründen başla
        const tempDir = path.join(__dirname, '..', 'public', 'uploads', 'temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
            // Klasör izinlerini ayarla (755 = rwxr-xr-x)
            try {
                fs.chmodSync(tempDir, 0o755);
            } catch (err) {
                console.warn('Klasör izinleri ayarlanamadı:', err.message);
            }
        }
        cb(null, tempDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
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

const router = express.Router();

// Tüm route'lar satıcı yetkisi gerektirir
router.use(authenticate);
router.use(isSeller);

// Satıcı dashboard
router.get('/dashboard', async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Proje Sayısı
        const [projects] = await pool.execute('SELECT COUNT(*) as total FROM projects WHERE user_id = ?', [userId]);

        // 2. Toplam Satış Adedi (Ödenmiş/Tamamlanmış)
        const [salesStats] = await pool.execute(
            `SELECT COUNT(DISTINCT o.id) as total_sales_count
             FROM orders o
             INNER JOIN order_items oi ON o.id = oi.order_id
             INNER JOIN projects p ON oi.project_id = p.id
             WHERE p.user_id = ? 
             AND (o.payment_status = 'paid' OR o.order_status = 'completed')`,
            [userId]
        );

        // 3. Toplam Net Kazanç (Cüzdana Giren) ve Görüntüleme
        // Transactions tablosundan sum al (En doğru net kazanç)
        const [earningsStats] = await pool.execute(
            `SELECT COALESCE(SUM(amount), 0) as total 
             FROM transactions 
             WHERE user_id = ? AND type = 'sale' AND status = 'completed'`,
            [userId]
        );
        const totalNetEarnings = parseFloat(earningsStats[0]?.total || 0);

        // View Count
        let viewsTotal = 0;
        try {
            const [views] = await pool.execute(
                `SELECT COALESCE(SUM(view_count), 0) as total FROM projects WHERE user_id = ?`,
                [userId]
            );
            viewsTotal = views[0]?.total || 0;
        } catch (err) {
            viewsTotal = 0;
        }

        // 4. Ortalama Puan
        let avgRating = 0;
        try {
            const [rating] = await pool.execute(
                `SELECT COALESCE(AVG(r.rating), 0) as avg FROM reviews r
                 INNER JOIN projects p ON r.project_id = p.id
                 WHERE p.user_id = ?`,
                [userId]
            );
            avgRating = parseFloat(rating[0]?.avg || 0);
        } catch (err) { }

        // 5. Bekleyen Kazançlar (Son 7 gün, henüz hesaba geçmemiş 'processing' siparişler)
        // Formül: (Net / 1.18) * Komisyon Oranı
        let pendingEarnings = 0;
        try {
            // Komisyon oranı varsayılan 15
            const [pendingRows] = await pool.execute(
                `SELECT 
                    o.final_amount, o.total_amount, o.discount_amount,
                    oi.subtotal, o.commission_rate
                 FROM orders o
                 INNER JOIN order_items oi ON o.id = oi.order_id
                 INNER JOIN projects p ON oi.project_id = p.id
                 WHERE p.user_id = ? 
                 AND (o.order_status = 'processing' OR o.order_status = 'pending')
                 AND o.created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)`,
                [userId]
            );

            for (const row of pendingRows) {
                const subtotal = parseFloat(row.subtotal);
                let effectiveSubtotal = subtotal;
                // İndirim payı düş
                if (row.total_amount > 0 && row.discount_amount > 0) {
                    effectiveSubtotal = subtotal - ((subtotal / row.total_amount) * row.discount_amount);
                }

                const net = effectiveSubtotal / 1.18;
                const commRate = parseFloat(row.commission_rate || 15);
                const sellerShare = net * ((100 - commRate) / 100);
                pendingEarnings += sellerShare;
            }
        } catch (err) {
            console.error('Pending earnings calc error:', err);
        }

        // 6. Güncel Cüzdan Bakiyesi (Users tablosu)
        const [userBalance] = await pool.execute('SELECT balance FROM users WHERE id = ?', [userId]);
        const currentBalance = parseFloat(userBalance[0]?.balance || 0);

        res.json({
            projects: projects[0]?.total || 0,
            sales: salesStats[0]?.total_sales_count || 0,
            earnings: totalNetEarnings,
            balance: currentBalance, // Frontend'de bu alan varsa gösterilir
            views: viewsTotal,
            avg_rating: avgRating.toFixed(1),
            pending_earnings: Math.round(pendingEarnings * 100) / 100
        });
    } catch (error) {
        console.error('Get seller dashboard error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Satıcının projeleri
router.get('/projects', async (req, res) => {
    try {
        // Önce tüm projeleri çek (primary_image olmadan)
        const [projects] = await pool.execute(
            `SELECT p.*, c.name as category_name
             FROM projects p
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE p.user_id = ?
             ORDER BY p.created_at DESC`,
            [req.user.id]
        );

        // Her proje için görselleri getir ve primary_image'i bul
        for (let project of projects) {
            // project_images tablosundan bu projeye ait tüm resimleri çek
            const [images] = await pool.execute(
                'SELECT image_path, is_primary, sort_order FROM project_images WHERE project_id = ? ORDER BY is_primary DESC, sort_order ASC',
                [project.id]
            );

            // is_primary = 1 olan resmi bul
            let primaryImage = null;
            if (images.length > 0) {
                // Önce is_primary = 1 olanı ara
                const primaryImg = images.find(img => img.is_primary === 1);
                if (primaryImg) {
                    primaryImage = primaryImg.image_path;
                } else {
                    // Eğer is_primary = 1 yoksa, ilk resmi al
                    primaryImage = images[0].image_path;
                }
            }

            // Primary image URL'ini düzelt
            if (primaryImage) {
                project.primary_image = `/uploads/${primaryImage}`;
            } else {
                project.primary_image = null;
            }

            // Tüm resimlerin URL'lerini düzelt
            project.images = images.map(img => ({
                ...img,
                image_path: `/uploads/${img.image_path}`
            }));
        }

        // Response'u gönder
        res.json({ projects });
    } catch (error) {
        console.error('Get seller projects error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Tek bir proje detayı
router.get('/projects/:id', async (req, res) => {
    try {
        const projectId = req.params.id;
        const userId = req.user.id;

        const [projects] = await pool.execute(
            `SELECT p.*, c.name as category_name, c.id as category_id
             FROM projects p
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE p.id = ? AND p.user_id = ?`,
            [projectId, userId]
        );

        if (projects.length === 0) {
            return res.status(404).json({ error: 'Proje bulunamadı' });
        }

        const project = projects[0];

        // Tags'ı project_tags tablosundan getir
        const [projectTags] = await pool.execute(
            `SELECT t.id, t.name, t.slug 
             FROM project_tags pt
             INNER JOIN tags t ON pt.tag_id = t.id
             WHERE pt.project_id = ?`,
            [projectId]
        );
        project.tags = projectTags.map(t => t.name);

        // Images'ı getir ve URL'leri düzelt
        const [images] = await pool.execute(
            'SELECT id, image_path, is_primary, sort_order FROM project_images WHERE project_id = ? ORDER BY is_primary DESC, sort_order ASC',
            [projectId]
        );
        project.images = images.map(img => {
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

        // Primary image'i de ekle
        const primaryImage = images.find(img => img.is_primary === 1);
        if (primaryImage) {
            project.primary_image = `/uploads/${primaryImage.image_path}`;
        }

        // Çok dilli içerikleri getir
        try {
            const [translations] = await pool.execute(
                `SELECT language_code, title, description, short_description 
                 FROM content_translations 
                 WHERE content_id = ? AND content_type = 'project'`,
                [projectId]
            );

            project.translations = {};
            translations.forEach(t => {
                project.translations[t.language_code] = {
                    title: t.title,
                    description: t.description,
                    short_description: t.short_description
                };
            });
        } catch (err) {
            // content_translations tablosu yoksa boş obje döndür
            console.log('content_translations table not available:', err.message);
            project.translations = {};
        }

        res.json({ project });
    } catch (error) {
        console.error('Get seller project error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Yeni proje oluştur
router.post('/projects', upload.fields([
    { name: 'primary_image', maxCount: 1 },
    { name: 'gallery_images', maxCount: 20 }
]), checkFileSizeLimit, async (req, res) => {
    try {
        // ABONELİK LİMİT KONTROLÜ
        const hasLimit = await checkSubscriptionLimit(req.user.id, 'project_limit');
        if (!hasLimit) {
            // Yüklenen dosyaları sil (çünkü işlem iptal edilecek)
            if (req.files) {
                const fsPromises = fs.promises;
                if (req.files.primary_image) {
                    for (const f of (Array.isArray(req.files.primary_image) ? req.files.primary_image : [req.files.primary_image])) {
                        try { await fsPromises.unlink(f.path); } catch (e) { }
                    }
                }
                if (req.files.gallery_images) {
                    for (const f of (Array.isArray(req.files.gallery_images) ? req.files.gallery_images : [req.files.gallery_images])) {
                        try { await fsPromises.unlink(f.path); } catch (e) { }
                    }
                }
            }
            return res.status(403).json({
                error: 'Proje oluşturma limitinize ulaştınız. Limitleri artırmak için paketinizi yükseltin.'
            });
        }

        // GENEL SİSTEM LİMİT KONTROLÜ
        const projectLimit = await checkProjectLimit(req.user.id);
        if (!projectLimit.allowed) {
            // Yüklenen dosyaları sil
            if (req.files) {
                const fsPromises = fs.promises;
                if (req.files.primary_image) {
                    for (const f of (Array.isArray(req.files.primary_image) ? req.files.primary_image : [req.files.primary_image])) {
                        try { await fsPromises.unlink(f.path); } catch (e) { }
                    }
                }
                if (req.files.gallery_images) {
                    for (const f of (Array.isArray(req.files.gallery_images) ? req.files.gallery_images : [req.files.gallery_images])) {
                        try { await fsPromises.unlink(f.path); } catch (e) { }
                    }
                }
            }
            return res.status(403).json({
                error: `Proje oluşturma limitine ulaştınız. Mevcut: ${projectLimit.current}/${projectLimit.max} proje.`
            });
        }

        // FormData veya JSON body kontrolü
        const isFormData = req.headers['content-type']?.includes('multipart/form-data');

        let projectData = {};
        if (isFormData) {
            // FormData'dan verileri al
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
                demo_url: req.body.demo_url || '',
                admin_demo_url: req.body.admin_demo_url || '',
                demo_username: req.body.demo_username || '',
                demo_password: req.body.demo_password || '',
                admin_username: req.body.admin_username || '',
                admin_password: req.body.admin_password || '',
                video_url: req.body.video_url || '',
                license_type: req.body.license_type || '',
                requirements: req.body.requirements || '',
                version: req.body.version || '1.0.0'
            };
        } else {
            projectData = req.body;
        }

        const {
            title_tr, title_en, title_de,
            description_tr, description_en, description_de,
            short_description_tr, short_description_en, short_description_de,
            category_id, price, discount_price, currency, tags,
            demo_url, admin_demo_url, demo_username, demo_password,
            admin_username, admin_password, video_url, license_type,
            requirements, version, completion_status, completion_percentage,
            source_url, timeline, donation_target, deadline
        } = projectData;

        if (!title_tr || !description_tr || !category_id) {
            return res.status(400).json({ error: 'Tüm zorunlu alanlar doldurulmalıdır (Türkçe)' });
        }

        const allowedStatuses = ['pending', 'approved', 'rejected', 'active', 'inactive'];
        let status = 'pending';
        if (req.user.role === 'admin' && req.body.status && allowedStatuses.includes(req.body.status)) {
            status = req.body.status;
        }

        // Validate price or donation target
        if (completion_status === 'completed' && !price) {
            return res.status(400).json({ error: 'Tamamlanmış projeler için fiyat zorunludur' });
        }
        if (completion_status === 'in_progress' && !donation_target) {
            return res.status(400).json({ error: 'Geliştirilmekte olan projeler için bağış hedefi zorunludur' });
        }

        // Slug oluştur ve unique kontrolü yap
        let slug = title_tr.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        let slugExists = true;
        let slugCounter = 1;
        const originalSlug = slug;

        // Slug'un unique olduğundan emin ol
        while (slugExists) {
            const [existing] = await pool.execute(
                'SELECT id FROM projects WHERE slug = ?',
                [slug]
            );
            if (existing.length === 0) {
                slugExists = false;
            } else {
                slug = `${originalSlug}-${slugCounter}`;
                slugCounter++;
            }
        }

        // Tags'ı technologies olarak kaydet
        const technologies = tags ? (typeof tags === 'string' ? tags : tags.join(',')) : null;

        console.log('Project Insert Values:', {
            userId: req.user.id,
            title: title_tr,
            cat: category_id,
            price: price || 0,
            status,
            active: 1,
            comp: parseInt(completion_percentage) || 100,
            donation: donation_target ? parseFloat(donation_target) : null,
            deadline: deadline ? deadline : null,
            date: new Date()
        });

        const insertValues = [
            req.user.id,
            title_tr,
            slug,
            description_tr,
            short_description_tr || null,
            category_id,
            price || 0,
            discount_price || null,
            currency || 'TRY',
            status, // Otomatik 'pending'
            1, // is_active (default 1)
            parseInt(completion_percentage) || 100,
            donation_target ? parseFloat(donation_target) : null, // Bağış hedefi
            deadline && deadline !== '' ? deadline : null, // Bitiş tarihi (empty string yerine null)
            null, // İndirme limiti (admin ayarlar)
            0, // Featured (admin ayarlar)
            demo_url || null,
            admin_demo_url || null,
            demo_username || null,
            demo_password || null,
            admin_username || null,
            admin_password || null,
            video_url || null,
            license_type || null,
            technologies || null, // Technologies (tags'dan)
            requirements || null,
            version || '1.0.0',
            completion_status || 'completed',
            source_url || null,
            timeline ? (typeof timeline === 'object' ? JSON.stringify(timeline) : timeline) : null
        ];

        // Check for undefined values
        const undefinedIndex = insertValues.findIndex(v => v === undefined);
        if (undefinedIndex !== -1) {
            console.error(`Undefined value at index ${undefinedIndex}`);
            return res.status(500).json({ error: 'Sunucu hatası: Eksik parametre', details: `Index ${undefinedIndex} is undefined` });
        }

        // Debug: Column and value count check
        const columns = 'user_id, title, slug, description, short_description, category_id, price, discount_price, currency, status, is_active, completion_percentage, donation_target, deadline, download_limit, featured, demo_url, admin_demo_url, demo_username, demo_password, admin_username, admin_password, video_url, license_type, technologies, requirements, version, completion_status, source_url, timeline';
        const columnCount = columns.split(',').length;
        console.log(`DEBUG: Column count: ${columnCount}, Values count: ${insertValues.length}`);
        console.log('DEBUG insertValues:', insertValues);

        const [result] = await pool.query(
            `INSERT INTO projects (${columns})
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            insertValues
        );

        const projectId = result.insertId;

        // Tags'ı project_tags tablosuna kaydet
        if (tags) {
            let tagNames = [];
            if (typeof tags === 'string') {
                tagNames = tags.split(',').map(t => t.trim()).filter(t => t);
            } else if (Array.isArray(tags)) {
                tagNames = tags;
            }

            // Her tag için: varsa ID'sini al, yoksa oluştur, sonra project_tags'e ekle
            for (const tagName of tagNames) {
                if (!tagName) continue;

                // Tag'i bul veya oluştur
                const [existingTags] = await pool.execute(
                    'SELECT id FROM tags WHERE slug = ?',
                    [tagName.toLowerCase().replace(/[^a-z0-9]+/g, '-')]
                );

                let tagId;
                if (existingTags.length > 0) {
                    tagId = existingTags[0].id;
                } else {
                    // Yeni tag oluştur
                    const [newTag] = await pool.execute(
                        'INSERT INTO tags (name, slug) VALUES (?, ?)',
                        [tagName, tagName.toLowerCase().replace(/[^a-z0-9]+/g, '-')]
                    );
                    tagId = newTag.insertId;
                }

                // project_tags tablosuna ekle (duplicate kontrolü ile)
                await pool.query(
                    `INSERT INTO project_tags (project_id, tag_id) 
                     VALUES (?, ?) 
                     ON DUPLICATE KEY UPDATE project_id = project_id`,
                    [projectId, tagId]
                );
            }
        }

        // Çok dilli içerikleri content_translations tablosuna kaydet (TÜM DİLLER)
        // Türkçe
        await pool.query(
            `INSERT INTO content_translations (content_id, content_type, language_code, title, description, short_description)
             VALUES (?, 'project', 'tr', ?, ?, ?)
             ON DUPLICATE KEY UPDATE title = ?, description = ?, short_description = ?`,
            [projectId, title_tr, description_tr, short_description_tr || null,
                title_tr, description_tr, short_description_tr || null]
        );

        // İngilizce
        if (title_en || description_en || short_description_en) {
            await pool.query(
                `INSERT INTO content_translations (content_id, content_type, language_code, title, description, short_description)
                 VALUES (?, 'project', 'en', ?, ?, ?)
                 ON DUPLICATE KEY UPDATE title = ?, description = ?, short_description = ?`,
                [projectId, title_en || title_tr, description_en || description_tr, short_description_en || short_description_tr || null,
                    title_en || title_tr, description_en || description_tr, short_description_en || short_description_tr || null]
            );
        }

        // Almanca
        if (title_de || description_de || short_description_de) {
            await pool.query(
                `INSERT INTO content_translations (content_id, content_type, language_code, title, description, short_description)
                 VALUES (?, 'project', 'de', ?, ?, ?)
                 ON DUPLICATE KEY UPDATE title = ?, description = ?, short_description = ?`,
                [projectId, title_de || title_tr, description_de || description_tr, short_description_de || short_description_tr || null,
                    title_de || title_tr, description_de || description_tr, short_description_de || short_description_tr || null]
            );
        }

        // Resim yükleme işlemleri
        console.log('📸 Resim yükleme başlatıldı. req.files:', req.files ? Object.keys(req.files) : 'yok');
        if (req.files) {
            const fsPromises = fs.promises;
            // Tüm resimler direkt projects/ klasöründe olacak (alt klasör yok)
            // __dirname kullanarak backend klasöründen başla
            const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'projects');

            // Upload dizinini oluştur ve izinleri ayarla
            await fsPromises.mkdir(uploadDir, { recursive: true });
            try {
                await fsPromises.chmod(uploadDir, 0o755);
            } catch (err) {
                console.warn('Klasör izinleri ayarlanamadı:', err.message);
            }

            // Primary image
            const primaryFile = req.files.primary_image ?
                (Array.isArray(req.files.primary_image) ? req.files.primary_image[0] : req.files.primary_image) : null;

            // Galeri resimleri
            const galleryFiles = req.files.gallery_images ?
                (Array.isArray(req.files.gallery_images) ? req.files.gallery_images : [req.files.gallery_images]) : [];

            // GÖRSEL SAYISI LİMİT KONTROLÜ
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
                        error: `Görsel limitine ulaştınız. Mevcut: ${imageLimit.current}/${imageLimit.max} görsel. Maksimum ${imageLimit.max} görsel ekleyebilirsiniz.`
                    });
                }
            }

            let sortOrder = 0;
            let hasPrimary = false;

            // Helper function: Dosyayı temp'ten projects'e taşı
            const moveFile = async (sourcePath, destPath) => {
                try {
                    // Dosyanın varlığını kontrol et
                    await fsPromises.access(sourcePath);
                    // Copy + unlink kullan (rename bazen çalışmıyor)
                    await fsPromises.copyFile(sourcePath, destPath);
                    await fsPromises.unlink(sourcePath);
                    console.log(`✅ Dosya taşındı: ${sourcePath} -> ${destPath}`);
                } catch (error) {
                    console.error(`❌ Dosya taşıma hatası: ${error.message}`);
                    console.error(`Source: ${sourcePath}`);
                    console.error(`Dest: ${destPath}`);
                    throw error;
                }
            };

            // Primary image'i yükle
            if (primaryFile && primaryFile.path) {
                try {
                    const primaryExt = path.extname(primaryFile.originalname);
                    // Dosya adına proje ID'sini ekle: primary_16_timestamp.png
                    const primaryFileName = `primary_${projectId}_${Date.now()}${primaryExt}`;
                    const primaryFilePath = path.join(uploadDir, primaryFileName);

                    // Dosyayı taşı
                    await moveFile(primaryFile.path, primaryFilePath);

                    // Veritabanına kaydet: projects/primary_16_timestamp.png
                    const relativePath = `projects/${primaryFileName}`;
                    await pool.query(
                        `INSERT INTO project_images (project_id, image_path, is_primary, sort_order) VALUES (?, ?, 1, ?)`,
                        [projectId, relativePath, sortOrder++]
                    );
                    hasPrimary = true;
                    console.log(`✅ Primary image kaydedildi: ${relativePath}`);
                } catch (error) {
                    console.error('❌ Primary image yükleme hatası:', error);
                    // Hata olsa bile devam et
                }
            }

            // Galeri resimlerini yükle
            for (const file of galleryFiles) {
                if (!file || !file.path) continue;

                try {
                    const ext = path.extname(file.originalname);
                    // Dosya adına proje ID'sini ekle: gallery_16_timestamp_random.png
                    const fileName = `gallery_${projectId}_${Date.now()}_${Math.random().toString(36).substring(7)}${ext}`;
                    const filePath = path.join(uploadDir, fileName);

                    // Dosyayı taşı
                    await moveFile(file.path, filePath);

                    // Veritabanına kaydet: projects/gallery_16_timestamp_random.png
                    const relativePath = `projects/${fileName}`;
                    const isPrimary = !hasPrimary && sortOrder === 0; // İlk resim primary olabilir

                    await pool.query(
                        `INSERT INTO project_images (project_id, image_path, is_primary, sort_order) VALUES (?, ?, ?, ?)`,
                        [projectId, relativePath, isPrimary ? 1 : 0, sortOrder++]
                    );

                    if (isPrimary) hasPrimary = true;
                    console.log(`✅ Galeri resmi kaydedildi: ${relativePath}`);
                } catch (error) {
                    console.error('❌ Galeri resmi yükleme hatası:', error);
                    // Hata olsa bile devam et
                }
            }
        }

        res.status(201).json({ message: 'Proje oluşturuldu', project_id: projectId });
    } catch (error) {
        console.error('Create project error:', error);
        console.error('Error stack:', error.stack);
        console.error('Request body:', req.body);
        console.error('Request files:', req.files);

        // Hata türüne göre mesaj döndür
        let errorMessage = 'Sunucu hatası';
        if (error.code === 'ER_NO_SUCH_TABLE') {
            errorMessage = 'Veritabanı tablosu bulunamadı';
        } else if (error.code === 'ER_BAD_FIELD_ERROR') {
            errorMessage = 'Veritabanı kolonu bulunamadı';
        } else if (error.code === 'ER_DUP_ENTRY') {
            errorMessage = 'Bu slug zaten kullanılıyor';
        } else if (error.message) {
            errorMessage = error.message;
        }

        res.status(500).json({
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Proje güncelle
router.put('/projects/:id', upload.fields([
    { name: 'primary_image', maxCount: 1 },
    { name: 'gallery_images', maxCount: 20 }
]), checkFileSizeLimit, async (req, res) => {
    try {
        const projectId = req.params.id;
        const userId = req.user.id;
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
                completion_status: req.body.completion_status || 'completed',
                completion_percentage: req.body.completion_percentage || 100,
                source_url: req.body.source_url || '',
                timeline: req.body.timeline || null,
                donation_target: req.body.donation_target || null,
                deadline: req.body.deadline || null
            };
        } else {
            projectData = req.body;
        }

        const {
            title, title_tr, title_en, title_de,
            description, description_tr, description_en, description_de,
            short_description, short_description_tr, short_description_en, short_description_de,
            category_id, price, discount_price, currency, tags, status, is_active,
            demo_url, admin_demo_url, demo_username, demo_password,
            admin_username, admin_password, video_url, license_type, requirements, version,
            completion_status, completion_percentage, source_url, timeline,
            donation_target, deadline
        } = projectData;

        // Projenin sahibi kontrolü
        const [existing] = await pool.execute(
            'SELECT id FROM projects WHERE id = ? AND user_id = ?',
            [projectId, userId]
        );

        if (existing.length === 0) {
            return res.status(404).json({ error: 'Proje bulunamadı veya yetkiniz yok' });
        }

        // Güncellenecek alanları hazırla
        const updates = [];
        const values = [];

        // title_tr varsa title olarak kullan (Türkçe varsayılan)
        const finalTitle = title_tr || title;
        if (finalTitle !== undefined && finalTitle !== null && finalTitle !== '') {
            updates.push('title = ?');
            values.push(finalTitle);
            // Slug'ı da güncelle
            const slug = finalTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            if (slug) {
                updates.push('slug = ?');
                values.push(slug);
            }
        }

        // description_tr varsa description olarak kullan
        const finalDescription = description_tr || description;
        if (finalDescription !== undefined && finalDescription !== null) {
            updates.push('description = ?');
            values.push(finalDescription || null);
        }

        // short_description_tr varsa short_description olarak kullan
        const finalShortDescription = short_description_tr || short_description;
        if (finalShortDescription !== undefined && finalShortDescription !== null) {
            updates.push('short_description = ?');
            values.push(finalShortDescription || null);
        }
        if (category_id !== undefined && category_id !== null && category_id !== '') {
            updates.push('category_id = ?');
            values.push(category_id);
        }
        if (price !== undefined && price !== null && price !== '') {
            updates.push('price = ?');
            values.push(parseFloat(price) || 0);
        }
        if (discount_price !== undefined && discount_price !== null && discount_price !== '') {
            updates.push('discount_price = ?');
            values.push(parseFloat(discount_price) || null);
        }
        if (currency !== undefined && currency !== null && currency !== '') {
            updates.push('currency = ?');
            values.push(currency);
        }
        // Tags güncellemesi project_tags tablosunda yapılacak (ayrı işlenecek)
        if (status !== undefined) {
            updates.push('status = ?');
            values.push(status);
        }
        // is_active kolonu veritabanında yoksa bu kısmı atlayın
        // Veritabanına kolonu eklemek için: ALTER TABLE projects ADD COLUMN is_active tinyint(1) DEFAULT 1;
        // Şimdilik devre dışı - veritabanında kolon yok
        // if (is_active !== undefined) {
        //     updates.push('is_active = ?');
        //     const isActiveValue = typeof is_active === 'string' 
        //         ? (is_active === '1' || is_active === 'true' || is_active.toLowerCase() === 'true')
        //         : Boolean(is_active);
        //     values.push(isActiveValue ? 1 : 0);
        // }
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
        if (completion_status !== undefined) {
            updates.push('completion_status = ?');
            values.push(completion_status);
        }
        if (completion_percentage !== undefined) {
            updates.push('completion_percentage = ?');
            values.push(parseInt(completion_percentage) || 0);
        }
        if (source_url !== undefined) {
            updates.push('source_url = ?');
            values.push(source_url || null);
        }
        if (timeline !== undefined) {
            updates.push('timeline = ?');
            values.push(timeline ? (typeof timeline === 'object' ? JSON.stringify(timeline) : timeline) : null);
        }
        if (donation_target !== undefined) {
            updates.push('donation_target = ?');
            values.push(donation_target || null);
        }
        if (deadline !== undefined) {
            updates.push('deadline = ?');
            values.push(deadline || null);
        }

        // Eğer hiçbir alan güncellenmiyorsa ama resim yükleme varsa devam et
        if (updates.length === 0 && (!req.files || (!req.files.primary_image && (!req.files.gallery_images || req.files.gallery_images.length === 0)))) {
            return res.status(400).json({ error: 'Güncellenecek alan belirtilmedi' });
        }

        // Eğer güncellenecek alan varsa UPDATE sorgusu çalıştır
        if (updates.length > 0) {
            // updated_at kolonu varsa ekle, yoksa atla
            try {
                const [cols] = await pool.execute("SHOW COLUMNS FROM projects LIKE 'updated_at'");
                if (cols.length > 0) {
                    updates.push('updated_at = NOW()');
                }
            } catch (colError) {
                console.warn('updated_at kolonu kontrol edilemedi:', colError.message);
            }
            
            values.push(projectId);

            console.log('UPDATE query:', `UPDATE projects SET ${updates.join(', ')} WHERE id = ?`);
            console.log('UPDATE values:', values);

            await pool.execute(
                `UPDATE projects SET ${updates.join(', ')} WHERE id = ?`,
                values
            );
        }

        // Tags güncellemesi (varsa)
        if (tags !== undefined) {
            // Önce mevcut tag'leri sil
            await pool.execute('DELETE FROM project_tags WHERE project_id = ?', [projectId]);

            // Yeni tag'leri ekle
            if (tags) {
                let tagNames = [];
                if (typeof tags === 'string') {
                    tagNames = tags.split(',').map(t => t.trim()).filter(t => t);
                } else if (Array.isArray(tags)) {
                    tagNames = tags;
                }

                for (const tagName of tagNames) {
                    if (!tagName) continue;

                    // Tag slug'ı oluştur
                    const tagSlug = tagName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

                    // Tag'i bul veya oluştur
                    const [existingTags] = await pool.execute(
                        'SELECT id FROM tags WHERE slug = ?',
                        [tagSlug]
                    );

                    let tagId;
                    if (existingTags.length > 0) {
                        tagId = existingTags[0].id;
                    } else {
                        // Yeni tag oluştur
                        const [newTag] = await pool.execute(
                            'INSERT INTO tags (name, slug) VALUES (?, ?)',
                            [tagName, tagSlug]
                        );
                        tagId = newTag.insertId;
                    }

                    // project_tags tablosuna ekle
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

        // Çok dilli içerikleri güncelle (undefined → null)
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

            // GÖRSEL SAYISI LİMİT KONTROLÜ (Güncelleme)
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
                        error: `Görsel limitine ulaştınız. Mevcut: ${imageLimit.current}/${imageLimit.max} görsel. Maksimum ${imageLimit.max} görsel ekleyebilirsiniz.`
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
            userId: req.user?.id,
            body: req.body
        });
        res.status(500).json({ error: 'Sunucu hatası', details: error.message });
    }
});

// Proje sil
router.delete('/projects/:id', async (req, res) => {
    try {
        const projectId = req.params.id;
        const userId = req.user.id;

        // Projenin sahibi kontrolü
        const [existing] = await pool.execute(
            'SELECT id FROM projects WHERE id = ? AND user_id = ?',
            [projectId, userId]
        );

        if (existing.length === 0) {
            return res.status(404).json({ error: 'Proje bulunamadı veya yetkiniz yok' });
        }

        await pool.execute('DELETE FROM projects WHERE id = ?', [projectId]);

        res.json({ message: 'Proje silindi' });
    } catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Kazançlar
// Kazançlar
router.get('/earnings', async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Toplam Ciro (Net Kazanç Toplamı) - Transactions tablosundan
        const [earningsStats] = await pool.execute(
            `SELECT COALESCE(SUM(amount), 0) as total 
             FROM transactions 
             WHERE user_id = ? AND type = 'sale' AND status = 'completed'`,
            [userId]
        );
        const totalNetEarnings = parseFloat(earningsStats[0]?.total || 0);

        // 2. Güncel Cüzdan Bakiyesi - Users tablosundan
        const [userBalance] = await pool.execute('SELECT balance FROM users WHERE id = ?', [userId]);
        const currentBalance = parseFloat(userBalance[0]?.balance || 0);

        // 3. Çekilen Bakiye (Tamamlananlar)
        const [withdrawnCompleted] = await pool.execute(
            `SELECT COALESCE(SUM(amount), 0) as total FROM withdrawals WHERE user_id = ? AND status = 'completed'`,
            [userId]
        );
        const withdrawnTotal = parseFloat(withdrawnCompleted[0].total || 0);

        // 4. Bekleyen Çekim Talepleri
        const [withdrawalsPending] = await pool.execute(
            `SELECT COALESCE(SUM(amount), 0) as total FROM withdrawals WHERE user_id = ? AND status = 'pending'`,
            [userId]
        );
        const pendingWithdrawalTotal = parseFloat(withdrawalsPending[0].total || 0);

        // 5. Bloke Bakiye (7 günlük bloke süresindeki satışlar)
        let blockedBalance = 0;
        try {
            // Önce users tablosundan blocked_balance'ı al
            const [userBlocked] = await pool.execute('SELECT blocked_balance FROM users WHERE id = ?', [userId]);
            blockedBalance = parseFloat(userBlocked[0]?.blocked_balance || 0);
            
            // Eğer blocked_balance kolonu yoksa, transactions tablosundan hesapla
            if (isNaN(blockedBalance)) {
                const [blockedStats] = await pool.execute(
                    `SELECT COALESCE(SUM(amount), 0) as total
                     FROM transactions
                     WHERE user_id = ? AND type = 'sale' AND status = 'completed'
                     AND (unblock_date IS NOT NULL AND unblock_date > NOW())`,
                    [userId]
                );
                blockedBalance = parseFloat(blockedStats[0]?.total || 0);
            }
        } catch (e) {
            // blocked_balance kolonu yoksa eski yöntemle hesapla
            const [blockedStats] = await pool.execute(
                `SELECT COALESCE(SUM(amount), 0) as total
                 FROM transactions
                 WHERE user_id = ? AND type = 'sale' AND status = 'completed'
                 AND created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)`,
                [userId]
            );
            blockedBalance = parseFloat(blockedStats[0]?.total || 0);
        }

        // 6. Bekleyen Sipariş Kazançları (Processing - Henüz hesaba geçmemiş)
        let pendingOrderEarnings = 0;
        try {
            const [pendingRows] = await pool.execute(
                `SELECT
                    o.final_amount, o.total_amount, o.discount_amount,
                    oi.subtotal, o.commission_rate
                 FROM orders o
                 INNER JOIN order_items oi ON o.id = oi.order_id
                 INNER JOIN projects p ON oi.project_id = p.id
                 WHERE p.user_id = ?
                 AND (o.order_status = 'processing' OR o.order_status = 'pending')`,
                [userId]
            );

            for (const row of pendingRows) {
                const subtotal = parseFloat(row.subtotal);
                let effectiveSubtotal = subtotal;
                if (row.total_amount > 0 && row.discount_amount > 0) {
                    effectiveSubtotal = subtotal - ((subtotal / row.total_amount) * row.discount_amount);
                }
                const net = effectiveSubtotal / 1.18;
                const commRate = parseFloat(row.commission_rate || 15);
                const sellerShare = net * ((100 - commRate) / 100);
                pendingOrderEarnings += sellerShare;
            }
        } catch (err) {
            console.error('Pending earnings calc error:', err);
        }

        // Çekilebilir Bakiye Hesaplama
        // Formül: Çekilebilir Bakiye (balance) - Bekleyen Çekimler
        // Bloke bakiye zaten balance'dan ayrı tutuluyor
        const available = Math.max(0, currentBalance - pendingWithdrawalTotal);

        res.json({
            total: totalNetEarnings, // Toplam Ciro
            balance: currentBalance, // Cüzdan Bakiyesi (Görünen)
            available: Math.round(available * 100) / 100, // Çekilebilir
            pending: Math.round(pendingOrderEarnings * 100) / 100, // İşlemdeki Siparişler (Gelecek)
            blocked: Math.round(blockedBalance * 100) / 100, // 7 Gün Kuralına Takılanlar
            withdrawn: withdrawnTotal,
            pending_withdrawals: pendingWithdrawalTotal
        });
    } catch (error) {
        console.error('Get earnings error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Para çekme talepleri
router.get('/withdrawals', async (req, res) => {
    try {
        const [withdrawals] = await pool.execute(
            `SELECT * FROM withdrawals WHERE user_id = ? ORDER BY created_at DESC`,
            [req.user.id]
        );
        res.json({ withdrawals });
    } catch (error) {
        console.error('Get withdrawals error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

router.post('/withdrawals', async (req, res) => {
    try {
        const { amount, iban, bank_name, account_holder } = req.body;
        const userId = req.user.id;

        if (!amount || parseFloat(amount) <= 0) {
            return res.status(400).json({ error: 'Geçerli bir tutar girin' });
        }

        if (!iban) {
            return res.status(400).json({ error: 'IBAN bilgisi gereklidir' });
        }

        // Toplam Satış (Adet) ve Toplam Kazanç (Cüzdana Giren)
        // DİKKAT: Toplam kazancı order_items'dan değil, transactions tablosundan çekiyoruz.
        // Böylece indirimler, iadeler ve komisyonlar düşülmüş NET rakamı görürüz.
        const [salesStats] = await pool.execute(
            `SELECT 
                COUNT(DISTINCT order_id) as total_sales_count,
                COALESCE(SUM(amount), 0) as total_earnings
             FROM transactions 
             WHERE user_id = ? AND type = 'sale' AND status = 'completed'`,
            [req.user.id]
        );

        const totalSales = salesStats[0].total_sales_count || 0;
        const totalEarnings = salesStats[0].total_earnings || 0;

        // Çekilen bakiye (statüsü 'completed' veya 'pending' olanlar)
        const [withdrawn] = await pool.execute(
            `SELECT COALESCE(SUM(amount), 0) as total FROM withdrawals WHERE user_id = ? AND status != 'rejected'`,
            [userId] // status != rejected (bekleyenler de bakiyeden düşmeli)
        );
        const withdrawnTotal = parseFloat(withdrawn[0].total || 0);

        // Çekilebilir bakiye: balance - bekleyen çekimler - bloke bakiye
        const [userBalance] = await pool.execute('SELECT balance, blocked_balance FROM users WHERE id = ?', [userId]);
        const currentBalance = parseFloat(userBalance[0]?.balance || 0);
        const blockedBalance = parseFloat(userBalance[0]?.blocked_balance || 0);
        
        const [pendingWithdrawals] = await pool.execute(
            "SELECT COALESCE(SUM(amount), 0) as total FROM withdrawals WHERE user_id = ? AND status = 'pending'",
            [userId]
        );
        const pendingTotal = parseFloat(pendingWithdrawals[0].total || 0);
        
        const available = Math.max(0, currentBalance - pendingTotal);

        if (parseFloat(amount) > available) {
            return res.status(400).json({ 
                error: `Çekilebilir bakiyeniz yetersiz. Mevcut: ${available.toFixed(2)} TL, Bloke: ${blockedBalance.toFixed(2)} TL` 
            });
        }

        const [result] = await pool.execute(
            `INSERT INTO withdrawals (user_id, amount, status, iban, bank_name, account_holder) VALUES (?, ?, 'pending', ?, ?, ?)`,
            [userId, amount, iban, bank_name || null, account_holder || null]
        );

        res.status(201).json({ message: 'Para çekme talebi oluşturuldu', withdrawal_id: result.insertId });
    } catch (error) {
        console.error('Create withdrawal error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Satıcı siparişleri (detaylı)
router.get('/orders', async (req, res) => {
    try {
        const userId = req.user.id;
        const { lang = 'tr', status, payment_status } = req.query;

        let statusFilter = '';
        let paymentFilter = '';
        const params = [userId, lang];

        if (status && status !== 'all') {
            statusFilter = ' AND o.order_status = ?';
            params.push(status);
        }

        if (payment_status && payment_status !== 'all') {
            paymentFilter = ' AND o.payment_status = ?';
            params.push(payment_status);
        }

        const [orders] = await pool.execute(
            `SELECT DISTINCT o.*,
                    COUNT(DISTINCT oi.id) as item_count,
                    GROUP_CONCAT(
                        JSON_OBJECT(
                            'id', oi.id,
                            'project_id', oi.project_id,
                            'project_title', COALESCE(ct.title, p.title),
                            'quantity', oi.quantity,
                            'price', oi.price,
                            'subtotal', oi.subtotal
                        ) SEPARATOR '|||'
                    ) as items_json,
                    u.username as customer_name,
                    u.email as customer_email,
                    -- Satıcının kazancı (bu siparişten)
                    ROUND((
                        (
                            SUM(oi.subtotal) - (CASE WHEN o.total_amount > 0 THEN (SUM(oi.subtotal) / o.total_amount) * COALESCE(o.discount_amount, 0) ELSE 0 END)
                        ) / 1.18
                    ) * ((100 - COALESCE(o.commission_rate, 15)) / 100), 2) as seller_earnings
             FROM orders o
             INNER JOIN order_items oi ON o.id = oi.order_id
             INNER JOIN projects p ON oi.project_id = p.id
             LEFT JOIN users u ON o.user_id = u.id
             LEFT JOIN content_translations ct ON ct.content_id = p.id 
                 AND ct.content_type = 'project' 
                 AND ct.language_code = ?
             WHERE p.user_id = ?${statusFilter}${paymentFilter}
             GROUP BY o.id
             ORDER BY o.created_at DESC`,
            params
        );

        // items_json'u parse et
        const ordersWithItems = orders.map(order => {
            if (order.items_json) {
                try {
                    order.items = order.items_json.split('|||').map(item => JSON.parse(item));
                } catch (e) {
                    order.items = [];
                }
            } else {
                order.items = [];
            }
            delete order.items_json;
            return order;
        });

        res.json({ orders: ordersWithItems });
    } catch (error) {
        console.error('Get seller orders error:', error);
        res.status(500).json({ error: 'Sunucu hatası', details: error.message });
    }
});

// Satışlar
router.get('/sales', async (req, res) => {
    try {
        const userId = req.user.id;

        const [sales] = await pool.execute(
            `SELECT o.id as id, o.order_number, o.created_at, o.payment_status, o.commission_rate,
                    oi.subtotal as total_amount, o.total_amount as order_gross_total, o.discount_amount,
                    -- İndirimli Net Kazanç Hesabı (Yuvarlanmış)
                    ROUND((
                        (
                            oi.subtotal - (CASE WHEN o.total_amount > 0 THEN (oi.subtotal / o.total_amount) * COALESCE(o.discount_amount, 0) ELSE 0 END)
                        ) / 1.18
                    ) * ((100 - COALESCE(o.commission_rate, 15)) / 100), 2) as earnings,
                    p.title as project_title, u.username as customer_name
             FROM orders o
             INNER JOIN order_items oi ON o.id = oi.order_id
             INNER JOIN projects p ON oi.project_id = p.id
             LEFT JOIN users u ON o.user_id = u.id
             WHERE p.user_id = ?
             ORDER BY o.created_at DESC`,
            [userId]
        );

        res.json({ sales });
    } catch (error) {
        console.error('Get sales error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Satış detayı
router.get('/sales/:id', async (req, res) => {
    try {
        const orderId = req.params.id;
        const userId = req.user.id;

        // Sipariş ve Müşteri Bilgisi
        const [orders] = await pool.execute(
            `SELECT o.id, o.order_number, o.created_at, o.payment_status, o.payment_method,
                    o.commission_rate, o.total_amount, o.discount_amount, o.final_amount,
                    o.coupon_code,
                    u.username as customer_name, u.email as customer_email,
                    u.phone as customer_phone
             FROM orders o
             LEFT JOIN users u ON o.user_id = u.id
             INNER JOIN order_items oi ON o.id = oi.order_id
             INNER JOIN projects p ON oi.project_id = p.id
             WHERE o.id = ? AND p.user_id = ?
             GROUP BY o.id`,
            [orderId, userId]
        );

        if (orders.length === 0) {
            return res.status(404).json({ error: 'Satış bulunamadı' });
        }

        const order = orders[0];

        // Satılan Ürünler
        const [items] = await pool.execute(
            `SELECT oi.*, p.title as project_title, p.slug as project_slug,
                    (SELECT image_path FROM project_images WHERE project_id = p.id AND is_primary = 1 LIMIT 1) as image
             FROM order_items oi
             INNER JOIN projects p ON oi.project_id = p.id
             WHERE oi.order_id = ? AND p.user_id = ?`,
            [orderId, userId]
        );

        // Hesaplamalar
        let totalEarnings = 0;
        let totalSales = 0;

        const roundMoney = (amount) => Math.round(amount * 100) / 100;

        const itemsWithImages = items.map(item => {
            if (item.image && !item.image.startsWith('/uploads')) {
                item.image = `/uploads/${item.image}`;
            }

            // Item bazlı kazanç hesabı (İndirim Dahil - Yuvarlama Uygulandı)
            const subtotal = parseFloat(item.subtotal);
            let effectiveSubtotal = subtotal;

            if (order.total_amount > 0 && order.discount_amount > 0) {
                effectiveSubtotal = subtotal - ((subtotal / order.total_amount) * order.discount_amount);
            }

            effectiveSubtotal = roundMoney(effectiveSubtotal);

            const netAmount = roundMoney(effectiveSubtotal / 1.18); // KDV hariç
            const commission = roundMoney(netAmount * (parseFloat(order.commission_rate || 15) / 100));
            const earning = roundMoney(netAmount - commission);

            totalSales += subtotal; // Brüt satış tutarı
            totalEarnings += earning;

            return {
                ...item,
                earning: earning,
                effective_price: effectiveSubtotal
            };
        });

        res.json({
            sale: {
                ...order,
                items: itemsWithImages,
                total_sales_amount: totalSales,
                total_earnings: totalEarnings
            }
        });

    } catch (error) {
        console.error('Get sale detail error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Mesajlar
router.get('/messages', async (req, res) => {
    try {
        const userId = req.user.id;

        // Satıcının projeleriyle ilgili mesajları getir (sender_id veya receiver_id bazlı)
        // Satıcıya mesaj gönderen müşterileri bul
        const [conversations] = await pool.execute(
            `SELECT DISTINCT
                CASE 
                    WHEN m.sender_id = ? THEN m.receiver_id 
                    ELSE m.sender_id 
                END as customer_id,
                u.username as customer_name,
                u.email as customer_email,
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
             GROUP BY customer_id, u.username, u.email
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
                [userId, conv.customer_id, conv.customer_id, userId, userId, userId]
            );
            conv.last_message = lastMsg[0]?.message || null;

            // Okunmamış mesaj sayısı
            const [unread] = await pool.execute(
                `SELECT COUNT(*) as count FROM messages 
                 WHERE receiver_id = ? AND sender_id = ? AND is_read = 0 AND is_deleted_receiver = 0`,
                [userId, conv.customer_id]
            );
            conv.unread_count = unread[0]?.count || 0;
        }

        // Her konuşma için mesajları getir
        for (let conv of conversations) {
            const [messages] = await pool.execute(
                `SELECT m.*, 
                        u_sender.username as sender_name,
                        u_receiver.username as receiver_name,
                        CASE WHEN m.sender_id = ? THEN 1 ELSE 0 END as is_seller
                 FROM messages m
                 LEFT JOIN users u_sender ON m.sender_id = u_sender.id
                 LEFT JOIN users u_receiver ON m.receiver_id = u_receiver.id
                 WHERE ((m.sender_id = ? AND m.receiver_id = ?) 
                    OR (m.sender_id = ? AND m.receiver_id = ?))
                   AND (m.is_deleted_sender = 0 OR m.sender_id != ?)
                   AND (m.is_deleted_receiver = 0 OR m.receiver_id != ?)
                 ORDER BY m.created_at ASC`,
                [userId, userId, conv.customer_id, conv.customer_id, userId, userId, userId]
            );
            conv.messages = messages;
            // conversation_id yerine customer_id kullan
            conv.conversation_id = conv.customer_id;
            conv.id = conv.customer_id;
        }

        res.json({ messages: conversations });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

router.post('/messages', async (req, res) => {
    try {
        const { conversation_id, message, receiver_id } = req.body;
        const userId = req.user.id;

        if (!message) {
            return res.status(400).json({ error: 'Mesaj gereklidir' });
        }

        // conversation_id veya receiver_id kullan
        const receiverId = receiver_id || conversation_id;

        if (!receiverId) {
            return res.status(400).json({ error: 'Alıcı ID gereklidir' });
        }

        // Alıcı kontrolü
        const [receiver] = await pool.execute('SELECT id FROM users WHERE id = ?', [receiverId]);
        if (receiver.length === 0) {
            return res.status(404).json({ error: 'Alıcı bulunamadı' });
        }

        // Mesaj gönder
        const [result] = await pool.execute(
            `INSERT INTO messages (sender_id, receiver_id, subject, message) 
             VALUES (?, ?, ?, ?)`,
            [userId, receiverId, null, message]
        );

        res.json({
            message: 'Mesaj gönderildi',
            message_id: result.insertId
        });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Müşteriler
router.get('/customers', async (req, res) => {
    try {
        const userId = req.user.id;

        // Sipariş yapan müşteriler
        const [orderCustomers] = await pool.execute(
            `SELECT DISTINCT 
                    u.id, 
                    u.username, 
                    u.email, 
                    u.created_at,
                    COUNT(DISTINCT o.id) as order_count,
                    COALESCE(SUM(oi.subtotal), 0) as total_spent
             FROM users u
             INNER JOIN orders o ON u.id = o.user_id
             INNER JOIN order_items oi ON o.id = oi.order_id
             INNER JOIN projects p ON oi.project_id = p.id
             WHERE p.user_id = ?
             AND o.payment_status = 'paid'
             GROUP BY u.id, u.username, u.email, u.created_at`,
            [userId]
        );

        // Bağış yapan müşteriler
        const [donationCustomers] = await pool.execute(
            `SELECT DISTINCT
                    u.id,
                    u.username,
                    u.email,
                    u.created_at
             FROM users u
             INNER JOIN project_donations pd ON u.id = pd.user_id
             INNER JOIN projects p ON pd.project_id = p.id
             WHERE p.user_id = ?
             AND pd.status IN ('completed', 'pending_approval')`,
            [userId]
        );

        // Müşterileri birleştir (Map kullanarak)
        const customerMap = new Map();
        
        // Sipariş yapan müşterileri ekle
        orderCustomers.forEach(customer => {
            customerMap.set(customer.id, {
                ...customer,
                order_count: customer.order_count,
                total_spent: parseFloat(customer.total_spent || 0)
            });
        });

        // Bağış yapan müşterileri ekle (eğer yoksa)
        donationCustomers.forEach(customer => {
            if (!customerMap.has(customer.id)) {
                customerMap.set(customer.id, {
                    id: customer.id,
                    username: customer.username,
                    email: customer.email,
                    created_at: customer.created_at,
                    order_count: 0,
                    total_spent: 0
                });
            }
        });

        const customerBase = Array.from(customerMap.values());

        // Her müşteri için sipariş detaylarını al ve kazancı hesapla + bağış bilgisini ekle
        const customersWithEarnings = await Promise.all(
            customerBase.map(async (customer) => {
                const [orderItems] = await pool.execute(
                    `SELECT 
                        oi.subtotal,
                        o.commission_rate,
                        o.total_amount,
                        o.discount_amount,
                        o.final_amount
                     FROM orders o
                     INNER JOIN order_items oi ON o.id = oi.order_id
                     INNER JOIN projects p ON oi.project_id = p.id
                     WHERE o.user_id = ?
                     AND p.user_id = ?
                     AND o.payment_status = 'paid'`,
                    [customer.id, userId]
                );

                let totalEarnings = 0;

                for (const item of orderItems) {
                    // İndirim dahil efektif tutar hesapla
                    const subtotal = parseFloat(item.subtotal || 0);
                    let effectiveSubtotal = subtotal;

                    if (item.total_amount > 0 && item.discount_amount > 0) {
                        effectiveSubtotal = subtotal - ((subtotal / item.total_amount) * item.discount_amount);
                    }

                    // KDV hariç tutar
                    const netAmount = effectiveSubtotal / 1.18;

                    // Komisyon oranı (varsayılan 15)
                    const commissionRate = parseFloat(item.commission_rate || 15);

                    // Komisyon tutarı
                    const commissionAmount = netAmount * (commissionRate / 100);

                    // Satıcı kazancı
                    const sellerEarning = netAmount - commissionAmount;
                    totalEarnings += sellerEarning;
                }

                // Müşterinin satıcının projelerine yaptığı toplam bağışı hesapla
                const [donations] = await pool.execute(
                    `SELECT COALESCE(SUM(amount), 0) as total_donation
                     FROM project_donations pd
                     INNER JOIN projects p ON pd.project_id = p.id
                     WHERE pd.user_id = ?
                     AND p.user_id = ?
                     AND pd.status IN ('completed', 'pending_approval')`,
                    [customer.id, userId]
                );

                const totalDonation = parseFloat(donations[0]?.total_donation || 0);

                return {
                    ...customer,
                    total_spent: parseFloat(customer.total_spent || 0),
                    total_earnings: Math.round(totalEarnings * 100) / 100, // 2 ondalık basamak
                    total_donation: totalDonation
                };
            })
        );

        // Müşterileri toplam kazanca göre sırala
        customersWithEarnings.sort((a, b) => b.total_earnings - a.total_earnings);

        res.json({ customers: customersWithEarnings });
    } catch (error) {
        console.error('Get customers error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Kuponlar
router.get('/coupons', async (req, res) => {
    try {
        const userId = req.user.id;

        // Seller'ın projelerine ait kuponları getir
        let [coupons] = [];
        let [projects] = [];
        
        try {
            // Seller'ın projelerini getir
            [projects] = await pool.execute(
                `SELECT id, title FROM projects WHERE user_id = ? AND status IN ('active', 'approved') ORDER BY title`,
                [userId]
            );

            // Önce project_id kolonunun var olup olmadığını kontrol et
            const [projectIdColumns] = await pool.execute("SHOW COLUMNS FROM coupons LIKE 'project_id'");
            if (projectIdColumns.length > 0) {
                // project_id kolonu varsa seller'ın projelerine ait kuponları getir
                [coupons] = await pool.execute(
                    `SELECT c.*, p.title as project_title, p.id as project_id
                     FROM coupons c
                     INNER JOIN projects p ON c.project_id = p.id
                     WHERE p.user_id = ?
                     ORDER BY c.created_at DESC`,
                    [userId]
                );
            } else {
                // project_id yoksa user_id kontrolü yap
                const [userIdColumns] = await pool.execute("SHOW COLUMNS FROM coupons LIKE 'user_id'");
                if (userIdColumns.length > 0) {
                    [coupons] = await pool.execute(
                        `SELECT * FROM coupons 
                         WHERE user_id = ? 
                         ORDER BY created_at DESC`,
                        [userId]
                    );
                } else {
                    coupons = [];
                }
            }
        } catch (error) {
            console.error('Get coupons error:', error);
            coupons = [];
            projects = [];
        }

        res.json({ coupons, projects, maxCoupons: 5 });
    } catch (error) {
        console.error('Get coupons error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

router.post('/coupons', async (req, res) => {
    try {
        const userId = req.user.id;
        const { code, discount_type, discount_value, min_amount, max_amount, usage_limit, one_time_use, start_date, expires_at, status, description, project_id } = req.body;

        if (!code || !discount_type || !discount_value) {
            return res.status(400).json({ error: 'Kupon kodu, indirim tipi ve değeri gereklidir' });
        }

        if (!project_id) {
            return res.status(400).json({ error: 'Proje seçimi gereklidir' });
        }

        // Projenin seller'a ait olup olmadığını kontrol et
        const [projectCheck] = await pool.execute('SELECT id FROM projects WHERE id = ? AND user_id = ?', [project_id, userId]);
        if (projectCheck.length === 0) {
            return res.status(403).json({ error: 'Bu projeye kupon oluşturma yetkiniz yok' });
        }

        // Maksimum 5 kupon kontrolü
        let currentCouponCount = 0;
        try {
            const [projectIdColumns] = await pool.execute("SHOW COLUMNS FROM coupons LIKE 'project_id'");
            if (projectIdColumns.length > 0) {
                // project_id kolonu varsa seller'ın projelerine ait kupon sayısını kontrol et
                const [countResult] = await pool.execute(
                    `SELECT COUNT(*) as count 
                     FROM coupons c
                     INNER JOIN projects p ON c.project_id = p.id
                     WHERE p.user_id = ?`,
                    [userId]
                );
                currentCouponCount = countResult[0]?.count || 0;
            } else {
                // project_id yoksa user_id kontrolü yap
                const [userIdColumns] = await pool.execute("SHOW COLUMNS FROM coupons LIKE 'user_id'");
                if (userIdColumns.length > 0) {
                    const [countResult] = await pool.execute('SELECT COUNT(*) as count FROM coupons WHERE user_id = ?', [userId]);
                    currentCouponCount = countResult[0]?.count || 0;
                }
            }
        } catch (error) {
            console.error('Count coupons error:', error);
        }

        if (currentCouponCount >= 5) {
            return res.status(400).json({ error: 'Maksimum 5 kupon oluşturabilirsiniz' });
        }

        // Kupon oluştur
        try {
            // project_id kolonunun var olup olmadığını kontrol et, yoksa ekle
            let [projectIdColumns] = await pool.execute("SHOW COLUMNS FROM coupons LIKE 'project_id'");
            if (projectIdColumns.length === 0) {
                // project_id kolonu yoksa ekle
                try {
                    await pool.execute('ALTER TABLE coupons ADD COLUMN project_id INT(11) DEFAULT NULL AFTER description');
                    await pool.execute('ALTER TABLE coupons ADD INDEX idx_project_id (project_id)');
                    console.log('✅ project_id kolonu eklendi');
                } catch (alterError) {
                    // Kolon zaten eklenmiş olabilir veya başka bir hata
                    console.error('project_id kolonu eklenirken hata:', alterError);
                }
            }

            // user_id kolonunun var olup olmadığını kontrol et, yoksa ekle
            let [userIdColumns] = await pool.execute("SHOW COLUMNS FROM coupons LIKE 'user_id'");
            if (userIdColumns.length === 0) {
                try {
                    await pool.execute('ALTER TABLE coupons ADD COLUMN user_id INT(11) DEFAULT NULL AFTER project_id');
                    await pool.execute('ALTER TABLE coupons ADD INDEX idx_user_id (user_id)');
                    console.log('✅ user_id kolonu eklendi');
                } catch (alterError) {
                    console.error('user_id kolonu eklenirken hata:', alterError);
                }
            }

            // project_id kolonu varsa proje bazlı kupon oluştur
            [projectIdColumns] = await pool.execute("SHOW COLUMNS FROM coupons LIKE 'project_id'");
            if (projectIdColumns.length > 0) {
                await pool.execute(
                    'INSERT INTO coupons (code, discount_type, discount_value, min_amount, max_amount, usage_limit, one_time_use, start_date, expires_at, status, description, project_id, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [code.toUpperCase(), discount_type, discount_value, min_amount || null, max_amount || null, usage_limit || null, one_time_use ? 1 : 0, start_date || null, expires_at || null, status || 'active', description || null, project_id, userId]
                );
            } else {
                // project_id yoksa user_id ile oluştur
                [userIdColumns] = await pool.execute("SHOW COLUMNS FROM coupons LIKE 'user_id'");
                if (userIdColumns.length > 0) {
                    await pool.execute(
                        'INSERT INTO coupons (code, discount_type, discount_value, min_amount, max_amount, usage_limit, one_time_use, start_date, expires_at, status, description, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                        [code.toUpperCase(), discount_type, discount_value, min_amount || null, max_amount || null, usage_limit || null, one_time_use ? 1 : 0, start_date || null, expires_at || null, status || 'active', description || null, userId]
                    );
                } else {
                    return res.status(500).json({ error: 'Kupon sistemi yapılandırılmamış' });
                }
            }
        } catch (error) {
            console.error('Create coupon error:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ error: 'Bu kupon kodu zaten kullanılıyor' });
            }
            return res.status(500).json({ error: error.message || 'Kupon oluşturulurken hata oluştu' });
        }

        res.json({ message: 'Kupon oluşturuldu' });
    } catch (error) {
        console.error('Create coupon error:', error);
        res.status(500).json({ error: error.message || 'Sunucu hatası' });
    }
});

router.put('/coupons/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { code, discount_type, discount_value, min_amount, max_amount, usage_limit, one_time_use, start_date, expires_at, status, description, project_id } = req.body;

        // Kuponun seller'a ait olup olmadığını kontrol et
        let couponCheck = [];
        try {
            const [projectIdColumns] = await pool.execute("SHOW COLUMNS FROM coupons LIKE 'project_id'");
            if (projectIdColumns.length > 0) {
                // project_id kolonu varsa proje bazlı kontrol
                [couponCheck] = await pool.execute(
                    `SELECT c.project_id 
                     FROM coupons c
                     INNER JOIN projects p ON c.project_id = p.id
                     WHERE c.id = ? AND p.user_id = ?`,
                    [id, userId]
                );
            } else {
                // project_id yoksa user_id kontrolü
                [couponCheck] = await pool.execute('SELECT user_id FROM coupons WHERE id = ?', [id]);
            }
        } catch (error) {
            console.error('Coupon check error:', error);
        }

        if (couponCheck.length === 0) {
            return res.status(404).json({ error: 'Kupon bulunamadı veya yetkiniz yok' });
        }

        // project_id kolonu varsa ve project_id değiştiriliyorsa kontrol et
        if (project_id) {
            const [projectCheck] = await pool.execute('SELECT id FROM projects WHERE id = ? AND user_id = ?', [project_id, userId]);
            if (projectCheck.length === 0) {
                return res.status(403).json({ error: 'Bu projeye kupon atama yetkiniz yok' });
            }
        }

        // Kuponu güncelle
        try {
            const [projectIdColumns] = await pool.execute("SHOW COLUMNS FROM coupons LIKE 'project_id'");
            if (projectIdColumns.length > 0 && project_id) {
                await pool.execute(
                    'UPDATE coupons SET code = ?, discount_type = ?, discount_value = ?, min_amount = ?, max_amount = ?, usage_limit = ?, one_time_use = ?, start_date = ?, expires_at = ?, status = ?, description = ?, project_id = ? WHERE id = ?',
                    [code.toUpperCase(), discount_type, discount_value, min_amount || null, max_amount || null, usage_limit || null, one_time_use ? 1 : 0, start_date || null, expires_at || null, status, description || null, project_id, id]
                );
            } else {
                await pool.execute(
                    'UPDATE coupons SET code = ?, discount_type = ?, discount_value = ?, min_amount = ?, max_amount = ?, usage_limit = ?, one_time_use = ?, start_date = ?, expires_at = ?, status = ?, description = ? WHERE id = ?',
                    [code.toUpperCase(), discount_type, discount_value, min_amount || null, max_amount || null, usage_limit || null, one_time_use ? 1 : 0, start_date || null, expires_at || null, status, description || null, id]
                );
            }
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ error: 'Bu kupon kodu zaten kullanılıyor' });
            }
            throw error;
        }

        res.json({ message: 'Kupon güncellendi' });
    } catch (error) {
        console.error('Update coupon error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

router.delete('/coupons/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        // Kuponun seller'a ait olup olmadığını kontrol et
        let couponCheck = [];
        try {
            const [projectIdColumns] = await pool.execute("SHOW COLUMNS FROM coupons LIKE 'project_id'");
            if (projectIdColumns.length > 0) {
                // project_id kolonu varsa proje bazlı kontrol
                [couponCheck] = await pool.execute(
                    `SELECT c.id 
                     FROM coupons c
                     INNER JOIN projects p ON c.project_id = p.id
                     WHERE c.id = ? AND p.user_id = ?`,
                    [id, userId]
                );
            } else {
                // project_id yoksa user_id kontrolü
                [couponCheck] = await pool.execute('SELECT id FROM coupons WHERE id = ? AND user_id = ?', [id, userId]);
            }
        } catch (error) {
            console.error('Coupon check error:', error);
        }

        if (couponCheck.length === 0) {
            return res.status(404).json({ error: 'Kupon bulunamadı veya yetkiniz yok' });
        }

        await pool.execute('DELETE FROM coupons WHERE id = ?', [id]);
        res.json({ message: 'Kupon silindi' });
    } catch (error) {
        console.error('Delete coupon error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Raporlar
// Satıcının projelerine favori ekleyen kullanıcıları getir
router.get('/favorites', async (req, res) => {
    try {
        const userId = req.user.id;

        // Satıcının projelerine favori ekleyen kullanıcıları getir
        const [favorites] = await pool.execute(
            `SELECT 
                f.id as favorite_id,
                f.created_at as favorited_at,
                u.id as user_id,
                u.username,
                u.email,
                u.avatar,
                p.id as project_id,
                p.title as project_title,
                p.slug as project_slug,
                c.name as category_name,
                (SELECT image_path FROM project_images WHERE project_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
            FROM favorites f
            INNER JOIN projects p ON f.project_id = p.id
            INNER JOIN users u ON f.user_id = u.id
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.user_id = ?
            ORDER BY f.created_at DESC`,
            [userId]
        );

        // URL'leri düzelt
        favorites.forEach(fav => {
            if (fav.primary_image) {
                fav.primary_image = `/uploads/${fav.primary_image}`;
            }
        });

        res.json({ favorites });
    } catch (error) {
        console.error('Get seller favorites error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Satıcının projesinden favoriyi kaldır (kullanıcının favorisini kaldır)
router.delete('/favorites/:favoriteId', async (req, res) => {
    try {
        const { favoriteId } = req.params;
        const userId = req.user.id;

        // Favorinin satıcının projesine ait olduğunu kontrol et
        const [favorite] = await pool.execute(
            `SELECT f.id, p.user_id as project_owner_id
            FROM favorites f
            INNER JOIN projects p ON f.project_id = p.id
            WHERE f.id = ?`,
            [favoriteId]
        );

        if (favorite.length === 0) {
            return res.status(404).json({ error: 'Favori bulunamadı' });
        }

        if (favorite[0].project_owner_id !== userId) {
            return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
        }

        // Favoriyi kaldır
        await pool.execute('DELETE FROM favorites WHERE id = ?', [favoriteId]);

        res.json({ message: 'Favori kaldırıldı' });
    } catch (error) {
        console.error('Remove favorite error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

router.get('/reports', async (req, res) => {
    try {
        const userId = req.user.id;
        const { type = 'sales', period = '30' } = req.query;

        let reports = {};

        if (type === 'sales' || type === 'all') {
            // Satış Raporları
            const [salesReport] = await pool.execute(
                `SELECT 
                    DATE(o.created_at) as date,
                    COUNT(DISTINCT o.id) as order_count,
                    COUNT(DISTINCT oi.project_id) as product_count,
                    COALESCE(SUM(oi.subtotal), 0) as total_revenue,
                    COALESCE(AVG(oi.subtotal), 0) as avg_order_value
                 FROM orders o
                 INNER JOIN order_items oi ON o.id = oi.order_id
                 INNER JOIN projects p ON oi.project_id = p.id
                 WHERE p.user_id = ? 
                 AND o.payment_status = 'paid'
                 AND o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                 GROUP BY DATE(o.created_at)
                 ORDER BY date DESC`,
                [userId, period]
            );

            // Proje bazlı satış raporu
            const [projectSales] = await pool.execute(
                `SELECT 
                    p.id,
                    p.title,
                    COUNT(DISTINCT o.id) as order_count,
                    COALESCE(SUM(oi.subtotal), 0) as revenue,
                    COALESCE(AVG(oi.subtotal), 0) as avg_price
                 FROM projects p
                 LEFT JOIN order_items oi ON p.id = oi.project_id
                 LEFT JOIN orders o ON oi.order_id = o.id AND o.payment_status = 'paid'
                 WHERE p.user_id = ?
                 GROUP BY p.id, p.title
                 ORDER BY revenue DESC`,
                [userId]
            );

            reports.sales = {
                daily: salesReport || [],
                byProject: projectSales || []
            };
        }

        if (type === 'earnings' || type === 'all') {
            // Kazanç Raporları
            const [earningsReport] = await pool.execute(
                `SELECT 
                    DATE(o.created_at) as date,
                    COUNT(DISTINCT o.id) as order_count,
                    COALESCE(SUM(
                        ROUND((
                            (oi.subtotal - (CASE WHEN o.total_amount > 0 THEN (oi.subtotal / o.total_amount) * COALESCE(o.discount_amount, 0) ELSE 0 END)) / 1.18
                        ) * ((100 - COALESCE(o.commission_rate, 15)) / 100), 2)
                    ), 0) as total_earnings
                 FROM orders o
                 INNER JOIN order_items oi ON o.id = oi.order_id
                 INNER JOIN projects p ON oi.project_id = p.id
                 WHERE p.user_id = ? 
                 AND o.payment_status = 'paid'
                 AND o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                 GROUP BY DATE(o.created_at)
                 ORDER BY date DESC`,
                [userId, period]
            );

            // Transaction bazlı kazanç
            const [transactionEarnings] = await pool.execute(
                `SELECT 
                    DATE(created_at) as date,
                    COUNT(*) as transaction_count,
                    COALESCE(SUM(amount), 0) as total_earnings
                 FROM transactions
                 WHERE user_id = ? 
                 AND type = 'sale' 
                 AND status = 'completed'
                 AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                 GROUP BY DATE(created_at)
                 ORDER BY date DESC`,
                [userId, period]
            );

            reports.earnings = {
                daily: earningsReport || [],
                transactions: transactionEarnings || []
            };
        }

        if (type === 'projects' || type === 'all') {
            // Proje Raporları
            const [projectStats] = await pool.execute(
                `SELECT 
                    p.id,
                    p.title,
                    p.status,
                    COALESCE(p.view_count, 0) as view_count,
                    COALESCE(p.download_count, 0) as download_count,
                    COUNT(DISTINCT o.id) as sale_count,
                    COALESCE(SUM(oi.subtotal), 0) as total_revenue,
                    COALESCE(AVG(r.rating), 0) as avg_rating,
                    COUNT(DISTINCT r.id) as review_count
                 FROM projects p
                 LEFT JOIN order_items oi ON p.id = oi.project_id
                 LEFT JOIN orders o ON oi.order_id = o.id AND o.payment_status = 'paid'
                 LEFT JOIN reviews r ON p.id = r.project_id
                 WHERE p.user_id = ?
                 GROUP BY p.id, p.title, p.status, p.view_count, p.download_count
                 ORDER BY total_revenue DESC`,
                [userId]
            );

            reports.projects = projectStats || [];
        }

        if (type === 'customers' || type === 'all') {
            // Müşteri Raporları
            const [customerReport] = await pool.execute(
                `SELECT 
                    u.id,
                    u.username,
                    u.email,
                    COUNT(DISTINCT o.id) as order_count,
                    COALESCE(SUM(oi.subtotal), 0) as total_spent,
                    COALESCE(SUM(
                        ROUND((
                            (oi.subtotal - (CASE WHEN o.total_amount > 0 THEN (oi.subtotal / o.total_amount) * COALESCE(o.discount_amount, 0) ELSE 0 END)) / 1.18
                        ) * ((100 - COALESCE(o.commission_rate, 15)) / 100), 2)
                    ), 0) as total_earnings,
                    COALESCE(SUM(pd.amount), 0) as total_donation
                 FROM users u
                 INNER JOIN orders o ON u.id = o.user_id
                 INNER JOIN order_items oi ON o.id = oi.order_id
                 INNER JOIN projects p ON oi.project_id = p.id
                 LEFT JOIN project_donations pd ON u.id = pd.user_id AND pd.project_id = p.id AND pd.status IN ('completed', 'pending_approval')
                 WHERE p.user_id = ? 
                 AND o.payment_status = 'paid'
                 AND o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                 GROUP BY u.id, u.username, u.email
                 ORDER BY total_spent DESC`,
                [userId, period]
            );

            reports.customers = customerReport || [];
        }

        if (type === 'time' || type === 'all') {
            // Zaman Bazlı Raporlar
            const [monthlyReport] = await pool.execute(
                `SELECT 
                    DATE_FORMAT(o.created_at, '%Y-%m') as month,
                    COUNT(DISTINCT o.id) as order_count,
                    COUNT(DISTINCT oi.project_id) as product_count,
                    COUNT(DISTINCT o.user_id) as customer_count,
                    COALESCE(SUM(oi.subtotal), 0) as revenue,
                    COALESCE(SUM(
                        ROUND((
                            (oi.subtotal - (CASE WHEN o.total_amount > 0 THEN (oi.subtotal / o.total_amount) * COALESCE(o.discount_amount, 0) ELSE 0 END)) / 1.18
                        ) * ((100 - COALESCE(o.commission_rate, 15)) / 100), 2)
                    ), 0) as earnings
                 FROM orders o
                 INNER JOIN order_items oi ON o.id = oi.order_id
                 INNER JOIN projects p ON oi.project_id = p.id
                 WHERE p.user_id = ? 
                 AND o.payment_status = 'paid'
                 AND o.created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
                 GROUP BY DATE_FORMAT(o.created_at, '%Y-%m')
                 ORDER BY month DESC`,
                [userId]
            );

            const [weeklyReport] = await pool.execute(
                `SELECT 
                    YEARWEEK(o.created_at) as week,
                    DATE_FORMAT(MIN(o.created_at), '%Y-%m-%d') as week_start,
                    COUNT(DISTINCT o.id) as order_count,
                    COALESCE(SUM(oi.subtotal), 0) as revenue,
                    COALESCE(SUM(
                        ROUND((
                            (oi.subtotal - (CASE WHEN o.total_amount > 0 THEN (oi.subtotal / o.total_amount) * COALESCE(o.discount_amount, 0) ELSE 0 END)) / 1.18
                        ) * ((100 - COALESCE(o.commission_rate, 15)) / 100), 2)
                    ), 0) as earnings
                 FROM orders o
                 INNER JOIN order_items oi ON o.id = oi.order_id
                 INNER JOIN projects p ON oi.project_id = p.id
                 WHERE p.user_id = ? 
                 AND o.payment_status = 'paid'
                 AND o.created_at >= DATE_SUB(NOW(), INTERVAL 12 WEEK)
                 GROUP BY YEARWEEK(o.created_at)
                 ORDER BY week DESC`,
                [userId]
            );

            reports.time = {
                monthly: monthlyReport || [],
                weekly: weeklyReport || []
            };
        }

        // Boş array'leri garanti et
        if (!reports.sales) reports.sales = { daily: [], byProject: [] };
        if (!reports.earnings) reports.earnings = { daily: [], transactions: [] };
        if (!reports.projects) reports.projects = [];
        if (!reports.customers) reports.customers = [];
        if (!reports.time) reports.time = { monthly: [], weekly: [] };

        console.log('Reports generated:', {
            sales: reports.sales?.daily?.length || 0,
            earnings: reports.earnings?.daily?.length || 0,
            projects: reports.projects?.length || 0,
            customers: reports.customers?.length || 0,
            time: {
                monthly: reports.time?.monthly?.length || 0,
                weekly: reports.time?.weekly?.length || 0
            }
        });

        res.json({ reports, period: parseInt(period) });
    } catch (error) {
        console.error('Get reports error:', error);
        res.status(500).json({ error: 'Sunucu hatası', details: error.message });
    }
});

// Analytics - Detaylı istatistikler
router.get('/analytics', async (req, res) => {
    try {
        const userId = req.user.id;
        const { period = '30' } = req.query; // 7, 30, 90, 365 gün

        // Genel İstatistikler
        const [generalStats] = await pool.execute(
            `SELECT 
                COUNT(DISTINCT p.id) as total_projects,
                COALESCE(SUM(p.view_count), 0) as total_views,
                COALESCE(SUM(p.download_count), 0) as total_downloads,
                COALESCE(AVG(r.rating), 0) as avg_rating,
                COUNT(DISTINCT r.id) as total_reviews
            FROM projects p
            LEFT JOIN reviews r ON p.id = r.project_id
            WHERE p.user_id = ?`,
            [userId]
        );

        // Satış İstatistikleri
        const [salesStats] = await pool.execute(
            `SELECT 
                COUNT(DISTINCT o.id) as total_orders,
                COUNT(DISTINCT oi.project_id) as products_sold,
                COALESCE(SUM(oi.subtotal), 0) as total_revenue,
                COALESCE(AVG(oi.subtotal), 0) as avg_order_value,
                COALESCE(SUM(CASE WHEN o.payment_status = 'paid' THEN oi.subtotal ELSE 0 END), 0) as paid_revenue
            FROM orders o
            INNER JOIN order_items oi ON o.id = oi.order_id
            INNER JOIN projects p ON oi.project_id = p.id
            WHERE p.user_id = ? 
            AND o.payment_status = 'paid'
            AND o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
            [userId, period]
        );

        // Kazanç İstatistikleri (Transactions)
        const [earningsStats] = await pool.execute(
            `SELECT 
                COALESCE(SUM(amount), 0) as total_earnings,
                COUNT(*) as transaction_count,
                AVG(amount) as avg_earning
            FROM transactions 
            WHERE user_id = ? 
            AND type = 'sale' 
            AND status = 'completed'
            AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
            [userId, period]
        );

        // Günlük Satış Trendi
        const [dailyTrend] = await pool.execute(
            `SELECT 
                DATE(o.created_at) as date,
                COUNT(DISTINCT o.id) as orders,
                COALESCE(SUM(oi.subtotal), 0) as revenue,
                COUNT(DISTINCT oi.project_id) as products
            FROM orders o
            INNER JOIN order_items oi ON o.id = oi.order_id
            INNER JOIN projects p ON oi.project_id = p.id
            WHERE p.user_id = ? 
            AND o.payment_status = 'paid'
            AND o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY DATE(o.created_at)
            ORDER BY date ASC`,
            [userId, period]
        );

        // En Çok Satan Projeler
        const [topProducts] = await pool.execute(
            `SELECT 
                p.id,
                p.title,
                p.price,
                COUNT(DISTINCT oi.order_id) as sales_count,
                COALESCE(SUM(oi.subtotal), 0) as revenue,
                COALESCE(SUM(p.view_count), 0) as views
            FROM projects p
            INNER JOIN order_items oi ON p.id = oi.project_id
            INNER JOIN orders o ON oi.order_id = o.id
            WHERE p.user_id = ? 
            AND o.payment_status = 'paid'
            AND o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY p.id, p.title, p.price
            ORDER BY sales_count DESC
            LIMIT 10`,
            [userId, period]
        );

        // Kategori Bazlı Satışlar
        const [categoryStats] = await pool.execute(
            `SELECT 
                c.name as category_name,
                COUNT(DISTINCT oi.order_id) as sales_count,
                COALESCE(SUM(oi.subtotal), 0) as revenue
            FROM order_items oi
            INNER JOIN projects p ON oi.project_id = p.id
            INNER JOIN categories c ON p.category_id = c.id
            INNER JOIN orders o ON oi.order_id = o.id
            WHERE p.user_id = ? 
            AND o.payment_status = 'paid'
            AND o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY c.id, c.name
            ORDER BY sales_count DESC`,
            [userId, period]
        );

        // Müşteri İstatistikleri
        const [customerStats] = await pool.execute(
            `SELECT 
                COUNT(DISTINCT o.user_id) as unique_customers,
                COUNT(DISTINCT o.id) as total_orders,
                COALESCE(AVG(o.final_amount), 0) as avg_customer_value
            FROM orders o
            INNER JOIN order_items oi ON o.id = oi.order_id
            INNER JOIN projects p ON oi.project_id = p.id
            WHERE p.user_id = ? 
            AND o.payment_status = 'paid'
            AND o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
            [userId, period]
        );

        // Aylık Karşılaştırma
        const [monthlyComparison] = await pool.execute(
            `SELECT 
                DATE_FORMAT(o.created_at, '%Y-%m') as month,
                COUNT(DISTINCT o.id) as orders,
                COALESCE(SUM(oi.subtotal), 0) as revenue,
                COUNT(DISTINCT oi.project_id) as products
            FROM orders o
            INNER JOIN order_items oi ON o.id = oi.order_id
            INNER JOIN projects p ON oi.project_id = p.id
            WHERE p.user_id = ? 
            AND o.payment_status = 'paid'
            AND o.created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
            GROUP BY DATE_FORMAT(o.created_at, '%Y-%m')
            ORDER BY month DESC
            LIMIT 6`,
            [userId]
        );

        res.json({
            period: parseInt(period),
            general: generalStats[0] || {},
            sales: salesStats[0] || {},
            earnings: earningsStats[0] || {},
            dailyTrend: dailyTrend || [],
            topProducts: topProducts || [],
            categories: categoryStats || [],
            customers: customerStats[0] || {},
            monthlyComparison: monthlyComparison || []
        });
    } catch (error) {
        console.error('Get analytics error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Medya Kütüphanesi - Dosya yükleme için multer yapılandırması
const mediaStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const mediaDir = path.join(__dirname, '..', 'public', 'uploads', 'seller-media');
        if (!fs.existsSync(mediaDir)) {
            fs.mkdirSync(mediaDir, { recursive: true });
            try {
                fs.chmodSync(mediaDir, 0o755);
            } catch (err) {
                console.warn('Klasör izinleri ayarlanamadı:', err.message);
            }
        }
        cb(null, mediaDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'media-' + uniqueSuffix + ext);
    }
});

const mediaUpload = multer({
    storage: mediaStorage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter: function (req, file, cb) {
        // İzin verilen dosya tipleri: PDF, DOC, DOCX, ZIP, RAR, TXT, MD, RTF, ODT, XLS, XLSX, PPT, PPTX, resim dosyaları
        const allowedTypes = /pdf|doc|docx|zip|rar|txt|md|rtf|odt|ods|xls|xlsx|ppt|pptx|jpg|jpeg|png|gif|webp|svg|bmp|ico/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype) || 
                        file.mimetype === 'application/octet-stream' ||
                        file.mimetype === 'application/zip' ||
                        file.mimetype === 'application/x-zip-compressed' ||
                        file.mimetype.startsWith('image/');
        
        console.log('File filter check:', {
            originalname: file.originalname,
            mimetype: file.mimetype,
            extname: path.extname(file.originalname).toLowerCase(),
            extnameMatch: extname,
            mimetypeMatch: mimetype
        });
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error(`Desteklenmeyen dosya tipi! İzin verilen: PDF, DOC, DOCX, ZIP, RAR, TXT, MD, RTF, ODT, XLS, XLSX, PPT, PPTX, resim dosyaları (JPG, PNG, GIF, WEBP, SVG, BMP). Dosya: ${file.originalname}, Tip: ${file.mimetype}`));
        }
    }
});

// Medya kütüphanesi tablosunu kontrol et ve oluştur
const ensureMediaTable = async () => {
    try {
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS seller_media (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                project_id INT NULL,
                file_name VARCHAR(255) NOT NULL,
                file_path VARCHAR(500) NOT NULL,
                file_size BIGINT NOT NULL,
                file_type VARCHAR(50) NOT NULL,
                mime_type VARCHAR(100) NOT NULL,
                category VARCHAR(50) DEFAULT 'other',
                description TEXT NULL,
                url VARCHAR(500) NULL,
                download_count INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_user_id (user_id),
                INDEX idx_project_id (project_id),
                INDEX idx_category (category),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        // URL kolonu yoksa ekle
        try {
            const [columns] = await pool.execute(`
                SHOW COLUMNS FROM seller_media LIKE 'url'
            `);
            if (columns.length === 0) {
                await pool.execute(`
                    ALTER TABLE seller_media 
                    ADD COLUMN url VARCHAR(500) NULL AFTER description
                `);
                console.log('URL kolonu seller_media tablosuna eklendi');
            }
        } catch (alterError) {
            console.warn('URL kolonu kontrol edilirken uyarı:', alterError.message);
        }
    } catch (error) {
        console.error('Media table check error:', error);
    }
};

// İlk yüklemede tabloyu oluştur
ensureMediaTable();

// Medya listesi
router.get('/media', async (req, res) => {
    try {
        const userId = req.user.id;
        const { project_id, category, search } = req.query;

        let query = `
            SELECT 
                sm.id, sm.user_id, sm.project_id, sm.file_name, sm.file_path, 
                sm.file_size, sm.file_type, sm.mime_type, sm.category, 
                sm.description, sm.url, sm.download_count, sm.created_at,
                p.title as project_title
            FROM seller_media sm
            LEFT JOIN projects p ON sm.project_id = p.id
            WHERE sm.user_id = ?
        `;
        const params = [userId];

        if (project_id) {
            query += ' AND sm.project_id = ?';
            params.push(project_id);
        }

        if (category) {
            query += ' AND sm.category = ?';
            params.push(category);
        }

        if (search) {
            query += ' AND (sm.file_name LIKE ? OR sm.description LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm);
        }

        query += ' ORDER BY sm.created_at DESC';

        const [media] = await pool.execute(query, params);

        // Tüm projeleri getir (filtreleme ve seçim için) - sadece draft olmayanlar
        const [projects] = await pool.execute(
            'SELECT id, title, status FROM projects WHERE user_id = ? AND status != "draft" ORDER BY title',
            [userId]
        );
        
        console.log(`Seller ${userId} için ${projects.length} proje bulundu:`, projects.map(p => ({ id: p.id, title: p.title, status: p.status })));

        res.json({ 
            media: media || [],
            projects: projects || [],
            categories: ['manual', 'documentation', 'source', 'other']
        });
    } catch (error) {
        console.error('Get media error:', error);
        res.status(500).json({ error: 'Sunucu hatası', details: error.message });
    }
});

// Medya yükleme
router.post('/media', mediaUpload.single('file'), async (req, res) => {
    try {
        const userId = req.user.id;
        
        if (!req.file) {
            return res.status(400).json({ error: 'Dosya yüklenmedi' });
        }

        const { project_id, category = 'other', description, url } = req.body;
        const filePath = `seller-media/${req.file.filename}`;
        const fileSize = req.file.size;
        const fileType = path.extname(req.file.originalname).substring(1).toLowerCase();
        const mimeType = req.file.mimetype;
        
        console.log('Media upload request:', {
            project_id,
            category,
            description,
            url,
            fileName: req.file.originalname,
            fileSize,
            fileType,
            mimeType
        });

        // Proje ID kontrolü (eğer belirtilmişse)
        if (project_id) {
            const [projectCheck] = await pool.execute(
                'SELECT id FROM projects WHERE id = ? AND user_id = ?',
                [project_id, userId]
            );
            if (projectCheck.length === 0) {
                // Dosyayı sil
                fs.unlinkSync(req.file.path);
                return res.status(403).json({ error: 'Bu projeye erişim yetkiniz yok' });
            }
        }

        // Seller media tablosuna ekle
        const [result] = await pool.execute(
            `INSERT INTO seller_media 
            (user_id, project_id, file_name, file_path, file_size, file_type, mime_type, category, description, url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, project_id || null, req.file.originalname, filePath, fileSize, fileType, mimeType, category, description || null, url || null]
        );

        const mediaId = result.insertId;

        // Eğer project_id yoksa (genel kütüphane), tüm YAYINLANMIŞ projelere ekle
        if (!project_id) {
            // Seller'ın tüm yayınlanmış (active, approved) projelerini al
            const [allProjects] = await pool.execute(
                'SELECT id, title, status FROM projects WHERE user_id = ? AND status IN ("active", "approved")',
                [userId]
            );

            let addedCount = 0;
            // Her projeye project_files tablosuna ekle
            for (const project of allProjects) {
                try {
                    await pool.execute(
                        `INSERT INTO project_files 
                        (project_id, file_path, file_name, file_size, file_type, version, is_latest, download_count)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            project.id,
                            filePath,
                            req.file.originalname,
                            fileSize,
                            fileType,
                            null,
                            1,
                            0
                        ]
                    );
                    addedCount++;
                } catch (fileError) {
                    console.warn(`Proje ${project.id} (${project.title}) için dosya eklenirken hata:`, fileError);
                    // Devam et, diğer projelere eklemeye devam et
                }
            }

            console.log(`Genel kütüphane: ${addedCount} projeye dosya eklendi`);
        } else {
            // Sadece seçilen projeye ekle
            try {
                await pool.execute(
                    `INSERT INTO project_files 
                    (project_id, file_path, file_name, file_size, file_type, version, is_latest, download_count)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        project_id,
                        filePath,
                        req.file.originalname,
                        fileSize,
                        fileType,
                        null,
                        1,
                        0
                    ]
                );
                console.log(`Tek proje: Proje ${project_id} için dosya eklendi`);
            } catch (fileError) {
                console.warn('Project_files tablosuna eklenirken hata:', fileError);
            }
        }

        // Kaç projeye eklendi bilgisini al
        let projectCount = 0;
        if (!project_id) {
            const [countResult] = await pool.execute(
                'SELECT COUNT(*) as count FROM project_files WHERE file_path = ?',
                [filePath]
            );
            projectCount = countResult[0]?.count || 0;
        } else {
            projectCount = 1;
        }

        res.json({
            id: mediaId,
            file_name: req.file.originalname,
            file_path: filePath,
            file_size: fileSize,
            file_type: fileType,
            category,
            project_id: project_id || null,
            is_global: !project_id,
            project_count: projectCount,
            message: project_id 
                ? `Dosya başarıyla yüklendi ve seçilen projeye eklendi` 
                : `Dosya başarıyla yüklendi ve ${projectCount} projeye eklendi`
        });
    } catch (error) {
        console.error('Upload media error:', error);
        if (req.file && req.file.path) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: 'Dosya yükleme hatası', details: error.message });
    }
});

// Medya silme
router.delete('/media/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        // Dosyanın sahibini kontrol et
        const [media] = await pool.execute(
            'SELECT file_path FROM seller_media WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (media.length === 0) {
            return res.status(404).json({ error: 'Dosya bulunamadı veya erişim yetkiniz yok' });
        }

        const filePath = path.join(__dirname, '..', 'public', 'uploads', media[0].file_path);

        // Veritabanından sil
        await pool.execute('DELETE FROM seller_media WHERE id = ? AND user_id = ?', [id, userId]);

        // Fiziksel dosyayı sil
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (fileError) {
            console.warn('Dosya silme hatası (devam ediliyor):', fileError);
        }

        res.json({ message: 'Dosya başarıyla silindi' });
    } catch (error) {
        console.error('Delete media error:', error);
        res.status(500).json({ error: 'Dosya silme hatası', details: error.message });
    }
});

// Medya indirme (download count artırma)
router.get('/media/:id/download', async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const [media] = await pool.execute(
            'SELECT file_path, file_name FROM seller_media WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (media.length === 0) {
            return res.status(404).json({ error: 'Dosya bulunamadı' });
        }

        const filePath = path.join(__dirname, '..', 'public', 'uploads', media[0].file_path);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Dosya bulunamadı' });
        }

        // Download count artır
        await pool.execute(
            'UPDATE seller_media SET download_count = download_count + 1 WHERE id = ?',
            [id]
        );

        res.download(filePath, media[0].file_name);
    } catch (error) {
        console.error('Download media error:', error);
        res.status(500).json({ error: 'Dosya indirme hatası', details: error.message });
    }
});

export default router;

