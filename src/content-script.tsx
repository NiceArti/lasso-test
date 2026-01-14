import { createRoot } from "react-dom/client";
import { injectUI } from "./lib/utils/inject-ui";
import App from "./App";
import css from "./index.css?inline";
import { AppProvider } from "./providers";

console.log("[LASSO] Content script loaded");

window.addEventListener('message', (e) => {
    if (e.data?.source !== 'LASSO_PAGE') return;

    if (e.data.type === 'NEED_DISMISSED_EMAILS') {
        chrome.runtime.sendMessage(
            { type: 'GET_DISMISSED_EMAILS' },
            (emails) => {
                window.postMessage(
                    { source: 'LASSO_EXT', type: 'DISMISSED_EMAILS', payload: emails },
                    '*'
                );
            }
        );
    }
});

/**
 * ---------------------------------------------------------------------------
 * Page Script Injection
 * ---------------------------------------------------------------------------
 *
 * The page script is injected directly into the page context in order to
 * override the native `fetch` function. This is required because content
 * scripts operate in an isolated world and cannot directly intercept
 * page-level network requests.
 *
 * The injected script is removed immediately after execution to avoid
 * unnecessary DOM pollution.
 */
const pageScript = document.createElement("script");
pageScript.src = chrome.runtime.getURL("page-script.js");
pageScript.type = "text/javascript";
pageScript.async = false;

(document.head || document.documentElement).appendChild(pageScript);
pageScript.remove();

/**
 * ---------------------------------------------------------------------------
 * UI Injection
 * ---------------------------------------------------------------------------
 *
 * The extension UI is rendered inside a Shadow DOM to ensure full isolation
 * from the host page styles and to prevent CSS leakage in both directions.
 *
 * The `injectUI` helper guarantees that a single, stable ShadowRoot exists
 * and can be safely reused across reloads.
 */
const shadowRoot = injectUI();

/**
 * ---------------------------------------------------------------------------
 * Style Injection
 * ---------------------------------------------------------------------------
 *
 * Styles are injected once into the Shadow DOM using an inline `<style>` tag.
 * A custom data attribute is used to prevent duplicate style insertion in
 * case the content script is executed multiple times.
 */
if (!shadowRoot.querySelector("style[data-lasso]")) {
    const style = document.createElement("style");
    style.setAttribute("data-lasso", "true");
    style.textContent = css;
    shadowRoot.appendChild(style);
}

/**
 * ---------------------------------------------------------------------------
 * React Mount Point
 * ---------------------------------------------------------------------------
 *
 * A dedicated container element is created inside the Shadow DOM to serve
 * as the mounting point for the React application.
 */
let container = shadowRoot.querySelector<HTMLDivElement>("#lasso-react-root");

if (!container) {
    container = document.createElement("div");
    container.id = "lasso-react-root";
    shadowRoot.appendChild(container);
}

/**
 * ---------------------------------------------------------------------------
 * React Application Bootstrap
 * ---------------------------------------------------------------------------
 *
 * The React application is mounted using the modern `createRoot` API.
 * Rendering inside the Shadow DOM ensures predictable and isolated UI
 * behavior regardless of the host page environment.
 */
createRoot(container).render(
    <AppProvider>
        <App />
    </AppProvider>
);