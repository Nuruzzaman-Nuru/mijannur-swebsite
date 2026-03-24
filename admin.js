// Admin Panel Functionality

const loginForm = document.getElementById("login-form");
const loginSection = document.getElementById("login-section");
const adminPanel = document.getElementById("admin-panel");
const logoutBtn = document.getElementById("logout-btn");
const newsForm = document.getElementById("news-form");

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "1234";
const API_NEWS_ENDPOINT = "/api/news";
const MAX_IMAGE_WIDTH = 1280;
const IMAGE_QUALITY = 0.75;

function getParsedUserNews() {
    try {
        const savedUserNews = localStorage.getItem("userNews");
        return savedUserNews ? JSON.parse(savedUserNews) : [];
    } catch (error) {
        return [];
    }
}

function saveUserNewsSafe(newsList) {
    try {
        localStorage.setItem("userNews", JSON.stringify(newsList));
        return true;
    } catch (error) {
        console.warn("Could not save all news to localStorage:", error);
        return false;
    }
}

function compressImageFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error("image_read_failed"));
        reader.onload = () => {
            const image = new Image();
            image.onerror = () => reject(new Error("image_decode_failed"));
            image.onload = () => {
                const ratio = Math.min(1, MAX_IMAGE_WIDTH / image.width);
                const width = Math.max(1, Math.round(image.width * ratio));
                const height = Math.max(1, Math.round(image.height * ratio));

                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                const context = canvas.getContext("2d");

                if (!context) {
                    reject(new Error("canvas_not_supported"));
                    return;
                }

                context.drawImage(image, 0, 0, width, height);
                resolve(canvas.toDataURL("image/jpeg", IMAGE_QUALITY));
            };
            image.src = reader.result;
        };
        reader.readAsDataURL(file);
    });
}

async function loadNewsFromApi() {
    try {
        const response = await fetch(API_NEWS_ENDPOINT, { cache: "no-store" });
        if (!response.ok) return null;

        const data = await response.json();
        return Array.isArray(data) ? data : null;
    } catch (error) {
        return null;
    }
}

async function createNewsInApi(newsPayload) {
    try {
        const response = await fetch(API_NEWS_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newsPayload)
        });

        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        return null;
    }
}

async function deleteNewsFromApi(id) {
    try {
        const response = await fetch(`${API_NEWS_ENDPOINT}/${encodeURIComponent(id)}`, {
            method: "DELETE"
        });
        return response.ok;
    } catch (error) {
        return false;
    }
}

function isAdminPostedNews(item) {
    if (!item || typeof item !== "object") return false;

    const postedBy = (item.postedBy || "").toString().trim().toLowerCase();
    const id = (item.id || "").toString();

    return postedBy === ADMIN_USERNAME || id.startsWith("admin_");
}

window.addEventListener("load", async () => {
    const isLoggedIn = localStorage.getItem("adminLoggedIn");
    if (isLoggedIn) {
        showAdminPanel();
        await loadRecentNews();
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
imageFile.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (file) {
        try {
            uploadedImageUrl = await compressImageFile(file);
            document.getElementById("image-url").value = "";
        } catch (error) {
            uploadedImageUrl = "";
            alert("ছবি প্রসেস করা যায়নি। ছোট ছবি দিন বা image URL ব্যবহার করুন।");
        }
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
    
    // Generate local fallback ID
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
        // Keep local cache cleaned
        const parsedUserNews = getParsedUserNews();
        let userNews = parsedUserNews.filter(isAdminPostedNews);

        // Try central API first for cross-device visibility
        const createdByApi = await createNewsInApi(newNews);
        const effectiveNews = createdByApi || newNews;

        // Update local cache (fallback/offline + quick UI refresh)
        userNews = userNews.filter(item => item.id !== effectiveNews.id);
        userNews.unshift(effectiveNews);
        
        // Save back to localStorage (best effort)
        const cacheSaved = saveUserNewsSafe(userNews);
        
        if (createdByApi) {
            alert("খবর সফলভাবে পোস্ট হয়েছে! এখন ফোন ও ল্যাপটপে দেখা যাবে।");
        } else if (cacheSaved) {
            alert("খবর পোস্ট হয়েছে, কিন্তু server/API চালু নেই বলে শুধু এই ডিভাইসে দেখা যাবে।");
        } else {
            alert("খবর পোস্ট হয়নি। ছবি খুব বড় হতে পারে, image URL দিন বা ছোট ছবি ব্যবহার করুন।");
            return;
        }
        newsForm.reset();
        uploadedImageUrl = "";
        document.getElementById("image-url").value = "";
        await loadRecentNews();
        
        // Reload news on main page if available
        if (typeof loadNews === 'function') {
            loadNews();
        }
    } catch (error) {
        console.error("Error posting news:", error);
        alert("খবর পোস্ট করতে সমস্যা হয়েছে!");
    }
});

async function loadRecentNews() {
    const newsList = document.getElementById("admin-news-list");

    const apiNews = await loadNewsFromApi();
    let userNews;

    if (Array.isArray(apiNews)) {
        userNews = apiNews.filter(isAdminPostedNews);
        saveUserNewsSafe(userNews);
    } else {
        const parsedUserNews = getParsedUserNews();
        userNews = parsedUserNews.filter(isAdminPostedNews);

        if (userNews.length !== parsedUserNews.length) {
            saveUserNewsSafe(userNews);
        }
    }
    
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

async function deleteNews(id) {
    if (confirm("এই খবর সত্যি মুছবেন?")) {
        try {
            await deleteNewsFromApi(id);

            let userNews = getParsedUserNews();
            userNews = userNews.filter(isAdminPostedNews);
            
            // Remove news by id
            userNews = userNews.filter(item => item.id !== id);
            
            // Save back to localStorage
            saveUserNewsSafe(userNews);
            
            await loadRecentNews();
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
