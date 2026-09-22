import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PostCard from '../components/PostCard';
import { apiFetch } from '../utils/format';

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [posts, setPosts] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/api/category')
      .then(setCategories)
      .catch(() => {});
    apiFetch('/api/post?limit=6')
      .then((data) => setPosts(data.posts))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <main>
      <section className='px-4 py-20 text-center'>
        <h1 className='mx-auto max-w-3xl text-4xl font-bold leading-tight sm:text-6xl'>
          Learn tech,{' '}
          <span className='bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent'>
            one topic at a time
          </span>
        </h1>
        <p className='mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-gray-400'>
          Real explanations, not surface-level takes. Dig into web development, machine
          learning, cloud, security and more — written to actually build understanding,
          one well-structured article at a time.
        </p>
        <Link
          to='/search'
          className='mt-8 inline-block rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 px-6 py-3 font-semibold transition hover:opacity-90'
        >
          Browse all articles
        </Link>
      </section>

      {categories.length > 0 && (
        <section className='mx-auto w-full max-w-6xl px-4'>
          <div className='flex flex-wrap justify-center gap-2'>
            {categories.map((c) => (
              <Link
                key={c.slug}
                to={`/category/${c.slug}`}
                className='rounded-full border border-gray-700 px-4 py-1.5 text-sm text-gray-300 transition hover:border-purple-500 hover:text-white'
              >
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className='mx-auto w-full max-w-6xl px-4 py-14'>
        <div className='mb-6 flex items-end justify-between'>
          <h2 className='text-2xl font-semibold'>Latest articles</h2>
          <Link to='/search' className='text-sm text-purple-300 hover:text-purple-200'>
            View all →
          </Link>
        </div>
        {error && <p className='text-red-300'>{error}</p>}
        {!posts && !error && <p className='text-gray-400'>Loading…</p>}
        {posts?.length === 0 && <p className='py-10 text-center text-gray-400'>No articles published yet.</p>}
        {posts?.length > 0 && (
          <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
            {posts.map((p) => (
              <PostCard key={p._id} post={p} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
