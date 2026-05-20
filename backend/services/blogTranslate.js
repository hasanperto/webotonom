import * as cheerio from 'cheerio';

const LANG_NAMES = { tr: 'Türkçe', en: 'English', de: 'Deutsch' };
const MYMEMORY_MAX = 450;
let geminiDisabled = false;

function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}

function normalizeForCompare(text) {
    return String(text || '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}

const TR_CHARS = /[ğüşıöçĞÜŞİÖÇ]/;

/** TR ile birebir aynı mı */
export function isUntranslatedCopy(translated, source) {
    if (!translated || !source) return true;
    const a = normalizeForCompare(translated);
    const b = normalizeForCompare(source);
    if (!a || !b) return true;
    return a === b || (a.length > 60 && a.slice(0, 90) === b.slice(0, 90));
}

/** Çeviri anlamlı şekilde farklı mı (kısmi çeviri dahil) */
export function hasMeaningfulTranslation(translated, source) {
    if (!translated || !source) return false;
    if (isUntranslatedCopy(translated, source)) return false;

    const trSrc = (source.match(TR_CHARS) || []).length;
    const trOut = (translated.match(TR_CHARS) || []).length;
    if (trSrc > 5 && trOut < trSrc * 0.55) return true;

    const a = normalizeForCompare(translated);
    const b = normalizeForCompare(source);
    if (a.slice(0, 80) !== b.slice(0, 80)) return true;

    let diff = 0;
    const len = Math.min(a.length, b.length, 500);
    for (let i = 0; i < len; i++) {
        if (a[i] !== b[i]) diff++;
    }
    return diff / Math.max(len, 1) > 0.08;
}

async function translateWithGemini(text, sourceLang, targetLang) {
    if (geminiDisabled || !process.env.GEMINI_API_KEY || !text?.trim()) {
        return null;
    }

    try {
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const source = LANG_NAMES[sourceLang] || sourceLang;
        const target = LANG_NAMES[targetLang] || targetLang;
        const prompt = `Translate ${source} to ${target}. Output only translation. Keep HTML tags.\n\n${text.slice(0, 12000)}`;
        const result = await model.generateContent(prompt);
        const out = result.response.text().trim();
        if (out && !isUntranslatedCopy(out, text)) return out;
    } catch (err) {
        if (String(err.message).includes('429') || String(err.message).includes('quota')) {
            geminiDisabled = true;
        }
    }
    return null;
}

async function translateWithMyMemory(text, sourceLang, targetLang) {
    if (!text?.trim()) return null;

    const chunks = [];
    const raw = text.trim();
    for (let i = 0; i < raw.length; i += MYMEMORY_MAX) {
        chunks.push(raw.slice(i, i + MYMEMORY_MAX));
    }

    const parts = [];
    for (const chunk of chunks) {
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=${sourceLang}|${targetLang}`;
        try {
            const res = await fetch(url);
            const data = await res.json();
            if (data.quotaFinished) break;
            const t = data.responseData?.translatedText?.trim();
            parts.push(t && t !== chunk ? t : chunk);
        } catch {
            parts.push(chunk);
        }
        await sleep(300);
    }

    const joined = parts.join(' ');
    return isUntranslatedCopy(joined, text) ? null : joined;
}

async function translatePlainText(text, sourceLang, targetLang) {
    if (!text?.trim() || sourceLang === targetLang) return text;

    const gemini = await translateWithGemini(text, sourceLang, targetLang);
    if (gemini) return gemini;

    const mm = await translateWithMyMemory(text, sourceLang, targetLang);
    if (mm) return mm;

    return text;
}

/** Paragraf/blok bazlı HTML çevirisi */
export async function translateHtmlContent(html, targetLang, sourceLang = 'tr') {
    if (!html?.trim() || targetLang === sourceLang) return html;

    const $ = cheerio.load(`<div id="doc">${html}</div>`, null, false);
    const root = $('#doc');
    let changed = 0;

    const elements = root.find('p, h1, h2, h3, h4, li, td, th, blockquote').toArray();
    for (const el of elements) {
        const $el = $(el);
        const plain = $el.text().replace(/\s+/g, ' ').trim();
        if (plain.length < 8) continue;

        const translated = await translatePlainText(plain, sourceLang, targetLang);
        if (!translated || isUntranslatedCopy(translated, plain)) continue;

        if ($el.find('img').length > 0) {
            const imgHtml = $el
                .find('img')
                .toArray()
                .map((node) => $.html(node))
                .join('');
            $el.html(`${imgHtml}<br/>${translated}`);
        } else {
            $el.text(translated);
        }
        changed++;
    }

    if (changed === 0) return html;
    const out = root.html() || html;
    return hasMeaningfulTranslation(out, html) ? out : html;
}

export async function translateBlogFields(
    { title, excerpt, contentHtml },
    targetLang,
    sourceLang = 'tr'
) {
    if (targetLang === sourceLang) {
        return { title, excerpt, contentHtml };
    }

    const tTitle = await translatePlainText(title, sourceLang, targetLang);
    const tExcerpt = excerpt
        ? await translatePlainText(excerpt.slice(0, 500), sourceLang, targetLang)
        : '';
    const tContent = await translateHtmlContent(contentHtml, targetLang, sourceLang);

    return {
        title: hasMeaningfulTranslation(tTitle, title) ? tTitle : title,
        excerpt: hasMeaningfulTranslation(tExcerpt, excerpt || '') ? tExcerpt : excerpt,
        contentHtml: hasMeaningfulTranslation(tContent, contentHtml)
            ? tContent
            : contentHtml,
    };
}
