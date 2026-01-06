/**
 * Normalizes the request target into a string URL.
 *
 * The Fetch API allows the request target to be provided as:
 * - a string URL,
 * - a `URL` object,
 * - or a `Request` instance.
 *
 * This helper abstracts over these variants and consistently
 * returns a string representation of the request URL.
 *
 * @param input - The first argument passed to the `fetch` call.
 * @returns A string URL if it can be resolved, otherwise `null`.
 */
export function getExtractedUrl(input: string | URL | Request): string | null {
    if (typeof input === "string") return input;
    if (input instanceof Request) return input.url;
    if (input instanceof URL) return input.toString();
    return null;
}
