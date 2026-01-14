/**
 * Extracts all email addresses from a given text.
 *
 * The function scans the input string using a case-insensitive
 * regular expression and returns a list of unique, normalized
 * email addresses.
 *
 * - Supports common email formats (e.g. user.name+tag@gmail.com)
 * - Ignores invalid or malformed addresses
 * - Removes duplicates
 * - Normalizes emails to lowercase
 *
 * This function is designed for decision-making pipelines,
 * text preprocessing, and lightweight validation (not full RFC-5322 compliance).
 *
 * @param text - The input text to scan for email addresses.
 * @returns An array of unique email addresses found in the text.
 *
 * @example
 * getEmails("Contact me at test@gmail.com")
 * // → ["test@gmail.com"]
 *
 * @example
 * getEmails("Emails: A@A.com, b@b.io")
 * // → ["a@a.com", "b@b.io"]
 */
export function getEmails(text: string): string[] {
    if (!text) return [];

    const matches = text.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi) ?? [];

    // Remove dups & return array
    return Array.from(
        new Set(matches.map(e => e.toLowerCase().trim()))
    );
}