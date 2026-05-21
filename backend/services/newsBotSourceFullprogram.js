import * as cheerio from 'cheerio';
import {
    fetchPageHtml,
    normalizeAbsoluteUrl,
    localizeContentImages,
    downloadBlogCover,
} from './newsBotCore.js';

export const SOURCE_ID = 'fullprogramlarindir';
export const BASE_URL = 'https://www.fullprogramlarindir.net';

export const CATEGORIES = [
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

export function getListPageUrl(page = 1, categoryPath = '') {
    const base = categoryPath
        ? `${BASE_URL}/${categoryPath.replace(/^\/+|\/+$/g, '')}/`
        : `${BASE_URL}/`;
    if (page <= 1) return base;
    return `${base}page/${page}/`;
}

function parsePostIndex($, el) {
    const $el = $(el);
    const linkEl = $el.find('.baslik h1 a').first();
    const url = normalizeAbsoluteUrl(linkEl.attr('href'), BASE_URL);
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
        sourceId: SOURCE_ID,
    };
}

export async function listPosts(page = 1, categoryPath = '') {
    const html = await fetchPageHtml(getListPageUrl(page, categoryPath), BASE_URL);
    const $ = cheerio.load(html);
    const items = [];

    $('.post-index').each((_, el) => {
        const item = parsePostIndex($, el);
        if (item) items.push(item);
    });

    return items;
}

export async function fetchPost(url) {
    if (!url || !url.includes('fullprogramlarindir.net')) {
        throw new Error('Geçersiz fullprogramlarindir URL');
    }

    const html = await fetchPageHtml(url, BASE_URL);
    const $ = cheerio.load(html);

    let title =
        $('h1.entry-title a').first().text().trim() ||
        $('h1.entry-title').first().text().trim() ||
        $('.baslik h1 a').first().text().trim();

    title = title.replace(/\s+/g, ' ').trim();
    if (!title) throw new Error('Başlık bulunamadı');

    const $content = $('.icerik-yapb-uzun').first();
    let contentHtml = $content.html()?.trim() || '';
    if (!contentHtml) throw new Error('İçerik bulunamadı');

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
        baseUrl: BASE_URL,
        sourceId: SOURCE_ID,
    };
}
