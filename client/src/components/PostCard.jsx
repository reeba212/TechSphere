import React from 'react';
import { Link } from 'react-router-dom';
import { categoryLabel, formatDate } from '../utils/format';

export default function PostCard({ post }) {
  return (
    <article className='group flex flex-col overflow-hidden rounded-xl border border-gray-800 bg-[#121212] transition hover:border-purple-500/60'>
      <Link to={`/post/${post.slug}`} className='block h-44 w-full overflow-hidden'>
        {post.coverImage ? (
          <img
            src={post.coverImage}
            alt=''
            loading='lazy'
            className='h-full w-full object-cover transition duration-300 group-hover:scale-105'
          />
        ) : (
          <div className='h-full w-full bg-gradient-to-br from-purple-600 to-blue-600 opacity-70' />
        )}
      </Link>
      <div className='flex flex-1 flex-col gap-2 p-4'>
        <div className='flex items-center gap-2 text-xs'>
          <Link
            to={`/category/${post.category}`}
            className='rounded-full bg-purple-500/20 px-2.5 py-0.5 font-medium text-purple-300 hover:bg-purple-500/30'
          >
            {categoryLabel(post.category)}
          </Link>
          {!post.published && (
            <span className='rounded-full bg-yellow-500/20 px-2.5 py-0.5 font-medium text-yellow-300'>Draft</span>
          )}
        </div>
        <Link to={`/post/${post.slug}`} className='text-lg font-semibold leading-snug text-white hover:text-purple-300'>
          {post.title}
        </Link>
        <p className='line-clamp-3 text-sm text-gray-400'>{post.excerpt}</p>
        <div className='mt-auto flex items-center gap-2 pt-3 text-xs text-gray-500'>
          <span>{post.author?.username ? `@${post.author.username}` : 'TechSphere'}</span>
          <span>·</span>
          <span>{formatDate(post.createdAt)}</span>
          <span>·</span>
          <span>{post.readTimeMins} min read</span>
        </div>
      </div>
    </article>
  );
}
