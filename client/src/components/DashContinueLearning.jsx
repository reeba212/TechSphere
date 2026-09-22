import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ProgressBar from './ProgressBar';
import { apiFetch } from '../utils/format';

export default function DashContinueLearning() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/api/progress/series-summary')
      .then(setSummary)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className='w-full p-4'>
      <h1 className='mb-6 text-2xl font-semibold'>Continue learning</h1>
      {error && <p className='text-red-300'>{error}</p>}
      {!summary && !error && <p className='text-gray-400'>Loading…</p>}
      {summary?.length === 0 && (
        <p className='py-10 text-center text-gray-400'>
          Start a{' '}
          <Link to='/series' className='text-purple-300 hover:text-purple-200'>
            learning path
          </Link>{' '}
          to see your progress here.
        </p>
      )}
      {summary?.length > 0 && (
        <div className='flex flex-col gap-4'>
          {summary.map(({ series, total, completed, nextPost }) => (
            <div key={series.slug} className='rounded-xl border border-gray-800 bg-[#121212] p-4'>
              <div className='flex items-center justify-between gap-3'>
                <Link to={`/series/${series.slug}`} className='font-semibold hover:text-purple-300'>
                  {series.title}
                </Link>
                <span className='shrink-0 text-sm text-gray-400'>
                  {completed}/{total} completed
                </span>
              </div>
              <div className='mt-3'>
                <ProgressBar value={total ? (completed / total) * 100 : 0} />
              </div>
              {nextPost && (
                <Link
                  to={`/post/${nextPost.slug}`}
                  className='mt-3 inline-block text-sm font-medium text-purple-300 hover:text-purple-200'
                >
                  Continue: {nextPost.title} →
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
