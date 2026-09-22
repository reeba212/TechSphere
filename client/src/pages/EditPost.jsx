import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import PostForm from '../components/PostForm';
import { apiFetch } from '../utils/format';

export default function EditPost() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch(`/api/post/${slug}`)
      .then(setPost)
      .catch((err) => setError(err.message));
  }, [slug]);

  if (error) return <p className='p-10 text-center text-red-300'>{error}</p>;
  if (!post) return <p className='p-10 text-center text-muted'>Loading…</p>;
  return <PostForm post={post} />;
}
