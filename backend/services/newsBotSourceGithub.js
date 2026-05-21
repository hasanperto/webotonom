import * as cheerio from 'cheerio';
import { fetchPageHtml, normalizeAbsoluteUrl } from './newsBotCore.js';

export const SOURCE_ID = 'github-trending';
export const BASE_URL = 'https://github.com';

export const CATEGORIES = [
    { label: 'Tümü', path: '' },
    { label: 'Python', path: 'python' },
    { label: 'JavaScript', path: 'javascript' },
    { label: 'TypeScript', path: 'typescript' },
    { label: 'Go', path: 'go' },
    { label: 'Rust', path: 'rust' },
    { label: 'Java', path: 'java' },
    { label: 'C++', path: 'cpp' },
    { label: 'C#', path: 'csharp' },
    { label: 'PHP', path: 'php' },
    { label: 'Ruby', path: 'ruby' },
    { label: 'Swift', path: 'swift' },
    { label: 'Kotlin', path: 'kotlin' },
    { label: 'Shell', path: 'shell' },
    { label: 'Haftalık', path: ':weekly' },
    { label: 'Aylık', path: ':monthly' },
];

function parseCategoryPath(categoryPath = '') {
    const raw = String(categoryPath || '').trim();
    if (raw.startsWith(':')) {
        return { lang: '', since: raw.slice(1) || 'daily' };
    }
    const idx = raw.indexOf(':');
    if (idx >= 0) {
        return {
            lang: raw.slice(0, idx),
            since: raw.slice(idx + 1) || 'daily',
        };
    }
    return { lang: raw, since: 'daily' };
}

export function getListPageUrl(page = 1, categoryPath = '') {
    if (page > 1) return null;
    const { lang, since } = parseCategoryPath(categoryPath);
    let url = `${BASE_URL}/trending`;
    if (lang) url += `/${lang}`;
    if (since && since !== 'daily') {
        url += `?since=${encodeURIComponent(since)}`;
    }
    return url;
}

function repoFullName($article) {
    const link = $article.find('h2 a').first();
    const href = link.attr('href') || '';
    const text = link.text().replace(/\s+/g, ' ').trim();
    if (href.startsWith('/')) {
        return href.replace(/^\//, '').split('?')[0];
    }
    return text.replace(/\s+/g, '');
}

export async function listPosts(page = 1, categoryPath = '') {
    const listUrl = getListPageUrl(page, categoryPath);
    if (!listUrl) return [];

    const html = await fetchPageHtml(listUrl, `${BASE_URL}/trending`);
    const $ = cheerio.load(html);
    const items = [];
    const { lang, since } = parseCategoryPath(categoryPath);

    $('article.Box-row').each((_, el) => {
        const $article = $(el);
        const repo = repoFullName($article);
        if (!repo || !repo.includes('/')) return;

        const url = `${BASE_URL}/${repo}`;
        const title = repo.split('/').pop() || repo;
        const excerpt =
            $article.find('p.col-9').first().text().replace(/\s+/g, ' ').trim() || '';
        const language = $article
            .find('[itemprop="programmingLanguage"]')
            .first()
            .text()
            .replace(/\s+/g, ' ')
            .trim();
        const starsToday = $article
            .find('.float-sm-right, span.d-inline-block.float-sm-right')
            .last()
            .text()
            .replace(/\s+/g, ' ')
            .trim();

        const ownerAvatar = $article.find('img.avatar-user').first().attr('src');

        items.push({
            url,
            title: `${repo} — GitHub Trending`,
            imageUrl: ownerAvatar || null,
            excerpt,
            date: starsToday || null,
            sourceCategory: language || lang || 'Trending',
            sourceCategoryPath: categoryPath,
            sourceId: SOURCE_ID,
            meta: { repo, since, language },
        });
    });

    return items;
}

export async function fetchPost(url) {
    if (!url || !url.includes('github.com')) {
        throw new Error('Geçersiz GitHub URL');
    }

    let repoPath;
    try {
        const parsed = new URL(url);
        repoPath = parsed.pathname.replace(/^\/+/, '').split('/').slice(0, 2).join('/');
    } catch {
        throw new Error('Geçersiz GitHub URL');
    }

    if (!repoPath || repoPath.split('/').length < 2) {
        throw new Error('Depo URL değil (owner/repo gerekli)');
    }

    const repoUrl = `${BASE_URL}/${repoPath}`;
    const html = await fetchPageHtml(repoUrl, BASE_URL);
    const $ = cheerio.load(html);

    const title =
        $('meta[property="og:title"]').attr('content')?.replace(/\s*·.*$/, '').trim() ||
        repoPath;

    const description =
        $('meta[property="og:description"]').attr('content')?.trim() ||
        $('meta[name="description"]').attr('content')?.trim() ||
        $('p.f4').first().text().replace(/\s+/g, ' ').trim() ||
        '';

    const language = $('[itemprop="programmingLanguage"]').first().text().trim();
    const readmeHtml =
        $('#readme article, .markdown-body').first().html()?.trim() || '';
    const readmeText = $('#readme article, .markdown-body')
        .first()
        .text()
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 2000);

    let contentHtml = '';
    if (description) {
        contentHtml += `<p><strong>${description}</strong></p>`;
    }
    if (readmeHtml) {
        contentHtml += readmeHtml;
    } else if (readmeText) {
        contentHtml += `<p>${readmeText.slice(0, 1500)}</p>`;
    }
    if (!contentHtml) {
        contentHtml = `<p>GitHub deposu: <a href="${repoUrl}" rel="noopener">${repoPath}</a></p>`;
    }
    contentHtml += `<p><a href="${repoUrl}" rel="noopener noreferrer">Kaynağı GitHub'da aç</a></p>`;

    const imageUrl =
        $('meta[property="og:image"]').attr('content') ||
        $('img.avatar').first().attr('src') ||
        null;

    const excerpt = (description || readmeText).slice(0, 320);

    return {
        url: repoUrl,
        title,
        contentHtml,
        imageUrl,
        excerpt,
        sourceCategory: language || 'GitHub',
        sourceCategoryPath: language ? `lang:${language}` : null,
        baseUrl: BASE_URL,
        sourceId: SOURCE_ID,
    };
}
