import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch, formatDate } from '../utils/format';

export default function DashCompleted() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/api/progress?completed=true')
      .then(setItems)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className='w-full p-4'>
      <h1 className='mb-6 text-2xl font-semibold'>Completed</h1>
      {error && <p className='text-red-300'>{error}</p>}
      {!items && !error && <p className='text-muted'>Loading…</p>}
      {items?.length === 0 && <p className='py-10 text-center text-muted'>No completed articles yet.</p>}
      {items?.length > 0 && (
        <ul className='flex flex-col gap-2'>
          {items.map((p) => (
            <li key={p._id} className='surface-card flex items-center justify-between gap-3 p-3'>
              <Link to={`/post/${p.post.slug}`} className='min-w-0 truncate font-medium hover:text-accent'>
                {p.post.title}
              </Link>
              <span className='shrink-0 text-sm text-muted'>{formatDate(p.completedAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
