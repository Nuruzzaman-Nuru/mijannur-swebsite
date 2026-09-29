"use strict";

const fs = require("fs/promises");
const path = require("path");
const sharp = require("sharp");
const { parseImageDataUrl } = require("./news-share");

const POSTER_WIDTH = 1200;
const POSTER_HEIGHT = 630;
const PHOTO_HEIGHT = 390;
const FRAME_SIZE = 8;
const LOGO_SIZE = 80;
const MAX_REMOTE_IMAGE_BYTES = 8 * 1024 * 1024;
const RED = "#a60000";
const CAPTION_RED = "#c80000";
const POSTER_FONT_PATH = path.join(
    __dirname,
    "../node_modules/@fontsource/noto-sans-bengali/files/noto-sans-bengali-bengali-700-normal.woff"
);

const CATEGORY_NAMES = {
    national: "জাতীয়",
    international: "আন্তর্জাতিক",
    politics: "রাজনীতি",
    corporate: "কর্পোরেট",
    education: "শিক্ষা",
    health: "স্বাস্থ্য",
    sports: "খেলা",
    technology: "প্রযুক্তি",
    lifestyle: "লাইফস্টাইল",
    feature: "ফিচার",
    law: "আইন",
    religion: "ধর্ম"
};

function escapeXml(value) {
    return String(value || "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;"
    })[character]);
}

function getGraphemes(value) {
    if (typeof Intl.Segmenter === "function") {
        return Array.from(new Intl.Segmenter("bn", { granularity: "grapheme" }).segment(value), item => item.segment);
    }
    return Array.from(value);
}

function wrapHeadline(title, maxCharacters = 48, maxLines = 3) {
    const words = String(title || "M TV - সর্বশেষ খবর").trim().split(/\s+/).filter(Boolean);
    const lines = [];
    let currentLine = "";
    let truncated = false;

    for (const word of words) {
        const nextLine = currentLine ? `${currentLine} ${word}` : word;
        if (!currentLine || getGraphemes(nextLine).length <= maxCharacters) {
            currentLine = nextLine;
            continue;
        }

        lines.push(currentLine);
        currentLine = word;
        if (lines.length === maxLines - 1) {
            truncated = true;
            break;
        }
    }

    if (currentLine && lines.length < maxLines) lines.push(currentLine);

    if (truncated && lines.length) {
        const lastLine = getGraphemes(lines[lines.length - 1]);
        while (lastLine.length >= maxCharacters) lastLine.pop();
        lines[lines.length - 1] = `${lastLine.join("").trimEnd()}…`;
    }

    return lines.length ? lines : ["M TV - সর্বশেষ খবর"];
}

async function loadNewsPhoto(news) {
    const image = String(news && news.image || "").trim();
    const embeddedImage = parseImageDataUrl(image);
    if (embeddedImage && embeddedImage.buffer.length <= MAX_REMOTE_IMAGE_BYTES) {
        return embeddedImage.buffer;
    }

    if (!image || image.startsWith("data:")) return null;

    try {
        const imageUrl = new URL(image);
        if (imageUrl.protocol !== "https:" || imageUrl.hostname === "localhost") return null;

        const response = await fetch(imageUrl, {
            redirect: "error",
            signal: AbortSignal.timeout(8000)
        });
        if (!response.ok || !String(response.headers.get("content-type") || "").startsWith("image/")) return null;

        const contentLength = Number(response.headers.get("content-length") || 0);
        if (contentLength > MAX_REMOTE_IMAGE_BYTES) return null;

        const buffer = Buffer.from(await response.arrayBuffer());
        return buffer.length <= MAX_REMOTE_IMAGE_BYTES ? buffer : null;
    } catch (error) {
        return null;
    }
}

function getDateAndAuthor(news) {
    const date = new Date(news.date);
    const formattedDate = Number.isNaN(date.getTime())
        ? String(news.date || "")
        : date.toLocaleDateString("bn-BD", { day: "2-digit", month: "long", year: "numeric" });
    const category = CATEGORY_NAMES[news.category] || String(news.category || "");
    const author = String(news.author || "M TV").trim();
    return [category, formattedDate, author].filter(Boolean).join("  |  ");
}

