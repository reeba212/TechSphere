import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/format';

const inputClass =
  'w-full p-2.5 bg-[#121212] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-700';

/**
 * Shared by Create Series and Edit Series. Pass `series` (from GET /api/series/:slug,
 * which includes its ordered posts) to edit an existing one and manage its membership.
 */
export default function SeriesForm({ series }) {
  const navigate = useNavigate();

  const [title, setTitle] = useState(series?.title || '');
  const [category, setCategory] = useState(series?.category || 'uncategorized');
  const [description, setDescription] = useState(series?.description || '');
  const [published, setPublished] = useState(series?.published || false);
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [allPosts, setAllPosts] = useState([]);
  const [memberIds, setMemberIds] = useState((series?.posts || []).map((p) => p._id));
  const [savingMembers, setSavingMembers] = useState(false);

  useEffect(() => {
    apiFetch('/api/category')
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (!series) return;
    apiFetch('/api/post?published=all&limit=50')
      .then((data) => setAllPosts(data.posts))
      .catch(() => {});
  }, [series]);

  const save = async () => {
    setError('');
    setSaving(true);
    const body = { title, category, description, published };
    try {
      const saved = await apiFetch(series ? `/api/series/${series._id}` : '/api/series/create', {
        method: series ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      navigate(series ? '/dashboard?tab=series' : `/edit-series/${saved.slug}`);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  const saveMembers = async (nextIds) => {
    setMemberIds(nextIds);
    setSavingMembers(true);
    setError('');
    try {
      await apiFetch(`/api/series/${series._id}/posts`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postIds: nextIds }),
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingMembers(false);
    }
  };

  const move = (index, dir) => {
    const target = index + dir;
    if (target < 0 || target >= memberIds.length) return;
    const next = [...memberIds];
    [next[index], next[target]] = [next[target], next[index]];
    saveMembers(next);
  };

  const addPost = (postId) => {
    if (!postId || memberIds.includes(postId)) return;
    saveMembers([...memberIds, postId]);
  };

  const removePost = (postId) => saveMembers(memberIds.filter((id) => id !== postId));

  const postById = (id) => allPosts.find((p) => p._id === id);
  const availableToAdd = allPosts.filter((p) => !memberIds.includes(p._id));

  return (
    <div className='mx-auto mb-10 w-full max-w-3xl p-3'>
      <h1 className='my-7 text-center text-3xl font-semibold'>{series ? 'Edit series' : 'Create a series'}</h1>

      <div className='flex flex-col gap-4'>
        <input
          type='text'
          placeholder='Title'
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputClass}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
          <option value='uncategorized'>Select a category</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <textarea
          placeholder='Description'
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={inputClass}
        />
        <label className='flex items-center gap-2 text-sm text-gray-300'>
          <input type='checkbox' checked={published} onChange={(e) => setPublished(e.target.checked)} />
          Published
        </label>

        {error && (
          <div role='alert' className='rounded-md border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-300'>
            {error}
          </div>
        )}

        <button
          type='button'
          disabled={saving || title.trim().length < 3}
          onClick={save}
          className='w-48 rounded-md bg-gradient-to-r from-purple-500 to-blue-500 px-4 py-2 font-semibold hover:opacity-90 disabled:opacity-50'
        >
          {saving ? 'Saving…' : series ? 'Save changes' : 'Create series'}
        </button>
      </div>

      {series && (
        <div className='mt-10 border-t border-gray-800 pt-8'>
          <h2 className='mb-4 text-xl font-semibold'>
            Posts in this series {savingMembers && <span className='text-sm font-normal text-gray-500'>(saving…)</span>}
          </h2>

          {memberIds.length === 0 && <p className='mb-4 text-gray-400'>No posts yet — add some below.</p>}
          {memberIds.length > 0 && (
            <ol className='flex flex-col gap-2'>
              {memberIds.map((id, i) => {
                const post = postById(id);
                return (
                  <li key={id} className='flex items-center gap-3 rounded-md border border-gray-800 bg-[#121212] p-3'>
                    <span className='w-6 shrink-0 text-center text-sm text-gray-500'>{i + 1}</span>
                    <span className='min-w-0 flex-1 truncate'>{post?.title || id}</span>
                    <button
                      type='button'
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      className='text-gray-400 hover:text-white disabled:opacity-30'
                    >
                      ↑
                    </button>
                    <button
                      type='button'
                      onClick={() => move(i, 1)}
                      disabled={i === memberIds.length - 1}
                      className='text-gray-400 hover:text-white disabled:opacity-30'
                    >
                      ↓
                    </button>
                    <button type='button' onClick={() => removePost(id)} className='text-red-400 hover:text-red-300'>
                      Remove
                    </button>
                  </li>
                );
              })}
            </ol>
          )}

          <select
            onChange={(e) => {
              addPost(e.target.value);
              e.target.value = '';
            }}
            defaultValue=''
            className={`${inputClass} mt-4`}
          >
            <option value='' disabled>
              Add a post…
            </option>
            {availableToAdd.map((p) => (
              <option key={p._id} value={p._id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
