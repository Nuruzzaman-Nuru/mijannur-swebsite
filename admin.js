// Admin Panel Functionality

const loginForm = document.getElementById("login-form");
const loginSection = document.getElementById("login-section");
const adminPanel = document.getElementById("admin-panel");
const logoutBtn = document.getElementById("logout-btn");
const newsForm = document.getElementById("news-form");

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "1234";

window.addEventListener("load", () => {
    const isLoggedIn = localStorage.getItem("adminLoggedIn");
    if (isLoggedIn) {
        showAdminPanel();
        loadRecentNews();
    }
});

loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        localStorage.setItem("adminLoggedIn", "true");
        localStorage.setItem("adminUsername", username);
        showAdminPanel();
        loadRecentNews();
    } else {
        alert("ইউজারনেম বা পাসওয়ার্ড ভুল!");
    }
});

logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("adminLoggedIn");
    localStorage.removeItem("adminUsername");
    loginSection.style.display = "block";
    adminPanel.style.display = "none";
    logoutBtn.style.display = "none";
    loginForm.reset();
});

function showAdminPanel() {
    loginSection.style.display = "none";
    adminPanel.style.display = "block";
    logoutBtn.style.display = "block";
}

let uploadedImageUrl = "";
const imageFile = document.getElementById("image-file");
imageFile.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            uploadedImageUrl = event.target.result;
            document.getElementById("image-url").value = "";
        };
        reader.readAsDataURL(file);
    }
});

newsForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const title = document.getElementById("title").value;
    const description = document.getElementById("description").value;
    const category = document.getElementById("category").value;
    const imageUrl = uploadedImageUrl || document.getElementById("image-url").value;
    const author = document.getElementById("author").value || "M TV";
    
    if (!title || !description || !category) {
        alert("সব তথ্য পূরণ করুন!");
        return;
    }
    
    // Generate unique ID
    const newId = 'admin_' + Date.now();
    
    const newNews = {
        id: newId,
        title: title,
        description: description,
        category: category,
        image: imageUrl || "https://via.placeholder.com/300x200?text=No+Image",
        date: new Date().toISOString().split("T")[0],
        author: author,
        postedBy: localStorage.getItem("adminUsername")
    };
    
    try {
        // Get existing user news
        const savedUserNews = localStorage.getItem('userNews');
        let userNews = savedUserNews ? JSON.parse(savedUserNews) : [];
        
        // Add new news to beginning
        userNews.unshift(newNews);
        
        // Save back to localStorage
        localStorage.setItem('userNews', JSON.stringify(userNews));
        
        alert("খবর সফলভাবে পোস্ট হয়েছে!");
        newsForm.reset();
        uploadedImageUrl = "";
        document.getElementById("image-url").value = "";
        loadRecentNews();
        
        // Reload news on main page if available
        if (typeof loadNews === 'function') {
            loadNews();
        }
    } catch (error) {
        console.error("Error posting news:", error);
        alert("খবর পোস্ট করতে সমস্যা হয়েছে!");
    }
});

function loadRecentNews() {
    const newsList = document.getElementById("admin-news-list");
    
    const savedUserNews = localStorage.getItem('userNews');
    const userNews = savedUserNews ? JSON.parse(savedUserNews) : [];
    
    if (userNews.length === 0) {
        newsList.innerHTML = "<p style=\"color: #999;\">এখনও কোনো খবর পোস্ট হয়নি</p>";
        return;
    }
    
    newsList.innerHTML = userNews.map(item => `
        <div class="admin-news-item">
            <div class="admin-news-header">
                <h4>${item.title}</h4>
                <button onclick="deleteNews('${item.id}')" class="btn-delete">মুছুন</button>
            </div>
            <p class="admin-news-meta">
                <strong>ক্যাটাগরি:</strong> ${item.category} | 
                <strong>তারিখ:</strong> ${item.date} | 
                <strong>লেখক:</strong> ${item.author}
            </p>
            <p>${item.description.substring(0, 100)}...</p>
        </div>
    `).join("");
}

function deleteNews(id) {
    if (confirm("এই খবর সত্যি মুছবেন?")) {
        try {
            const savedUserNews = localStorage.getItem('userNews');
            let userNews = savedUserNews ? JSON.parse(savedUserNews) : [];
            
            // Remove news by id
            userNews = userNews.filter(item => item.id !== id);
            
            // Save back to localStorage
            localStorage.setItem('userNews', JSON.stringify(userNews));
            
            loadRecentNews();
            alert("খবর মুছে দেওয়া হয়েছে!");
            
            // Reload news on main page if available
            if (typeof loadNews === 'function') {
                loadNews();
            }
        } catch (error) {
            console.error("Error deleting news:", error);
            alert("খবর মুছতে সমস্যা হয়েছে!");
        }
    }
}
