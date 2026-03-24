// Global variables
let allNews = [];
let userNews = [];
let currentCategory = null;

// Load news from JSON and localStorage
async function loadNews() {
    try {
        const response = await fetch('news.json');
        const data = await response.json();
        allNews = data.news || [];
        
        const savedUserNews = localStorage.getItem('userNews');
        userNews = savedUserNews ? JSON.parse(savedUserNews) : [];
        
        const combinedNews = [...userNews, ...allNews];
        
        displayFeaturedBanner(combinedNews, 'featured-news');
        displayNewsAsBanners(combinedNews, 'news-container');
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

    const combinedNews = [...userNews, ...allNews];
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

    const combinedNews = [...userNews, ...allNews];
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
