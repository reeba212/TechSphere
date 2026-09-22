import React, { useCallback } from 'react';
import 'react-quill-new/dist/quill.snow.css';
import 'highlight.js/styles/github-dark.css';

// `html` must come from prepareArticle() (sanitized, code blocks converted, headings given ids).
export default function ArticleContent({ html }) {
  const handleClick = useCallback(async (e) => {
    const button = e.target.closest('.copy-btn');
    if (!button) return;
    const code = button.parentElement.querySelector('code');
    try {
      await navigator.clipboard.writeText(code.textContent);
      button.textContent = 'Copied!';
    } catch {
      button.textContent = 'Press Ctrl+C';
    }
    setTimeout(() => {
      button.textContent = 'Copy';
    }, 1500);
  }, []);

  return (
    <div className='ql-snow'>
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
      <div className='ql-editor article-body' onClick={handleClick} dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
