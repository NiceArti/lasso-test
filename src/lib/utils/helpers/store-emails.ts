type Issue = {
    id: string;
    timestamp: number;
    originalText: string;
    modifiedText: string;
    emails: string[];
};

const STORAGE_KEY = "issues";

/**
 * Persists a detected issue to browser storage.
 *
 * An issue represents a single interception event where sensitive
 * data (e.g. email addresses) was detected in user input.
 *
 * The function is intentionally minimal at the call site — it accepts
 * only the relevant business data, while internally generating
 * metadata such as unique identifiers and timestamps.
 *
 * @param emails - Detected email addresses.
 * @param originalText - Original user-submitted text.
 * @param modifiedText - User-approved (possibly anonymized) text.
 */
export function storeEmails(
    emails: string[],
    originalText: string,
    modifiedText: string,
): void {
    const issue: Issue = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        originalText,
        modifiedText,
        emails,
    };

    chrome.storage.local.get([STORAGE_KEY], (result) => {
        const existing: Issue[] = Array.isArray(result[STORAGE_KEY])
            ? result[STORAGE_KEY]
            : [];

        chrome.storage.local.set({
            [STORAGE_KEY]: [...existing, issue],
        });
    });
}
