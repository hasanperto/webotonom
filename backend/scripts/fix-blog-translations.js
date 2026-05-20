/**
 * Blog çevirilerini onarır:
 * - TR: description → content taşır
 * - EN/DE: içerik Node.js gibi placeholder ise veya content dolu ama bp ile uyumsuzsa siler
 */
import pool from '../config/database.js';

const PLACEHOLDER = /node\.js\s*22|performance improvements/i;

const [posts] = await pool.execute(
    `SELECT id, title, slug, content FROM blog_posts`
);

let fixedTr = 0;
let removed = 0;

for (const post of posts) {
    const [rows] = await pool.execute(
        `SELECT id, language_code, content, description, short_description
         FROM content_translations
         WHERE content_id = ? AND content_type = 'blog'`,
        [post.id]
    );

    for (const row of rows) {
        if (row.language_code === 'tr') {
            if ((!row.content || row.content.length < 20) && row.description?.length > 20) {
                await pool.execute(
                    `UPDATE content_translations
                     SET content = description, description = NULL
                     WHERE id = ?`,
                    [row.id]
                );
                fixedTr++;
            }
            continue;
        }

        const badContent =
            row.content &&
            (PLACEHOLDER.test(row.content) ||
                (post.content &&
                    !row.content.includes(post.title.slice(0, 12)) &&
                    row.content.length > 100));

        if (badContent) {
            await pool.execute('DELETE FROM content_translations WHERE id = ?', [row.id]);
            removed++;
        }
    }
}

console.log(`TR düzeltildi: ${fixedTr}, hatalı EN/DE silindi: ${removed}`);
process.exit(0);
