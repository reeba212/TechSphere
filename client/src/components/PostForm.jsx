import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { apiFetch } from '../utils/format';

const toolbarOptions = [
  [{ header: [1, 2, 3, 4, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ color: [] }, { background: [] }],
  [{ align: [] }],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['blockquote', 'code-block'],
  ['link', 'image'],
  ['clean'],
];

const inputClass = 'input-field';

const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);
  const data = await apiFetch('/api/upload/image', { method: 'POST', body: formData });
  return data.url;
};

/**
 * Shared by Create Post and Edit Post. Pass `post` to edit an existing article.
 */
export default function PostForm({ post }) {
  const navigate = useNavigate();
  const quillRef = useRef(null);

  const [title, setTitle] = useState(post?.title || '');
  const [category, setCategory] = useState(post?.category || 'uncategorized');
  const [tags, setTags] = useState(post?.tags?.join(', ') || '');
  const [content, setContent] = useState(post?.content || '');
  const [coverImage, setCoverImage] = useState(post?.coverImage || '');
  const [coverFile, setCoverFile] = useState(null);
  const [categories, setCategories] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/api/category')
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  // Inline images are uploaded to the server instead of being embedded as base64.
  const modules = useMemo(
    () => ({
      toolbar: {
        container: toolbarOptions,
        handlers: {
          image: () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = async () => {
              const file = input.files?.[0];
              if (!file) return;
              try {
                const url = await uploadImage(file);
                const editor = quillRef.current.getEditor();
                const index = editor.getSelection(true).index;
                editor.insertEmbed(index, 'image', url);
                editor.setSelection(index + 1);
              } catch (err) {
                setError(err.message);
              }
            };
            input.click();
          },
        },
      },
    }),
    []
  );

  const handleCoverUpload = async () => {
    if (!coverFile) return;
    setError('');
    setUploading(true);
    try {
      setCoverImage(await uploadImage(coverFile));
      setCoverFile(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const save = async (published) => {
    setError('');
    setSaving(true);
    const body = {
      title,
      content,
      category,
      coverImage,
      published,
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    };
    try {
      const saved = await apiFetch(post ? `/api/post/${post._id}` : '/api/post/create', {
        method: post ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      navigate(published ? `/post/${saved.slug}` : '/dashboard?tab=posts');
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    save(true);
  };

  return (
    <div className='p-3 mb-10 w-full max-w-6xl mx-auto min-h-screen'>
      <h1 className='text-center text-3xl my-7 font-semibold'>{post ? 'Edit post' : 'Create a post'}</h1>
      <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
        <div className='flex flex-col sm:flex-row gap-4 w-full'>
          <input
            type='text'
            placeholder='Title'
            required
            id='title'
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`${inputClass} sm:w-1/2`}
          />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={`${inputClass} sm:w-1/2`}>
            <option value='uncategorized'>Select a category</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <input
          type='text'
          placeholder='Tags, comma separated (e.g. react, hooks)'
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className={inputClass}
        />

        <div className='flex flex-col gap-3 rounded-lg border-2 border-dashed border-line bg-surface p-4'>
          <div className='flex flex-col sm:flex-row gap-4 items-center justify-between'>
            <div>
              <input
                type='file'
                accept='image/*'
                id='fileUpload'
                className='hidden'
                onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
              />
              <label htmlFor='fileUpload' className='btn-secondary cursor-pointer'>
                Choose cover image
              </label>
              <span className='p-2 bg-transparent text-ink'>{coverFile ? coverFile.name : 'No file chosen'}</span>
            </div>
            <button type='button' onClick={handleCoverUpload} disabled={!coverFile || uploading} className='btn-primary'>
              {uploading ? 'Uploading…' : 'Upload Image'}
            </button>
          </div>
          {coverImage && (
            <div className='relative'>
              <img src={coverImage} alt='Cover preview' className='w-full max-h-64 object-cover rounded-md' />
              <button
                type='button'
                onClick={() => setCoverImage('')}
                className='absolute top-2 right-2 rounded-md bg-black/70 px-3 py-1 text-sm text-ink hover:bg-red-600'
              >
                Remove
              </button>
            </div>
          )}
        </div>

        <ReactQuill ref={quillRef} theme='snow' value={content} onChange={setContent} modules={modules} />

        {error && (
          <div role='alert' className='rounded-md border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-300'>
            {error}
          </div>
        )}

        <div className='flex flex-col sm:flex-row gap-3'>
          <button type='button' disabled={saving} onClick={() => save(false)} className='btn-secondary sm:w-48'>
            Save as draft
          </button>
          <button type='submit' disabled={saving} className='btn-primary sm:w-48'>
            {saving ? 'Saving…' : post?.published ? 'Update & keep published' : 'Publish'}
          </button>
        </div>
      </form>
    </div>
  );
}
