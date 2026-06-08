import sanitizeHtml from 'sanitize-html';
import path from 'path';

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

        // Support local relative URLs strictly from known prefixes
        if (urlStr.startsWith('/uploads/')) {
            const normalized = path.normalize(urlStr).replace(/\\/g, '/');
            if (normalized.startsWith('/uploads/') && !normalized.includes('..')) {
                return true;
            }
            return false;
        }

        const parsed = new URL(urlStr);

        // Enforce allowed protocols (HTTP, HTTPS only)
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            return false;
        }

        // Block localhost, local IPs, and private subnets in production
        if (process.env.NODE_ENV === 'production') {
            const hostname = parsed.hostname;
            if (
                hostname === 'localhost' ||
                hostname.startsWith('127.') ||
                hostname.startsWith('10.') ||
                hostname.startsWith('192.168.') ||
                (hostname.startsWith('172.') && parseInt(hostname.split('.')[1], 10) >= 16 && parseInt(hostname.split('.')[1], 10) <= 31) ||
                hostname.endsWith('.local')
            ) {
                return false;
            }
        }
        
        return true;
    } catch (err) {
        return false;
    }
};
