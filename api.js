const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const {
    createNewsShareHtml,
    getNewsImageUrl,
    getNewsShareUrl,
    getPublicSiteUrl,
    parseImageDataUrl
} = require('./lib/news-share');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(express.static(path.join(__dirname)));

// Path to db.json
const dbPath = path.join(__dirname, 'db.json');

// Helper to read db.json
function readDatabase() {
    try {
        const data = fs.readFileSync(dbPath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return { news: [] };
    }
}

// Helper to write db.json
function writeDatabase(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

// GET all news
app.get('/api/news', (req, res) => {
    const db = readDatabase();
    res.json(db.news);
});

// GET single news by ID
app.get('/api/news/:id', (req, res) => {
    const db = readDatabase();
    const news = db.news.find(item => item.id == req.params.id);
    if (news) {
        res.json(news);
    } else {
        res.status(404).json({ error: 'News not found' });
    }
});

// POST new news
app.post('/api/news', (req, res) => {
    const db = readDatabase();
    const newNews = {
        id: req.body.id || `admin_${Date.now()}`,
        title: req.body.title,
        description: req.body.description,
        category: req.body.category,
        image: req.body.image,
        date: req.body.date || new Date().toISOString().split('T')[0],
        author: req.body.author,
        postedBy: req.body.postedBy || 'adminmijanur',
        isPublished: req.body.isPublished === true ? true : false,  // Default false (draft)
        createdAt: Date.now()  // Timestamp when created
    };
    
    db.news.unshift(newNews);
    writeDatabase(db);
    res.json(newNews);
});

// DELETE news
app.delete('/api/news/:id', (req, res) => {
    const db = readDatabase();
    const index = db.news.findIndex(item => item.id == req.params.id);
    
    if (index !== -1) {
        const deleted = db.news.splice(index, 1);
        writeDatabase(db);
        res.json({ success: true, deleted: deleted[0] });
    } else {
        res.status(404).json({ error: 'News not found' });
    }
});

// UPDATE news
app.put('/api/news/:id', (req, res) => {
    const db = readDatabase();
    const index = db.news.findIndex(item => item.id == req.params.id);
    
    if (index !== -1) {
        const updated = { 
            ...db.news[index], 
            ...req.body, 
            id: db.news[index].id,
            createdAt: db.news[index].createdAt  // Never change createdAt
        };
        db.news[index] = updated;
        writeDatabase(db);
        res.json(db.news[index]);
    } else {
        res.status(404).json({ error: 'News not found' });
    }
});

// PUBLISH news
app.patch('/api/news/:id/publish', (req, res) => {
    const db = readDatabase();
    const index = db.news.findIndex(item => item.id == req.params.id);
    
    if (index !== -1) {
        db.news[index].isPublished = true;
        writeDatabase(db);
        res.json({ success: true, message: 'News published', news: db.news[index] });
    } else {
        res.status(404).json({ error: 'News not found' });
    }
});

app.get('/api/news-share', (req, res) => {
    const id = String(req.query.id || '').trim();
    if (!id) return res.status(400).send('News id is required');

    const db = readDatabase();
    const news = (Array.isArray(db) ? db : db.news || []).find(item => String(item.id) === id);
    if (!news) return res.status(404).send('News not found');

    res.set('Cache-Control', 'no-store, max-age=0');
    res.type('html').send(createNewsShareHtml(news, getPublicSiteUrl()));
});

app.get('/api/news-image', (req, res) => {
    const id = String(req.query.id || '').trim();
    if (!id) return res.status(400).send('News id is required');

    const db = readDatabase();
    const news = (Array.isArray(db) ? db : db.news || []).find(item => String(item.id) === id);
    if (!news) return res.status(404).send('News not found');

    const imageData = parseImageDataUrl(news.image);
    if (imageData && imageData.buffer.length > 0) {
        res.set({
            'Cache-Control': 'public, max-age=300',
            'X-Content-Type-Options': 'nosniff'
        });
        return res.type(imageData.contentType).send(imageData.buffer);
    }

    const imageUrl = getNewsImageUrl(news, getPublicSiteUrl());
    return res.redirect(302, imageUrl);
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
