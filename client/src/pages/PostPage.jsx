import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ArticleContent from '../components/ArticleContent';
import TableOfContents from '../components/TableOfContents';
import PostCard from '../components/PostCard';
import { useReadingProgress } from '../hooks/useReadingProgress';
import { prepareArticle } from '../utils/prepareArticle';
import { apiFetch, categoryLabel, formatDate } from '../utils/format';
import NotFound from './NotFound';

function SeriesNav({ seriesContext }) {
  if (!seriesContext) return null;
  const { series, position, total, prev, next } = seriesContext;
  return (
    <div className='mx-auto mt-8 flex max-w-3xl flex-col gap-3 rounded-xl border border-gray-800 bg-[#121212] p-4 sm:flex-row sm:items-center sm:justify-between'>
      <Link to={`/series/${series.slug}`} className='text-sm text-gray-400 hover:text-purple-300'>
        {series.title} · Part {position} of {total}
      </Link>
      <div className='flex gap-2 text-sm'>
        {prev ? (
          <Link to={`/post/${prev.slug}`} className='rounded-md border border-gray-700 px-3 py-1.5 hover:border-purple-500'>
            ← Previous
          </Link>
        ) : (
          <span className='rounded-md border border-gray-800 px-3 py-1.5 text-gray-600'>← Previous</span>
        )}
        {next ? (
          <Link to={`/post/${next.slug}`} className='rounded-md border border-gray-700 px-3 py-1.5 hover:border-purple-500'>
            Next →
          </Link>
        ) : (
          <span className='rounded-md border border-gray-800 px-3 py-1.5 text-gray-600'>Next →</span>
        )}
      </div>
    </div>
  );
}

