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
      {!items && !error && <p className='text-gray-400'>Loading…</p>}
      {items?.length === 0 && <p className='py-10 text-center text-gray-400'>No completed articles yet.</p>}
      {items?.length > 0 && (
        <ul className='flex flex-col gap-2'>
          {items.map((p) => (
            <li
              key={p._id}
              className='flex items-center justify-between gap-3 rounded-md border border-gray-800 bg-[#121212] p-3'
            >
              <Link to={`/post/${p.post.slug}`} className='min-w-0 truncate font-medium hover:text-purple-300'>
                {p.post.title}
              </Link>
              <span className='shrink-0 text-sm text-gray-500'>{formatDate(p.completedAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
