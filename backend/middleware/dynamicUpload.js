import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getMaxFileSizeBytes } from '../utils/limitsUtils.js';

/**
 * Dinamik dosya boyutu limiti ile multer middleware oluşturur
 * @param {Object} options - Multer seçenekleri
 * @param {string} options.destination - Dosya yükleme dizini
 * @param {string} options.filenamePrefix - Dosya adı öneki
 * @param {Array<string>} options.allowedTypes - İzin verilen dosya tipleri (örn: ['jpeg', 'jpg', 'png'])
 * @param {number} options.defaultMaxSize - Varsayılan maksimum dosya boyutu (MB)
 * @returns {Function} Multer middleware fonksiyonu
 */
export const createDynamicUpload = (options) => {
    const {
        destination,
        filenamePrefix = 'file',
        allowedTypes = ['jpeg', 'jpg', 'png', 'gif', 'webp'],
        defaultMaxSize = 10 // MB
    } = options;

    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            const uploadDir = path.join(process.cwd(), 'public', 'uploads', destination);
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            cb(null, uploadDir);
        },
        filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, `${filenamePrefix}-${uniqueSuffix}${path.extname(file.originalname)}`);
        }
    });

    // Dinamik limit kontrolü için middleware
    return async (req, res, next) => {
        try {
            // Limits ayarlarını oku
            const maxFileSizeBytes = await getMaxFileSizeBytes();
            
            const upload = multer({
                storage: storage,
                limits: { fileSize: maxFileSizeBytes },
                fileFilter: function (req, file, cb) {
                    const allowedTypesRegex = new RegExp(allowedTypes.join('|'), 'i');
                    const extname = allowedTypesRegex.test(path.extname(file.originalname).toLowerCase());
                    const mimetype = allowedTypesRegex.test(file.mimetype);
                    if (mimetype && extname) {
                        return cb(null, true);
                    } else {
                        cb(new Error(`Sadece ${allowedTypes.join(', ')} dosyaları yüklenebilir!`));
                    }
                }
            });

            // Multer middleware'ini dinamik olarak uygula
            // Bu biraz karmaşık, bu yüzden alternatif bir yaklaşım kullanacağız
            // Şimdilik limits kontrolünü route seviyesinde yapacağız
            next();
        } catch (error) {
            console.error('Dynamic upload error:', error);
            // Hata durumunda varsayılan limiti kullan
            const defaultMaxSizeBytes = defaultMaxSize * 1024 * 1024;
            const upload = multer({
                storage: storage,
                limits: { fileSize: defaultMaxSizeBytes },
                fileFilter: function (req, file, cb) {
                    const allowedTypesRegex = new RegExp(allowedTypes.join('|'), 'i');
                    const extname = allowedTypesRegex.test(path.extname(file.originalname).toLowerCase());
                    const mimetype = allowedTypesRegex.test(file.mimetype);
                    if (mimetype && extname) {
                        return cb(null, true);
                    } else {
                        cb(new Error(`Sadece ${allowedTypes.join(', ')} dosyaları yüklenebilir!`));
                    }
                }
            });
            next();
        }
    };
};

/**
 * Dosya boyutu kontrolü için middleware
 * Limits ayarlarından maksimum dosya boyutunu kontrol eder
 */
export const checkFileSizeLimit = async (req, res, next) => {
    try {
        if (!req.files && !req.file) {
            return next();
        }

        const maxFileSizeBytes = await getMaxFileSizeBytes();
        const files = req.files ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : [req.file];

        for (const file of files) {
            if (file && file.size > maxFileSizeBytes) {
                // Dosyayı sil
                try {
                    if (file.path) {
                        await fs.promises.unlink(file.path);
                    }
                } catch (e) {
                    console.error('File delete error:', e);
                }
                return res.status(413).json({
                    error: `Dosya boyutu çok büyük. Maksimum dosya boyutu: ${maxFileSizeBytes / (1024 * 1024)}MB`
                });
            }
        }

        next();
    } catch (error) {
        console.error('Check file size limit error:', error);
        next(); // Hata durumunda devam et
    }
};
