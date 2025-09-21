// utils/domUtils.ts

/**
 * Strips HTML tags from a string to return plain text.
 * @param html The input string containing HTML.
 * @returns The plain text content.
 */
export const stripHtml = (html: string): string => {
    // Use a temporary div to parse the HTML and extract text content
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
};
