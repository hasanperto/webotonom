/**
 * Blog liste + yazı detay UI çevirileri
 * Kullanım: node scripts/add-blog-page-translations.js
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'teknopro',
});

const translations = [
    ['tr', 'blog.featured', 'Öne çıkan', 'blog'],
    ['tr', 'blog.search_placeholder', 'Yazılarda ara...', 'blog'],
    ['tr', 'blog.categories', 'Kategoriler', 'blog'],
    ['tr', 'blog.all_posts', 'Tümü', 'blog'],
    ['tr', 'blog.clear_filters', 'Filtreleri temizle', 'blog'],
    ['en', 'blog.featured', 'Featured', 'blog'],
    ['en', 'blog.search_placeholder', 'Search posts...', 'blog'],
    ['en', 'blog.categories', 'Categories', 'blog'],
    ['en', 'blog.all_posts', 'All', 'blog'],
    ['en', 'blog.clear_filters', 'Clear filters', 'blog'],
    ['de', 'blog.featured', 'Hervorgehoben', 'blog'],
    ['de', 'blog.search_placeholder', 'Beiträge suchen...', 'blog'],
    ['de', 'blog.categories', 'Kategorien', 'blog'],
    ['de', 'blog.all_posts', 'Alle', 'blog'],
    ['de', 'blog.clear_filters', 'Filter zurücksetzen', 'blog'],
    ['tr', 'blog.back_to_blog', "Blog'a Dön", 'blog'],
    ['tr', 'blog.comments_title', 'Yorumlar ({count})', 'blog'],
    ['tr', 'blog.no_comments', 'Henüz yorum yapılmamış. İlk yorumu siz yapın!', 'blog'],
    ['tr', 'blog.add_comment', 'Yorum Yap', 'blog'],
    ['tr', 'blog.comment_placeholder', 'Yorumunuzu yazın...', 'blog'],
    ['tr', 'blog.login_to_comment', 'Yorum yapmak için giriş yapmalısınız', 'blog'],
    ['tr', 'blog.comment_added', 'Yorumunuz eklendi!', 'blog'],
    ['tr', 'blog.comment_error', 'Yorum eklenemedi', 'blog'],
    ['tr', 'blog.link_copied', 'Link kopyalandı!', 'blog'],
    ['tr', 'blog.post_not_found', 'Yazı bulunamadı', 'blog'],
    ['en', 'blog.back_to_blog', 'Back to Blog', 'blog'],
    ['en', 'blog.comments_title', 'Comments ({count})', 'blog'],
    ['en', 'blog.no_comments', 'No comments yet. Be the first to comment!', 'blog'],
    ['en', 'blog.add_comment', 'Add Comment', 'blog'],
    ['en', 'blog.comment_placeholder', 'Write your comment...', 'blog'],
    ['en', 'blog.login_to_comment', 'Please log in to leave a comment', 'blog'],
    ['en', 'blog.comment_added', 'Your comment has been added!', 'blog'],
    ['en', 'blog.comment_error', 'Could not add comment', 'blog'],
    ['en', 'blog.link_copied', 'Link copied!', 'blog'],
    ['en', 'blog.post_not_found', 'Post not found', 'blog'],
    ['de', 'blog.back_to_blog', 'Zurück zum Blog', 'blog'],
    ['de', 'blog.comments_title', 'Kommentare ({count})', 'blog'],
    ['de', 'blog.no_comments', 'Noch keine Kommentare. Seien Sie der Erste!', 'blog'],
    ['de', 'blog.add_comment', 'Kommentar schreiben', 'blog'],
    ['de', 'blog.comment_placeholder', 'Schreiben Sie Ihren Kommentar...', 'blog'],
    ['de', 'blog.login_to_comment', 'Bitte melden Sie sich an, um zu kommentieren', 'blog'],
    ['de', 'blog.comment_added', 'Ihr Kommentar wurde hinzugefügt!', 'blog'],
    ['de', 'blog.comment_error', 'Kommentar konnte nicht hinzugefügt werden', 'blog'],
    ['de', 'blog.link_copied', 'Link kopiert!', 'blog'],
    ['de', 'blog.post_not_found', 'Beitrag nicht gefunden', 'blog'],
    ['tr', 'blog.author', 'Yazar', 'blog'],
    ['tr', 'blog.published_date', '{date}', 'blog'],
    ['tr', 'blog.reading_time', '{minutes} dk okuma', 'blog'],
    ['en', 'blog.author', 'Author', 'blog'],
    ['en', 'blog.published_date', '{date}', 'blog'],
    ['en', 'blog.reading_time', '{minutes} min read', 'blog'],
    ['de', 'blog.author', 'Autor', 'blog'],
    ['de', 'blog.published_date', '{date}', 'blog'],
    ['de', 'blog.reading_time', '{minutes} Min. Lesezeit', 'blog'],
    ['tr', 'blog.toc_title', 'İçindekiler', 'blog'],
    ['tr', 'blog.share_title', 'Paylaş', 'blog'],
    ['tr', 'blog.share_copy', 'Kopyala', 'blog'],
    ['tr', 'blog.share_whatsapp', 'WhatsApp', 'blog'],
    ['tr', 'blog.share_facebook', 'Facebook', 'blog'],
    ['tr', 'blog.share_instagram', 'Instagram', 'blog'],
    ['tr', 'blog.share_instagram_hint', 'Link kopyalandı. Instagram hikayenize yapıştırabilirsiniz.', 'blog'],
    ['tr', 'blog.share_copy_error', 'Link kopyalanamadı', 'blog'],
    ['tr', 'blog.sidebar_label', 'Yazı kenar çubuğu', 'blog'],
    ['en', 'blog.toc_title', 'Table of contents', 'blog'],
    ['en', 'blog.share_title', 'Share', 'blog'],
    ['en', 'blog.share_copy', 'Copy link', 'blog'],
    ['en', 'blog.share_whatsapp', 'WhatsApp', 'blog'],
    ['en', 'blog.share_facebook', 'Facebook', 'blog'],
    ['en', 'blog.share_instagram', 'Instagram', 'blog'],
    ['en', 'blog.share_instagram_hint', 'Link copied. You can paste it in your Instagram story.', 'blog'],
    ['en', 'blog.share_copy_error', 'Could not copy link', 'blog'],
    ['en', 'blog.sidebar_label', 'Article sidebar', 'blog'],
    ['de', 'blog.toc_title', 'Inhaltsverzeichnis', 'blog'],
    ['de', 'blog.share_title', 'Teilen', 'blog'],
    ['de', 'blog.share_copy', 'Link kopieren', 'blog'],
    ['de', 'blog.share_whatsapp', 'WhatsApp', 'blog'],
    ['de', 'blog.share_facebook', 'Facebook', 'blog'],
    ['de', 'blog.share_instagram', 'Instagram', 'blog'],
    ['de', 'blog.share_instagram_hint', 'Link kopiert. In Instagram Story einfügen.', 'blog'],
    ['de', 'blog.share_copy_error', 'Link konnte nicht kopiert werden', 'blog'],
    ['de', 'blog.sidebar_label', 'Seitenleiste', 'blog'],
];

async function main() {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        for (const [lang, key, value, group] of translations) {
            const [existing] = await connection.execute(
                'SELECT id FROM translations WHERE language_code = ? AND `key` = ?',
                [lang, key]
            );
            if (existing.length > 0) {
                await connection.execute(
                    'UPDATE translations SET value = ?, `group` = ?, updated_at = NOW() WHERE language_code = ? AND `key` = ?',
                    [value, group, lang, key]
                );
                console.log(`Güncellendi: ${lang} ${key}`);
            } else {
                await connection.execute(
                    'INSERT INTO translations (language_code, `key`, value, `group`, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
                    [lang, key, value, group]
                );
                console.log(`Eklendi: ${lang} ${key}`);
            }
        }
        await connection.commit();
        console.log('\nBlog çevirileri tamam (liste + detay).');
    } catch (e) {
        await connection.rollback();
        console.error(e);
        process.exitCode = 1;
    } finally {
        connection.release();
        await pool.end();
    }
}

main();
