import {
    resolveLocalCategoryName,
    slugifyTitle,
    slugifyTag,
} from './newsBotScraper.js';

export async function findOrCreateCategoryId(pool, sourceCategory) {
    const localName = resolveLocalCategoryName(sourceCategory);
    const slug = slugifyTitle(localName);

    const [existing] = await pool.execute(
        'SELECT id FROM blog_categories WHERE slug = ? OR name = ? LIMIT 1',
        [slug, localName]
    );
    if (existing.length > 0) return existing[0].id;

    const [result] = await pool.execute(
        `INSERT INTO blog_categories (name, slug, description, sort_order, status)
         VALUES (?, ?, ?, ?, 'active')`,
        [localName, slug, sourceCategory ? `Kaynak: ${sourceCategory}` : null, 0]
    );
    return result.insertId;
}

export async function attachTagsToPost(pool, postId, tagNames) {
    for (const name of tagNames) {
        const trimmed = name.trim();
        if (!trimmed) continue;

        const tagSlug = slugifyTag(trimmed);
        let tagId;

        const [existing] = await pool.execute(
            'SELECT id FROM blog_tags WHERE slug = ? OR name = ? LIMIT 1',
            [tagSlug, trimmed]
        );

        if (existing.length > 0) {
            tagId = existing[0].id;
        } else {
            const [ins] = await pool.execute(
                'INSERT INTO blog_tags (name, slug) VALUES (?, ?)',
                [trimmed.slice(0, 50), tagSlug]
            );
            tagId = ins.insertId;
        }

        await pool.execute(
            'INSERT IGNORE INTO blog_post_tags (post_id, tag_id) VALUES (?, ?)',
            [postId, tagId]
        );
    }
}
