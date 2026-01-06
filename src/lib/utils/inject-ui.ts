import { UI_ROOT_ID } from "../constants";

/**
 * Injects and initializes the root container for the extension UI.
 *
 * This helper ensures that a single, stable DOM mount point exists
 * for rendering the extension's interface. If the root element does
 * not yet exist, it is created and appended to the document body.
 *
 * A Shadow DOM is attached to the root element to:
 * - isolate extension styles from the host page,
 * - prevent CSS leakage in both directions,
 * - and ensure consistent UI rendering regardless of the page environment.
 *
 * @returns The `ShadowRoot` used as the mounting target for the UI.
 */
export function injectUI() {
    let root = document.getElementById(UI_ROOT_ID);

    if (!root) {
        root = document.createElement("div");
        root.id = UI_ROOT_ID;
        document.body.appendChild(root);
    }

    const shadow = root.shadowRoot ?? root.attachShadow({ mode: "open" });
    return shadow;
}