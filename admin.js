// Admin Panel Functionality

const loginForm = document.getElementById("login-form");
const loginSection = document.getElementById("login-section");
const adminPanel = document.getElementById("admin-panel");
const logoutBtn = document.getElementById("logout-btn");
const newsForm = document.getElementById("news-form");
const formTitle = document.getElementById("admin-form-title") || document.querySelector("#admin-panel h2");
const submitNewsBtn = document.getElementById("submit-news-btn");
const cancelEditBtn = document.getElementById("cancel-edit-btn");
const imageUrlInput = document.getElementById("image-url");
const imageFile = document.getElementById("image-file");

const ADMIN_USERNAME = "adminmijanur";
const ADMIN_PASSWORD = "12345678";
const FALLBACK_API_BASE_URL = "https://mijannur-swebsite.vercel.app";
function getApiNewsEndpoint() {
    const configuredBase = String(window.NEWS_API_BASE_URL || "").replace(/\/+$/, "");
    if (configuredBase) return `${configuredBase}/api/news`;

    const hostname = window.location.hostname;
    const isStaticHost = window.location.protocol === "file:" || hostname.endsWith("github.io");
    if (isStaticHost) return `${FALLBACK_API_BASE_URL}/api/news`;

    return "/api/news";
}
const API_NEWS_ENDPOINT = getApiNewsEndpoint();
const MAX_IMAGE_WIDTH = 1280;
const IMAGE_QUALITY = 0.75;
const MIN_IMAGE_QUALITY = 0.45;
const IMAGE_QUALITY_STEP = 0.1;
const MAX_IMAGE_DATA_URL_LENGTH = 350000;
let editingNewsId = null;
let editingOriginalDate = null;
let currentAdminNews = [];
let latestApiErrorMessage = "";
let pendingImageProcessing = null;
let imageProcessingToken = 0;

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

function parseDateLikeValue(value) {
    if (typeof value === "number" && Number.isFinite(value)) return value;

    const text = String(value || "").trim();
    if (!text) return 0;

    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
        const timestamp = new Date(`${text}T00:00:00`).getTime();
        return Number.isNaN(timestamp) ? 0 : timestamp;
    }

    const timestamp = new Date(text).getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getNewsTimestamp(item) {
    if (!item || typeof item !== "object") return 0;

    const candidates = [item.updatedAt, item.createdAt, item.publishedAt, item.date];
    for (const value of candidates) {
        const timestamp = parseDateLikeValue(value);
        if (timestamp > 0) return timestamp;
    }

    return 0;
}

function mergeAdminNewsLists(...newsLists) {
    const keyed = new Map();
    const withoutId = [];

    newsLists.forEach(list => {
        (list || []).forEach(item => {
            if (!isAdminPostedNews(item)) return;

            const id = String(item.id || "").trim();
            if (!id) {
                withoutId.push(item);
                return;
            }

            if (!keyed.has(id)) {
                keyed.set(id, item);
                return;
            }

            const existing = keyed.get(id);
            if (getNewsTimestamp(item) > getNewsTimestamp(existing)) {
                keyed.set(id, item);
            }
        });
    });

    const merged = [...keyed.values(), ...withoutId];
    merged.sort((a, b) => getNewsTimestamp(b) - getNewsTimestamp(a));
    return merged;
}

function isDataImageUrl(value) {
    return typeof value === "string" && value.startsWith("data:image/");
}

function isOversizedImageReference(value) {
    return isDataImageUrl(value) && value.length > MAX_IMAGE_DATA_URL_LENGTH;
}

function normalizeImageReference(value) {
    const normalized = (value || "").toString().trim();
    if (!normalized) return OFFLINE_PLACEHOLDER_IMAGE;
    if (isOversizedImageReference(normalized)) return OFFLINE_PLACEHOLDER_IMAGE;
    return normalized;
}

function makeStorageFriendlyNews(newsList) {
    return (newsList || []).map((item, index) => {
        if (isOversizedImageReference(item.image)) {
            return { ...item, image: OFFLINE_PLACEHOLDER_IMAGE };
        }
        if (index < 3) return item;
        return { ...item, image: OFFLINE_PLACEHOLDER_IMAGE };
    });
}

