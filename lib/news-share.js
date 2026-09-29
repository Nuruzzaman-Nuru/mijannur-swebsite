"use strict";

const DEFAULT_PUBLIC_SITE_URL = "https://mijannur-swebsite.vercel.app";

function getPublicSiteUrl() {
    return String(process.env.PUBLIC_SITE_URL || DEFAULT_PUBLIC_SITE_URL)
        .trim()
        .replace(/\/+$/, "");
}

function getNewsVersion(news) {
    return String(news && (news.updatedAt || news.createdAt || news.date) || "1");
}

function getNewsShareUrl(news, publicSiteUrl = getPublicSiteUrl()) {
    const url = new URL("/api/news-share", `${publicSiteUrl}/`);
    url.searchParams.set("id", String(news && news.id || ""));
    url.searchParams.set("v", getNewsVersion(news));
    return url.href;
}

function getNewsImageUrl(news, publicSiteUrl = getPublicSiteUrl()) {
    const url = new URL("/api/news-poster", `${publicSiteUrl}/`);
    url.searchParams.set("id", String(news && news.id || ""));
    url.searchParams.set("v", getNewsVersion(news));
    return url.href;
}

function parseImageDataUrl(image) {
    const match = String(image || "").match(/^data:(image\/(?:jpe?g|png|gif|webp));base64,([A-Za-z0-9+/=\s]+)$/i);
    if (!match) return null;

    const contentType = match[1].toLowerCase() === "image/jpg" ? "image/jpeg" : match[1].toLowerCase();
    return {
        contentType,
        buffer: Buffer.from(match[2], "base64")
    };
}

function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function createNewsShareHtml(news, publicSiteUrl = getPublicSiteUrl()) {
    const shareUrl = getNewsShareUrl(news, publicSiteUrl);
    const detailUrl = `${publicSiteUrl}/detail.html?id=${encodeURIComponent(String(news.id))}`;
    const imageUrl = getNewsImageUrl(news, publicSiteUrl);
    const title = escapeHtml(news.title || "M TV - সর্বশেষ খবর");
    const description = escapeHtml(String(news.description || "").trim().slice(0, 240));
    const escapedImageUrl = escapeHtml(imageUrl);
    const escapedShareUrl = escapeHtml(shareUrl);
    const escapedDetailUrl = escapeHtml(detailUrl);

    return `<!doctype html>
<html lang="bn">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} - M TV</title>
<meta name="description" content="${description}">
<meta property="og:type" content="article">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:image" content="${escapedImageUrl}">
<meta property="og:image:secure_url" content="${escapedImageUrl}">
<meta property="og:image:alt" content="${title}">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="${escapedShareUrl}">
<link rel="image_src" href="${escapedImageUrl}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="${escapedImageUrl}">
<meta name="twitter:image:alt" content="${title}">
</head>
<body>
<p>খবরটি খুলছে... <a href="${escapedDetailUrl}">এখানে চাপ দিন</a></p>
<script>window.location.replace(${JSON.stringify(detailUrl)});</script>
</body>
</html>`;
}

module.exports = {
    createNewsShareHtml,
    getNewsVersion,
    getNewsImageUrl,
    getNewsShareUrl,
    getPublicSiteUrl,
    parseImageDataUrl
};
