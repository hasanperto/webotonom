import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://www.fullprogramlarindir.net';
const USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/** Kaynak site kategori filtreleri (Haber Botu UI) */
export const SOURCE_CATEGORY_FILTERS = [
    { label: 'Tümü', path: '' },
    { label: 'Full Oyun İndir', path: 'kategori/pc-oyunlari-indiriniz/full-oyun-indir' },
    { label: 'PC Oyunları', path: 'kategori/pc-oyunlari-indiriniz' },
    { label: 'Genel Programlar', path: 'kategori/genel-cesit-programlar-indir' },
    { label: 'AI / Yapay Zeka', path: 'kategori/ai-yapay-zeka-programlari-indir' },
    { label: 'AntiVirüs & Güvenlik', path: 'kategori/antivirus-guvenlik-programlari-indir' },
    { label: 'Grafik & Resim', path: 'kategori/grafik-ve-resim-programlari-indir' },
    { label: 'İnternet Programları', path: 'kategori/internet-programlari-indir' },
    { label: 'Ses & Video', path: 'kategori/ses-ve-video-programlari-indir' },
    { label: 'Android Oyun', path: 'kategori/android-oyun-indir' },
    { label: 'Android Uygulama', path: 'kategori/android-uygulama-program-indir' },
];

const STOP_WORDS = new Set([
    'indir', 'full', 'pc', 'türkçe', 'turkce', 've', 'ile', 'için', 'icin', 'the', 'and',
    'bir', 'bu', 'olan', 'katılımsız', 'portable', 'final', 'build', 'version', 'x64',
]);

/** Yerel blog_categories.name eşlemesi */
const LOCAL_CATEGORY_RULES = [
    { match: /yapay\s*zeka|^ai\b|artificial/i, name: 'AI' },
    { match: /oyun|game|gta|repack|torrent\s*oyun/i, name: 'GAME' },
];

export function getListPageUrl(page = 1, categoryPath = '') {
    const base = categoryPath
        ? `${BASE_URL}/${categoryPath.replace(/^\/+|\/+$/g, '')}/`
        : `${BASE_URL}/`;
    if (page <= 1) return base;
    return `${base}page/${page}/`;
}

export async function fetchPageHtml(url) {
    const res = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' },
    });
    if (!res.ok) {
        throw new Error(`Sayfa alınamadı (${res.status})`);
    }
    return res.text();
}

function normalizeUrl(href) {
    if (!href) return null;
    if (href.startsWith('http')) return href;
    return `${BASE_URL}${href.startsWith('/') ? '' : '/'}${href}`;
}

function parsePostIndex($, el) {
    const $el = $(el);
    const linkEl = $el.find('.baslik h1 a').first();
    const url = normalizeUrl(linkEl.attr('href'));
    const title = linkEl.text().replace(/\s+/g, ' ').trim();
    const imageUrl = $el.find('.yazi img').first().attr('src') || null;
    const excerpt = $el
        .find('.yazi > p')
        .first()
        .text()
        .replace(/\s+/g, ' ')
        .trim();
    const date = $el.find('.tarih').text().replace(/\s+/g, ' ').trim() || null;
    const categoryEl = $el.find('.kategori a').first();
    const sourceCategory = categoryEl.text().replace(/\s+/g, ' ').trim() || null;
    const sourceCategoryPath = categoryEl.attr('href')
        ? categoryEl.attr('href').replace(BASE_URL, '').replace(/^\/+|\/+$/g, '')
        : null;

    if (!url || !title) return null;
    return {
        url,
        title,
        imageUrl,
        excerpt,
        date,
        sourceCategory,
        sourceCategoryPath,
    };
}

export async function listNewsBotPosts(page = 1, categoryPath = '') {
    const html = await fetchPageHtml(getListPageUrl(page, categoryPath));
    const $ = cheerio.load(html);
    const items = [];

    $('.post-index').each((_, el) => {
        const item = parsePostIndex($, el);
        if (item) items.push(item);
    });

    return items;
}

export async function fetchNewsBotPost(url) {
    if (!url || !url.includes('fullprogramlarindir.net')) {
        throw new Error('Geçersiz kaynak URL');
    }

    const html = await fetchPageHtml(url);
    const $ = cheerio.load(html);

    let title =
        $('h1.entry-title a').first().text().trim() ||
        $('h1.entry-title').first().text().trim() ||
        $('.baslik h1 a').first().text().trim();

    title = title.replace(/\s+/g, ' ').trim();
    if (!title) {
        throw new Error('Başlık bulunamadı');
    }

    const $content = $('.icerik-yapb-uzun').first();
    let contentHtml = $content.html()?.trim() || '';
    if (!contentHtml) {
        throw new Error('İçerik bulunamadı');
    }

    const imageUrl =
        $content.find('img').first().attr('src') ||
        $('meta[property="og:image"]').attr('content') ||
        null;

    const categoryEl = $('.yazi-alt .kategori a, .altbilgi .kategori a').first();
    const sourceCategory = categoryEl.text().replace(/\s+/g, ' ').trim() || null;
    const sourceCategoryPath = categoryEl.attr('href')
        ? categoryEl.attr('href').replace(BASE_URL, '').replace(/^\/+|\/+$/g, '')
        : null;

    const plain = $content.text().replace(/\s+/g, ' ').trim();
    const excerpt = plain.slice(0, 320);

    return {
        url,
        title,
        contentHtml,
        imageUrl,
        excerpt,
        sourceCategory,
        sourceCategoryPath,
    };
}

