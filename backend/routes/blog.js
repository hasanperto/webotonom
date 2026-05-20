import express from 'express';
import pool from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { BLOG_LOCALE_SELECT, applyBlogLocale } from '../utils/blogLocale.js';
import { ensureBlogLanguage } from '../services/blogTranslationStore.js';

const router = express.Router();

const BLOG_CT_JOINS = `
    LEFT JOIN content_translations ct ON ct.content_id = bp.id
        AND ct.content_type = 'blog'
        AND ct.language_code = ?
    LEFT JOIN content_translations ct_fb ON ct_fb.content_id = bp.id
        AND ct_fb.content_type = 'blog'
        AND ct_fb.language_code = 'tr'
`;

function normalizeLang(lang) {
    const code = String(lang || 'tr').toLowerCase().slice(0, 2);
    return ['tr', 'en', 'de'].includes(code) ? code : 'tr';
}

router.get('/', async (req, res) => {
    try {
        const { category, tag, page = 1, limit = 10 } = req.query;
        const lang = normalizeLang(req.query.lang);
        const offset = (page - 1) * limit;

        let query = `
            SELECT bp.*, u.username as author_name,
             bc.name as category_name, bc.slug as category_slug,
             ${BLOG_LOCALE_SELECT},
             (SELECT COUNT(*) FROM blog_comments WHERE post_id = bp.id AND is_approved = 1) as comment_count
            FROM blog_posts bp
            LEFT JOIN users u ON bp.user_id = u.id
            LEFT JOIN blog_categories bc ON bp.category_id = bc.id
            ${BLOG_CT_JOINS}
            WHERE bp.status = 'published'
        `;
        const params = [lang];

        if (category) {
            query += ' AND bc.slug = ?';
            params.push(category);
        }

        if (tag) {
            query += ` AND EXISTS (
                SELECT 1 FROM blog_post_tags bpt
                INNER JOIN blog_tags bt ON bt.id = bpt.tag_id
                WHERE bpt.post_id = bp.id AND bt.slug = ?
            )`;
            params.push(tag);
        }

        query += ' ORDER BY bp.published_at DESC, bp.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [rows] = await pool.execute(query, params);
        res.json({ posts: rows.map((r) => applyBlogLocale(r, lang)) });
    } catch (error) {
        console.error('Get blog posts error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

router.get('/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const lang = normalizeLang(req.query.lang);

        const [rows] = await pool.execute(
            `SELECT bp.*, bp.cover_image as featured_image, u.username as author_name,
             bc.name as category_name, bc.slug as category_slug,
             ${BLOG_LOCALE_SELECT},
             (SELECT GROUP_CONCAT(bt.name ORDER BY bt.name SEPARATOR ', ')
              FROM blog_post_tags bpt
              INNER JOIN blog_tags bt ON bt.id = bpt.tag_id
              WHERE bpt.post_id = bp.id) as tags
             FROM blog_posts bp
             LEFT JOIN users u ON bp.user_id = u.id
             LEFT JOIN blog_categories bc ON bp.category_id = bc.id
             ${BLOG_CT_JOINS}
             WHERE bp.slug = ? AND bp.status = 'published'`,
            [lang, slug]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Yazı bulunamadı' });
        }

        if (lang !== 'tr') {
            await ensureBlogLanguage(rows[0].id, lang);
            const [refreshed] = await pool.execute(
                `SELECT bp.*, bp.cover_image as featured_image, u.username as author_name,
                 bc.name as category_name, bc.slug as category_slug,
                 ${BLOG_LOCALE_SELECT},
                 (SELECT GROUP_CONCAT(bt.name ORDER BY bt.name SEPARATOR ', ')
                  FROM blog_post_tags bpt
                  INNER JOIN blog_tags bt ON bt.id = bpt.tag_id
                  WHERE bpt.post_id = bp.id) as tags
                 FROM blog_posts bp
                 LEFT JOIN users u ON bp.user_id = u.id
                 LEFT JOIN blog_categories bc ON bp.category_id = bc.id
                 ${BLOG_CT_JOINS}
                 WHERE bp.slug = ? AND bp.status = 'published'`,
                [lang, slug]
            );
            if (refreshed.length) rows[0] = refreshed[0];
        }

        const post = applyBlogLocale(rows[0], lang);

        const [comments] = await pool.execute(
            `SELECT bc.*, u.username
             FROM blog_comments bc
             LEFT JOIN users u ON bc.user_id = u.id
             WHERE bc.post_id = ? AND bc.is_approved = 1
             ORDER BY bc.created_at DESC`,
            [post.id]
        );

        await pool.execute('UPDATE blog_posts SET view_count = view_count + 1 WHERE id = ?', [post.id]);

        let similarPosts = [];
        try {
            const [similar] = await pool.execute(
                `SELECT bp.id, bp.slug, bp.cover_image, bp.created_at,
                 u.username as author_name,
                 ${BLOG_LOCALE_SELECT}
                 FROM blog_posts bp
                 LEFT JOIN users u ON bp.user_id = u.id
                 ${BLOG_CT_JOINS}
                 WHERE bp.id != ?
                 AND bp.status = 'published'
                 AND (bp.category_id = ? OR bp.category_id IS NOT NULL)
                 ORDER BY RAND()
                 LIMIT 3`,
                [lang, post.id, post.category_id || 0]
            );

            if (similar.length < 3) {
                const [random] = await pool.execute(
                    `SELECT bp.id, bp.slug, bp.cover_image, bp.created_at,
                     u.username as author_name,
                     ${BLOG_LOCALE_SELECT}
                     FROM blog_posts bp
                     LEFT JOIN users u ON bp.user_id = u.id
                     ${BLOG_CT_JOINS}
                     WHERE bp.id != ?
                     AND bp.status = 'published'
                     ORDER BY RAND()
                     LIMIT ?`,
                    [lang, post.id, 3 - similar.length]
                );
                similarPosts = [...similar, ...random].slice(0, 3);
            } else {
                similarPosts = similar;
            }
        } catch (similarError) {
            console.warn('Similar posts fetch error:', similarError);
            similarPosts = [];
        }

        res.json({
            post,
            comments,
            similarPosts: similarPosts.map((r) => applyBlogLocale(r, lang)),
        });
    } catch (error) {
        console.error('Get blog post error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

router.post('/:id/comments', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { comment } = req.body;
        const userId = req.user.id;

        if (!comment) {
            return res.status(400).json({ error: 'Yorum gereklidir' });
        }

        await pool.execute(
            'INSERT INTO blog_comments (post_id, user_id, comment, is_approved) VALUES (?, ?, ?, ?)',
            [id, userId, comment, 1]
        );

        res.status(201).json({ message: 'Yorumunuz eklendi' });
    } catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

export default router;
