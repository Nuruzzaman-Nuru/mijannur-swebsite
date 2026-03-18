// Global variables
let allNews = [];
let currentCategory = null;

// Load news from JSON file
async function loadNews() {
    try {
        const response = await fetch('news.json');
        const data = await response.json();
        allNews = data.news;
        
        // Display featured news
        displayFeaturedNews();
        
        // Display all news
        displayAllNews(allNews);
        
        // Display popular news in sidebar
        displayPopularNews();
    } catch (error) {
        console.error('Error loading news:', error);
        document.getElementById('news-container').innerHTML = 
            '<p>খবর লোড করতে সমস্যা হয়েছে। অনুগ্রহ করে পরে চেষ্টা করুন।</p>';
    }
}

// Display featured news (first item)
function displayFeaturedNews() {
    const featuredContainer = document.getElementById('featured-news');
    if (!featuredContainer || allNews.length === 0) return;

    const featured = allNews[0];
    const imageUrl = featured.image || 'https://via.placeholder.com/800x400?text=Featured+News';
    const bengaliDate = new Date(featured.date).toLocaleDateString('bn-BD', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    featuredContainer.innerHTML = `
        <div class="featured-news-item">
            <img src="${imageUrl}" alt="${featured.title}" class="featured-image">
            <div class="featured-content">
                <span class="featured-category ${featured.categoryEn || 'technology'}">${featured.category}</span>
                <h2>${featured.title}</h2>
                <p>${featured.description}</p>
                <div class="featured-meta">
                    <span class="featured-date">📅 ${bengaliDate}</span>
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

    newsArray.forEach(item => {
        const newsCard = document.createElement('div');
        newsCard.className = 'news-card';
        
        const imageUrl = item.image || 'https://via.placeholder.com/300x200?text=No+Image';
        const bengaliDate = new Date(item.date).toLocaleDateString('bn-BD', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const categoryClass = item.categoryEn || 'technology';
        
        newsCard.innerHTML = `
            <img src="${imageUrl}" alt="${item.title}" class="news-image">
            <div class="news-content">
                <span class="news-category ${categoryClass}">${item.category}</span>
                <h3 class="news-title">${item.title}</h3>
                <p class="news-description">${item.description}</p>
                <p class="news-date">📅 ${bengaliDate}</p>
            </div>
        `;
        
        newsContainer.appendChild(newsCard);
    });
}

// Display popular news in sidebar
function displayPopularNews() {
    const popularContainer = document.getElementById('popular-news');
    if (!popularContainer) return;

    // Get top 5 news items as popular
    const topNews = allNews.slice(0, 5);
    popularContainer.innerHTML = '';

    topNews.forEach((item, index) => {
        const imageUrl = item.image || 'https://via.placeholder.com/80x80?text=News';
        const bengaliDate = new Date(item.date).toLocaleDateString('bn-BD', {
            day: 'numeric',
            month: 'short'
        });

        const popularItem = document.createElement('div');
        popularItem.className = 'popular-news-item';
        popularItem.innerHTML = `
            <img src="${imageUrl}" alt="${item.title}" class="popular-news-image">
            <div class="popular-news-text">
                <h4>${item.title}</h4>
                <p>${bengaliDate}</p>
            </div>
        `;
        popularContainer.appendChild(popularItem);
    });
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
    
    // Filter news
    const filteredNews = allNews.filter(news => 
        news.categoryEn && news.categoryEn.toLowerCase() === category.toLowerCase()
    );

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
        displayAllNews(allNews);
        return;
    }

    const searchResults = allNews.filter(news => 
        news.title.toLowerCase().includes(query.toLowerCase()) ||
        news.description.toLowerCase().includes(query.toLowerCase())
    );

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
