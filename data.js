// Supabase Configuration
// TODO: Replace with your Supabase project credentials
const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';

// For local testing, we'll use localStorage with JSON file simulation
// Replace this with actual Supabase calls when you set it up

class NewsDatabase {
    constructor() {
        this.useLocalStorage = true; // Change to false when you have Supabase setup
        this.localStorageKey = 'newsData';
    }

    // Get all news
    async getAllNews() {
        if (this.useLocalStorage) {
            let news = JSON.parse(localStorage.getItem(this.localStorageKey)) || [];
            return news;
        }
        // TODO: Implement Supabase fetch when ready
    }

    // Get single news by ID
    async getNews(id) {
        if (this.useLocalStorage) {
            const news = JSON.parse(localStorage.getItem(this.localStorageKey)) || [];
            return news.find(item => item.id == id);
        }
        // TODO: Implement Supabase fetch when ready
    }

    // Add new news
    async addNews(newsData) {
        if (this.useLocalStorage) {
            let news = JSON.parse(localStorage.getItem(this.localStorageKey)) || [];
            const newNews = {
                id: Date.now(),
                ...newsData,
                createdAt: new Date().toISOString()
            };
            news.unshift(newNews);
            localStorage.setItem(this.localStorageKey, JSON.stringify(news));
            return newNews;
        }
        // TODO: Implement Supabase insert when ready
    }

    // Delete news
    async deleteNews(id) {
        if (this.useLocalStorage) {
            let news = JSON.parse(localStorage.getItem(this.localStorageKey)) || [];
            const filtered = news.filter(item => item.id !== id);
            localStorage.setItem(this.localStorageKey, JSON.stringify(filtered));
            return true;
        }
        // TODO: Implement Supabase delete when ready
    }

    // Update news
    async updateNews(id, updates) {
        if (this.useLocalStorage) {
            let news = JSON.parse(localStorage.getItem(this.localStorageKey)) || [];
            const index = news.findIndex(item => item.id == id);
            if (index !== -1) {
                news[index] = { ...news[index], ...updates };
                localStorage.setItem(this.localStorageKey, JSON.stringify(news));
                return news[index];
            }
            return null;
        }
        // TODO: Implement Supabase update when ready
    }

    // Get news by category
    async getNewsByCategory(category) {
        const news = await this.getAllNews();
        return news.filter(item => item.category === category);
    }

    // Search news
    async searchNews(query) {
        const news = await this.getAllNews();
        return news.filter(item =>
            item.title.toLowerCase().includes(query.toLowerCase()) ||
            item.description.toLowerCase().includes(query.toLowerCase())
        );
    }
}

// Create global database instance
const db = new NewsDatabase();
