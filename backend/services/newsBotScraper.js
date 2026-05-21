/** Haber Botu — çoklu kaynak facade */
export {
    fetchPageHtml,
    downloadBlogAsset,
    downloadBlogCover,
    localizeContentImages,
    getPublicUploadUrl,
    slugifyTitle,
    slugifyTag,
} from './newsBotCore.js';

export {
    listNewsBotSources,
    listNewsBotPosts,
    fetchNewsBotPost,
    getSourceCategories,
    detectSourceFromUrl,
    NEWS_BOT_SOURCES,
} from './newsBotRegistry.js';

export { CATEGORIES as SOURCE_CATEGORY_FILTERS } from './newsBotSourceFullprogram.js';

const STOP_WORDS = new Set([
    'indir', 'full', 'pc', 'türkçe', 'turkce', 've', 'ile', 'için', 'icin', 'the', 'and',
    'bir', 'bu', 'olan', 'katılımsız', 'portable', 'final', 'build', 'version', 'x64',
    'izle', 'film', 'github', 'trending', 'stars', 'today',
]);

const LOCAL_CATEGORY_RULES = [
    { match: /yapay\s*zeka|^ai\b|artificial|claude|copilot|llm/i, name: 'AI' },
    { match: /oyun|game|gta|repack|torrent\s*oyun/i, name: 'GAME' },
    { match: /film|sinema|dublaj|altyazı|imdb|aksiyon\s*filmi|dram\s*filmi/i, name: 'Film' },
    { match: /github|repository|repo|open\s*source|developer/i, name: 'AI' },
];

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
