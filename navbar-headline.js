(() => {
    const headlineText = document.getElementById("navbar-headline-text");
    const headlineLink = document.getElementById("navbar-headline-link");
    const API_NEWS_ENDPOINT = "/api/news";

    if (!headlineText || !headlineLink) return;

    const FALLBACK_TEXT = "সর্বশেষ খবর জানতে সব খবর পাতায় যান";

    function isValidItem(item) {
        return item && typeof item === "object" && String(item.title || "").trim();
    }

    function toDateValue(item) {
        const dateValue = new Date(item?.date || "").getTime();
        return Number.isNaN(dateValue) ? 0 : dateValue;
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
        try {
            const response = await fetch("news.json", { cache: "no-store" });
            if (!response.ok) return [];

            const data = await response.json();
            return Array.isArray(data?.news) ? data.news : [];
        } catch (error) {
            return [];
        }
    }

    async function loadLatestHeadline() {
        const apiNews = await loadFromApi();
        const sourceNews = Array.isArray(apiNews) ? apiNews : await loadFromJson();

        const latest = sourceNews
            .filter(isValidItem)
            .sort((a, b) => toDateValue(b) - toDateValue(a))[0];

        if (!latest) {
            headlineText.textContent = FALLBACK_TEXT;
            headlineLink.href = "news.html";
            return;
        }

        headlineText.textContent = latest.title;
        headlineLink.setAttribute("title", latest.title);

        if (latest.id === undefined || latest.id === null || latest.id === "") {
            headlineLink.href = "news.html";
            return;
        }

        headlineLink.href = `detail.html?id=${encodeURIComponent(latest.id)}`;
    }

    loadLatestHeadline();
})();
