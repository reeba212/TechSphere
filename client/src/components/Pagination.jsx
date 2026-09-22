import React from 'react';

// Renders nothing for a single page. Shows at most 5 numbered buttons around the current page.
export default function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;

  const start = Math.max(1, Math.min(page - 2, pages - 4));
  const numbers = [];
  for (let n = start; n <= Math.min(pages, start + 4); n++) numbers.push(n);

  const base = 'min-w-10 rounded-md border px-3 py-2 text-sm transition';
  const idle = 'border-line text-muted hover:border-accent hover:text-accent';

  return (
    <nav aria-label='Pagination' className='mt-10 flex flex-wrap items-center justify-center gap-2'>
      <button
        type='button'
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        className={`${base} ${idle} disabled:cursor-not-allowed disabled:opacity-40`}
      >
        Prev
      </button>
      {numbers.map((n) => (
        <button
          key={n}
          type='button'
          aria-current={n === page ? 'page' : undefined}
          onClick={() => onChange(n)}
          className={`${base} ${n === page ? 'border-accent bg-accent/20 text-ink' : idle}`}
        >
          {n}
        </button>
      ))}
      <button
        type='button'
        disabled={page === pages}
        onClick={() => onChange(page + 1)}
        className={`${base} ${idle} disabled:cursor-not-allowed disabled:opacity-40`}
      >
        Next
      </button>
    </nav>
  );
}
