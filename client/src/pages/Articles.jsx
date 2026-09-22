import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { HiChevronDown } from 'react-icons/hi';
import PostCard from '../components/PostCard';
import Pagination from '../components/Pagination';
import { apiFetch, categoryLabel } from '../utils/format';

const inputClass = 'input-field';
const selectClass = 'input-field appearance-none pr-9';

// A native <select> with its default arrow replaced so we can give it room from the edge.
function Select({ className = '', ...props }) {
  return (
    <div className={`relative ${className}`}>
      <select {...props} className={`${selectClass} w-full`} />
      <HiChevronDown className='pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted' />
    </div>
  );
}

/**
 * Serves both /search (all articles + search + filters) and /category/:category.
 * All filter state lives in the URL so results are shareable and back/forward works.
 */
export default function Articles() {
  const { category: categoryParam } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useSelector((state) => state.user);
  const [searchParams, setSearchParams] = useSearchParams();

  const q = searchParams.get('q') || '';
  const tag = searchParams.get('tag') || '';
  const category = categoryParam || searchParams.get('category') || '';
  const page = Number(searchParams.get('page')) || 1;
  const sort = searchParams.get('sort') || (q ? 'relevance' : 'newest');

  const [categories, setCategories] = useState([]);
  const [queryInput, setQueryInput] = useState(q);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/category')
      .then(setCategories)
      .catch(() => {});
  }, []);

  useEffect(() => setQueryInput(q), [q]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ page, limit: 9, sort });
    if (q) params.set('q', q);
    if (tag) params.set('tag', tag);
    if (category) params.set('category', category);

    apiFetch(`/api/post?${params}`)
      .then((data) => !cancelled && setResult(data))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [q, tag, category, page, sort]);

  const update = (changes) => {
    const next = new URLSearchParams(searchParams);
    Object.entries({ page: 1, ...changes }).forEach(([key, value]) => {
      if (value && !(key === 'page' && value === 1)) next.set(key, value);
      else next.delete(key);
    });
    setSearchParams(next);
  };

  const heading = categoryParam
    ? categoryLabel(categoryParam)
    : q
      ? `Results for "${q}"`
      : tag
        ? `Tagged #${tag}`
        : 'All articles';

  const submitSearch = (e) => {
    e.preventDefault();
    update({ q: queryInput.trim(), sort: '' });
  };

  const isDefaultSort = sort === (q ? 'relevance' : 'newest');
  const hasActiveFilters = Boolean(q || tag || category || !isDefaultSort);

  const clearFilters = () => {
    if (categoryParam) navigate('/search');
    else setSearchParams(new URLSearchParams());
  };

  return (
    <main className='mx-auto w-full max-w-6xl px-4 py-10'>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div>
          <h1 className='text-3xl sm:text-4xl'>{heading}</h1>
          {categoryParam && (
            <p className='mt-2 text-muted'>{categories.find((c) => c.slug === categoryParam)?.description}</p>
          )}
        </div>
        {currentUser?.isAdmin && (
          <Link to='/create-post' className='btn-primary shrink-0'>
            Write a post
          </Link>
        )}
      </div>

      <div className='mt-6 flex flex-col gap-3 md:flex-row'>
        <form onSubmit={submitSearch} className='flex flex-1 gap-2'>
          <input
            type='search'
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            placeholder='Search articles…'
            aria-label='Search articles'
            className={`${inputClass} w-full`}
          />
          <button type='submit' className='btn-primary'>
            Search
          </button>
        </form>
        {!categoryParam && (
          <Select value={category} onChange={(e) => update({ category: e.target.value })} aria-label='Category'>
            <option value=''>All categories</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </Select>
        )}
        <Select
          value={sort}
          onChange={(e) => update({ sort: e.target.value === 'newest' ? '' : e.target.value })}
          aria-label='Sort'
        >
          <option value='newest'>Newest</option>
          <option value='oldest'>Oldest</option>
          {q && <option value='relevance'>Most relevant</option>}
        </Select>
        {hasActiveFilters && (
          <button
            type='button'
            onClick={clearFilters}
            className='shrink-0 rounded-md border border-line px-4 py-2.5 text-sm font-medium text-muted transition hover:border-red-500 hover:text-ink'
          >
            Clear filters
          </button>
        )}
      </div>

      {tag && (
        <button
          type='button'
          onClick={() => update({ tag: '' })}
          className='mt-3 rounded-full border border-line px-3 py-1 text-sm text-muted hover:border-red-500'
        >
          #{tag} ✕
        </button>
      )}

      <div className='mt-8'>
        {error && <p className='text-red-300'>{error}</p>}
        {loading && !result && <p className='text-muted'>Loading…</p>}
        {result && (
          <>
            <p className='mb-4 text-sm text-muted'>
              {result.total} {result.total === 1 ? 'article' : 'articles'}
            </p>
            {result.posts.length === 0 ? (
              <p className='py-16 text-center text-muted'>No articles found.</p>
            ) : (
              <div className={`grid gap-6 sm:grid-cols-2 lg:grid-cols-3 ${loading ? 'opacity-60' : ''}`}>
                {result.posts.map((p) => (
                  <PostCard key={p._id} post={p} />
                ))}
              </div>
            )}
            <Pagination
              page={result.page}
              pages={result.pages}
              onChange={(n) => {
                update({ page: n });
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </>
        )}
      </div>
    </main>
  );
}
