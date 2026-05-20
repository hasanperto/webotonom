import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// Public settings (sadece gerekli alanlar)
// GET /api/public/settings/:group
router.get('/:group', async (req, res) => {
    try {
        const { group } = req.params;
        
        // Veritabanı sorgusu - timeout ile
        let rows = [];
        try {
            const queryPromise = pool.execute(
                'SELECT `key`, `value`, `type` FROM settings WHERE `group` = ?',
                [group]
            );
            // 3 saniye timeout
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Database timeout')), 3000)
            );
            [rows] = await Promise.race([queryPromise, timeoutPromise]);
        } catch (error) {
            console.error('Public settings query error:', error);
            // Hata durumunda boş obje döndür
            return res.json({});
        }

        const result = {};
        for (const r of rows) {
            if (r.type === 'boolean') result[r.key] = r.value === '1' || r.value === 'true';
            else if (r.type === 'number') result[r.key] = parseFloat(r.value) || 0;
            else result[r.key] = r.value;
        }

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
        if (error.code === 'ER_NO_SUCH_TABLE') return res.json({});
        console.error('Public settings error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

export default router;


