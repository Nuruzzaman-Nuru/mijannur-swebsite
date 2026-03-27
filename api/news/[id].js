"use strict";

const {
    NEWS_TTL_HOURS,
    normalizeNewsItem,
    pruneExpiredNews,
    normalizeDatabaseShape,
    loadNewsStore,
    saveNewsStore
} = require("../../lib/news-store");

function setCommonHeaders(res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,PUT,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Cache-Control", "no-store");
}

function getRequestBody(req) {
    if (!req || typeof req.body === "undefined" || req.body === null) return {};
    if (typeof req.body === "string") {
        try {
            return JSON.parse(req.body);
        } catch (error) {
            return {};
        }
    }
    return req.body;
}

function getNewsId(req) {
    if (req && req.query && typeof req.query.id !== "undefined") {
        return String(req.query.id);
    }
    return "";
}

module.exports = async (req, res) => {
    setCommonHeaders(res);

    if (req.method === "OPTIONS") {
        res.status(200).end();
        return;
    }

    const id = getNewsId(req);
    if (!id) {
        res.status(400).json({ error: "News id is required" });
        return;
    }

    try {
        const { db, meta } = await loadNewsStore();
        const normalizedDb = normalizeDatabaseShape(db);
        const pruned = pruneExpiredNews(normalizedDb);
        const workingDb = pruned.db;

        if (req.method === "GET" && pruned.changed) {
            const commitMessage = `Auto-remove expired news older than ${NEWS_TTL_HOURS}h`;
            await saveNewsStore(workingDb, meta, commitMessage);
        }

        const index = workingDb.news.findIndex(item => String(item.id) === id);

        if (req.method === "GET") {
            if (index === -1) {
                res.status(404).json({ error: "News not found" });
                return;
            }
            res.status(200).json(workingDb.news[index]);
            return;
        }

        if (req.method === "PUT") {
            if (index === -1) {
                res.status(404).json({ error: "News not found" });
                return;
            }

            const incoming = getRequestBody(req);
            const updated = normalizeNewsItem({ ...incoming, id }, workingDb.news[index]);

            if (!updated.title || !updated.description || !updated.category) {
                res.status(400).json({ error: "title, description, category are required" });
                return;
            }

            workingDb.news[index] = updated;
            await saveNewsStore(workingDb, meta, `Update news ${id}`);
            res.status(200).json(updated);
            return;
        }

        if (req.method === "DELETE") {
            if (index === -1) {
                res.status(404).json({ error: "News not found" });
                return;
            }

            const deleted = workingDb.news[index];
            workingDb.news.splice(index, 1);

            await saveNewsStore(workingDb, meta, `Delete news ${id}`);
            res.status(200).json({ success: true, deleted });
            return;
        }

        res.status(405).json({ error: "Method not allowed" });
    } catch (error) {
        res.status(500).json({
            error: "Failed to handle news by id request",
            details: error && error.message ? error.message : "unknown_error"
        });
    }
};
