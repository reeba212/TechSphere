import { htmlToText } from './sanitize.js';

const MIN_WORDS = 220; // ~300 tokens
const MAX_WORDS = 380; // ~500 tokens
const OVERLAP_WORDS = 40;

const HEADING_RE = /<h([1-6])[^>]*>(.*?)<\/h\1>/gis;

// Splits sanitized article HTML into sections at each heading, carrying a
// breadcrumb of the enclosing headings (e.g. "Setup > Installation").
const splitByHeading = (html) => {
    const sections = [];
    const stack = []; // [{ level, title }]
    let lastIndex = 0;
    let match;
    let pendingTitle = null;
    let pendingLevel = 0;

    const flush = (end) => {
        const text = htmlToText(html.slice(lastIndex, end));
        if (text) sections.push({ headingPath: stack.map((h) => h.title).join(' > ') || null, text });
    };

    HEADING_RE.lastIndex = 0;
    while ((match = HEADING_RE.exec(html))) {
        flush(match.index);
        const level = Number(match[1]);
        const title = htmlToText(match[2]);
        while (stack.length && stack[stack.length - 1].level >= level) stack.pop();
        if (title) stack.push({ level, title });
        lastIndex = HEADING_RE.lastIndex;
    }
    flush(html.length);

    return sections;
};

const chunkWords = (words, headingPath) => {
    const chunks = [];
    let start = 0;
    while (start < words.length) {
        const end = Math.min(start + MAX_WORDS, words.length);
        chunks.push({ headingPath, text: words.slice(start, end).join(' ') });
        if (end === words.length) break;
        start = end - OVERLAP_WORDS;
    }
    return chunks;
};

// chunkArticle(html) -> [{ headingPath, text }], ~300-500 tokens each with overlap,
// each chunk tagged with the heading it falls under for source citations.
export const chunkArticle = (html) => {
    const sections = splitByHeading(html);
    const chunks = [];
    for (const section of sections) {
        const words = section.text.split(' ').filter(Boolean);
        if (words.length === 0) continue;
        if (words.length <= MAX_WORDS + MIN_WORDS) {
            chunks.push({ headingPath: section.headingPath, text: words.join(' ') });
        } else {
            chunks.push(...chunkWords(words, section.headingPath));
        }
    }
    return chunks.map((c, position) => ({ ...c, position }));
};
