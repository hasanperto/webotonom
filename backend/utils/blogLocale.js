/** Eski/hatalı otomatik çeviri içeriklerini filtrele */
const BAD_CONTENT_RE =
    /node\.js\s*22\s*lts|node\.js\s*22\s*performance|v8\s*engine\s*upgrade/i;

export function isBadBlogContent(html) {
    if (!html || typeof html !== 'string') return false;
    const plain = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    return BAD_CONTENT_RE.test(plain);
}

function firstValid(...candidates) {
    for (const value of candidates) {
        if (value && String(value).trim() && !isBadBlogContent(value)) {
            return value;
        }
    }
    for (const value of candidates) {
        if (value && String(value).trim()) return value;
    }
    return '';
}

import {
    isUntranslatedCopy,
    hasMeaningfulTranslation,
} from '../services/blogTranslate.js';

/** SQL satırından (ham çeviri sütunları) görüntülenecek alanları üret */
export function applyBlogLocale(row, lang = 'tr') {
    if (!row) return row;

    const title = firstValid(row._ct_title, row._fb_title, row.title);
    const excerpt = firstValid(
        row._ct_short,
        row._fb_short,
        row.excerpt
    );

    const trBody = firstValid(row._fb_content, row._fb_description, row.content);
    const langBody = firstValid(row._ct_content, row._ct_description);

    let content;
    if (
        lang !== 'tr' &&
        langBody &&
        hasMeaningfulTranslation(langBody, trBody)
    ) {
        content = langBody;
    } else if (lang !== 'tr') {
        content = trBody;
    } else {
        content = firstValid(
            row._ct_content,
            row._ct_description,
            row._fb_content,
            row._fb_description,
            row.content
        );
    }

    const cleaned = { ...row, title, excerpt, content };

    delete cleaned._ct_title;
    delete cleaned._ct_content;
    delete cleaned._ct_description;
    delete cleaned._ct_short;
    delete cleaned._fb_title;
    delete cleaned._fb_content;
    delete cleaned._fb_description;
    delete cleaned._fb_short;

    return cleaned;
}

export const BLOG_LOCALE_SELECT = `
    ct.title AS _ct_title,
    ct.content AS _ct_content,
    ct.description AS _ct_description,
    ct.short_description AS _ct_short,
    ct_fb.title AS _fb_title,
    ct_fb.content AS _fb_content,
    ct_fb.description AS _fb_description,
    ct_fb.short_description AS _fb_short
`;