function saveUserNewsWithFallback(newsList) {
    if (saveUserNewsSafe(newsList)) {
        return { saved: true, list: newsList, downgradedImage: false };
    }

    const optimized = makeStorageFriendlyNews(newsList);
    if (saveUserNewsSafe(optimized)) {
        return { saved: true, list: optimized, downgradedImage: true };
    }

    const noDataImages = (newsList || [])
        .map(item => isDataImageUrl(item.image) ? { ...item, image: OFFLINE_PLACEHOLDER_IMAGE } : item);
    if (saveUserNewsSafe(noDataImages)) {
        return { saved: true, list: noDataImages, downgradedImage: true };
    }

    const compactList = (newsList || [])
        .map(item => ({
            ...item,
            description: String(item.description || "").slice(0, 500),
            image: OFFLINE_PLACEHOLDER_IMAGE
        }));
    if (saveUserNewsSafe(compactList)) {
        return { saved: true, list: compactList, downgradedImage: true };
    }

    return { saved: false, list: newsList, downgradedImage: false };
}

function renderAdminNewsList(userNews) {
    const newsList = document.getElementById("admin-news-list");

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

                const downscaleSteps = [1, 0.85, 0.7, 0.55];
                let bestDataUrl = "";

                for (const step of downscaleSteps) {
                    const nextWidth = Math.max(1, Math.round(width * step));
                    const nextHeight = Math.max(1, Math.round(height * step));
                    canvas.width = nextWidth;
                    canvas.height = nextHeight;
                    context.clearRect(0, 0, nextWidth, nextHeight);
                    context.drawImage(image, 0, 0, nextWidth, nextHeight);

                    for (let quality = IMAGE_QUALITY; quality >= MIN_IMAGE_QUALITY; quality -= IMAGE_QUALITY_STEP) {
                        const roundedQuality = Math.max(MIN_IMAGE_QUALITY, Number(quality.toFixed(2)));
                        const compressedData = canvas.toDataURL("image/jpeg", roundedQuality);
                        bestDataUrl = compressedData;

                        if (compressedData.length <= MAX_IMAGE_DATA_URL_LENGTH) {
                            resolve(compressedData);
                            return;
                        }
                    }
                }

                if (!bestDataUrl) {
                    reject(new Error("image_compress_failed"));
                    return;
                }

                resolve(bestDataUrl);
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

async function readApiErrorMessage(response) {
    try {
        const payload = await response.json();
        if (payload && typeof payload === "object") {
            const combined = [payload.error, payload.details].filter(Boolean).join(" | ");
            if (combined) return combined;
        }
    } catch (error) {
        // Ignore JSON parsing issues.
    }

    try {
        const text = await response.text();
        if (text && text.trim()) return text.trim();
    } catch (error) {
        // Ignore text parsing issues.
    }

    return `HTTP_${response.status}`;
}

function getApiPersistenceHint() {
    const message = (latestApiErrorMessage || "").toLowerCase();
    const likelyStorageIssue = message.includes("erofs")
        || message.includes("read-only")
        || message.includes("permission")
        || message.includes("github_env_missing")
        || message.includes("github_write_failed")
        || message.includes("failed to handle news request");

    if (!likelyStorageIssue) return "";

    return "Vercel এ post persist করতে Project Settings -> Environment Variables এ GITHUB_OWNER, GITHUB_REPO, GITHUB_TOKEN, GITHUB_BRANCH, GITHUB_NEWS_FILE সেট করে redeploy দিন।";
}

async function createNewsInApi(newsPayload) {
    latestApiErrorMessage = "";

    try {
        const response = await fetch(API_NEWS_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newsPayload)
        });

        if (!response.ok) {
            latestApiErrorMessage = await readApiErrorMessage(response);
            return null;
        }

        return await response.json();
    } catch (error) {
        latestApiErrorMessage = error && error.message ? error.message : "network_error";
        return null;
    }
}

