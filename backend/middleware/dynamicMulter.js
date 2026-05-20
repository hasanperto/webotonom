import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getMaxFileSizeBytes, getMaxImagesPerProject } from '../utils/limitsUtils.js';

/**
 * Dinamik multer fields middleware oluşturur
 * Limits ayarlarından maxCount ve fileSize değerlerini alır
 */
export const createDynamicProjectUpload = () => {
    return async (req, res, next) => {
        try {
            const maxFileSizeBytes = await getMaxFileSizeBytes();
            const maxImages = await getMaxImagesPerProject();

            // Multer storage
            const storage = multer.diskStorage({
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

            // Dinamik multer instance
            const upload = multer({
                storage: storage,
                limits: { fileSize: maxFileSizeBytes },
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

            // Dinamik fields ile middleware'i uygula
            const fields = [
                { name: 'primary_image', maxCount: 1 },
                { name: 'gallery_images', maxCount: maxImages }
            ];

            upload.fields(fields)(req, res, next);
        } catch (error) {
            console.error('Dynamic multer error:', error);
            // Hata durumunda varsayılan değerlerle devam et
            const storage = multer.diskStorage({
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

            const upload = multer({
                storage: storage,
                limits: { fileSize: 10 * 1024 * 1024 }, // Varsayılan 10MB
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

            upload.fields([
                { name: 'primary_image', maxCount: 1 },
                { name: 'gallery_images', maxCount: 20 }
            ])(req, res, next);
        }
    };
};
