import * as cheerio from 'cheerio';
import { fetchPageHtml, normalizeAbsoluteUrl } from './newsBotCore.js';

export const SOURCE_ID = 'fullhdfilm';
export const BASE_URL = 'https://www.fullhdfilmizlesene.life';

export const CATEGORIES = [
    { label: 'Tümü (Yeni Filmler)', path: '' },
    { label: 'Aksiyon', path: 'filmizle/aksiyon-filmleri' },
    { label: 'Komedi', path: 'filmizle/komedi-filmleri' },
    { label: 'Dram', path: 'filmizle/dram-filmleri' },
    { label: 'Gerilim', path: 'filmizle/gerilim-filmleri' },
    { label: 'Korku', path: 'filmizle/korku-filmleri' },
    { label: 'Bilim Kurgu', path: 'filmizle/bilim-kurgu-filmleri' },
    { label: 'Fantastik', path: 'filmizle/fantastik-filmler' },
    { label: 'Animasyon', path: 'filmizle/animasyon-filmleri' },
    { label: 'Macera', path: 'filmizle/macera-filmleri' },
    { label: 'Belgesel', path: 'filmizle/belgesel-filmleri' },
    { label: 'Aile', path: 'filmizle/aile-filmleri' },
];

export function getListPageUrl(page = 1, categoryPath = '') {
    const cat = (categoryPath || '').replace(/^\/+|\/+$/g, '');
    if (!cat) {
        if (page <= 1) return `${BASE_URL}/yeni-filmler/`;
        return `${BASE_URL}/yeni-filmler/${page}`;
    }
    if (page <= 1) return `${BASE_URL}/${cat}/`;
    return `${BASE_URL}/${cat}/${page}`;
}

function posterFromFilm($el) {
    const img = $el.find('img.afis, picture img').first();
    return (
        img.attr('data-src') ||
        img.attr('src') ||
        img.attr('data-srcset')?.split(/\s+/)[0] ||
        null
    );
}

function parseFilmItem($, el) {
    const $el = $(el);
    const link = $el.find('a.tt').first();
    const url = normalizeAbsoluteUrl(link.attr('href'), BASE_URL);
    const title =
        $el.find('.film-title').first().text().replace(/\s+/g, ' ').trim() ||
        link.text().replace(/\s+izle$/i, '').replace(/\s+/g, ' ').trim();
    const imageUrl = posterFromFilm($el);
    const sourceCategory = $el.find('.ktt').first().text().replace(/\s+/g, ' ').trim() || null;
    const date =
        $el.find('time').attr('datetime') ||
        $el.find('time').text().replace(/\s+/g, ' ').trim() ||
        null;
    const imdb = $el.find('.imdb').first().text().trim();
    const excerpt = [sourceCategory, imdb ? `IMDB ${imdb}` : null]
        .filter(Boolean)
        .join(' · ');

    if (!url || !title) return null;
    return {
        url,
        title,
        imageUrl: imageUrl && !imageUrl.startsWith('data:') ? imageUrl : null,
        excerpt,
        date,
        sourceCategory,
        sourceCategoryPath: categoryPathFromUrl(url),
        sourceId: SOURCE_ID,
    };
}

function categoryPathFromUrl(url) {
    try {
        const p = new URL(url).pathname;
        const m = p.match(/^\/filmizle\/[^/]+/);
        return m ? m[0].replace(/^\//, '') : null;
    } catch {
        return null;
    }
}

export async function listPosts(page = 1, categoryPath = '') {
    const html = await fetchPageHtml(getListPageUrl(page, categoryPath), BASE_URL);
    const $ = cheerio.load(html);
    const items = [];
    const seen = new Set();

    $('ul.list li.film, li.film').each((_, el) => {
        const item = parseFilmItem($, el);
        if (item && !seen.has(item.url)) {
            seen.add(item.url);
            items.push(item);
        }
    });

    return items;
}

function extractJsonLdDescription($) {
    let text = '';
    $('script[type="application/ld+json"]').each((_, el) => {
        try {
            const data = JSON.parse($(el).html() || '{}');
            const nodes = Array.isArray(data) ? data : [data];
            for (const node of nodes) {
                if (node['@type'] === 'Movie' && node.description) {
                    text = String(node.description).trim();
                    break;
                }
            }
        } catch {
            /* ignore */
        }
    });
    return text;
}

export async function fetchPost(url) {
    if (!url || !url.includes('fullhdfilmizlesene')) {
        throw new Error('Geçersiz film sitesi URL');
    }

    const html = await fetchPageHtml(url, BASE_URL);
    const $ = cheerio.load(html);

    let title =
        $('.single header .izle-titles h1 a').first().text().trim() ||
        $('.single header .izle-titles h1').first().text().trim() ||
        $('h1 a').first().text().trim() ||
        $('meta[property="og:title"]').attr('content') ||
        '';

    title = title.replace(/\s+izle$/i, '').replace(/\s+/g, ' ').trim();
    if (!title) throw new Error('Film başlığı bulunamadı');

    const ozet =
        $('.film-ozeti .ozet-ic').first().html()?.trim() ||
        $('.detay-sag .film-ozeti').first().html()?.trim() ||
        '';
    const jsonDesc = extractJsonLdDescription($);
    const plainOzet = $('.film-ozeti .ozet-ic')
        .text()
        .replace(/\s+/g, ' ')
        .trim();

    let contentHtml = ozet;
    if (!contentHtml && jsonDesc) {
        contentHtml = `<p>${jsonDesc.replace(/</g, '&lt;')}</p>`;
    }
    if (!contentHtml) throw new Error('Film özeti bulunamadı');

    const imageUrl =
        $('meta[property="og:image"]').attr('content') ||
        $('.afis').attr('src') ||
        $('img.afis').attr('data-src') ||
        null;

    const sourceCategory =
        $('.ktt').first().text().replace(/\s+/g, ' ').trim() ||
        $('meta[name="description"]').attr('content')?.slice(0, 80) ||
        'Film';

    const excerpt = (plainOzet || jsonDesc || '').slice(0, 320);

    return {
        url,
        title,
        contentHtml,
        imageUrl,
        excerpt,
        sourceCategory,
        sourceCategoryPath: categoryPathFromUrl(url),
        baseUrl: BASE_URL,
        sourceId: SOURCE_ID,
    };
}
