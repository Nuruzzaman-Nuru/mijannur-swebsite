"use strict";

const { normalizeDatabaseShape, loadNewsStore } = require("../lib/news-store");
const { createNewsShareHtml, getPublicSiteUrl } = require("../lib/news-share");

module.exports = async (req, res) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
        res.setHeader("Allow", "GET, HEAD");
        res.status(405).end();
        return;
    }

    const id = String(req.query && req.query.id || "").trim();
    if (!id) {
        res.status(400).send("News id is required");
        return;
    }

    try {
        const { db } = await loadNewsStore();
        const news = normalizeDatabaseShape(db).news.find(item => String(item.id) === id);
        if (!news) {
            res.status(404).send("News not found");
            return;
        }

        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.setHeader("Cache-Control", "no-store, max-age=0");
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.status(200).send(req.method === "HEAD" ? "" : createNewsShareHtml(news, getPublicSiteUrl()));
    } catch (error) {
        res.status(500).send("Could not load news preview");
    }
};
