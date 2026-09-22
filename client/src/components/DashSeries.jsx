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
        <Link
          to='/create-series'
          className='rounded-md bg-gradient-to-r from-purple-500 to-blue-500 px-4 py-2 font-semibold hover:opacity-90'
        >
          New series
        </Link>
      </div>

      {error && <p className='mb-4 text-red-300'>{error}</p>}
      {!result && !error && <p className='text-gray-400'>Loading…</p>}
      {result?.series.length === 0 && <p className='py-10 text-center text-gray-400'>No series yet.</p>}

      {result?.series.length > 0 && (
        <div className='overflow-x-auto rounded-xl border border-gray-800'>
          <table className='w-full text-left text-sm'>
            <thead className='bg-[#181818] text-xs uppercase text-gray-400'>
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
                <tr key={series._id} className='border-t border-gray-800 bg-[#121212]'>
                  <td className='max-w-xs px-4 py-3'>
                    <Link to={`/series/${series.slug}`} className='font-medium hover:text-purple-300'>
                      {series.title}
                    </Link>
                  </td>
                  <td className='px-4 py-3 text-gray-400'>{categoryLabel(series.category)}</td>
                  <td className='px-4 py-3'>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        series.published ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'
                      }`}
                    >
                      {series.published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className='whitespace-nowrap px-4 py-3 text-gray-400'>{formatDate(series.createdAt)}</td>
                  <td className='whitespace-nowrap px-4 py-3 text-right'>
                    <button
                      type='button'
                      onClick={() => togglePublished(series)}
                      className='mr-3 text-gray-300 hover:text-white'
                    >
                      {series.published ? 'Unpublish' : 'Publish'}
                    </button>
                    <Link to={`/edit-series/${series.slug}`} className='mr-3 text-purple-300 hover:text-purple-200'>
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
