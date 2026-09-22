import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ProgressBar from '../components/ProgressBar';
import { apiFetch, categoryLabel } from '../utils/format';
import NotFound from './NotFound';

export default function SeriesPage() {
  const { slug } = useParams();
  const { currentUser } = useSelector((state) => state.user);
  const [series, setSeries] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | missing | error

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setSeries(null);

    apiFetch(`/api/series/${slug}`)
      .then((data) => {
        if (cancelled) return;
        setSeries(data);
        setStatus('ready');
      })
      .catch((err) => {
        if (!cancelled) setStatus(err.message === 'Series not found' ? 'missing' : 'error');
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (status === 'loading') return <p className='p-20 text-center text-gray-400'>Loading…</p>;
  if (status === 'missing') return <NotFound />;
  if (status === 'error') return <p className='p-20 text-center text-red-300'>Could not load this series.</p>;

  const completedCount = series.posts.filter((p) => p.completed).length;
  const nextPost = series.posts.find((p) => !p.completed);

  return (
    <main className='mx-auto w-full max-w-3xl px-4 py-10'>
      <div className='mb-2 flex items-center gap-2 text-sm'>
        <Link
          to={`/category/${series.category}`}
          className='rounded-full bg-purple-500/20 px-3 py-1 font-medium text-purple-300 hover:bg-purple-500/30'
        >
          {categoryLabel(series.category)}
        </Link>
        {!series.published && (
          <span className='rounded-full bg-yellow-500/20 px-3 py-1 font-medium text-yellow-300'>Draft</span>
        )}
      </div>
      <h1 className='text-3xl font-bold sm:text-4xl'>{series.title}</h1>
      {series.description && <p className='mt-3 text-gray-400'>{series.description}</p>}

      {currentUser && series.posts.length > 0 && (
        <div className='mt-6'>
          <div className='mb-2 flex items-center justify-between text-sm text-gray-400'>
            <span>
              {completedCount}/{series.posts.length} completed
            </span>
            {nextPost && (
              <Link to={`/post/${nextPost.slug}`} className='font-medium text-purple-300 hover:text-purple-200'>
                {completedCount === 0 ? 'Start series' : 'Continue'} →
              </Link>
            )}
          </div>
          <ProgressBar value={(completedCount / series.posts.length) * 100} />
        </div>
      )}

      <ol className='mt-8 flex flex-col gap-3'>
        {series.posts.length === 0 && <p className='text-gray-400'>No articles in this series yet.</p>}
        {series.posts.map((post, i) => (
          <li key={post._id}>
            <Link
              to={`/post/${post.slug}`}
              className='flex items-center gap-4 rounded-xl border border-gray-800 bg-[#121212] p-4 transition hover:border-purple-500/60'
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                  post.completed ? 'bg-green-500/20 text-green-300' : 'bg-gray-800 text-gray-400'
                }`}
              >
                {post.completed ? '✓' : i + 1}
              </span>
              <span className='min-w-0 flex-1'>
                <span className='block truncate font-medium'>{post.title}</span>
                <span className='text-sm text-gray-500'>{post.readTimeMins} min read</span>
              </span>
              {!post.published && (
                <span className='shrink-0 rounded-full bg-yellow-500/20 px-2.5 py-0.5 text-xs font-medium text-yellow-300'>
                  Draft
                </span>
              )}
            </Link>
          </li>
        ))}
      </ol>
    </main>
  );
}
