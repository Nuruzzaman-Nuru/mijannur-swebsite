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
    const author = document.getElementById("author").value || "অজানা";
    
    if (!title || !description || !category) {
        alert("সব তথ্য পূরণ করুন!");
        return;
    }
    
    const newNews = {
        title: title,
        description: description,
        category: category,
        image: imageUrl || "https://via.placeholder.com/300x200?text=No+Image",
        date: new Date().toISOString().split("T")[0],
        author: author,
        postedBy: localStorage.getItem("adminUsername")
    };
    
    try {
        await db.addNews(newNews);
        alert("খবর সফলভাবে পোস্ট হয়েছে!");
        newsForm.reset();
        uploadedImageUrl = "";
        loadRecentNews();
    } catch (error) {
        console.error("Error posting news:", error);
        alert("খবর পোস্ট করতে সমস্যা হয়েছে!");
    }
});

async function loadRecentNews() {
    const news = await db.getAllNews();
    const newsList = document.getElementById("admin-news-list");
    
    if (news.length === 0) {
        newsList.innerHTML = "<p style=\"color: #999;\">এখনও কোনো খবর পোস্ট হয়নি</p>";
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
    `).join("");
}

async function deleteNews(id) {
    if (confirm("এই খবর সত্যি মুছবেন?")) {
        try {
            await db.deleteNews(id);
            loadRecentNews();
            alert("খবর মুছে দেওয়া হয়েছে!");
        } catch (error) {
            console.error("Error deleting news:", error);
            alert("খবর মুছতে সমস্যা হয়েছে!");
        }
    }
}
