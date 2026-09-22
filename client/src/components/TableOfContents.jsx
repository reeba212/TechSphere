import React, { useEffect, useState } from 'react';

// Lists h1–h4 of the article and highlights the section currently in view.
export default function TableOfContents({ headings }) {
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    if (!headings.length) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible) setActiveId(visible.target.id);
      },
      { rootMargin: '0px 0px -70% 0px' }
    );
    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 2) return null;

  const minLevel = Math.min(...headings.map((h) => h.level));

  return (
    <nav aria-label='Table of contents' className='rounded-xl border border-gray-800 bg-[#121212] p-4'>
      <h2 className='mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400'>On this page</h2>
      <ul className='space-y-2 text-sm'>
        {headings.map((h) => (
          <li key={h.id} style={{ paddingLeft: `${(h.level - minLevel) * 12}px` }}>
            <a
              href={`#${h.id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                setActiveId(h.id);
              }}
              className={`block transition hover:text-white ${
                activeId === h.id ? 'font-medium text-purple-300' : 'text-gray-400'
              }`}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
