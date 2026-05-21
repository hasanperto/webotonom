import pool from '../config/database.js';

const MAINTENANCE_CACHE_MS = 60_000;
let maintenanceCache = { at: 0, settings: null };

async function loadMaintenanceSettings() {
    const now = Date.now();
    if (maintenanceCache.settings && now - maintenanceCache.at < MAINTENANCE_CACHE_MS) {
        return maintenanceCache.settings;
    }

    const [settings] = await pool.execute(
        'SELECT `key`, `value`, `type` FROM settings WHERE `group` = ?',
        ['maintenance']
    );

    const maintenanceSettings = {
        enabled: false,
        message_tr: 'Site bakımda. Lütfen daha sonra tekrar deneyin.',
        message_en: 'Site is under maintenance. Please try again later.',
        message_de: 'Die Website befindet sich im Wartungsmodus. Bitte versuchen Sie es später erneut.',
        message: 'Site bakımda. Lütfen daha sonra tekrar deneyin.',
        allowedIps: '',
    };

    settings.forEach((setting) => {
        if (setting.type === 'boolean') {
            maintenanceSettings[setting.key] =
                setting.value === '1' || setting.value === 'true';
        } else {
            maintenanceSettings[setting.key] = setting.value;
        }
    });

    maintenanceCache = { at: now, settings: maintenanceSettings };
    return maintenanceSettings;
}

/**
 * Bakım modu kontrolü middleware
 * Bakım modu aktifse ve kullanıcı admin değilse veya IP izinli değilse erişimi engeller
 */
export const checkMaintenanceMode = async (req, res, next) => {
    try {
        // Admin route'ları, API route'ları ve bakım modu sayfası route'ları muaf
        const exemptPaths = [
            '/admin',
            '/api/admin',
            '/api/auth',
            '/api/public/settings/maintenance',
            '/api/public/settings',
            '/api/i18n', // Dil API'leri bakım modunda da çalışmalı
            '/api/cart', // Sepet API'leri bakım modunda da çalışmalı (admin için)
            '/maintenance'
        ];
        
        if (exemptPaths.some(path => req.path.startsWith(path))) {
            return next();
        }

        let maintenanceSettings;
        try {
            const queryPromise = loadMaintenanceSettings();
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Database timeout')), 3000)
            );
            maintenanceSettings = await Promise.race([queryPromise, timeoutPromise]);
        } catch (error) {
            console.error('Maintenance settings query error:', error);
            return next();
        }

        // Bakım modu aktif değilse devam et
        if (!maintenanceSettings.enabled) {
            return next();
        }

        // Kullanıcı admin ise erişime izin ver
        if (req.user && req.user.role_id === 1) {
            return next();
        }

        // IP adresi kontrolü
        const clientIp = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
        const allowedIps = maintenanceSettings.allowed_ips || maintenanceSettings.allowedIps || '';
        
        if (allowedIps) {
            const ipList = allowedIps.split('\n').map(ip => ip.trim()).filter(ip => ip);
            if (ipList.includes(clientIp)) {
                return next();
            }
        }

        // Bakım modu sayfasına yönlendir
        // Çok dilli mesaj desteği
        const language = req.headers['accept-language']?.split(',')[0]?.split('-')[0] || 'tr';
        const messageKey = `message_${language}`;
        const defaultMessage = maintenanceSettings.message || maintenanceSettings.message_tr || 'Site bakımda. Lütfen daha sonra tekrar deneyin.';
        const localizedMessage = maintenanceSettings[messageKey] || defaultMessage;
        
        return res.status(503).json({
            maintenance: true,
            message: localizedMessage,
            message_tr: maintenanceSettings.message_tr || defaultMessage,
            message_en: maintenanceSettings.message_en || 'Site is under maintenance. Please try again later.',
            message_de: maintenanceSettings.message_de || 'Die Website befindet sich im Wartungsmodus. Bitte versuchen Sie es später erneut.'
        });
    } catch (error) {
        console.error('Maintenance mode check error:', error);
        // Hata durumunda erişime izin ver (güvenlik için)
        next();
    }
};