export function getPublicUploadUrl(relativePath) {
    const base = process.env.PUBLIC_BASE_URL || 'http://localhost:5000';
    const clean = String(relativePath || '')
        .replace(/^\/+/, '')
        .replace(/^uploads\//, '');
    return `${base}/uploads/${clean}`;
}

export async function downloadBlogAsset(imageUrl, prefix = 'cover-bot') {
    if (!imageUrl) return null;

    try {
        let absoluteUrl = imageUrl;
        if (absoluteUrl.startsWith('//')) absoluteUrl = `https:${absoluteUrl}`;
        else if (absoluteUrl.startsWith('/')) absoluteUrl = `${BASE_URL}${absoluteUrl}`;

        const parsed = new URL(absoluteUrl);
        let ext = path.extname(parsed.pathname).toLowerCase();
        if (!ext || !['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
            ext = '.jpg';
        }

        const filename = `${prefix}-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
        const blogDir = path.join(process.cwd(), 'public', 'uploads', 'blog');
        fs.mkdirSync(blogDir, { recursive: true });

        const res = await fetch(absoluteUrl, {
            headers: { 'User-Agent': USER_AGENT },
        });
        if (!res.ok) return null;

        const buffer = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync(path.join(blogDir, filename), buffer);
        return `blog/${filename}`;
    } catch (err) {
        console.warn('Asset download failed:', err.message);
        return null;
    }
}

export async function downloadBlogCover(imageUrl) {
    return downloadBlogAsset(imageUrl, 'cover-bot');
}

/** İçerikteki tüm harici görselleri sunucuya indir */
export async function localizeContentImages(html) {
    const $ = cheerio.load(`<div id="bot-root">${html}</div>`, null, false);
    const root = $('#bot-root');

    const imgs = root.find('img').toArray();
    for (const img of imgs) {
        let src = $(img).attr('src');
        if (!src || src.startsWith('data:')) continue;

        if (src.startsWith('//')) src = `https:${src}`;
        else if (src.startsWith('/')) src = `${BASE_URL}${src}`;

        if (src.includes('/uploads/blog/')) continue;

        const localPath = await downloadBlogAsset(src, 'content-bot');
        if (localPath) {
            $(img).attr('src', getPublicUploadUrl(localPath));
        }
    }

    return root.html() || html;
}

export function slugifyTitle(title) {
    const map = { ğ: 'g', ü: 'u', ş: 's', ı: 'i', ö: 'o', ç: 'c', Ğ: 'g', Ü: 'u', Ş: 's', İ: 'i', Ö: 'o', Ç: 'c' };
    let s = title.toLowerCase();
    for (const [k, v] of Object.entries(map)) s = s.split(k).join(v);
    return (
        s
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')
            .slice(0, 200) || `post-${Date.now()}`
    );
}

export function buildSeoFields(title, excerptPlain) {
    const plainExcerpt = (excerptPlain || title)
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    const meta_title = title.slice(0, 60);
    const meta_description = plainExcerpt.slice(0, 160);
    const meta_keywords = buildTagNames(title, null).join(', ');

    return { meta_title, meta_description, meta_keywords };
}

export function buildTagNames(title, sourceCategory) {
    const tags = new Set();

    if (sourceCategory) {
        tags.add(sourceCategory.trim());
    }

    title
        .replace(/[^\wğüşıöçĞÜŞİÖÇ\s-]/gi, ' ')
        .split(/\s+/)
        .map((w) => w.trim())
        .filter((w) => w.length > 2 && !STOP_WORDS.has(w.toLowerCase()))
        .slice(0, 6)
        .forEach((w) => tags.add(w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()));

    return [...tags].slice(0, 10);
}

export function resolveLocalCategoryName(sourceCategory) {
    const text = (sourceCategory || '').trim();
    if (!text) return 'GAME';

    for (const rule of LOCAL_CATEGORY_RULES) {
        if (rule.match.test(text)) return rule.name;
    }

    if (/program|yazılım|software|driver|office|internet|android|ios|windows/i.test(text)) {
        return 'AI';
    }

    return 'GAME';
}

export function slugifyTag(name) {
    return slugifyTitle(name).slice(0, 50);
}
