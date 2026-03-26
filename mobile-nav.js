(() => {
    const MOBILE_BREAKPOINT = 768;
    const toggleButton = document.querySelector(".mobile-nav-toggle");
    const navbarContent = document.querySelector(".navbar-content");

    if (!toggleButton || !navbarContent) return;

    const closeMenu = () => {
        navbarContent.classList.remove("is-open");
        toggleButton.setAttribute("aria-expanded", "false");
        toggleButton.innerHTML = '<i class="fas fa-bars" aria-hidden="true"></i>';
    };

    const openMenu = () => {
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
            closeMenu();
        }
    });
})();
