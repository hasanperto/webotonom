import 'dotenv/config';
import pool from '../config/database.js';
import { ensureBlogLanguage } from '../services/blogTranslationStore.js';

await pool.execute(
    `DELETE FROM content_translations WHERE content_id = 5 AND content_type = 'blog' AND language_code IN ('en', 'de')`
);
console.log('Eski EN/DE silindi');

for (const lang of ['en', 'de']) {
    await ensureBlogLanguage(5, lang);
}

const [rows] = await pool.execute(
    `SELECT language_code, LEFT(title, 70) t, LEFT(content, 120) c
     FROM content_translations WHERE content_id = 5 AND content_type = 'blog'`
);
console.table(rows);
process.exit(0);
