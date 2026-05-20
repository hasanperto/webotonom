import 'dotenv/config';
import pool from '../config/database.js';
import { translateBlogFields, hasMeaningfulTranslation } from '../services/blogTranslate.js';

const [tr] = await pool.execute(
    `SELECT content, title, short_description FROM content_translations
     WHERE content_id = 5 AND language_code = 'tr'`
);
const source = {
    title: tr[0].title,
    excerpt: tr[0].short_description,
    contentHtml: tr[0].content,
};
const r = await translateBlogFields(source, 'de', 'tr');
console.log('title:', r.title);
console.log('title ok:', hasMeaningfulTranslation(r.title, source.title));
console.log('content ok:', hasMeaningfulTranslation(r.contentHtml, source.contentHtml));
console.log('plain:', r.contentHtml?.replace(/<[^>]+>/g, ' ').slice(100, 350));
process.exit(0);
