(function () {
    const maxRetries = 30;
    const retryDelayMs = 250;

    function getPageData() {
        const body = document.body;

        return {
            page: body.dataset.analyticsPage || document.title,
            lang: document.documentElement.lang || "unknown",
            path: window.location.pathname,
            title: document.title
        };
    }

    function trackUmami(eventName, eventData, attempt) {
        if (window.umami && typeof window.umami.track === "function") {
            window.umami.track(eventName, eventData);
            return;
        }

        if (attempt >= maxRetries) {
            return;
        }

        window.setTimeout(function () {
            trackUmami(eventName, eventData, attempt + 1);
        }, retryDelayMs);
    }

    function track(eventName, eventData) {
        trackUmami(eventName, eventData, 0);
    }

    function trackPageView() {
        track("Page Viewed", getPageData());
    }

    function trackSectionViews() {
        const sections = document.querySelectorAll("[data-analytics-view]");

        if (!sections.length || !("IntersectionObserver" in window)) {
            return;
        }

        const viewedSections = new Set();
        const pageData = getPageData();

        const observer = new IntersectionObserver(function (entries) {
            for (const entry of entries) {
                if (!entry.isIntersecting) {
                    continue;
                }

                const sectionName = entry.target.dataset.analyticsView;

                if (!sectionName || viewedSections.has(sectionName)) {
                    continue;
                }

                viewedSections.add(sectionName);

                track("Section Viewed", {
                    page: pageData.page,
                    lang: pageData.lang,
                    path: pageData.path,
                    section: sectionName
                });
            }
        }, {
            threshold: 0.5
        });

        sections.forEach(function (section) {
            observer.observe(section);
        });
    }

    document.addEventListener("DOMContentLoaded", function () {
        trackPageView();
        trackSectionViews();
    });
})();
