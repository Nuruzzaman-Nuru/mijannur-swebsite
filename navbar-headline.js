(() => {
    const FALLBACK_API_BASE_URL = "https://mijannur-swebsite.vercel.app";
    function getApiNewsEndpoint() {
        const configuredBase = String(window.NEWS_API_BASE_URL || "").replace(/\/+$/, "");
        if (configuredBase) return `${configuredBase}/api/news`;

        const hostname = window.location.hostname;
        const isStaticHost = window.location.protocol === "file:" || hostname.endsWith("github.io");
        if (isStaticHost) return `${FALLBACK_API_BASE_URL}/api/news`;

        return "/api/news";
    }

    const API_NEWS_ENDPOINT = getApiNewsEndpoint();
    const REFRESH_INTERVAL_MS = 60 * 1000;
    const HEADLINE_SPEED_PX_PER_SEC = 80;

    const track = document.getElementById("navbar-headline-track");
    if (!track) return;

    const FALLBACK_TEXT = "শেষ ২৪ ঘণ্টায় নতুন শিরোনাম নেই";

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function parseDateLikeValue(value) {
        if (typeof value === "number" && Number.isFinite(value)) return value;

        const text = String(value || "").trim();
        if (!text) return 0;

        if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
            const timestamp = new Date(`${text}T00:00:00`).getTime();
            return Number.isNaN(timestamp) ? 0 : timestamp;
        }

        const timestamp = new Date(text).getTime();
        return Number.isNaN(timestamp) ? 0 : timestamp;
    }

    function getNewsTimestamp(item) {
        if (!item || typeof item !== "object") return 0;

        const candidates = [item.createdAt, item.updatedAt, item.publishedAt, item.date];
        for (const value of candidates) {
            const timestamp = parseDateLikeValue(value);
            if (timestamp > 0) return timestamp;
        }

        return 0;
    }

    function buildDetailHref(item) {
        if (!item || item.id === undefined || item.id === null || item.id === "") {
            return "news.html";
        }

        return `detail.html?id=${encodeURIComponent(item.id)}`;
    }

    function buildHeadlineLinks(items, options = {}) {
        const hidden = options.hidden === true;

        return items.map(item => {
            const title = String(item.title || "").trim();
            const safeTitle = escapeHtml(title);
            const href = buildDetailHref(item);
            const hiddenAttrs = hidden ? ' aria-hidden="true" tabindex="-1"' : "";
            const separatorAttrs = hidden ? ' aria-hidden="true"' : "";

            return [
                `<a class="navbar-headline-item" href="${href}" title="${safeTitle}"${hiddenAttrs}>${safeTitle}</a>`,
                `<span class="navbar-headline-separator"${separatorAttrs}>•</span>`
            ].join("");
        }).join("");
    }

    function renderStaticMessage(text) {
        const safeText = escapeHtml(text || FALLBACK_TEXT);
        track.classList.add("is-static");
        track.style.setProperty("--headline-scroll-distance", "0px");
        track.innerHTML = `<a class="navbar-headline-link" href="news.html">${safeText}</a>`;
    }

    function applyAnimationMetrics() {
        if (track.classList.contains("is-static")) return;

        requestAnimationFrame(() => {
            const distance = Math.max(1, Math.round(track.scrollWidth / 2));
            const duration = Math.max(18, Math.round(distance / HEADLINE_SPEED_PX_PER_SEC));

            track.style.setProperty("--headline-scroll-distance", `${distance}px`);
            track.style.setProperty("--headline-duration", `${duration}s`);
        });
    }

    function renderHeadlines(items) {
        if (!items.length) {
            renderStaticMessage(FALLBACK_TEXT);
            return;
        }

        if (items.length === 1) {
            const single = items[0];
            const safeTitle = escapeHtml(String(single.title || ""));
            track.classList.add("is-static");
            track.style.setProperty("--headline-scroll-distance", "0px");
            track.innerHTML = `<a class="navbar-headline-link" href="${buildDetailHref(single)}" title="${safeTitle}">${safeTitle}</a>`;
            return;
        }

        const firstPass = buildHeadlineLinks(items, { hidden: false });
        const secondPass = buildHeadlineLinks(items, { hidden: true });

        track.classList.remove("is-static");
        track.innerHTML = firstPass + secondPass;
        applyAnimationMetrics();
    }

    async function loadFromApi() {
        try {
            const response = await fetch(API_NEWS_ENDPOINT, { cache: "no-store" });
            if (!response.ok) return null;

            const data = await response.json();
            return Array.isArray(data) ? data : null;
        } catch (error) {
            return null;
        }
    }

    async function loadFromJson() {
        if (window.NewsSource && typeof window.NewsSource.loadNewsFromGitHub === "function") {
            return window.NewsSource.loadNewsFromGitHub();
        }

        const rawNewsUrl = (window.NewsSource && window.NewsSource.rawUrl)
            || window.GITHUB_RAW_NEWS_URL
            || "https://raw.githubusercontent.com/Nuruzzaman-Nuru/mijannur-swebsite/main/db.json";
        const sources = [rawNewsUrl, "db.json", "news.json"].filter(Boolean);

        for (const source of sources) {
            try {
                const separator = source.includes("?") ? "&" : "?";
                const response = await fetch(`${source}${separator}v=${Date.now()}`, { cache: "no-store" });
                if (!response.ok) continue;

                const data = await response.json();
                const news = Array.isArray(data) ? data : data.news;
                if (Array.isArray(news)) return news;
            } catch (error) {
                // Try the next source.
            }
        }

        return [];
    }

    function getRecentHeadlines(sourceNews) {
        return (sourceNews || [])
            .filter(item => item && typeof item === "object")
            .filter(item => String(item.title || "").trim())
            .sort((a, b) => getNewsTimestamp(b) - getNewsTimestamp(a))
            .slice(0, 20);
    }

    async function refreshTicker() {
        const apiNews = await loadFromApi();
        const sourceNews = Array.isArray(apiNews) ? apiNews : await loadFromJson();
        const recent = getRecentHeadlines(sourceNews);
        renderHeadlines(recent);
    }

    let resizeTimer = null;
    window.addEventListener("resize", () => {
        if (resizeTimer) {
            clearTimeout(resizeTimer);
        }

        resizeTimer = setTimeout(() => {
            applyAnimationMetrics();
        }, 120);
    });

    refreshTicker();
    setInterval(refreshTicker, REFRESH_INTERVAL_MS);
})();
