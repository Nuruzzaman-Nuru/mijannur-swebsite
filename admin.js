// Admin Panel Functionality

const loginForm = document.getElementById("login-form");
const loginSection = document.getElementById("login-section");
const adminPanel = document.getElementById("admin-panel");
const logoutBtn = document.getElementById("logout-btn");
const newsForm = document.getElementById("news-form");
const formTitle = document.getElementById("admin-form-title") || document.querySelector("#admin-panel h2");
const submitNewsBtn = document.getElementById("submit-news-btn");
const cancelEditBtn = document.getElementById("cancel-edit-btn");

const ADMIN_USERNAME = "adminmijanur";
const ADMIN_PASSWORD = "12345678";
const API_NEWS_ENDPOINT = "/api/news";
const MAX_IMAGE_WIDTH = 1280;
const IMAGE_QUALITY = 0.75;
let editingNewsId = null;
let editingOriginalDate = null;
let currentAdminNews = [];

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

async function updateNewsInApi(id, newsPayload) {
    try {
        const response = await fetch(`${API_NEWS_ENDPOINT}/${encodeURIComponent(id)}`, {
            method: "PUT",
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
    resetNewsFormToCreateMode();
});

function showAdminPanel() {
    loginSection.style.display = "none";
    adminPanel.style.display = "block";
    logoutBtn.style.display = "block";
}

function setCreateMode() {
    editingNewsId = null;
    editingOriginalDate = null;

    if (formTitle) formTitle.textContent = "নিউজ পোস্ট করুন";
    if (submitNewsBtn) submitNewsBtn.textContent = "নিউজ পোস্ট করুন";
    if (cancelEditBtn) cancelEditBtn.style.display = "none";
}

function setEditMode() {
    if (formTitle) formTitle.textContent = "নিউজ এডিট করুন";
    if (submitNewsBtn) submitNewsBtn.textContent = "এডিট সেভ করুন";
    if (cancelEditBtn) cancelEditBtn.style.display = "block";
}

function resetNewsFormToCreateMode() {
    newsForm.reset();
    uploadedImageUrl = "";
    document.getElementById("image-url").value = "";
    if (imageFile) imageFile.value = "";
    setCreateMode();
}

setCreateMode();

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

if (cancelEditBtn) {
    cancelEditBtn.addEventListener("click", () => {
        resetNewsFormToCreateMode();
    });
}

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
    
    const fallbackImage = imageUrl || "https://via.placeholder.com/300x200?text=No+Image";
    const basePayload = {
        title: title,
        description: description,
        category: category,
        image: fallbackImage,
        author: author,
        postedBy: localStorage.getItem("adminUsername")
    };
    
    try {
        // Keep local cache cleaned
        const parsedUserNews = getParsedUserNews();
        let userNews = parsedUserNews.filter(isAdminPostedNews);

        let effectiveNews = null;
        let successMessage = "";

        if (editingNewsId) {
            const existing = currentAdminNews.find(item => String(item.id) === String(editingNewsId));
            const updatePayload = {
                ...basePayload,
                date: editingOriginalDate || (existing && existing.date) || new Date().toISOString().split("T")[0]
            };

            const updatedByApi = await updateNewsInApi(editingNewsId, updatePayload);
            effectiveNews = updatedByApi || { ...(existing || {}), ...updatePayload, id: editingNewsId };

            userNews = userNews.map(item =>
                String(item.id) === String(editingNewsId) ? effectiveNews : item
            );

            if (!userNews.some(item => String(item.id) === String(editingNewsId))) {
                userNews.unshift(effectiveNews);
            }

            const cacheSaved = saveUserNewsSafe(userNews);
            if (!updatedByApi && !cacheSaved) {
                alert("এডিট সেভ হয়নি। server/API এবং storage check করুন।");
                return;
            }

            successMessage = updatedByApi
                ? "খবর এডিট সফল হয়েছে! সব ডিভাইসে আপডেট দেখাবে।"
                : "খবর এডিট হয়েছে, কিন্তু server/API অফ থাকায় শুধু এই ডিভাইসে আপডেট দেখাবে।";
        } else {
            const newNews = {
                id: "admin_" + Date.now(),
                ...basePayload,
                date: new Date().toISOString().split("T")[0]
            };

            const createdByApi = await createNewsInApi(newNews);
            effectiveNews = createdByApi || newNews;

            // Update local cache (fallback/offline + quick UI refresh)
            userNews = userNews.filter(item => String(item.id) !== String(effectiveNews.id));
            userNews.unshift(effectiveNews);

            const cacheSaved = saveUserNewsSafe(userNews);
            if (!createdByApi && !cacheSaved) {
                alert("খবর পোস্ট হয়নি। ছবি খুব বড় হতে পারে, image URL দিন বা ছোট ছবি ব্যবহার করুন।");
                return;
            }

            successMessage = createdByApi
                ? "খবর সফলভাবে পোস্ট হয়েছে! এখন ফোন ও ল্যাপটপে দেখা যাবে।"
                : "খবর পোস্ট হয়েছে, কিন্তু server/API চালু নেই বলে শুধু এই ডিভাইসে দেখা যাবে।";
        }

        alert(successMessage);
        resetNewsFormToCreateMode();
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
    
    currentAdminNews = userNews;

    if (userNews.length === 0) {
        if (editingNewsId) resetNewsFormToCreateMode();
        newsList.innerHTML = "<p style=\"color: #999;\">এখনও কোনো খবর পোস্ট হয়নি</p>";
        return;
    }
    
    newsList.innerHTML = userNews.map(item => `
        <div class="admin-news-item">
            <div class="admin-news-header">
                <h4>${item.title}</h4>
                <div class="admin-news-actions">
                    <button onclick="beginEditNews('${item.id}')" class="btn-edit">এডিট</button>
                    <button onclick="deleteNews('${item.id}')" class="btn-delete">মুছুন</button>
                </div>
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

function beginEditNews(id) {
    const newsItem = currentAdminNews.find(item => String(item.id) === String(id));
    if (!newsItem) {
        alert("খবর খুঁজে পাওয়া যায়নি।");
        return;
    }

    editingNewsId = newsItem.id;
    editingOriginalDate = newsItem.date;
    uploadedImageUrl = newsItem.image || "";

    document.getElementById("title").value = newsItem.title || "";
    document.getElementById("description").value = newsItem.description || "";
    document.getElementById("category").value = newsItem.category || "";
    document.getElementById("author").value = newsItem.author || "M TV";
    document.getElementById("image-url").value = newsItem.image && /^https?:\/\//i.test(newsItem.image)
        ? newsItem.image
        : "";
    if (imageFile) imageFile.value = "";

    setEditMode();
    newsForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function deleteNews(id) {
    if (confirm("এই খবর সত্যি মুছবেন?")) {
        try {
            const deletedFromApi = await deleteNewsFromApi(id);

            let userNews = getParsedUserNews();
            userNews = userNews.filter(isAdminPostedNews);
            
            // Remove news by id
            userNews = userNews.filter(item => String(item.id) !== String(id));
            
            // Save back to localStorage
            saveUserNewsSafe(userNews);

            if (String(editingNewsId) === String(id)) {
                resetNewsFormToCreateMode();
            }
            
            await loadRecentNews();
            if (deletedFromApi) {
                alert("খবর মুছে দেওয়া হয়েছে।");
            } else {
                alert("খবর লোকালি মুছে দেওয়া হয়েছে, কিন্তু server/API থেকে মুছতে সমস্যা হয়েছে।");
            }
            
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
