import DOMPurify from 'dompurify';
import hljs from 'highlight.js/lib/common';

const slugify = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// Defence in depth: the server already sanitizes on save, we sanitize again before rendering.
const sanitize = (html) =>
  DOMPurify.sanitize(html, { ADD_ATTR: ['target', 'data-list', 'data-language'] });

const highlight = (text, language) => {
  if (language && hljs.getLanguage(language)) {
    return hljs.highlight(text, { language, ignoreIllegals: true }).value;
  }
  return hljs.highlightAuto(text).value;
};

const buildCodeBlock = (doc, text, language) => {
  const wrapper = doc.createElement('div');
  wrapper.className = 'code-block';

  const button = doc.createElement('button');
  button.type = 'button';
  button.className = 'copy-btn';
  button.textContent = 'Copy';

  const pre = doc.createElement('pre');
  const code = doc.createElement('code');
  code.className = 'hljs';
  code.innerHTML = highlight(text, language); // hljs escapes the source text
  pre.appendChild(code);

  wrapper.append(button, pre);
  return wrapper;
};

/**
 * Turns stored article HTML into render-ready HTML plus a list of headings for the
 * table of contents: sanitizes, converts code blocks (Quill 2 containers or <pre>) into
 * highlighted blocks with a copy button, and gives h1–h4 stable ids.
 */
export const prepareArticle = (html) => {
  const doc = new DOMParser().parseFromString(sanitize(html || ''), 'text/html');

  doc.querySelectorAll('.ql-code-block-container').forEach((container) => {
    const lines = [...container.querySelectorAll('.ql-code-block')];
    const text = lines.map((l) => l.textContent).join('\n');
    const language = lines[0]?.getAttribute('data-language');
    container.replaceWith(buildCodeBlock(doc, text, language && language !== 'plain' ? language : undefined));
  });
  doc.querySelectorAll('pre').forEach((pre) => {
    if (pre.closest('.code-block')) return;
    pre.replaceWith(buildCodeBlock(doc, pre.textContent, undefined));
  });

  const used = new Map();
  const headings = [];
  doc.querySelectorAll('h1, h2, h3, h4').forEach((el) => {
    const text = el.textContent.trim();
    if (!text) return;
    const base = slugify(text) || 'section';
    const count = used.get(base) || 0;
    used.set(base, count + 1);
    const id = count ? `${base}-${count + 1}` : base;
    el.id = id;
    headings.push({ id, text, level: Number(el.tagName[1]) });
  });

  return { html: doc.body.innerHTML, headings };
};
