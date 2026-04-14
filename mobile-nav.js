(() => {
    const MOBILE_BREAKPOINT = 768;
    const toggleButton = document.querySelector(".mobile-nav-toggle");
    const navbarContent = document.querySelector(".navbar-content");

    if (!toggleButton || !navbarContent) return;

    const applyMobileMenuFixes = () => {
        if (window.innerWidth > MOBILE_BREAKPOINT) return;

        navbarContent.style.maxHeight = "calc(100vh - 88px)";
        navbarContent.style.overflowY = "auto";

        navbarContent.querySelectorAll(".nav-links li").forEach(item => {
            item.style.width = "100%";
        });

        navbarContent.querySelectorAll(".nav-links a").forEach(link => {
            link.style.display = "block";
            link.style.width = "100%";
            link.style.color = "#2c3e50";
            link.style.textDecoration = "none";
        });
    };

    const clearMobileMenuFixes = () => {
        navbarContent.style.maxHeight = "";
        navbarContent.style.overflowY = "";

        navbarContent.querySelectorAll(".nav-links li").forEach(item => {
            item.style.width = "";
        });

        navbarContent.querySelectorAll(".nav-links a").forEach(link => {
            link.style.display = "";
            link.style.width = "";
            link.style.color = "";
            link.style.textDecoration = "";
        });
    };

    const closeMenu = () => {
        navbarContent.classList.remove("is-open");
        toggleButton.setAttribute("aria-expanded", "false");
        toggleButton.innerHTML = '<i class="fas fa-bars" aria-hidden="true"></i>';
    };

    const openMenu = () => {
        applyMobileMenuFixes();
        navbarContent.classList.add("is-open");
        toggleButton.setAttribute("aria-expanded", "true");
        toggleButton.innerHTML = '<i class="fas fa-times" aria-hidden="true"></i>';
    };

    toggleButton.addEventListener("click", () => {
        if (navbarContent.classList.contains("is-open")) {
            closeMenu();
            return;
        }
        openMenu();
    });

    navbarContent.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
            if (window.innerWidth <= MOBILE_BREAKPOINT) {
                closeMenu();
            }
        });
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > MOBILE_BREAKPOINT) {
            clearMobileMenuFixes();
            closeMenu();
            return;
        }

        applyMobileMenuFixes();
    });

    applyMobileMenuFixes();
})();
