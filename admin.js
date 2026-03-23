// Admin Panel Functionality

const loginForm = document.getElementById('login-form');
const loginSection = document.getElementById('login-section');
const adminPanel = document.getElementById('admin-panel');
const logoutBtn = document.getElementById('logout-btn');
const newsForm = document.getElementById('news-form');

// Simple credentials (for demo only - in production use secure backend)
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = '1234';

// Check if user is already logged in
window.addEventListener('load', () => {
    const isLoggedIn = localStorage.getItem('adminLoggedIn');
    if (isLoggedIn) {
        showAdminPanel();
        loadRecentNews();
    }
});

// Login Handler
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        localStorage.setItem('adminLoggedIn', 'true');
        localStorage.setItem('adminUsername', username);
        showAdminPanel();
        loadRecentNews();
    } else {
        alert('ইউজারনেম বা পাসওয়ার্ড ভুল!');
    }
});

// Logout Handler
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('adminUsername');
    loginSection.style.display = 'block';
    adminPanel.style.display = 'none';
    logoutBtn.style.display = 'none';
    loginForm.reset();
});

// Show Admin Panel
function showAdminPanel() {
    loginSection.style.display = 'none';
    adminPanel.style.display = 'block';
    logoutBtn.style.display = 'block';
}

// Handle Image Upload
let uploadedImageUrl = '';
const imageFile = document.getElementById('image-file');
imageFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            uploadedImageUrl = event.target.result;
            document.getElementById('image-url').value = '';
        };
        reader.readAsDataURL(file);
    }
});

// Add News Handler
newsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const category = document.getElementById('category').value;
    const imageUrl = uploadedImageUrl || document.getElementById('image-url').value;
    const author = document.getElementById('author').value || 'অজানা';
    
    if (!title || !description || !category) {
        alert('সব তথ্য পূরণ করুন!');
        return;
    }
    
    // Get existing news
    let news = JSON.parse(localStorage.getItem('userNews')) || [];
    
    // Create new news object
    const newNews = {
        id: Date.now(),
        title: title,
        description: description,
        category: category,
        image: imageUrl || 'https://via.placeholder.com/300x200?text=No+Image',
        date: new Date().toISOString().split('T')[0],
        author: author,
        postedBy: localStorage.getItem('adminUsername')
    };
    
    // Add to beginning of array
    news.unshift(newNews);
    
    // Save to localStorage
    localStorage.setItem('userNews', JSON.stringify(news));
    
    alert('খবর সফলভাবে পোস্ট হয়েছে!');
    newsForm.reset();
    uploadedImageUrl = '';
    loadRecentNews();
});

// Load Recent News
function loadRecentNews() {
    const news = JSON.parse(localStorage.getItem('userNews')) || [];
    const newsList = document.getElementById('admin-news-list');
    
    if (news.length === 0) {
        newsList.innerHTML = '<p style="color: #999;">এখনও কোনো খবর পোস্ট হয়নি</p>';
        return;
    }
    
    newsList.innerHTML = news.map(item => `
        <div class="admin-news-item">
            <div class="admin-news-header">
                <h4>${item.title}</h4>
                <button onclick="deleteNews(${item.id})" class="btn-delete">মুছুন</button>
            </div>
            <p class="admin-news-meta">
                <strong>ক্যাটাগরি:</strong> ${item.category} | 
                <strong>তারিখ:</strong> ${item.date} | 
                <strong>লেখক:</strong> ${item.author}
            </p>
            <p>${item.description.substring(0, 100)}...</p>
        </div>
    `).join('');
}

// Delete News
function deleteNews(id) {
    if (confirm('এই খবর সত্যি মুছবেন?')) {
        let news = JSON.parse(localStorage.getItem('userNews')) || [];
        news = news.filter(item => item.id !== id);
        localStorage.setItem('userNews', JSON.stringify(news));
        loadRecentNews();
        alert('খবর মুছে দেওয়া হয়েছে!');
    }
}
