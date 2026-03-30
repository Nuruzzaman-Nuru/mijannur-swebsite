const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

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

// Auto-delete unpublished news older than 24 hours
function cleanupOldUnpublishedNews() {
    const db = readDatabase();
    const now = Date.now();
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    
    const initialLength = db.news.length;
    
    // Keep only published news or unpublished news created within 24 hours
    db.news = db.news.filter(news => {
        const isPublished = news.isPublished === true;
        if (isPublished) return true; // Keep published forever
        
        const createdAt = news.createdAt ? parseInt(news.createdAt) : 0;
        const age = now - createdAt;
        const isRecent = age < TWENTY_FOUR_HOURS;
        
        return isRecent; // Keep if less than 24 hours old
    });
    
    if (db.news.length < initialLength) {
        writeDatabase(db);
        console.log(`Deleted ${initialLength - db.news.length} old unpublished news items`);
    }
}

// Schedule cleanup every hour
setInterval(cleanupOldUnpublishedNews, 60 * 60 * 1000);
// Run cleanup once on startup
cleanupOldUnpublishedNews();

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

// PUBLISH news (mark as published - prevents deletion)
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

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
