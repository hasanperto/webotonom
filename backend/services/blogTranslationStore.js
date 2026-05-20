import pool from '../config/database.js';
import {
    translateBlogFields,
    isUntranslatedCopy,
    hasMeaningfulTranslation,
} from './blogTranslate.js';

export async function saveBlogTranslation(postId, lang, { title, contentHtml, excerpt }) {
    await pool.execute(
        `INSERT INTO content_translations (
            content_id, content_type, language_code, title, content, short_description
        ) VALUES (?, 'blog', ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            title = VALUES(title),
            content = VALUES(content),
            short_description = VALUES(short_description),
            description = NULL`,
        [postId, lang, title, contentHtml, excerpt || '']
    );
}

/** Seçilen dilde geçerli çeviri yoksa TR kaynaktan üret ve kaydet */
export async function ensureBlogLanguage(postId, lang) {
    if (!lang || lang === 'tr') return;

    const [posts] = await pool.execute(
        'SELECT id, title, excerpt, content FROM blog_posts WHERE id = ?',
        [postId]
    );
    if (!posts.length) return;

    const post = posts[0];

    const [trRows] = await pool.execute(
        `SELECT title, content, short_description FROM content_translations
         WHERE content_id = ? AND content_type = 'blog' AND language_code = 'tr'`,
        [postId]
    );

    const source = {
        title: trRows[0]?.title || post.title,
        excerpt: trRows[0]?.short_description || post.excerpt || '',
        contentHtml: trRows[0]?.content || post.content,
    };

    const [langRows] = await pool.execute(
        `SELECT title, content FROM content_translations
         WHERE content_id = ? AND content_type = 'blog' AND language_code = ?`,
        [postId, lang]
    );

    const existing = langRows[0];
    if (
        existing?.content &&
        !isUntranslatedCopy(existing.content, source.contentHtml)
    ) {
        return;
    }

    console.log(`Blog #${postId} ${lang} çevirisi oluşturuluyor...`);
    const translated = await translateBlogFields(source, lang, 'tr');

    if (
        !hasMeaningfulTranslation(translated.contentHtml, source.contentHtml) ||
        !hasMeaningfulTranslation(translated.title, source.title)
    ) {
        console.warn(`Blog #${postId} ${lang} çevirisi başarısız, TR gösterilecek`);
        return;
    }

    await saveBlogTranslation(postId, lang, translated);
    console.log(`Blog #${postId} ${lang} çevirisi kaydedildi`);
}
