// Get news ID from URL
const urlParams = new URLSearchParams(window.location.search);
const newsId = urlParams.get('id');
const API_NEWS_ENDPOINT = '/api/news';

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
    const response = await fetch('news.json');
    const data = await response.json();
    return data.news || [];
}

// Load and display news detail
async function loadNewsDetail() {
    try {
        const apiNews = await loadNewsFromApi();
        const allNews = Array.isArray(apiNews) ? apiNews : await loadNewsFromJsonFile();
        
        // Load user news
        const parsedUserNews = JSON.parse(localStorage.getItem('userNews')) || [];
        const userNews = getAdminOnlyNews(parsedUserNews);

        if (userNews.length !== parsedUserNews.length) {
            saveUserNewsSafe(userNews);
        }
        
        // Combine both
        const combinedNews = getAdminOnlyNews([...userNews, ...allNews]);
        
        // Find the news by ID
        const news = combinedNews.find(item => item.id == newsId);
        
        if (!news) {
            document.getElementById('detail-content').innerHTML = 
                '<p style="color: red; text-align: center;">খবর পাওয়া যায়নি।</p>';
            return;
        }
        
        // Display news detail
        displayNewsDetail(news);
        
        // Display related news
        displayRelatedNews(combinedNews, news);
        
    } catch (error) {
        console.error('Error loading news:', error);
        document.getElementById('detail-content').innerHTML = 
            '<p style="color: red; text-align: center;">খবর লোড করতে সমস্যা হয়েছে।</p>';
    }
}

// Display detailed news
function displayNewsDetail(news) {
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

    const categoryName = categoryMap[news.category] || news.category;
    const imageUrl = news.image || 'https://via.placeholder.com/800x400?text=No+Image';
    const bengaliDate = new Date(news.date).toLocaleDateString('bn-BD', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Update page title and meta tags for social sharing
    document.title = news.title + ' - নিউজ পোর্টাল';
    
    // Update Open Graph meta tags
    updateMetaTag('og:title', news.title);
    updateMetaTag('og:description', news.description.substring(0, 160));
    updateMetaTag('og:image', imageUrl);
    updateMetaTag('og:url', window.location.href);
    
    // Update Twitter Card meta tags
    updateMetaTag('twitter:title', news.title);
    updateMetaTag('twitter:description', news.description.substring(0, 160));
    updateMetaTag('twitter:image', imageUrl);

    const detailHtml = `
        <div class="detail-header">
            <span class="detail-category">${categoryName}</span>
            <h1 class="detail-title">${news.title}</h1>
            
            <div class="detail-meta">
                <span class="detail-date">📅 ${bengaliDate}</span>
                ${news.author ? `<span class="detail-author">✍️ ${news.author}</span>` : ''}
                ${news.postedBy ? `<span class="detail-posted-by">👤 ${news.postedBy}</span>` : ''}
            </div>
        </div>

        <div class="detail-image-wrapper">
            <img src="${imageUrl}" alt="${news.title}" class="detail-image">
        </div>

        <div class="detail-body">
            <p class="detail-description">${news.description}</p>
        </div>
        
        <div class="share-buttons">
            <h3>শেয়ার করুন:</h3>
            <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}" target="_blank" class="share-btn share-facebook" title="Facebook এ শেয়ার করুন">
                <i class="fab fa-facebook"></i> Facebook
            </a>
            <a href="https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(news.title)}" target="_blank" class="share-btn share-twitter" title="Twitter এ শেয়ার করুন">
                <i class="fab fa-twitter"></i> Twitter
            </a>
            <a href="https://wa.me/?text=${encodeURIComponent(news.title + ' ' + window.location.href)}" target="_blank" class="share-btn share-whatsapp" title="WhatsApp এ শেয়ার করুন">
                <i class="fab fa-whatsapp"></i> WhatsApp
            </a>
            <a href="mailto:?subject=${encodeURIComponent(news.title)}&body=${encodeURIComponent(news.description + '\n\n' + window.location.href)}" class="share-btn share-email" title="ইমেইল এ শেয়ার করুন">
                <i class="fas fa-envelope"></i> ইমেইল
            </a>
        </div>

        <div class="detail-footer">
            <a href="news.html" class="back-link">← সব খবরে ফিরুন</a>
        </div>
    `;

    document.getElementById('detail-content').innerHTML = detailHtml;
}

// Function to update meta tags
function updateMetaTag(property, content) {
    let metaTag = document.querySelector(`meta[property="${property}"], meta[name="${property}"]`);
    
    if (!metaTag) {
        metaTag = document.createElement('meta');
        if (property.startsWith('og:')) {
            metaTag.setAttribute('property', property);
        } else {
            metaTag.setAttribute('name', property);
        }
        document.head.appendChild(metaTag);
    }
    
    metaTag.setAttribute('content', content);
}

// Display related news (same category)
function displayRelatedNews(allNews, currentNews) {
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

    // Find related news (same category, excluding current)
    const relatedNews = allNews.filter(item => 
        item.category === currentNews.category && item.id !== currentNews.id
    ).slice(0, 5);

    const relatedContainer = document.getElementById('related-news');
    
    if (relatedNews.length === 0) {
        relatedContainer.innerHTML = '<p style="color: #999;">সম্পর্কিত খবর নেই</p>';
        return;
    }

    relatedContainer.innerHTML = relatedNews.map(item => {
        const categoryName = categoryMap[item.category] || item.category;
        return `
            <div class="related-item" onclick="goToNews(${item.id})">
                <div class="related-title">${item.title.substring(0, 35)}...</div>
                <div class="related-category">${categoryName}</div>
            </div>
        `;
    }).join('');
}

// Navigate to news detail
function goToNews(id) {
    window.location.href = `detail.html?id=${id}`;
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

// Load on page load
document.addEventListener('DOMContentLoaded', function() {
    loadNewsDetail();
    displayDate();

    // Search functionality
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('search-input');
    
    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            const query = searchInput.value;
            if (query.trim()) {
                window.location.href = `news.html?search=${encodeURIComponent(query)}`;
            }
        });
    }

    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const query = searchInput.value;
                if (query.trim()) {
                    window.location.href = `news.html?search=${encodeURIComponent(query)}`;
                }
            }
        });
    }
});
