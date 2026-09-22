import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Pagination from '../components/Pagination';
import { apiFetch, categoryLabel } from '../utils/format';

export default function Series() {
  const { currentUser } = useSelector((state) => state.user);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch(`/api/series?page=${page}&limit=12`)
      .then(setResult)
      .catch((err) => setError(err.message));
  }, [page]);

  return (
    <main className='mx-auto w-full max-w-6xl px-4 py-10'>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div>
          <h1 className='text-3xl font-bold sm:text-4xl'>Learning paths</h1>
          <p className='mt-2 text-gray-400'>Structured series that build on each other, topic by topic.</p>
        </div>
        {currentUser?.isAdmin && (
          <Link
            to='/create-series'
            className='shrink-0 rounded-md bg-gradient-to-r from-purple-500 to-blue-500 px-4 py-2 font-semibold hover:opacity-90'
          >
            New series
          </Link>
        )}
      </div>

      {error && <p className='mt-8 text-red-300'>{error}</p>}
      {!result && !error && <p className='mt-8 text-gray-400'>Loading…</p>}
      {result?.series.length === 0 && (
        <p className='mt-16 py-10 text-center text-gray-400'>No learning paths published yet.</p>
      )}

      {result?.series.length > 0 && (
        <div className='mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
          {result.series.map((s) => (
            <Link
              key={s._id}
              to={`/series/${s.slug}`}
              className='flex flex-col gap-3 rounded-xl border border-gray-800 bg-[#121212] p-5 transition hover:border-purple-500/60'
            >
              <span className='w-fit rounded-full bg-purple-500/20 px-2.5 py-0.5 text-xs font-medium text-purple-300'>
                {categoryLabel(s.category)}
              </span>
              <span className='text-lg font-semibold'>{s.title}</span>
              {s.description && <span className='line-clamp-2 text-sm text-gray-400'>{s.description}</span>}
            </Link>
          ))}
        </div>
      )}

      {result && <Pagination page={result.page} pages={result.pages} onChange={setPage} />}
    </main>
  );
}
