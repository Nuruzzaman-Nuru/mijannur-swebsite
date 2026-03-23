// Global variables
let allNews = [];
let userNews = [];
let currentCategory = null;

// Load news from JSON file and localStorage
async function loadNews() {
    try {
        // Load news from JSON file
        const response = await fetch('news.json');
        const data = await response.json();
        allNews = data.news;
        
        // Load user-posted news from localStorage
        const savedUserNews = localStorage.getItem('userNews');
        userNews = savedUserNews ? JSON.parse(savedUserNews) : [];
        
        // Combine both - user news first (newest)
        const combinedNews = [...userNews, ...allNews];
        
        // Display featured news
        displayFeaturedNews(combinedNews);
        
        // Display all news
        displayAllNews(combinedNews);
        
        // Display popular news in sidebar
        displayPopularNews(combinedNews);
    } catch (error) {
        console.error('Error loading news:', error);
        document.getElementById('news-container').innerHTML = 
            '<p>খবর লোড করতে সমস্যা হয়েছে। অনুগ্রহ করে পরে চেষ্টা করুন।</p>';
    }
}

// Display featured news (first item)
function displayFeaturedNews(newsArray) {
    const featuredContainer = document.getElementById('featured-news');
    if (!featuredContainer || newsArray.length === 0) return;

    const featured = newsArray[0];
    const imageUrl = featured.image || 'https://via.placeholder.com/800x400?text=Featured+News';
    const bengaliDate = new Date(featured.date).toLocaleDateString('bn-BD', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

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

    const categoryName = categoryMap[featured.category] || featured.category;

    featuredContainer.innerHTML = `
        <div class="featured-news-item">
            <img src="${imageUrl}" alt="${featured.title}" class="featured-image">
            <div class="featured-content">
                <span class="featured-category">${categoryName}</span>
                <h2>${featured.title}</h2>
                <p>${featured.description}</p>
                <div class="featured-meta">
                    <span class="featured-date">📅 ${bengaliDate}</span>
                    ${featured.author ? `<span class="featured-author">✍️ ${featured.author}</span>` : ''}
                </div>
            </div>
        </div>
    `;
}

// Display all news in grid
function displayAllNews(newsArray) {
    const newsContainer = document.getElementById('news-container');
    if (!newsContainer) return;

    if (newsArray.length === 0) {
        newsContainer.innerHTML = '<p>কোনো খবর পাওয়া যায়নি।</p>';
        return;
    }

    newsContainer.innerHTML = '';

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

    newsArray.forEach(item => {
        const newsCard = document.createElement('div');
        newsCard.className = 'news-card';
        
        const imageUrl = item.image || 'https://via.placeholder.com/300x200?text=No+Image';
        const bengaliDate = new Date(item.date).toLocaleDateString('bn-BD', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const categoryName = categoryMap[item.category] || item.category;
        
        newsCard.innerHTML = `
            <img src="${imageUrl}" alt="${item.title}" class="news-image">
            <div class="news-content">
                <span class="news-category">${categoryName}</span>
                <h3 class="news-title">${item.title}</h3>
                <p class="news-description">${item.description.substring(0, 100)}...</p>
                <p class="news-date">📅 ${bengaliDate}</p>
                ${item.author ? `<p class="news-author"><strong>লেখক:</strong> ${item.author}</p>` : ''}
            </div>
        `;
        
        newsContainer.appendChild(newsCard);
    });
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

    // Get top 5 news
    const topNews = newsArray.slice(0, 5);

    popularContainer.innerHTML = topNews.map((item, index) => {
        const categoryName = categoryMap[item.category] || item.category;
        return `
            <div class="popular-item">
                <span class="popular-number">${index + 1}</span>
                <div class="popular-content">
                    <p class="popular-title">${item.title.substring(0, 40)}...</p>
                    <p class="popular-category">${categoryName}</p>
                </div>
            </div>
        `;
    }).join('');
}

// Filter news by category
function loadNewsByCategory(category) {
    currentCategory = category;
    
    // Find bengali category name
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

    const bengaliCategoryName = categoryMap[category] || category;
    
    // Combine all news and filter
    const combinedNews = [...userNews, ...allNews];
    const filteredNews = combinedNews.filter(news => news.category === category);

    // Update heading
    const newsSection = document.querySelector('.news-section h2');
    if (newsSection) {
        newsSection.textContent = bengaliCategoryName + ' সংক্রান্ত খবর';
    }

    // Display filtered news
    displayAllNews(filteredNews);
}

// Search functionality
function searchNews(query) {
    if (!query.trim()) {
        const combinedNews = [...userNews, ...allNews];
        displayAllNews(combinedNews);
        return;
    }

    const combinedNews = [...userNews, ...allNews];
    const searchResults = combinedNews.filter(news => 
        news.title.toLowerCase().includes(query.toLowerCase()) ||
        news.description.toLowerCase().includes(query.toLowerCase())
    );

    // Update heading
    const newsSection = document.querySelector('.news-section h2');
    if (newsSection) {
        newsSection.textContent = `"${query}" এর সার্চ ফলাফল (${searchResults.length})`;
    }

    displayAllNews(searchResults);
}

// Display current date on page load
function displayDate() {
    const dateElements = document.querySelectorAll('#current-date');
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const today = new Date();
    
    // Bengali date format
    const dateStr = today.toLocaleDateString('bn-BD', options);
    
    dateElements.forEach(element => {
        element.textContent = '📅 ' + dateStr;
    });
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    loadNews();
    displayDate();

    // Search button click
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
