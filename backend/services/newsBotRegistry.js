import * as fullprogram from './newsBotSourceFullprogram.js';
import * as film from './newsBotSourceFilm.js';
import * as github from './newsBotSourceGithub.js';

const MODULES = {
    fullprogramlarindir: fullprogram,
    fullhdfilm: film,
    'github-trending': github,
};

export const NEWS_BOT_SOURCES = [
    {
        id: fullprogram.SOURCE_ID,
        label: 'fullprogramlarindir.net',
        domain: 'fullprogramlarindir.net',
    },
    {
        id: film.SOURCE_ID,
        label: 'fullhdfilmizlesene.life',
        domain: 'fullhdfilmizlesene.life',
    },
    {
        id: github.SOURCE_ID,
        label: 'GitHub Trending',
        domain: 'github.com/trending',
    },
];

const DEFAULT_SOURCE_ID = fullprogram.SOURCE_ID;

export function listNewsBotSources() {
    return NEWS_BOT_SOURCES;
}

export function getSourceModule(sourceId) {
    return MODULES[sourceId] || MODULES[DEFAULT_SOURCE_ID];
}

export function getSourceCategories(sourceId) {
    return getSourceModule(sourceId).CATEGORIES || [];
}

export function detectSourceFromUrl(url) {
    if (!url) return null;
    const u = url.toLowerCase();
    if (u.includes('fullprogramlarindir.net')) return fullprogram.SOURCE_ID;
    if (u.includes('fullhdfilmizlesene')) return film.SOURCE_ID;
    if (u.includes('github.com')) return github.SOURCE_ID;
    return null;
}

export async function listNewsBotPosts(page = 1, categoryPath = '', sourceId = DEFAULT_SOURCE_ID) {
    const mod = getSourceModule(sourceId);
    return mod.listPosts(page, categoryPath);
}

export async function fetchNewsBotPost(url) {
    const sourceId = detectSourceFromUrl(url);
    if (!sourceId) {
        throw new Error(
            'Desteklenmeyen kaynak. fullprogramlarindir.net, fullhdfilmizlesene.life veya github.com depo URL kullanın.'
        );
    }
    return getSourceModule(sourceId).fetchPost(url);
}
