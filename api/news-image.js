"use strict";

const { normalizeDatabaseShape, loadNewsStore } = require("../lib/news-store");
const { getPublicSiteUrl, parseImageDataUrl } = require("../lib/news-share");

function redirectToLogo(res) {
    res.status(302).setHeader("Location", `${getPublicSiteUrl()}/images/logo.png`);
    res.end();
}

module.exports = async (req, res) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
        res.setHeader("Allow", "GET, HEAD");
        res.status(405).end();
        return;
    }

    const id = String(req.query && req.query.id || "").trim();
    if (!id) {
        res.status(400).end("News id is required");
        return;
    }

    try {
        const { db } = await loadNewsStore();
        const news = normalizeDatabaseShape(db).news.find(item => String(item.id) === id);
        if (!news) {
            res.status(404).end("News not found");
            return;
        }

        const image = String(news.image || "").trim();
        const imageData = parseImageDataUrl(image);
        if (imageData && imageData.buffer.length > 0) {
            res.setHeader("Content-Type", imageData.contentType);
            res.setHeader("Content-Length", imageData.buffer.length);
            res.setHeader("Cache-Control", "public, max-age=300");
            res.setHeader("X-Content-Type-Options", "nosniff");
            res.status(200).end(req.method === "HEAD" ? undefined : imageData.buffer);
            return;
        }

        if (image) {
            try {
                const imageUrl = new URL(image);
                if (imageUrl.protocol === "http:" || imageUrl.protocol === "https:") {
                    res.status(302).setHeader("Location", imageUrl.href);
                    res.end();
                    return;
                }
            } catch (error) {
                // Use the site logo when the saved image URL is invalid.
            }
        }

        redirectToLogo(res);
    } catch (error) {
        res.status(500).end("Could not load news image");
    }
};
