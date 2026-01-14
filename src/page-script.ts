import type { ChatGPTConversationPayload } from "./lib/types";
import {
    isTargetUrl,
    getEmails,
    getExtractedUrl,
    getBodyFromArgs,
    getMergedMessageParts,
    getDismissedEmails,
} from "./lib/utils/helpers";

console.log("🔥 LASSO page script loaded");

/**
 * ---------------------------------------------------------------------------
 * Page Script State
 * ---------------------------------------------------------------------------
 *
 * The page script operates within the page context and is responsible for
 * intercepting outgoing `fetch` calls. Since user interaction is asynchronous,
 * we temporarily store the pending request state while awaiting a decision
 * from the UI (cancel or submit).
 *
 * Only a single pending request is supported at a time, which is sufficient
 * for the ChatGPT interaction flow.
 */
let pendingResolve: ((value: Response) => void) | null = null;
let pendingArgs: [RequestInfo | URL, RequestInit?] | null = null;
let pendingParsed: ChatGPTConversationPayload | null = null;


/**
 * Preserve a reference to the native `fetch` implementation so it can be
 * invoked later without recursion.
 */
const originalFetch = window.fetch;

/**
 * ---------------------------------------------------------------------------
 * Fetch Interception
 * ---------------------------------------------------------------------------
 *
 * Overrides the native `fetch` function in order to inspect outgoing ChatGPT
 * conversation requests before they are dispatched.
 *
 * Non-target requests are passed through untouched.
 */
window.fetch = async function (...args) {
    const url = getExtractedUrl(args[0]);

    // Only intercept ChatGPT conversation submission requests
    if (!isTargetUrl(url ?? "")) {
        return originalFetch.apply(this, args);
    }

    const body = getBodyFromArgs(args) ?? "";
    const parsed = JSON.parse(body) as ChatGPTConversationPayload;

    const mergedParts = getMergedMessageParts(parsed.messages);
    const emailsFound = getEmails(mergedParts);
    const dismissedEmails = await getDismissedEmails();

    const dismissedSet = new Set(
        dismissedEmails.map(e => e.toLowerCase().trim())
    );

    const filteredEmails = emailsFound.filter(
        email => !dismissedSet.has(email.toLowerCase().trim())
    );


    // If no issues are detected, allow the request to proceed unmodified
    if (filteredEmails.length === 0) {
        return originalFetch.apply(this, args);
    }

    /**
     * Notify the UI that issues were found and pause request dispatch
     * until the user makes a decision.
     */
    window.dispatchEvent(
        new CustomEvent("lasso:open", {
            detail: {
                text: mergedParts,
                emails: filteredEmails,
            },
        })
    );

    // Pause the request until the user responds via the UI
    return new Promise((resolve) => {
        pendingResolve = resolve;
        pendingArgs = args;
        pendingParsed = parsed;
    });
};

/**
 * ---------------------------------------------------------------------------
 * Cancel Handling
 * ---------------------------------------------------------------------------
 *
 * If the user cancels the operation, the original request is dispatched
 * without any modification.
 */
window.addEventListener("lasso:cancel", () => {
    if (!pendingResolve || !pendingArgs) return;

    console.log("↩️ Cancel → sending original request");

    originalFetch(...pendingArgs).then(pendingResolve);

    // Clear pending state
    pendingResolve = null;
    pendingArgs = null;
    pendingParsed = null;
});

/**
 * ---------------------------------------------------------------------------
 * Submit Handling
 * ---------------------------------------------------------------------------
 *
 * When the user submits a modified version of the message, the payload
 * is patched accordingly and sent to the ChatGPT backend.
 *
 * The page script does not perform anonymization logic itself — it
 * trusts the UI to provide the final, user-approved text.
 */
window.addEventListener("lasso:submit", (event: any) => {
    if (!pendingResolve || !pendingArgs || !pendingParsed) return;

    const { modifiedText } = event.detail;

    console.log("✅ Submit → sending user-modified request");

    const patchedPayload: ChatGPTConversationPayload = {
        ...pendingParsed,
        messages: pendingParsed.messages.map((m) =>
            m.author.role === "user"
                ? {
                    ...m,
                    content: {
                        ...m.content,
                        parts: [modifiedText],
                    },
                }
                : m
        ),
    };

    const newBody = JSON.stringify(patchedPayload);
    const [input, init] = pendingArgs;

    originalFetch(input, {
        ...init,
        body: newBody,
    }).then(pendingResolve);

    // Clear pending state
    pendingResolve = null;
    pendingArgs = null;
    pendingParsed = null;
});
