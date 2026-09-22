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
      <section className='hero-dots-left px-4 py-20'>
        <div className='relative z-10 mx-auto grid max-w-6xl gap-10 lg:grid-cols-[auto_1fr] lg:items-center lg:gap-20'>
          <h1 className='text-4xl leading-tight sm:text-5xl md:text-6xl lg:text-7xl'>
            <span className='block whitespace-nowrap'>Learn tech.</span>
            <span className='block whitespace-nowrap'>Build understanding.</span>
            <span className='block whitespace-nowrap text-accent'>Go deeper.</span>
          </h1>
          <div>
            <p className='max-w-md text-lg leading-relaxed text-muted'>
              Learn about complex technical concepts, explore curated learning paths, track your
              progress, test your knowledge, and ask an AI tutor about what you're learning.
            </p>
            <div className='mt-8 flex flex-wrap gap-4'>
              <Link to='/search' className='btn-primary'>
                Browse all articles
              </Link>
              <Link to='/about' className='btn-outline'>
                About us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {categories.length > 0 && (
        <section className='mx-auto w-full max-w-6xl px-4'>
          <div className='flex flex-wrap justify-center gap-2'>
            {categories.map((c) => (
              <Link
                key={c.slug}
                to={`/category/${c.slug}`}
                className='rounded-full border border-line px-4 py-1.5 text-sm text-muted transition hover:border-accent hover:text-accent'
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
          <Link to='/search' className='text-sm text-muted hover:text-accent'>
            View all →
          </Link>
        </div>
        {error && <p className='text-red-300'>{error}</p>}
        {!posts && !error && <p className='text-muted'>Loading…</p>}
        {posts?.length === 0 && <p className='py-10 text-center text-muted'>No articles published yet.</p>}
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
