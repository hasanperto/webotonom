import fs from 'fs';
import path from 'path';

export const USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const FETCH_TIMEOUT_MS = 30000;

export function normalizeAbsoluteUrl(href, baseUrl) {
    if (!href) return null;
    if (href.startsWith('http')) return href;
    if (href.startsWith('//')) return `https:${href}`;
    const base = (baseUrl || '').replace(/\/+$/, '');
    return `${base}${href.startsWith('/') ? '' : '/'}${href}`;
}

export async function fetchPageHtml(url, referer, attempt = 1) {
    const headers = {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
        Referer: referer || url,
        'Cache-Control': 'no-cache',
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
        const res = await fetch(url, { headers, signal: controller.signal });
        if (!res.ok) {
            throw new Error(`Sayfa alınamadı (HTTP ${res.status}): ${url}`);
        }
        return res.text();
    } catch (err) {
        if (attempt < 2) {
            await new Promise((r) => setTimeout(r, 1500));
            return fetchPageHtml(url, referer, attempt + 1);
        }
        if (err?.name === 'AbortError') {
            throw new Error(`Kaynak site yanıt vermedi (30 sn zaman aşımı): ${url}`);
        }
        const code = err?.cause?.code || err?.code;
        if (code) {
            throw new Error(`Kaynak siteye bağlanılamadı (${code}): ${url}`);
        }
        throw new Error(err?.message || `Kaynak site isteği başarısız: ${url}`);
    } finally {
        clearTimeout(timeoutId);
    }
}

export function getPublicUploadUrl(relativePath) {
    const base = process.env.PUBLIC_BASE_URL || 'http://localhost:5000';
    const clean = String(relativePath || '')
        .replace(/^\/+/, '')
        .replace(/^uploads\//, '');
    return `${base}/uploads/${clean}`;
}

export async function downloadBlogAsset(imageUrl, prefix = 'cover-bot', baseUrl = '') {
    if (!imageUrl) return null;

    try {
        const absoluteUrl = normalizeAbsoluteUrl(imageUrl, baseUrl);
        if (!absoluteUrl) return null;

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

export async function downloadBlogCover(imageUrl, baseUrl) {
    return downloadBlogAsset(imageUrl, 'cover-bot', baseUrl);
}

export async function localizeContentImages(html, baseUrl = '') {
    const cheerio = await import('cheerio');
    const $ = cheerio.load(`<div id="bot-root">${html}</div>`, null, false);
    const root = $('#bot-root');

    for (const img of root.find('img').toArray()) {
        let src = $(img).attr('src');
        if (!src || src.startsWith('data:')) continue;

        if (src.includes('/uploads/blog/')) continue;

        const localPath = await downloadBlogAsset(src, 'content-bot', baseUrl);
        if (localPath) {
            $(img).attr('src', getPublicUploadUrl(localPath));
        }
    }

    return root.html() || html;
}

export function slugifyTitle(title) {
    const map = {
        ğ: 'g', ü: 'u', ş: 's', ı: 'i', ö: 'o', ç: 'c',
        Ğ: 'g', Ü: 'u', Ş: 's', İ: 'i', Ö: 'o', Ç: 'c',
    };
    let s = title.toLowerCase();
    for (const [k, v] of Object.entries(map)) s = s.split(k).join(v);
    return (
        s
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')
            .slice(0, 200) || `post-${Date.now()}`
    );
}

export function slugifyTag(name) {
    return slugifyTitle(name).slice(0, 50);
}
