import pool from '../config/database.js';
import {
    fetchNewsBotPost,
    downloadBlogCover,
    slugifyTitle,
    localizeContentImages,
    buildSeoFields,
    buildTagNames,
} from './newsBotScraper.js';
import { findOrCreateCategoryId, attachTagsToPost } from './newsBotDb.js';
import { translateBlogFields } from './blogTranslate.js';
import { saveBlogTranslation } from './blogTranslationStore.js';

export async function importNewsBotArticle(userId, url, status = 'draft') {
    const scraped = await fetchNewsBotPost(url);
    const normalizedTitle = scraped.title.trim();

    const [dup] = await pool.execute(
        'SELECT id, title FROM blog_posts WHERE LOWER(TRIM(title)) = LOWER(TRIM(?)) LIMIT 1',
        [normalizedTitle]
    );
    if (dup.length > 0) {
        const err = new Error('Bu başlıkta bir yazı zaten var');
        err.code = 'DUPLICATE';
        err.existing_id = dup[0].id;
        err.title = dup[0].title;
        throw err;
    }

    let slug = slugifyTitle(normalizedTitle);
    const [slugExists] = await pool.execute(
        'SELECT id FROM blog_posts WHERE slug = ?',
        [slug]
    );
    if (slugExists.length > 0) {
        slug = `${slug}-${Date.now()}`;
    }

    const contentHtml = await localizeContentImages(scraped.contentHtml);
    const coverPath = (await downloadBlogCover(scraped.imageUrl)) || null;
    const seo = buildSeoFields(normalizedTitle, scraped.excerpt);
    const categoryId = await findOrCreateCategoryId(pool, scraped.sourceCategory);
    const tagNames = buildTagNames(normalizedTitle, scraped.sourceCategory);

    const postStatus = status === 'published' ? 'published' : 'draft';
    const publishedAt = postStatus === 'published' ? new Date() : null;

    const [result] = await pool.execute(
        `INSERT INTO blog_posts (
            user_id, title, slug, excerpt, content, category_id, status,
            is_featured, meta_title, meta_description, meta_keywords,
            cover_image, published_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            userId,
            normalizedTitle,
            slug,
            scraped.excerpt || '',
            contentHtml,
            categoryId,
            postStatus,
            0,
            seo.meta_title,
            seo.meta_description,
            seo.meta_keywords,
            coverPath,
            publishedAt,
        ]
    );

    const postId = result.insertId;

    await saveBlogTranslation(postId, 'tr', {
        title: normalizedTitle,
        contentHtml,
        excerpt: scraped.excerpt || '',
    });

    const base = {
        title: normalizedTitle,
        excerpt: scraped.excerpt || '',
        contentHtml,
    };

    for (const lang of ['en', 'de']) {
        const translated = await translateBlogFields(base, lang, 'tr');
        await saveBlogTranslation(postId, lang, translated);
    }

    await attachTagsToPost(pool, postId, tagNames);

    return {
        post_id: postId,
        title: normalizedTitle,
        slug,
        category_id: categoryId,
        tags: tagNames,
        seo,
        status: postStatus,
    };
}
