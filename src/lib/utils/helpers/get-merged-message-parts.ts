import type { ChatMessage } from "@/lib/types";

/**
 * Merges all user-authored message parts into a single normalized string.
 *
 * ChatGPT conversation payloads may contain multiple messages and message parts,
 * including non-textual segments. This helper:
 * - selects only messages authored by the user,
 * - extracts textual content parts,
 * - concatenates them into a single string,
 * - and normalizes whitespace for reliable downstream processing.
 *
 * The resulting string represents the full user-submitted prompt as it will be
 * sent to the ChatGPT backend, making it suitable for inspection (e.g. detecting
 * sensitive data such as email addresses).
 *
 * @param messages - Array of conversation messages from the ChatGPT payload.
 * @returns A normalized string containing all user-authored text content.
 */
export function getMergedMessageParts(messages: ChatMessage[]): string {
    return messages
        .filter(m => m.author.role === "user")
        .flatMap(message => message.content.parts ?? [])
        .filter((p): p is string => typeof p === "string")
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
}