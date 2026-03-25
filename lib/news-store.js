"use strict";

const fs = require("fs/promises");
const path = require("path");

const OFFLINE_PLACEHOLDER_IMAGE = "https://via.placeholder.com/300x200?text=No+Image";
const LOCAL_DB_PATH = path.join(process.cwd(), "db.json");

function normalizeDatabaseShape(raw) {
    if (Array.isArray(raw)) return { news: raw };
    if (!raw || typeof raw !== "object") return { news: [] };
    if (!Array.isArray(raw.news)) return { ...raw, news: [] };
    return raw;
}

function parseJsonSafe(text, fallback) {
    try {
        return JSON.parse(text);
    } catch (error) {
        return fallback;
    }
}

function getGitHubConfig() {
    const owner = String(process.env.GITHUB_OWNER || "").trim();
    const repo = String(process.env.GITHUB_REPO || "").trim();
    const token = String(process.env.GITHUB_TOKEN || "").trim();
    const branch = String(process.env.GITHUB_BRANCH || "main").trim() || "main";
    const filePath = String(process.env.GITHUB_NEWS_FILE || "db.json").trim() || "db.json";

    const enabled = Boolean(owner && repo && token);
    return { enabled, owner, repo, token, branch, filePath };
}

function encodeGitHubPath(filePath) {
    return filePath
        .split("/")
        .map(part => encodeURIComponent(part))
        .join("/");
}

function normalizeNewsItem(input, existing = {}) {
    const nowDate = new Date().toISOString().split("T")[0];
    const merged = { ...existing, ...input };

    return {
        id: merged.id || existing.id || `admin_${Date.now()}`,
        title: String(merged.title || "").trim(),
        description: String(merged.description || "").trim(),
        category: String(merged.category || "").trim(),
        image: String(merged.image || OFFLINE_PLACEHOLDER_IMAGE).trim(),
        date: String(merged.date || existing.date || nowDate).trim(),
        author: String(merged.author || existing.author || "M TV").trim(),
        postedBy: String(merged.postedBy || existing.postedBy || "adminmijanur").trim()
    };
}

async function readLocalStore() {
    try {
        const raw = await fs.readFile(LOCAL_DB_PATH, "utf8");
        const parsed = parseJsonSafe(raw, { news: [] });
        const db = normalizeDatabaseShape(parsed);
        return { db, meta: { provider: "local" } };
    } catch (error) {
        return { db: { news: [] }, meta: { provider: "local" } };
    }
}

async function writeLocalStore(db) {
    const payload = JSON.stringify(normalizeDatabaseShape(db), null, 2);
    await fs.writeFile(LOCAL_DB_PATH, payload, "utf8");
}

async function readGitHubStore(config) {
    const filePath = encodeGitHubPath(config.filePath);
    const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${filePath}?ref=${encodeURIComponent(config.branch)}`;

    const response = await fetch(url, {
        headers: {
            "Accept": "application/vnd.github+json",
            "Authorization": `Bearer ${config.token}`,
            "User-Agent": "mijan-news-api"
        }
    });

    if (!response.ok) {
        const details = await response.text();
        throw new Error(`github_read_failed:${response.status}:${details}`);
    }

    const payload = await response.json();
    const decoded = Buffer.from(payload.content || "", "base64").toString("utf8");
    const parsed = parseJsonSafe(decoded, { news: [] });
    const db = normalizeDatabaseShape(parsed);

    return { db, meta: { provider: "github", sha: payload.sha, config } };
}

async function writeGitHubStore(db, meta, commitMessage) {
    const filePath = encodeGitHubPath(meta.config.filePath);
    const url = `https://api.github.com/repos/${meta.config.owner}/${meta.config.repo}/contents/${filePath}`;

    const content = Buffer.from(JSON.stringify(normalizeDatabaseShape(db), null, 2), "utf8").toString("base64");

    const response = await fetch(url, {
        method: "PUT",
        headers: {
            "Accept": "application/vnd.github+json",
            "Authorization": `Bearer ${meta.config.token}`,
            "Content-Type": "application/json",
            "User-Agent": "mijan-news-api"
        },
        body: JSON.stringify({
            message: commitMessage || "Update news data",
            content,
            sha: meta.sha,
            branch: meta.config.branch
        })
    });

    if (!response.ok) {
        const details = await response.text();
        throw new Error(`github_write_failed:${response.status}:${details}`);
    }

    const payload = await response.json();
    const nextSha = payload && payload.content && payload.content.sha ? payload.content.sha : meta.sha;
    return { ...meta, sha: nextSha };
}

async function loadNewsStore() {
    const gitHubConfig = getGitHubConfig();
    if (gitHubConfig.enabled) {
        return readGitHubStore(gitHubConfig);
    }

    return readLocalStore();
}

async function saveNewsStore(db, meta, commitMessage) {
    if (meta && meta.provider === "github") {
        const nextMeta = await writeGitHubStore(db, meta, commitMessage);
        return { db: normalizeDatabaseShape(db), meta: nextMeta };
    }

    await writeLocalStore(db);
    return { db: normalizeDatabaseShape(db), meta: { provider: "local" } };
}

module.exports = {
    OFFLINE_PLACEHOLDER_IMAGE,
    normalizeNewsItem,
    normalizeDatabaseShape,
    loadNewsStore,
    saveNewsStore
};

