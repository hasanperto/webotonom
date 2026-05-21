import pool from '../config/database.js';

/** Çeviri açıklaması kısa özet ise ana (projects) açıklamayı ezmesin */
export function applyProjectTranslation(project, trans) {
    if (!trans) return;
    if (trans.title) project.title = trans.title;
    if (trans.short_description) project.short_description = trans.short_description;

    const baseDesc = (project.description || '').trim();
    const transDesc = (trans.description || '').trim();
    if (!transDesc) return;

    if (!baseDesc) {
        project.description = transDesc;
        return;
    }

    if (transDesc.length >= baseDesc.length * 0.65) {
        project.description = transDesc;
    }
}

/**
 * Proje listesine görseller, etiketler ve çevirileri tek seferde ekler (N+1 önleme).
 */
export async function enrichProjectsList(projects, lang = 'tr', options = {}) {
    const { imageLimit = 5, tagLimit = 10 } = options;
    if (!projects?.length) return projects;

    const ids = projects.map((p) => p.id);
    const placeholders = ids.map(() => '?').join(',');

    const transPromise = pool
        .execute(
            `SELECT content_id, language_code, title, description, short_description
             FROM content_translations
             WHERE content_type = 'project' AND content_id IN (${placeholders}) AND language_code = ?`,
            [...ids, lang]
        )
        .catch((err) => {
            console.warn('Batch translations fetch failed:', err.message);
            return [[]];
        });

    const [allImages, allTags, allTrans] = await Promise.all([
        pool.execute(
            `SELECT project_id, image_path, is_primary, sort_order
             FROM project_images
             WHERE project_id IN (${placeholders})
             ORDER BY project_id, sort_order ASC, is_primary DESC`,
            ids
        ),
        pool.execute(
            `SELECT pt.project_id, t.id, t.name, t.slug
             FROM project_tags pt
             INNER JOIN tags t ON t.id = pt.tag_id
             WHERE pt.project_id IN (${placeholders})
             ORDER BY t.name ASC`,
            ids
        ),
        transPromise,
    ]);

    const imagesByProject = {};
    const tagsByProject = {};
    const transByProject = {};

    for (const img of allImages[0]) {
        if (!imagesByProject[img.project_id]) imagesByProject[img.project_id] = [];
        if (imagesByProject[img.project_id].length < imageLimit) {
            imagesByProject[img.project_id].push({
                ...img,
                image_path: img.image_path ? `/uploads/${img.image_path}` : null,
            });
        }
    }

    for (const tag of allTags[0]) {
        if (!tagsByProject[tag.project_id]) tagsByProject[tag.project_id] = [];
        if (tagsByProject[tag.project_id].length < tagLimit) {
            tagsByProject[tag.project_id].push({
                id: tag.id,
                name: tag.name,
                slug: tag.slug,
            });
        }
    }

    for (const tr of allTrans[0]) {
        transByProject[tr.content_id] = tr;
    }

    for (const project of projects) {
        if (project.primary_image) {
            project.primary_image = `/uploads/${project.primary_image}`;
        }
        project.images = imagesByProject[project.id] || [];
        project.tags = tagsByProject[project.id] || [];
        const trans = transByProject[project.id];
        if (trans) applyProjectTranslation(project, trans);
    }

    return projects;
}
