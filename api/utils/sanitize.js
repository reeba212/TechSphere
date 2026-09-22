import sanitizeHtml from 'sanitize-html';

const COLOR = [/^#[0-9a-f]{3,8}$/i, /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/i];

// Allows what the Quill editor produces (headings, lists, code blocks, links,
// images, inline formatting) and nothing else: no scripts, iframes or event handlers.
const ARTICLE_OPTIONS = {
    allowedTags: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr', 'blockquote',
        'ul', 'ol', 'li', 'pre', 'code', 'strong', 'b', 'em', 'i', 'u', 's',
        'a', 'img', 'span', 'div', 'sub', 'sup',
    ],
    allowedAttributes: {
        a: ['href', 'target', 'rel'],
        img: ['src', 'alt', 'width', 'height'],
        li: ['data-list'],
        span: ['contenteditable', 'style'],
        div: ['data-language', 'spellcheck'],
        p: ['style'],
        '*': ['class'],
    },
    allowedClasses: { '*': ['ql-*'] },
    allowedStyles: {
        '*': { color: COLOR, 'background-color': COLOR },
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: { img: ['http', 'https'] },
    transformTags: {
        a: (tagName, attribs) => ({
            tagName,
            attribs: { ...attribs, target: '_blank', rel: 'noopener noreferrer nofollow' },
        }),
    },
};

export const sanitizeArticleHtml = (html) => sanitizeHtml(html || '', ARTICLE_OPTIONS);

const ENTITIES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" };

// Block-level boundaries become spaces first so "<h2>A</h2><p>B</p>" reads "A B", not "AB".
const BLOCK_BOUNDARY = /<\/(p|h[1-6]|li|div|blockquote|pre|ul|ol)>|<br\s*\/?>/gi;

export const htmlToText = (html) =>
    sanitizeHtml((html || '').replace(BLOCK_BOUNDARY, ' $&'), { allowedTags: [], allowedAttributes: {} })
        .replace(/&(amp|lt|gt|quot|#39);/g, (m) => ENTITIES[m])
        .replace(/\s+/g, ' ')
        .trim();

export const makeExcerpt = (html, max = 180) => {
    const text = htmlToText(html);
    return text.length <= max ? text : `${text.slice(0, max).trimEnd()}…`;
};

export const readTimeMins = (html) => {
    const words = htmlToText(html).split(' ').filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 200));
};