async function updateNewsInApi(id, newsPayload) {
    latestApiErrorMessage = "";

    try {
        const response = await fetch(`${API_NEWS_ENDPOINT}/${encodeURIComponent(id)}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newsPayload)
        });

        if (!response.ok) {
            latestApiErrorMessage = await readApiErrorMessage(response);
            return null;
        }

        return await response.json();
    } catch (error) {
        latestApiErrorMessage = error && error.message ? error.message : "network_error";
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

async function loadNewsFromStaticSource() {
    if (window.NewsSource && typeof window.NewsSource.loadNewsFromGitHub === "function") {
        return window.NewsSource.loadNewsFromGitHub();
    }

    return null;
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
    syncSubmitButtonState();
}

function setEditMode() {
    if (formTitle) formTitle.textContent = "নিউজ এডিট করুন";
    if (submitNewsBtn) submitNewsBtn.textContent = "এডিট সেভ করুন";
    if (cancelEditBtn) cancelEditBtn.style.display = "block";
    syncSubmitButtonState();
}

function syncSubmitButtonState() {
    if (!submitNewsBtn) return;
    submitNewsBtn.disabled = Boolean(pendingImageProcessing);
}

function resetNewsFormToCreateMode() {
    newsForm.reset();
    uploadedImageUrl = "";
    if (imageUrlInput) imageUrlInput.value = "";
    if (imageFile) imageFile.value = "";
    pendingImageProcessing = null;
    imageProcessingToken += 1;
    setCreateMode();
}

setCreateMode();

let uploadedImageUrl = "";
if (imageUrlInput) {
    imageUrlInput.addEventListener("input", () => {
        if (!imageUrlInput.value.trim()) return;
        // URL ব্যবহার করলে আগের selected file image override করা হবে।
        uploadedImageUrl = "";
        if (imageFile) imageFile.value = "";
    });
}

if (imageFile) {
    imageFile.addEventListener("click", () => {
        // Allow selecting the same image again on mobile.
        imageFile.value = "";
    });

    imageFile.addEventListener("change", (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) {
            uploadedImageUrl = "";
            return;
        }

        const token = ++imageProcessingToken;
        pendingImageProcessing = (async () => {
            try {
                uploadedImageUrl = await compressImageFile(file);
                if (uploadedImageUrl.length > MAX_IMAGE_DATA_URL_LENGTH) {
                    uploadedImageUrl = OFFLINE_PLACEHOLDER_IMAGE;
                    alert("ছবিটি খুব বড় হওয়ায় পোস্টে placeholder ছবি ব্যবহার হবে।");
                    return;
                }
                if (imageUrlInput) imageUrlInput.value = "";
            } catch (error) {
                uploadedImageUrl = "";
                alert("ছবি প্রসেস করা যায়নি। ছোট ছবি দিন বা image URL ব্যবহার করুন।");
            }
        })().finally(() => {
            if (token !== imageProcessingToken) return;
            pendingImageProcessing = null;
            syncSubmitButtonState();
        });

        syncSubmitButtonState();
    });
}

if (cancelEditBtn) {
    cancelEditBtn.addEventListener("click", () => {
        resetNewsFormToCreateMode();
    });
}

newsForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (pendingImageProcessing) {
        alert("ছবি প্রসেস হচ্ছে, কয়েক সেকেন্ড অপেক্ষা করুন...");
        await pendingImageProcessing;
    }
    
    const title = document.getElementById("title").value;
    const description = document.getElementById("description").value;
    const category = document.getElementById("category").value;
    const imageUrl = normalizeImageReference(uploadedImageUrl || (imageUrlInput ? imageUrlInput.value : ""));
    const author = document.getElementById("author").value || "M TV";
    
    if (!title || !description || !category) {
        alert("সব তথ্য পূরণ করুন!");
        return;
    }
    
    const fallbackImage = imageUrl;
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
        let userNews = mergeAdminNewsLists(parsedUserNews);

        let effectiveNews = null;
        let successMessage = "";
        let syncedWithApi = false;
        let shouldRenderLocalCache = false;

        if (editingNewsId) {
            const existing = currentAdminNews.find(item => String(item.id) === String(editingNewsId));
            const updatePayload = {
                ...basePayload,
                date: editingOriginalDate || (existing && existing.date) || new Date().toISOString().split("T")[0]
            };

            const updatedByApi = await updateNewsInApi(editingNewsId, updatePayload);
            syncedWithApi = Boolean(updatedByApi);
            effectiveNews = updatedByApi || { ...(existing || {}), ...updatePayload, id: editingNewsId };

            userNews = userNews.map(item =>
                String(item.id) === String(editingNewsId) ? effectiveNews : item
            );

            if (!userNews.some(item => String(item.id) === String(editingNewsId))) {
                userNews.unshift(effectiveNews);
            }

            const cacheSaveResult = saveUserNewsWithFallback(userNews);
            userNews = cacheSaveResult.list;
            currentAdminNews = userNews;
            shouldRenderLocalCache = !syncedWithApi;

            successMessage = updatedByApi
                ? "খবর এডিট সফল হয়েছে! সব ডিভাইসে আপডেট দেখাবে।"
                : !cacheSaveResult.saved
                    ? "খবর এডিট হয়েছে, কিন্তু browser storage বন্ধ/সীমাবদ্ধ। পেজ refresh দিলে হারাতে পারে।"
                : cacheSaveResult.downgradedImage
                    ? "খবর এডিট হয়েছে, তবে স্টোরেজ সীমার কারণে কিছু পুরোনো ছবির বদলে placeholder রাখা হয়েছে।"
                    : "খবর এডিট হয়েছে, কিন্তু server/API অফ থাকায় শুধু এই ডিভাইসে আপডেট দেখাবে।";
        } else {
            const newNews = {
                id: "admin_" + Date.now(),
                ...basePayload,
                date: new Date().toISOString().split("T")[0]
            };

            const createdByApi = await createNewsInApi(newNews);
            syncedWithApi = Boolean(createdByApi);
            effectiveNews = createdByApi || newNews;

            // Update local cache (fallback/offline + quick UI refresh)
            userNews = userNews.filter(item => String(item.id) !== String(effectiveNews.id));
            userNews.unshift(effectiveNews);

            const cacheSaveResult = saveUserNewsWithFallback(userNews);
            userNews = cacheSaveResult.list;
            currentAdminNews = userNews;
            shouldRenderLocalCache = !syncedWithApi;

            successMessage = createdByApi
                ? "খবর সফলভাবে পোস্ট হয়েছে! এখন ফোন ও ল্যাপটপে দেখা যাবে।"
                : !cacheSaveResult.saved
                    ? "খবর পোস্ট হয়েছে, কিন্তু browser storage বন্ধ/সীমাবদ্ধ। পেজ refresh দিলে হারাতে পারে।"
                : cacheSaveResult.downgradedImage
                    ? "খবর পোস্ট হয়েছে। স্টোরেজ সীমার কারণে কিছু পুরোনো ছবির বদলে placeholder রাখা হয়েছে।"
                    : "খবর পোস্ট হয়েছে, কিন্তু server/API চালু নেই বলে শুধু এই ডিভাইসে দেখা যাবে।";
        }

        const apiHint = !syncedWithApi ? getApiPersistenceHint() : "";
        if (apiHint) {
            successMessage = `${successMessage}\n\n${apiHint}`;
        }

        alert(successMessage);
        resetNewsFormToCreateMode();
        if (shouldRenderLocalCache) {
            renderAdminNewsList(currentAdminNews);
        } else {
            await loadRecentNews();
        }
        
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
    const apiNews = await loadNewsFromApi();
    const staticNews = Array.isArray(apiNews) ? null : await loadNewsFromStaticSource();
    let userNews;
    const localNews = mergeAdminNewsLists(getParsedUserNews());

    if (Array.isArray(apiNews)) {
        userNews = mergeAdminNewsLists(localNews, apiNews);
        saveUserNewsWithFallback(userNews);
    } else if (Array.isArray(staticNews)) {
        userNews = mergeAdminNewsLists(localNews, staticNews);
        saveUserNewsWithFallback(userNews);
    } else {
        userNews = localNews;
        const cacheSaveResult = saveUserNewsWithFallback(userNews);
        userNews = cacheSaveResult.list;
    }
    
    currentAdminNews = userNews;
    renderAdminNewsList(userNews);
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
    if (imageUrlInput) {
        imageUrlInput.value = newsItem.image && /^https?:\/\//i.test(newsItem.image)
            ? newsItem.image
            : "";
    }
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
