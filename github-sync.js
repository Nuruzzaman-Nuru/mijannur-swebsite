// Shared news loader for static/GitHub pages.
// Admin API persists news into db.json, so public pages must read db.json too.

const GITHUB_RAW_URL = "https://raw.githubusercontent.com/Nuruzzaman-Nuru/mijannur-swebsite/main/db.json";
const LOCAL_DB_URL = "db.json";
const LEGACY_NEWS_URL = "news.json";
const NEWS_CACHE_KEY = "cachedNews";

function normalizeNewsPayload(payload) {
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.news)) return payload.news;
    return [];
}

async function fetchNewsJson(url) {
    const separator = url.includes("?") ? "&" : "?";
    const response = await fetch(`${url}${separator}v=${Date.now()}`, {
        cache: "no-store",
        headers: { "Accept": "application/json" }
    });

    if (!response.ok) return null;

    const data = await response.json();
    return normalizeNewsPayload(data);
}

function readCachedNews() {
    try {
        const cached = localStorage.getItem(NEWS_CACHE_KEY);
        return cached ? normalizeNewsPayload(JSON.parse(cached)) : [];
    } catch (error) {
        return [];
    }
}

function cacheNews(newsList) {
    try {
        localStorage.setItem(NEWS_CACHE_KEY, JSON.stringify(newsList || []));
    } catch (error) {
        // Ignore cache failures. Fresh fetches still work.
    }
}

async function loadNewsFromGitHub() {
    const sources = [GITHUB_RAW_URL, LOCAL_DB_URL, LEGACY_NEWS_URL];

    for (const source of sources) {
        try {
            const news = await fetchNewsJson(source);
            if (Array.isArray(news) && news.length) {
                cacheNews(news);
                return news;
            }
        } catch (error) {
            // Try the next source.
        }
    }

    return readCachedNews();
}

window.NewsSource = {
    rawUrl: GITHUB_RAW_URL,
    loadNewsFromGitHub,
    readCachedNews
};