async function createCaptionSvg(news) {
    const captionHeight = POSTER_HEIGHT - PHOTO_HEIGHT;
    const lines = wrapHeadline(news.title);
    const titleStartY = 64;
    const titleLineHeight = 48;
    const titleSvg = lines.map((line, index) => (
        `<text x="600" y="${titleStartY + index * titleLineHeight}" text-anchor="middle">${escapeXml(line)}</text>`
    )).join("");
    const metaY = Math.min(captionHeight - 20, titleStartY + lines.length * titleLineHeight + 22);
    const meta = escapeXml(getDateAndAuthor(news));
    const font = (await fs.readFile(POSTER_FONT_PATH)).toString("base64");

    return Buffer.from(`<svg width="${POSTER_WIDTH}" height="${captionHeight}" xmlns="http://www.w3.org/2000/svg">
<defs><style>@font-face { font-family: PosterBengali; src: url(data:font/woff;base64,${font}) format("woff"); }</style></defs>
<rect width="100%" height="100%" fill="${CAPTION_RED}"/>
<g fill="#fff" font-family="PosterBengali, sans-serif" font-weight="700" font-size="43">${titleSvg}</g>
<text x="${POSTER_WIDTH - FRAME_SIZE - 8}" y="${metaY}" text-anchor="end" fill="#ffe5e5" font-family="PosterBengali, sans-serif" font-size="20">${meta}</text>
</svg>`);
}

async function createLogoTile(logoBuffer) {
    const logoInset = 7;
    const innerSize = LOGO_SIZE - logoInset * 2;
    const resizedLogo = await sharp(logoBuffer)
        .resize(innerSize, innerSize, { fit: "contain", background: "#ffffff" })
        .png()
        .toBuffer();

    const borderSvg = Buffer.from(`<svg width="${LOGO_SIZE}" height="${LOGO_SIZE}" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="1" width="${LOGO_SIZE - 2}" height="${LOGO_SIZE - 2}" rx="8" fill="none" stroke="#ffffff" stroke-width="3"/></svg>`);

    return sharp({
        create: {
            width: LOGO_SIZE,
            height: LOGO_SIZE,
            channels: 4,
            background: { r: 255, g: 255, b: 255, alpha: 1 }
        }
    })
        .composite([
            { input: resizedLogo, left: logoInset, top: logoInset },
            { input: borderSvg, left: 0, top: 0 }
        ])
        .png()
        .toBuffer();
}

async function createNewsPoster(news, options = {}) {
    const logoPath = options.logoPath || path.join(__dirname, "../images/logo.png");
    const logoBuffer = options.logoBuffer || await fs.readFile(logoPath);
    const photoBuffer = await loadNewsPhoto(news) || logoBuffer;
    const photoWidth = POSTER_WIDTH - FRAME_SIZE * 2;
    const photoHeight = PHOTO_HEIGHT - FRAME_SIZE * 2;

    const [photo, logoTile, caption] = await Promise.all([
        sharp(photoBuffer)
            .rotate()
            .resize(photoWidth, photoHeight, {
                fit: "contain",
                background: RED
            })
            .jpeg({ quality: 88 })
            .toBuffer(),
        createLogoTile(logoBuffer),
        createCaptionSvg(news)
    ]);

    return sharp({
        create: {
            width: POSTER_WIDTH,
            height: POSTER_HEIGHT,
            channels: 3,
            background: RED
        }
    })
        .composite([
            { input: photo, left: FRAME_SIZE, top: FRAME_SIZE },
            { input: caption, left: 0, top: PHOTO_HEIGHT },
            { input: logoTile, left: Math.round((POSTER_WIDTH - LOGO_SIZE) / 2), top: PHOTO_HEIGHT - Math.round(LOGO_SIZE / 2) }
        ])
        .jpeg({ quality: 88, progressive: true })
        .toBuffer();
}

module.exports = { createNewsPoster, wrapHeadline };