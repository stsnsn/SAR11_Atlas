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

    function createSiteLogo() {
        if (document.body.hasAttribute("data-theme-embedded") || document.querySelector("[data-site-logo]")) return;

        const header = document.createElement("div");
        header.className = "site-logo-header";
        header.setAttribute("data-site-logo", "");

        const wrapper = document.createElement("span");
        wrapper.className = "site-logo-wrap";

        const logo = document.createElement("img");
        logo.className = "site-logo";
        logo.src = "../data/image/favicon/sga_logo_full_horizontal.svg";
        logo.alt = "SAR11 Genome Atlas logo";

        wrapper.appendChild(logo);
        header.appendChild(wrapper);

        const main = document.querySelector("main[role='main'], [role='main']");
        if (main) {
            const title = main.querySelector("h1");
            const titleContainer = title && title.parentElement !== main ? title.parentElement : null;
            if (titleContainer) {
                titleContainer.classList.add("site-title-after-logo");
                main.insertBefore(header, titleContainer);
            } else {
                main.insertBefore(header, main.firstChild);
            }
            return;
        }

        const standaloneTitle = document.body.querySelector("h1");
        document.body.insertBefore(header, standaloneTitle || document.body.firstChild);
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

    function applyTheme(dark, persist) {
        document.body.classList.toggle("dark-mode", dark);

        const table = document.getElementById("table");
        if (table) table.classList.toggle("dark-mode", dark);

        document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
            button.textContent = dark ? "Light mode" : "Dark mode";
            button.setAttribute("aria-pressed", String(dark));
        });

        if (persist) saveTheme(dark);
        notifySyncedFrames(dark);
        window.dispatchEvent(new CustomEvent("sar11:themechange", { detail: { dark } }));
    }

    function initializeTheme() {
        createSiteLogo();
        initializeSyncedFrames();
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
