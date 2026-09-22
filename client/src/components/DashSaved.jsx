import React, { useCallback, useEffect, useState } from 'react';
import Pagination from './Pagination';
import PostCard from './PostCard';
import { apiFetch } from '../utils/format';

const PAGE_SIZE = 9;

export default function DashSaved() {
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setResult(await apiFetch(`/api/bookmarks?limit=${PAGE_SIZE}&page=${page}`));
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className='w-full p-4'>
      <h1 className='mb-6 text-2xl font-semibold'>Saved articles</h1>
      {error && <p className='text-red-300'>{error}</p>}
      {!result && !error && <p className='text-muted'>Loading…</p>}
      {result?.posts.length === 0 && <p className='py-10 text-center text-muted'>No saved articles yet.</p>}
      {result?.posts.length > 0 && (
        <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
          {result.posts.map((p) => (
            <PostCard key={p._id} post={p} />
          ))}
        </div>
      )}
      {result && <Pagination page={result.page} pages={result.pages} onChange={setPage} />}
    </div>
  );
}
