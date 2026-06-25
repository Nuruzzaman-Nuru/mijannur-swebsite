(() => {
    const existing = window.NewsSiteConfig || {};
    const apiBaseUrl = String(
        window.NEWS_API_BASE_URL ||
        existing.apiBaseUrl ||
        "https://mijannur-swebsite.vercel.app"
    ).replace(/\/+$/, "");
    const githubRawNewsUrl = String(
        window.GITHUB_RAW_NEWS_URL ||
        existing.githubRawNewsUrl ||
        "https://raw.githubusercontent.com/Nuruzzaman-Nuru/mijannur-swebsite/main/db.json"
    ).trim();

    window.NewsSiteConfig = {
        ...existing,
        apiBaseUrl,
        githubRawNewsUrl
    };

    window.NEWS_API_BASE_URL = apiBaseUrl;
    window.GITHUB_RAW_NEWS_URL = githubRawNewsUrl;
})();
