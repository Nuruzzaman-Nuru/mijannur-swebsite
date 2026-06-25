// Global variables
let allNews = [];
let userNews = [];
let currentCategory = null;
const FALLBACK_API_BASE_URL = 'https://mijannur-swebsite.vercel.app';

function getApiNewsEndpoint() {
    const configuredBase = String(window.NEWS_API_BASE_URL || '').replace(/\/+$/, '');
    if (configuredBase) return `${configuredBase}/api/news`;

    const hostname = window.location.hostname;
    const isStaticHost = window.location.protocol === 'file:' || hostname.endsWith('github.io');
    if (isStaticHost) return `${FALLBACK_API_BASE_URL}/api/news`;

    return '/api/news';
}

const API_NEWS_ENDPOINT = getApiNewsEndpoint();

function isAdminPostedNews(item) {
    if (!item || typeof item !== 'object') return false;

    const postedBy = (item.postedBy || '').toString().trim().toLowerCase();
    const id = (item.id || '').toString();
    const hasRequiredContent = Boolean(
        String(item.title || '').trim() &&
        String(item.description || '').trim()
    );

    if (!hasRequiredContent) return false;

    return (
        postedBy === 'admin' ||
        postedBy === 'adminmijanur' ||
        id.startsWith('admin_') ||
        postedBy === ''
    );
}

function getAdminOnlyNews(newsList) {
    return (newsList || []).filter(isAdminPostedNews);
}

function saveUserNewsSafe(newsList) {
    try {
        localStorage.setItem('userNews', JSON.stringify(newsList));
    } catch (error) {
        console.warn('Could not cache news in localStorage:', error);
    }
}

function getParsedUserNews() {
    try {
        const savedUserNews = localStorage.getItem('userNews');
        return savedUserNews ? JSON.parse(savedUserNews) : [];
    } catch (error) {
        return [];
    }
}

function parseDateLikeValue(value) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;

    const text = String(value || '').trim();
    if (!text) return 0;

    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
        const timestamp = new Date(`${text}T00:00:00`).getTime();
        return Number.isNaN(timestamp) ? 0 : timestamp;
    }

    const timestamp = new Date(text).getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getNewsTimestamp(item) {
    if (!item || typeof item !== 'object') return 0;

    const candidates = [item.updatedAt, item.createdAt, item.publishedAt, item.date];
    for (const value of candidates) {
        const timestamp = parseDateLikeValue(value);
        if (timestamp > 0) return timestamp;
    }

    return 0;
}

function dedupeAndSortNews(newsList) {
    const keyed = new Map();
    const withoutId = [];

    (newsList || []).forEach(item => {
        if (!item || typeof item !== 'object') return;

        const id = String(item.id || '').trim();
        if (!id) {
            withoutId.push(item);
            return;
        }

        if (!keyed.has(id)) {
            keyed.set(id, item);
            return;
        }

        const existing = keyed.get(id);
        if (getNewsTimestamp(item) > getNewsTimestamp(existing)) {
            keyed.set(id, item);
        }
    });

    const combined = [...keyed.values(), ...withoutId];
    combined.sort((a, b) => getNewsTimestamp(b) - getNewsTimestamp(a));
    return combined;
}

function getCombinedNews() {
    return dedupeAndSortNews(getAdminOnlyNews([...(userNews || []), ...(allNews || [])]));
}

async function loadNewsFromApi() {
    try {
        const response = await fetch(API_NEWS_ENDPOINT, { cache: 'no-store' });
        if (!response.ok) return null;

        const data = await response.json();
        return Array.isArray(data) ? data : null;
    } catch (error) {
        return null;
    }
}

async function loadNewsFromJsonFile() {
    if (window.NewsSource && typeof window.NewsSource.loadNewsFromGitHub === 'function') {
        return window.NewsSource.loadNewsFromGitHub();
    }

    const rawNewsUrl = (window.NewsSource && window.NewsSource.rawUrl)
        || window.GITHUB_RAW_NEWS_URL
        || 'https://raw.githubusercontent.com/Nuruzzaman-Nuru/mijannur-swebsite/main/db.json';
    const sources = [rawNewsUrl, 'db.json', 'news.json'].filter(Boolean);

    for (const source of sources) {
        try {
            const response = await fetch(`${source}${source.includes('?') ? '&' : '?'}v=${Date.now()}`, { cache: 'no-store' });
            if (!response.ok) continue;

            const data = await response.json();
            const news = Array.isArray(data) ? data : data.news;
            if (Array.isArray(news)) return news;
        } catch (error) {
            // Try the next source.
        }
    }

    return [];
}

