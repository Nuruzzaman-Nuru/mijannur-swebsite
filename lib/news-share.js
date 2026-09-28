"use strict";

const DEFAULT_PUBLIC_SITE_URL = "https://mijannur-swebsite.vercel.app";

function getPublicSiteUrl() {
    return String(process.env.PUBLIC_SITE_URL || DEFAULT_PUBLIC_SITE_URL)
        .trim()
        .replace(/\/+$/, "");
}

function getNewsShareUrl(newsId, publicSiteUrl = getPublicSiteUrl()) {
    return `${publicSiteUrl}/api/news-share?id=${encodeURIComponent(String(newsId || ""))}`;
}

function getNewsImageUrl(news, publicSiteUrl = getPublicSiteUrl()) {
    const image = String(news && news.image || "").trim();
    if (!image || image.startsWith("data:image/")) {
        return image
            ? `${publicSiteUrl}/api/news-image?id=${encodeURIComponent(String(news.id || ""))}`
            : `${publicSiteUrl}/images/logo.png`;
    }

    try {
        const imageUrl = new URL(image, `${publicSiteUrl}/`);
        if (imageUrl.protocol === "http:" || imageUrl.protocol === "https:") {
            return imageUrl.href;
        }
    } catch (error) {
        return `${publicSiteUrl}/images/logo.png`;
    }

    return `${publicSiteUrl}/images/logo.png`;
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
    const shareUrl = getNewsShareUrl(news.id, publicSiteUrl);
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
<meta property="og:image:alt" content="${title}">
<meta property="og:url" content="${escapedShareUrl}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="${escapedImageUrl}">
<meta http-equiv="refresh" content="0;url=${escapedDetailUrl}">
</head>
<body>
<p>খবরটি খুলছে... <a href="${escapedDetailUrl}">এখানে চাপ দিন</a></p>
<script>window.location.replace(${JSON.stringify(detailUrl)});</script>
</body>
</html>`;
}

module.exports = {
    createNewsShareHtml,
    getNewsImageUrl,
    getNewsShareUrl,
    getPublicSiteUrl,
    parseImageDataUrl
};
