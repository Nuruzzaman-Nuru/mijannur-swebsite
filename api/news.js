"use strict";

const {
    normalizeNewsItem,
    normalizeDatabaseShape,
    loadNewsStore,
    saveNewsStore
} = require("../lib/news-store");

function setCommonHeaders(res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
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

module.exports = async (req, res) => {
    setCommonHeaders(res);

    if (req.method === "OPTIONS") {
        res.status(200).end();
        return;
    }

    try {
        if (req.method === "GET") {
            const { db } = await loadNewsStore();
            const normalized = normalizeDatabaseShape(db);
            res.status(200).json(normalized.news);
            return;
        }

        if (req.method === "POST") {
            const incoming = getRequestBody(req);
            const normalizedItem = normalizeNewsItem(incoming);

            if (!normalizedItem.title || !normalizedItem.description || !normalizedItem.category) {
                res.status(400).json({ error: "title, description, category are required" });
                return;
            }

            const { db, meta } = await loadNewsStore();
            const normalizedDb = normalizeDatabaseShape(db);
            normalizedDb.news = [normalizedItem, ...normalizedDb.news];

            await saveNewsStore(normalizedDb, meta, `Create news ${normalizedItem.id}`);
            res.status(201).json(normalizedItem);
            return;
        }

        res.status(405).json({ error: "Method not allowed" });
    } catch (error) {
        res.status(500).json({
            error: "Failed to handle news request",
            details: error && error.message ? error.message : "unknown_error"
        });
    }
};
