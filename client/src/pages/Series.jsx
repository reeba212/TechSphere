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
          <h1 className='text-3xl sm:text-4xl'>Learning paths</h1>
          <p className='mt-2 text-muted'>Structured series that build on each other, topic by topic.</p>
        </div>
        {currentUser?.isAdmin && (
          <Link to='/create-series' className='btn-primary shrink-0'>
            New series
          </Link>
        )}
      </div>

      {error && <p className='mt-8 text-red-300'>{error}</p>}
      {!result && !error && <p className='mt-8 text-muted'>Loading…</p>}
      {result?.series.length === 0 && (
        <p className='mt-16 py-10 text-center text-muted'>No learning paths published yet.</p>
      )}

      {result?.series.length > 0 && (
        <div className='mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
          {result.series.map((s) => (
            <Link key={s._id} to={`/series/${s.slug}`} className='surface-card flex flex-col gap-3 p-5'>
              <span className='tag w-fit'>{categoryLabel(s.category)}</span>
              <span className='text-lg font-semibold'>{s.title}</span>
              {s.description && <span className='line-clamp-2 text-sm text-muted'>{s.description}</span>}
            </Link>
          ))}
        </div>
      )}

      {result && <Pagination page={result.page} pages={result.pages} onChange={setPage} />}
    </main>
  );
}