export default function PostPage() {
  const { slug } = useParams();
  const { currentUser } = useSelector((state) => state.user);
  const [post, setPost] = useState(null);
  const [related, setRelated] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | missing | error
  const [bookmarked, setBookmarked] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [savingProgress, setSavingProgress] = useState(false);
  const [showResume, setShowResume] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setPost(null);
    setRelated([]);
    window.scrollTo(0, 0);

    apiFetch(`/api/post/${slug}`)
      .then((data) => {
        if (cancelled) return;
        setPost(data);
        setBookmarked(Boolean(data.bookmarked));
        setCompleted(Boolean(data.progress?.completed));
        setShowResume(Boolean(data.progress) && !data.progress.completed && data.progress.lastReadPosition > 300);
        setStatus('ready');
        document.title = `${data.title} | TechSphere`;
        apiFetch(`/api/post/${slug}/related`)
          .then((r) => !cancelled && setRelated(r))
          .catch(() => {});
      })
      .catch((err) => {
        if (!cancelled) setStatus(err.message === 'Post not found' ? 'missing' : 'error');
      });

    return () => {
      cancelled = true;
      document.title = 'TechSphere';
    };
  }, [slug]);

  useReadingProgress(post?._id, { enabled: Boolean(currentUser && post), alreadyCompleted: completed });

  const article = useMemo(() => (post ? prepareArticle(post.content) : null), [post]);

  const toggleBookmark = async () => {
    const next = !bookmarked;
    setBookmarked(next); // optimistic
    try {
      await apiFetch(`/api/bookmarks/${post._id}`, { method: next ? 'POST' : 'DELETE' });
    } catch {
      setBookmarked(!next);
    }
  };

  const toggleCompleted = async () => {
    const next = !completed;
    setCompleted(next);
    setSavingProgress(true);
    try {
      await apiFetch(`/api/progress/${post._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: next, ...(next ? { progressPercentage: 100 } : {}) }),
      });
    } catch {
      setCompleted(!next);
    } finally {
      setSavingProgress(false);
    }
  };

  if (status === 'loading') return <p className='p-20 text-center text-gray-400'>Loading…</p>;
  if (status === 'missing') return <NotFound />;
  if (status === 'error') return <p className='p-20 text-center text-red-300'>Could not load this article.</p>;

  return (
    <main className='mx-auto w-full max-w-6xl px-4 py-10'>
      {showResume && (
        <div className='mx-auto mb-6 flex max-w-3xl items-center justify-between gap-3 rounded-xl border border-purple-500/40 bg-purple-500/10 px-4 py-3 text-sm'>
          <span className='text-purple-200'>Continue where you left off?</span>
          <div className='flex items-center gap-3'>
            <button
              type='button'
              onClick={() => {
                window.scrollTo({ top: post.progress.lastReadPosition, behavior: 'smooth' });
                setShowResume(false);
              }}
              className='font-medium text-purple-300 hover:text-purple-200'
            >
              Jump to where I left off
            </button>
            <button type='button' onClick={() => setShowResume(false)} className='text-gray-400 hover:text-white'>
              ✕
            </button>
          </div>
        </div>
      )}

      <header className='mx-auto max-w-3xl text-center'>
        <div className='mb-4 flex flex-wrap items-center justify-center gap-2 text-sm'>
          <Link
            to={`/category/${post.category}`}
            className='rounded-full bg-purple-500/20 px-3 py-1 font-medium text-purple-300 hover:bg-purple-500/30'
          >
            {categoryLabel(post.category)}
          </Link>
          {!post.published && (
            <span className='rounded-full bg-yellow-500/20 px-3 py-1 font-medium text-yellow-300'>Draft</span>
          )}
        </div>
        <h1 className='text-3xl font-bold leading-tight sm:text-5xl'>{post.title}</h1>
        <div className='mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-gray-400'>
          {post.author?.profilePicture && (
            <img src={post.author.profilePicture} alt='' className='h-7 w-7 rounded-full object-cover' />
          )}
          <span>{post.author?.username ? `@${post.author.username}` : 'TechSphere'}</span>
          <span>·</span>
          <span>{formatDate(post.createdAt)}</span>
          <span>·</span>
          <span>{post.readTimeMins} min read</span>
          {currentUser?.isAdmin && (
            <Link to={`/edit-post/${post.slug}`} className='ml-2 text-purple-300 underline hover:text-purple-200'>
              Edit
            </Link>
          )}
        </div>

        {currentUser && (
          <div className='mt-5 flex items-center justify-center gap-3'>
            <button
              type='button'
              onClick={toggleBookmark}
              className={`rounded-md border px-3 py-1.5 text-sm font-medium transition ${
                bookmarked
                  ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                  : 'border-gray-700 text-gray-300 hover:border-purple-500 hover:text-white'
              }`}
            >
              {bookmarked ? '★ Saved' : '☆ Save'}
            </button>
            <button
              type='button'
              disabled={savingProgress}
              onClick={toggleCompleted}
              className={`rounded-md border px-3 py-1.5 text-sm font-medium transition disabled:opacity-50 ${
                completed
                  ? 'border-green-500 bg-green-500/20 text-green-300'
                  : 'border-gray-700 text-gray-300 hover:border-green-500 hover:text-white'
              }`}
            >
              {completed ? '✓ Completed' : 'Mark as complete'}
            </button>
          </div>
        )}
      </header>

      {post.coverImage && (
        <img
          src={post.coverImage}
          alt=''
          className='mx-auto mt-8 max-h-[28rem] w-full max-w-4xl rounded-xl object-cover'
        />
      )}

      <SeriesNav seriesContext={post.seriesContext} />

      <div className='mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_16rem]'>
        <div className='min-w-0 lg:order-1 lg:mx-auto lg:w-full lg:max-w-3xl'>
          <ArticleContent html={article.html} />
          {post.tags.length > 0 && (
            <div className='mt-10 flex flex-wrap gap-2 border-t border-gray-800 pt-6'>
              {post.tags.map((t) => (
                <Link
                  key={t}
                  to={`/search?tag=${encodeURIComponent(t)}`}
                  className='rounded-md border border-gray-700 px-2.5 py-1 text-sm text-gray-300 hover:border-purple-500 hover:text-white'
                >
                  #{t}
                </Link>
              ))}
            </div>
          )}
        </div>
        <aside className='hidden lg:order-2 lg:block'>
          <div className='sticky top-6'>
            <TableOfContents headings={article.headings} />
          </div>
        </aside>
      </div>

      <div className='mx-auto max-w-3xl'>
        <SeriesNav seriesContext={post.seriesContext} />
      </div>

      {related.length > 0 && (
        <section className='mt-16 border-t border-gray-800 pt-10'>
          <h2 className='mb-6 text-2xl font-semibold'>Related articles</h2>
          <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
            {related.map((p) => (
              <PostCard key={p._id} post={p} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