// Load news from JSON and localStorage
async function loadNews() {
    try {
        const apiNews = await loadNewsFromApi();
        const localNews = getAdminOnlyNews(getParsedUserNews());

        if (Array.isArray(apiNews)) {
            allNews = getAdminOnlyNews(apiNews);
            userNews = localNews;
        } else {
            allNews = await loadNewsFromJsonFile();
            userNews = localNews;
        }
        
        const combinedNews = getCombinedNews();
        saveUserNewsSafe(combinedNews);

        if (typeof displayFeaturedBanner === 'function') {
            displayFeaturedBanner(combinedNews, 'featured-news');
        }

        if (typeof displayNewsAsBanners === 'function') {
            displayNewsAsBanners(combinedNews, 'news-container');
        }

        displayPopularNews(combinedNews);
    } catch (error) {
        console.error('Error:', error);
        const container = document.getElementById('news-container');
        if (container) container.innerHTML = '<p>খবর লোড করতে সমস্যা হয়েছে।</p>';
    }
}

// Display popular news in sidebar
function displayPopularNews(newsArray) {
    const popularContainer = document.getElementById('popular-news');
    if (!popularContainer) return;

    const categoryMap = {
        'national': 'জাতীয়',
        'international': 'আন্তর্জাতিক',
        'politics': 'রাজনীতি',
        'corporate': 'কর্পোরেট',
        'education': 'শিক্ষা',
        'health': 'স্বাস্থ্য',
        'sports': 'খেলা',
        'technology': 'প্রযুক্তি',
        'lifestyle': 'লাইফস্টাইল',
        'feature': 'ফিচার',
        'law': 'আইন',
        'religion': 'ধর্ম'
    };

    const topNews = newsArray.slice(0, 5);
    popularContainer.innerHTML = topNews.map((item, index) => {
        const categoryName = categoryMap[item.category] || item.category;
        return `
            <div class="popular-item" onclick="window.location.href='detail.html?id=${item.id}'">
                <span class="popular-number">${index + 1}</span>
                <div class="popular-content">
                    <p class="popular-title">${item.title.substring(0, 40)}...</p>
                    <p class="popular-category">${categoryName}</p>
                </div>
            </div>
        `;
    }).join('');
}

// Filter by category
function loadNewsByCategory(category) {
    currentCategory = category;
    
    const categoryMap = {
        'national': 'জাতীয়',
        'international': 'আন্তর্জাতিক',
        'politics': 'রাজনীতি',
        'corporate': 'কর্পোরেট',
        'education': 'শিক্ষা',
        'health': 'স্বাস্থ্য',
        'sports': 'খেলা',
        'technology': 'প্রযুক্তি',
        'lifestyle': 'লাইফস্টাইল',
        'feature': 'ফিচার',
        'law': 'আইন',
        'religion': 'ধর্ম'
    };

    const combinedNews = getCombinedNews();
    const filteredNews = combinedNews.filter(item => item.category === category);
    
    const newsSection = document.querySelector('.news-section h2');
    if (newsSection) newsSection.textContent = (categoryMap[category] || category) + ' সংক্রান্ত খবর';
    
    displayNewsAsBanners(filteredNews, 'news-container');
}

// Search news
function searchNews(query) {
    if (!query.trim()) {
        loadNews();
        return;
    }

    const combinedNews = getCombinedNews();
    const searchResults = combinedNews.filter(item => 
        item.title.toLowerCase().includes(query.toLowerCase()) || 
        item.description.toLowerCase().includes(query.toLowerCase())
    );
    
    const newsSection = document.querySelector('.news-section h2');
    if (newsSection) newsSection.textContent = `"${query}" এর সার্চ ফলাফল (${searchResults.length})`;
    
    displayNewsAsBanners(searchResults, 'news-container');
}

// Display current date
function displayDate() {
    const dateElements = document.querySelectorAll('#current-date');
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const today = new Date();
    const dateStr = today.toLocaleDateString('bn-BD', options);
    
    dateElements.forEach(element => {
        element.textContent = '📅 ' + dateStr;
    });
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    loadNews();
    displayDate();

    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('search-input');
    
    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            searchNews(searchInput.value);
        });
    }

    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchNews(searchInput.value);
            }
        });
    }
});
