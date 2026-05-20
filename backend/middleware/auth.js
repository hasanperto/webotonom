import jwt from 'jsonwebtoken';
import { checkAndDowngradeRole } from '../utils/subscriptionUtils.js';

export const authenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Token bulunamadı' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        req.user = decoded;

        // Abonelik kontrolü ve rol güncelleme (Sadece seller ise kontrol et)
        if (req.user.role === 'seller') {
            await checkAndDowngradeRole(req.user.id);
            // Rol değişmiş olabilir, veritabanından güncel rolü çekmek gerekebilir ama 
            // şimdilik token'daki rol ile devam ediyoruz, bir sonraki login'de düzelir.
            // Veya veritabanından güncel kullanıcıyı çekip req.user'ı güncelleyebiliriz.
            // Bu daha güvenli olur.
            // const [users] = await pool.execute('SELECT role FROM users WHERE id = ?', [req.user.id]);
            // if (users.length > 0) req.user.role = users[0].role;
        }

        next();
    } catch (error) {
        return res.status(401).json({ error: 'Geçersiz token' });
    }
};

export const isAdmin = (req, res, next) => {
    console.log('🔐 isAdmin middleware - req.user:', req.user);
    console.log('🔐 isAdmin middleware - req.user.role:', req.user?.role);
    
    if (!req.user) {
        console.error('❌ isAdmin: req.user yok!');
        return res.status(401).json({ error: 'Kullanıcı bilgisi bulunamadı' });
    }
    
    if (req.user.role !== 'admin') {
        console.error('❌ isAdmin: Yetki yok! Kullanıcı rolü:', req.user.role);
        return res.status(403).json({ error: 'Admin yetkisi gerekli', currentRole: req.user.role });
    }
    
    console.log('✅ isAdmin: Yetki onaylandı');
    next();
};

export const isSeller = async (req, res, next) => {
    try {
        // Token'daki rol güncel olmayabilir, veritabanından kontrol et
        const pool = (await import('../config/database.js')).default;

        // user_roles ile join yaparak rol slug'ını al
        const [users] = await pool.execute(
            'SELECT ur.slug as role, u.status FROM users u LEFT JOIN user_roles ur ON u.role_id = ur.id WHERE u.id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Kullanıcı bulunamadı' });
        }

        const currentRole = users[0].role;
        const userStatus = users[0].status;

        // Kullanıcı aktif değilse
        if (userStatus !== 'active') {
            return res.status(403).json({ error: 'Hesabınız aktif değil' });
        }

        // req.user.role'u güncelle (sonraki kontroller için)
        req.user.role = currentRole;

        if (currentRole !== 'seller' && currentRole !== 'admin') {
            return res.status(403).json({ 
                error: 'Satıcı yetkisi gerekli',
                currentRole: currentRole,
                message: 'Bu sayfaya erişmek için satıcı hesabına ihtiyacınız var'
            });
        }
        next();
    } catch (error) {
        console.error('isSeller middleware error:', error);
        return res.status(500).json({ error: 'Sunucu hatası (Yetkilendirme)', details: error.message });
    }
};

