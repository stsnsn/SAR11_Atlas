(function () {
    "use strict";

    const STORAGE_KEY = "sar11-theme";

    function readSavedTheme() {
        try {
            return window.localStorage.getItem(STORAGE_KEY);
        } catch (error) {
            return null;
        }
    }

    function saveTheme(dark) {
        try {
            window.localStorage.setItem(STORAGE_KEY, dark ? "dark" : "light");
        } catch (error) {
            // The theme still works when storage is unavailable.
        }
    }

    function initializeNavbarBrand() {
        if (document.body.hasAttribute("data-theme-embedded")) return;

        const brand = document.querySelector(".navbar-brand");
        if (!brand || brand.querySelector("[data-navbar-brand-lockup]")) return;

        brand.setAttribute("aria-label", "SAR11 Genome Atlas home");

        const emblem = document.createElement("img");
        emblem.className = "navbar-brand-lockup__emblem";
        emblem.src = "../data/image/favicon/favicon_30right.svg";
        emblem.alt = "";

        const wordmark = document.createElement("span");
        wordmark.className = "navbar-brand-lockup__wordmark";

        const title = document.createElement("span");
        title.className = "navbar-brand-lockup__title";
        title.textContent = "SAR11 Genome Atlas";

        const subtitle = document.createElement("span");
        subtitle.className = "navbar-brand-lockup__subtitle";
        subtitle.textContent = "Connecting genomes, orthogroups, and function";

        const rule = document.createElement("span");
        rule.className = "navbar-brand-lockup__rule";
        rule.setAttribute("aria-hidden", "true");

        wordmark.append(title, subtitle, rule);
        wordmark.setAttribute("data-navbar-brand-lockup", "");
        brand.replaceChildren(emblem, wordmark);
    }

    function positionThemeToggles() {
        const heading = document.querySelector(".atlas-page-heading, .og-page-heading");
        if (!heading) return;

        const description = document.querySelector(".atlas-intro, .og-intro");
        if (description && !heading.contains(description)) {
            description.classList.add("page-heading-description");
            heading.appendChild(description);
        }

        document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
            button.classList.remove("mb-3", "theme-toggle--floating");
            button.classList.add("theme-toggle--heading");
            heading.appendChild(button);
        });
    }

    function notifySyncedFrames(dark) {
        document.querySelectorAll("iframe[data-theme-sync]").forEach((frame) => {
            if (frame.contentWindow) {
                frame.contentWindow.postMessage({ type: "sar11-theme", dark }, "*");
            }
        });
    }

    function initializeSyncedFrames() {
        document.querySelectorAll("iframe[data-theme-sync]").forEach((frame) => {
            frame.addEventListener("load", () => {
                const dark = document.body.classList.contains("dark-mode");
                if (frame.contentWindow) {
                    frame.contentWindow.postMessage({ type: "sar11-theme", dark }, "*");
                }
            });
        });
    }

    function initializeEmbedStates() {
        document.querySelectorAll("iframe.atlas-content-frame, iframe.atlas-embed-frame, iframe.og-embed-frame").forEach((frame) => {
            if (
                frame.dataset.embedStateInitialized === "true" ||
                frame.hasAttribute("data-no-embed-status") ||
                frame.getAttribute("src") === "about:blank"
            ) return;

            frame.dataset.embedStateInitialized = "true";
            frame.setAttribute("aria-busy", "true");
            const status = document.createElement("p");
            status.className = "atlas-embed-status";
            status.setAttribute("role", "status");
            status.textContent = "Loading embedded viewer...";
            frame.parentNode.insertBefore(status, frame);

            const finish = () => {
                frame.removeAttribute("aria-busy");
                status.hidden = true;
            };
            frame.addEventListener("load", finish, { once: true });
            window.setTimeout(() => {
                if (!status.hidden) {
                    status.textContent = "This embedded viewer is taking longer than usual to load.";
                    status.classList.add("atlas-embed-status--slow");
                }
            }, 12000);
        });
    }

    function initializeTableScrollHints() {
        const update = () => {
            document.querySelectorAll(".atlas-table-wrap:not(.atlas-table-wrap--datatable-scroll)").forEach((wrap) => {
                wrap.classList.toggle("atlas-table-wrap--overflowing", wrap.scrollWidth > wrap.clientWidth + 2);
            });
        };
        update();
        window.addEventListener("resize", update, { passive: true });
    }

    function themeToggleIcon(mode) {
        if (mode === "deep") {
            return `
                <svg class="theme-toggle__icon" viewBox="0 0 28 20" aria-hidden="true">
                    <path d="M5 8.5h12.5a5 5 0 0 1 0 10H7.5a5 5 0 0 1-2.5-9.33V8.5Z" />
                    <path d="M10 8.5V5.75h5V8.5M12.5 5.75V3.5h3.25" />
                    <circle cx="10" cy="13.5" r="1.5" />
                    <circle cx="15" cy="13.5" r="1.5" />
                    <path class="theme-toggle__beam" d="m22 11 5-2.5v7L22 13" />
                </svg>`;
        }

        return `
            <svg class="theme-toggle__icon" viewBox="0 0 28 20" aria-hidden="true">
                <path class="theme-toggle__sun" d="M10 10a4 4 0 0 1 8 0M14 1.5V4M6.5 4.25 8.25 6M21.5 4.25 19.75 6" />
                <path d="M2 12.5c2.15-1.8 4.3-1.8 6.45 0s4.3 1.8 6.45 0 4.3-1.8 6.45 0 4.3 1.8 6.45 0M2 17c2.15-1.8 4.3-1.8 6.45 0s4.3 1.8 6.45 0 4.3-1.8 6.45 0 4.3 1.8 6.45 0" />
            </svg>`;
    }

    function renderThemeToggle(button, dark) {
        const nextMode = dark ? "shallow" : "deep";
        button.classList.toggle("is-deep", dark);
        button.innerHTML = `
            ${themeToggleIcon("shallow")}
            <span class="theme-toggle__track" aria-hidden="true">
                <span class="theme-toggle__knob"></span>
            </span>
            ${themeToggleIcon("deep")}`;
        button.setAttribute("aria-label", `Switch to ${nextMode} theme`);
        button.setAttribute("title", `Switch to ${nextMode} theme`);
    }

    function applyTheme(dark, persist) {
        document.body.classList.toggle("dark-mode", dark);

        const table = document.getElementById("table");
        if (table) table.classList.toggle("dark-mode", dark);

        document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
            renderThemeToggle(button, dark);
            button.setAttribute("aria-pressed", String(dark));
        });

        if (persist) saveTheme(dark);
        notifySyncedFrames(dark);
        window.dispatchEvent(new CustomEvent("sar11:themechange", { detail: { dark } }));
    }

    function initializeTheme() {
        initializeNavbarBrand();
        positionThemeToggles();
        initializeSyncedFrames();
        initializeEmbedStates();
        initializeTableScrollHints();
        const savedTheme = readSavedTheme();
        const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
        let dark = savedTheme ? savedTheme === "dark" : prefersDark;

        if (document.body.hasAttribute("data-theme-embedded")) {
            try {
                if (window.parent !== window) {
                    dark = window.parent.document.body.classList.contains("dark-mode");
                }
            } catch (error) {
                // A parent message will synchronize cross-origin embeds.
            }

            window.addEventListener("message", (event) => {
                if (event.source !== window.parent || !event.data || event.data.type !== "sar11-theme") return;
                applyTheme(Boolean(event.data.dark), false);
            });
        }

        document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
            button.addEventListener("click", () => {
                applyTheme(!document.body.classList.contains("dark-mode"), true);
            });
        });

        applyTheme(dark, false);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initializeTheme);
    } else {
        initializeTheme();
    }
}());
