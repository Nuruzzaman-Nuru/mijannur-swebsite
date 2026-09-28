"use strict";

const path = require("path");
const { normalizeDatabaseShape, loadNewsStore } = require("../lib/news-store");
const { createNewsPoster } = require("../lib/news-poster");

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

        const poster = await createNewsPoster(news, {
            logoPath: path.join(process.cwd(), "images/logo.png")
        });
        res.setHeader("Content-Type", "image/jpeg");
        res.setHeader("Content-Length", poster.length);
        res.setHeader("Cache-Control", "public, max-age=300");
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.status(200).end(req.method === "HEAD" ? undefined : poster);
    } catch (error) {
        res.status(500).end("Could not create news poster");
    }
};