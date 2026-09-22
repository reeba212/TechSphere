import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Pagination from './Pagination';
import { apiFetch, categoryLabel, formatDate } from '../utils/format';

const PAGE_SIZE = 10;

export default function DashSeries() {
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setResult(await apiFetch(`/api/series?published=all&limit=${PAGE_SIZE}&page=${page}`));
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const togglePublished = async (series) => {
    try {
      await apiFetch(`/api/series/${series._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !series.published }),
      });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (series) => {
    if (!window.confirm(`Delete "${series.title}"? This cannot be undone.`)) return;
    try {
      await apiFetch(`/api/series/${series._id}`, { method: 'DELETE' });
      if (result.series.length === 1 && page > 1) setPage(page - 1);
      else load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className='w-full p-4'>
      <div className='mb-6 flex items-center justify-between'>
        <h1 className='text-2xl font-semibold'>Series</h1>
        <Link to='/create-series' className='btn-primary'>
          New series
        </Link>
      </div>

      {error && <p className='mb-4 text-red-300'>{error}</p>}
      {!result && !error && <p className='text-muted'>Loading…</p>}
      {result?.series.length === 0 && <p className='py-10 text-center text-muted'>No series yet.</p>}

      {result?.series.length > 0 && (
        <div className='overflow-x-auto rounded-xl border border-line'>
          <table className='w-full text-left text-sm'>
            <thead className='bg-surface-2 text-xs uppercase text-muted'>
              <tr>
                <th className='px-4 py-3'>Title</th>
                <th className='px-4 py-3'>Category</th>
                <th className='px-4 py-3'>Status</th>
                <th className='px-4 py-3'>Created</th>
                <th className='px-4 py-3 text-right'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {result.series.map((series) => (
                <tr key={series._id} className='border-t border-line bg-surface'>
                  <td className='max-w-xs px-4 py-3'>
                    <Link to={`/series/${series.slug}`} className='font-medium hover:text-accent'>
                      {series.title}
                    </Link>
                  </td>
                  <td className='px-4 py-3 text-muted'>{categoryLabel(series.category)}</td>
                  <td className='px-4 py-3'>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        series.published ? 'bg-success/20 text-success' : 'bg-warn/20 text-warn'
                      }`}
                    >
                      {series.published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className='whitespace-nowrap px-4 py-3 text-muted'>{formatDate(series.createdAt)}</td>
                  <td className='whitespace-nowrap px-4 py-3 text-right'>
                    <button
                      type='button'
                      onClick={() => togglePublished(series)}
                      className='mr-3 text-muted hover:text-accent'
                    >
                      {series.published ? 'Unpublish' : 'Publish'}
                    </button>
                    <Link to={`/edit-series/${series.slug}`} className='mr-3 text-muted underline hover:text-accent'>
                      Edit
                    </Link>
                    <button type='button' onClick={() => remove(series)} className='text-red-400 hover:text-red-300'>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {result && <Pagination page={result.page} pages={result.pages} onChange={setPage} />}
    </div>
  );
}
