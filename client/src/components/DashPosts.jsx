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
        <Link
          to='/create-post'
          className='rounded-md bg-gradient-to-r from-purple-500 to-blue-500 px-4 py-2 font-semibold hover:opacity-90'
        >
          New post
        </Link>
      </div>

      {error && <p className='mb-4 text-red-300'>{error}</p>}
      {!result && !error && <p className='text-gray-400'>Loading…</p>}
      {result?.posts.length === 0 && <p className='py-10 text-center text-gray-400'>No posts yet.</p>}

      {result?.posts.length > 0 && (
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
              {result.posts.map((post) => (
                <tr key={post._id} className='border-t border-gray-800 bg-[#121212]'>
                  <td className='max-w-xs px-4 py-3'>
                    <Link to={`/post/${post.slug}`} className='font-medium hover:text-purple-300'>
                      {post.title}
                    </Link>
                  </td>
                  <td className='px-4 py-3 text-gray-400'>{categoryLabel(post.category)}</td>
                  <td className='px-4 py-3'>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        post.published ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'
                      }`}
                    >
                      {post.published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className='whitespace-nowrap px-4 py-3 text-gray-400'>{formatDate(post.createdAt)}</td>
                  <td className='whitespace-nowrap px-4 py-3 text-right'>
                    <button
                      type='button'
                      onClick={() => togglePublished(post)}
                      className='mr-3 text-gray-300 hover:text-white'
                    >
                      {post.published ? 'Unpublish' : 'Publish'}
                    </button>
                    <Link to={`/edit-post/${post.slug}`} className='mr-3 text-purple-300 hover:text-purple-200'>
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
