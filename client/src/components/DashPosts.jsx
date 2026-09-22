import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Pagination from './Pagination';
import { apiFetch, categoryLabel, formatDate } from '../utils/format';

const PAGE_SIZE = 10;

export default function DashPosts() {
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setResult(await apiFetch(`/api/post?published=all&limit=${PAGE_SIZE}&page=${page}`));
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const togglePublished = async (post) => {
    try {
      await apiFetch(`/api/post/${post._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !post.published }),
      });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (post) => {
    if (!window.confirm(`Delete "${post.title}"? This cannot be undone.`)) return;
    try {
      await apiFetch(`/api/post/${post._id}`, { method: 'DELETE' });
      // Deleting the last item on a page should step back a page.
      if (result.posts.length === 1 && page > 1) setPage(page - 1);
      else load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className='w-full p-4'>
      <div className='mb-6 flex items-center justify-between'>
        <h1 className='text-2xl font-semibold'>Posts</h1>
        <Link to='/create-post' className='btn-primary'>
          New post
        </Link>
      </div>

      {error && <p className='mb-4 text-red-300'>{error}</p>}
      {!result && !error && <p className='text-muted'>Loading…</p>}
      {result?.posts.length === 0 && <p className='py-10 text-center text-muted'>No posts yet.</p>}

      {result?.posts.length > 0 && (
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
              {result.posts.map((post) => (
                <tr key={post._id} className='border-t border-line bg-surface'>
                  <td className='max-w-xs px-4 py-3'>
                    <Link to={`/post/${post.slug}`} className='font-medium hover:text-accent'>
                      {post.title}
                    </Link>
                  </td>
                  <td className='px-4 py-3 text-muted'>{categoryLabel(post.category)}</td>
                  <td className='px-4 py-3'>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        post.published ? 'bg-success/20 text-success' : 'bg-warn/20 text-warn'
                      }`}
                    >
                      {post.published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className='whitespace-nowrap px-4 py-3 text-muted'>{formatDate(post.createdAt)}</td>
                  <td className='whitespace-nowrap px-4 py-3 text-right'>
                    <button
                      type='button'
                      onClick={() => togglePublished(post)}
                      className='mr-3 text-muted hover:text-accent'
                    >
                      {post.published ? 'Unpublish' : 'Publish'}
                    </button>
                    <Link to={`/edit-post/${post.slug}`} className='mr-3 text-muted underline hover:text-accent'>
                      Edit
                    </Link>
                    <button type='button' onClick={() => remove(post)} className='text-red-400 hover:text-red-300'>
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
