import 'dotenv/config';
import pool from '../config/database.js';
import { ensureBlogLanguage } from '../services/blogTranslationStore.js';

const slug = process.argv[2];
const langs = process.argv[3]?.split(',') || ['en', 'de'];

if (!slug) {
    console.log('Kullanım: node scripts/retranslate-blog-post.js <slug> [en,de]');
    process.exit(1);
}

const [posts] = await pool.execute('SELECT id, title FROM blog_posts WHERE slug = ?', [slug]);
if (!posts.length) {
    console.error('Yazı bulunamadı:', slug);
    process.exit(1);
}

const post = posts[0];
console.log('Yazı:', post.title);

for (const lang of langs) {
    await ensureBlogLanguage(post.id, lang);
    const [row] = await pool.execute(
        `SELECT language_code, LEFT(title, 60) t, LEFT(content, 100) c
         FROM content_translations WHERE content_id = ? AND language_code = ?`,
        [post.id, lang]
    );
    console.log(lang, row[0] || 'yok');
}

process.exit(0);
