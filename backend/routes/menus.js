import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// Public menü endpoint'i (navbar/footer için)
// GET /api/menus/:type?lang=tr  -> aktif menü öğeleri + dil çevirileri
router.get('/:type', async (req, res) => {
    try {
        const { type } = req.params;
        const language = req.query.lang || 'tr'; // Dil parametresi

        const [items] = await pool.execute(
            'SELECT * FROM menu_items WHERE menu_type = ? AND status = ? ORDER BY `order` ASC',
            [type, 'active']
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

        console.log(`[MENUS] type=${type} lang=${language} active_count=${itemsWithTranslations.length}`);
        res.json({ items: itemsWithTranslations });
    } catch (error) {
        if (error.code === 'ER_NO_SUCH_TABLE') {
            console.log(`[MENUS] type=${req.params.type} table_missing`);
            return res.json({ items: [] });
        }
        console.error('Public menus error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

export default router;


