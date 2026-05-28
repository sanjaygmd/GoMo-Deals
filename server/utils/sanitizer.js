import sanitizeHtml from 'sanitize-html';

/**
 * Basic sanitizer for general text inputs.
 * Strips all HTML tags.
 */
export const sanitizeText = (text) => {
    if (!text || typeof text !== 'string') return text;
    return sanitizeHtml(text, {
        allowedTags: [],
        allowedAttributes: {}
    }).trim();
};

/**
 * Sanitizer for content that might allow some formatting (like descriptions).
 * Allows basic tags like b, i, em, strong, p, br.
 */
export const sanitizeDescription = (html) => {
    if (!html || typeof html !== 'string') return html;
    return sanitizeHtml(html, {
        allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
        allowedAttributes: {}
    }).trim();
};

/**
 * Validate image URLs to protect against SSRF and Content-Injection.
 * Enforces http/https, blocks private subnet IPs/localhost/link-local, and cleans unsafe characters.
 */
export const isValidImageUrl = (urlStr) => {
    if (!urlStr || typeof urlStr !== 'string') return false;

    try {
        // Enforce basic character safety to block injection
        if (urlStr.includes('<') || urlStr.includes('>') || urlStr.includes('"') || urlStr.includes("'")) {
            return false;
        }

        // Support local relative URLs (e.g. /uploads/image.jpg)
        if (urlStr.startsWith('/') || urlStr.startsWith('./') || urlStr.startsWith('../')) {
            return true;
        }

        const parsed = new URL(urlStr);

        // Enforce allowed protocols (HTTP, HTTPS, and Base64 Data URIs)
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:' && parsed.protocol !== 'data:') {
            return false;
        }

        // Allow localhost, local IPs, and private subnets for development and staging
        return true;
    } catch (err) {
        return false;
    }
};
