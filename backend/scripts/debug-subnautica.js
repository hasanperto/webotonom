import 'dotenv/config';
import pool from '../config/database.js';
import { BLOG_LOCALE_SELECT, applyBlogLocale } from '../utils/blogLocale.js';

const BLOG_CT_JOINS = `
    LEFT JOIN content_translations ct ON ct.content_id = bp.id
        AND ct.content_type = 'blog' AND ct.language_code = ?
    LEFT JOIN content_translations ct_fb ON ct_fb.content_id = bp.id
        AND ct_fb.content_type = 'blog' AND ct_fb.language_code = 'tr'
`;

const [rows] = await pool.execute(
    `SELECT bp.id, bp.title, bp.slug, bp.content,
     ${BLOG_LOCALE_SELECT}
     FROM blog_posts bp
     ${BLOG_CT_JOINS}
     WHERE bp.slug LIKE '%subnautica%' OR bp.title LIKE '%Subnautica%'
     LIMIT 1`,
    ['de']
);

if (!rows.length) {
    console.log('not found');
    process.exit(0);
}

const raw = rows[0];
console.log('slug:', raw.slug);
console.log('RAW _ct_title:', raw._ct_title?.slice(0, 60));
console.log('RAW _ct_content len:', (raw._ct_content || '').length);
console.log('RAW _ct_content start:', (raw._ct_content || '').slice(0, 80));
console.log('RAW _fb_content start:', (raw._fb_content || '').slice(0, 80));

const postDe = applyBlogLocale(raw, 'de');
console.log('\nAPPLIED DE title:', postDe.title?.slice(0, 60));
console.log('APPLIED DE content:', postDe.content?.replace(/<[^>]+>/g, ' ').slice(80, 280));

const [all] = await pool.execute(
    `SELECT language_code, LENGTH(content) clen, LENGTH(description) dlen, LEFT(title,50) t
     FROM content_translations WHERE content_id=? AND content_type='blog'`,
    [raw.id]
);
console.log('\nAll translations:', all);

process.exit(0);
