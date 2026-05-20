import pool from '../config/database.js';

/**
 * Limits ayarlarını veritabanından okur
 * @returns {Promise<Object>} Limits ayarları objesi
 */
export const getLimitsSettings = async () => {
    try {
        const [settings] = await pool.execute(
            'SELECT `key`, `value`, `type` FROM settings WHERE `group` = ?',
            ['limits']
        );

        const result = {
            maxFileSize: 10, // MB - varsayılan
            maxProjectsPerUser: 10, // varsayılan
            maxImagesPerProject: 20, // varsayılan
            maxFileUploads: 5 // varsayılan
        };

        settings.forEach(setting => {
            if (setting.type === 'number') {
                result[setting.key] = parseFloat(setting.value) || 0;
            } else {
                result[setting.key] = setting.value;
            }
        });

        return result;
    } catch (error) {
        console.error('Get limits settings error:', error);
        // Hata durumunda varsayılan değerleri döndür
        return {
            maxFileSize: 10,
            maxProjectsPerUser: 10,
            maxImagesPerProject: 20,
            maxFileUploads: 5
        };
    }
};

/**
 * Kullanıcının proje sayısı limitini kontrol eder
 * @param {number} userId - Kullanıcı ID
 * @returns {Promise<{allowed: boolean, current: number, max: number}>}
 */
export const checkProjectLimit = async (userId) => {
    try {
        const limits = await getLimitsSettings();
        const maxProjects = limits.maxProjectsPerUser || 10;

        // Admin kontrolü
        const [users] = await pool.execute('SELECT role_id FROM users WHERE id = ?', [userId]);
        if (users.length > 0 && users[0].role_id === 1) {
            return { allowed: true, current: 0, max: -1 }; // Admin limitsiz
        }

        const [projects] = await pool.execute(
            'SELECT COUNT(*) as count FROM projects WHERE user_id = ? AND status != "deleted"',
            [userId]
        );

        const current = projects[0]?.count || 0;

        return {
            allowed: current < maxProjects,
            current: current,
            max: maxProjects
        };
    } catch (error) {
        console.error('Check project limit error:', error);
        return { allowed: false, current: 0, max: 0 };
    }
};

/**
 * Proje görsel sayısı limitini kontrol eder
 * @param {number} projectId - Proje ID
 * @param {number} newImagesCount - Yeni eklenen görsel sayısı
 * @returns {Promise<{allowed: boolean, current: number, max: number}>}
 */
export const checkImageLimit = async (projectId, newImagesCount = 0) => {
    try {
        const limits = await getLimitsSettings();
        const maxImages = limits.maxImagesPerProject || 20;

        const [images] = await pool.execute(
            'SELECT COUNT(*) as count FROM project_images WHERE project_id = ?',
            [projectId]
        );

        const current = images[0]?.count || 0;
        const total = current + newImagesCount;

        return {
            allowed: total <= maxImages,
            current: current,
            max: maxImages,
            total: total
        };
    } catch (error) {
        console.error('Check image limit error:', error);
        return { allowed: false, current: 0, max: 0, total: 0 };
    }
};

/**
 * Dosya boyutu limitini byte cinsinden döndürür
 * @returns {Promise<number>} Maksimum dosya boyutu (byte)
 */
export const getMaxFileSizeBytes = async () => {
    try {
        const limits = await getLimitsSettings();
        const maxFileSizeMB = limits.maxFileSize || 10;
        return maxFileSizeMB * 1024 * 1024; // MB'yi byte'a çevir
    } catch (error) {
        console.error('Get max file size error:', error);
        return 10 * 1024 * 1024; // Varsayılan 10MB
    }
};

/**
 * Maksimum görsel sayısını döndürür
 * @returns {Promise<number>} Maksimum görsel sayısı
 */
export const getMaxImagesPerProject = async () => {
    try {
        const limits = await getLimitsSettings();
        return limits.maxImagesPerProject || 20;
    } catch (error) {
        console.error('Get max images per project error:', error);
        return 20; // Varsayılan 20
    }
};
