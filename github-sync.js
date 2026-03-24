// Auto-update news from GitHub raw file
// এই ফাংশন GitHub থেকে news.json লোড করে

const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/Nuruzzaman-Nuru/mijannur-swebsite/main/news.json';

async function loadNewsFromGitHub() {
    try {
        const response = await fetch(GITHUB_RAW_URL, {
            headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('cachedNews', JSON.stringify(data.news));
            console.log('News updated from GitHub');
            return data.news;
        }
    } catch (error) {
        console.log('Could not fetch from GitHub, using cached news');
    }
    
    // ফলব্যাক: localStorage থেকে ব্যবহার করুন
    const cached = localStorage.getItem('cachedNews');
    return cached ? JSON.parse(cached) : [];
}

// প্রতি ১০ মিনিটে আপডেট করুন
setInterval(loadNewsFromGitHub, 10 * 60 * 1000);

// পেজ লোড হওয়ার সাথে সাথে আপডেট করুন
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadNewsFromGitHub);
} else {
    loadNewsFromGitHub();
}
