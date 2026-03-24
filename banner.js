// Display news in banner format
function displayNewsAsBanners(newsArray, containerId) {
    const container = document.getElementById(containerId);
    if (!container || newsArray.length === 0) return;

    container.innerHTML = '';

    const categoryMap = {
        national: 'National',
        international: 'International',
        politics: 'Politics',
        corporate: 'Corporate',
        education: 'Education',
        health: 'Health',
        sports: 'Sports',
        technology: 'Technology',
        lifestyle: 'Lifestyle',
        feature: 'Feature',
        law: 'Law',
        religion: 'Religion'
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
            <div class="news-banner-media">
                <img src="${imageUrl}" alt="${item.title}" class="news-banner-image">
                <img src="images/logo.png" alt="M TV" class="news-banner-corner-logo">
            </div>
            <div class="news-banner-caption">
                <div class="news-banner-meta">
                    <span class="news-banner-category">${categoryName}</span>
                    <span class="news-banner-date">Date: ${bengaliDate}</span>
                    <span class="news-banner-author">By: ${item.author || 'M TV'}</span>
                    <span class="channel-badge">M TV</span>
                </div>
                <h3 class="news-banner-title">${item.title}</h3>
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
        national: 'National',
        international: 'International',
        politics: 'Politics',
        corporate: 'Corporate',
        education: 'Education',
        health: 'Health',
        sports: 'Sports',
        technology: 'Technology',
        lifestyle: 'Lifestyle',
        feature: 'Feature',
        law: 'Law',
        religion: 'Religion'
    };

    const categoryName = categoryMap[featured.category] || featured.category;

    const banner = document.createElement('div');
    banner.className = 'news-banner';
    banner.style.cursor = 'pointer';
    banner.innerHTML = `
        <div class="news-banner-media">
            <img src="${imageUrl}" alt="${featured.title}" class="news-banner-image">
            <img src="images/logo.png" alt="M TV" class="news-banner-corner-logo">
        </div>
        <div class="news-banner-caption">
            <div class="news-banner-meta">
                <span class="news-banner-category">${categoryName}</span>
                <span class="news-banner-date">Date: ${bengaliDate}</span>
                <span class="news-banner-author">By: ${featured.author || 'M TV'}</span>
                <span class="channel-badge">M TV</span>
            </div>
            <h2 class="news-banner-title">${featured.title}</h2>
        </div>
    `;

    banner.addEventListener('click', () => {
        window.location.href = `detail.html?id=${featured.id}`;
    });

    container.innerHTML = '';
    container.appendChild(banner);
}
