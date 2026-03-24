// Display news in banner format
function displayNewsAsBanners(newsArray, containerId) {
    const container = document.getElementById(containerId);
    if (!container || newsArray.length === 0) return;

    container.innerHTML = '';
    
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

    const bannersGrid = document.createElement('div');
    bannersGrid.className = 'news-banners-grid';

    newsArray.slice(0, 6).forEach(item => {
        const banner = document.createElement('div');
        banner.className = 'news-banner news-banner-small';
        banner.style.cursor = 'pointer';
        
        const imageUrl = item.image || 'https://via.placeholder.com/400x300?text=News';
        const bengaliDate = new Date(item.date).toLocaleDateString('bn-BD', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
        });
        const categoryName = categoryMap[item.category] || item.category;

        banner.innerHTML = `
            <img src="${imageUrl}" alt="${item.title}" class="news-banner-image">
            <div class="news-banner-overlay">
                <h3 class="news-banner-title">${item.title}</h3>
                <div class="news-banner-meta">
                    <span class="news-banner-category">${categoryName}</span>
                    <span class="news-banner-date">📅 ${bengaliDate}</span>
                </div>
            </div>
        `;

        banner.addEventListener('click', () => {
            window.location.href = `detail.html?id=${item.id}`;
        });

        bannersGrid.appendChild(banner);
    });

    container.appendChild(bannersGrid);
}

// Display featured news as large banner
function displayFeaturedBanner(newsArray, containerId) {
    const container = document.getElementById(containerId);
    if (!container || newsArray.length === 0) return;

    const featured = newsArray[0];
    const imageUrl = featured.image || 'https://via.placeholder.com/800x400?text=Featured';
    const bengaliDate = new Date(featured.date).toLocaleDateString('bn-BD', {
        weekday: 'long',
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

    const banner = document.createElement('div');
    banner.className = 'news-banner';
    banner.style.cursor = 'pointer';
    banner.innerHTML = `
        <img src="${imageUrl}" alt="${featured.title}" class="news-banner-image">
        <div class="news-banner-overlay">
            <h2 class="news-banner-title">${featured.title}</h2>
            <div class="news-banner-meta">
                <span class="news-banner-category">${categoryName}</span>
                <span class="news-banner-date">📅 ${bengaliDate}</span>
                ${featured.author ? `<span>✍️ ${featured.author}</span>` : ''}
            </div>
        </div>
    `;

    banner.addEventListener('click', () => {
        window.location.href = `detail.html?id=${featured.id}`;
    });

    container.innerHTML = '';
    container.appendChild(banner);
}
