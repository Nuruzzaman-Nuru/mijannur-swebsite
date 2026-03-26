(() => {
    const MOBILE_BREAKPOINT = 768;
    const VISIBLE_CATEGORY_COUNT = 0;
    const categoryList = document.querySelector(".category-menu ul");

    if (!categoryList) return;

    const categoryItems = Array.from(categoryList.querySelectorAll(":scope > li"));
    if (categoryItems.length <= VISIBLE_CATEGORY_COUNT) return;

    const hiddenItems = categoryItems.slice(VISIBLE_CATEGORY_COUNT);
    hiddenItems.forEach(item => item.classList.add("mobile-collapsed-category"));

    const moreItem = document.createElement("li");
    moreItem.className = "category-more-item";
    moreItem.innerHTML = `
        <button type="button" class="category-more-toggle" aria-expanded="false">
            ক্যাটাগরি
            <i class="fas fa-chevron-down" aria-hidden="true"></i>
        </button>
        <div class="category-more-dropdown" role="menu"></div>
    `;

    const toggleButton = moreItem.querySelector(".category-more-toggle");
    const dropdown = moreItem.querySelector(".category-more-dropdown");

    hiddenItems.forEach(item => {
        const link = item.querySelector("a");
        if (!link) return;
        const clone = link.cloneNode(true);
        clone.setAttribute("role", "menuitem");
        clone.addEventListener("click", () => {
            closeMoreDropdown();
        });
        dropdown.appendChild(clone);
    });

    categoryList.appendChild(moreItem);

    function closeMoreDropdown() {
        moreItem.classList.remove("is-open");
        toggleButton.setAttribute("aria-expanded", "false");
    }

    function openMoreDropdown() {
        moreItem.classList.add("is-open");
        toggleButton.setAttribute("aria-expanded", "true");
    }

    function syncForViewport() {
        if (window.innerWidth <= MOBILE_BREAKPOINT) {
            hiddenItems.forEach(item => item.classList.add("mobile-collapsed-category"));
            return;
        }

        hiddenItems.forEach(item => item.classList.remove("mobile-collapsed-category"));
        closeMoreDropdown();
    }

    toggleButton.addEventListener("click", (event) => {
        event.preventDefault();
        if (moreItem.classList.contains("is-open")) {
            closeMoreDropdown();
            return;
        }
        openMoreDropdown();
    });

    document.addEventListener("click", (event) => {
        if (!moreItem.contains(event.target)) {
            closeMoreDropdown();
        }
    });

    window.addEventListener("resize", syncForViewport);
    syncForViewport();
})();
