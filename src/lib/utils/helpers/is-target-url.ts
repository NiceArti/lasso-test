/**
 * Determines whether a given URL corresponds to the ChatGPT
 * conversation submission endpoint.
 *
 * This helper is used to precisely filter outgoing network requests
 * that contain user-generated conversation payloads, ensuring that
 * only relevant requests are intercepted and processed by the extension.
 *
 * @param url - The request URL extracted from the intercepted fetch call.
 * @returns `true` if the URL matches the ChatGPT conversation endpoint,
 *          otherwise `false`.
 */
export function isTargetUrl(url: string) {
    return url.toLowerCase() === "https://chatgpt.com/backend-api/f/conversation";
}