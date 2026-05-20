import pool from '../config/database.js';

const [posts] = await pool.execute(
    `SELECT id, title, slug, LEFT(content, 100) as content_preview
     FROM blog_posts
     WHERE title LIKE '%PRAGMATA%' OR title LIKE '%Node%' OR slug LIKE '%pragmata%'
     ORDER BY id DESC LIMIT 5`
);
console.log('posts:', posts);

for (const p of posts) {
    const [tr] = await pool.execute(
        `SELECT language_code,
                LEFT(title, 50) as title,
                LEFT(COALESCE(content, ''), 80) as content_col,
                LEFT(COALESCE(description, ''), 80) as desc_col
         FROM content_translations
         WHERE content_id = ? AND content_type = 'blog'`,
        [p.id]
    );
    console.log('\npost id', p.id, p.slug);
    console.log('bp.content:', p.content_preview);
    console.log('translations:', tr);
}

// Simulate API query for en
if (posts[0]) {
    const slug = posts[0].slug;
    const lang = 'en';
    const BLOG_CT_JOINS = `
        LEFT JOIN content_translations ct ON ct.content_id = bp.id
            AND ct.content_type = 'blog' AND ct.language_code = ?
        LEFT JOIN content_translations ct_fb ON ct_fb.content_id = bp.id
            AND ct_fb.content_type = 'blog' AND ct_fb.language_code = 'tr'
    `;
    const BLOG_CONTENT = `COALESCE(
        NULLIF(ct.content, ''),
        NULLIF(ct.description, ''),
        NULLIF(ct_fb.content, ''),
        NULLIF(ct_fb.description, ''),
        bp.content
    )`;
    const [r] = await pool.execute(
        `SELECT bp.title as bp_title, ${BLOG_CONTENT} as resolved_content
         FROM blog_posts bp ${BLOG_CT_JOINS} WHERE bp.slug = ?`,
        [lang, slug]
    );
    console.log('\nAPI en resolved:', r[0]?.resolved_content?.slice(0, 120));
}

process.exit(0);
