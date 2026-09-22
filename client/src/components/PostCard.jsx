import React from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineDocumentText } from 'react-icons/hi';
import { categoryLabel, formatDate } from '../utils/format';

export default function PostCard({ post }) {
  return (
    <article className='surface-card group flex flex-col gap-3 p-4'>
      <div className='flex gap-4'>
        <div className='flex min-w-0 flex-1 flex-col gap-2'>
          <div className='flex items-center gap-2 text-xs'>
            <Link to={`/category/${post.category}`} className='tag'>
              {categoryLabel(post.category)}
            </Link>
            {!post.published && (
              <span className='rounded-full bg-warn/20 px-2.5 py-0.5 font-medium text-warn'>Draft</span>
            )}
          </div>
          <Link to={`/post/${post.slug}`} className='line-clamp-2 font-semibold leading-snug text-ink hover:text-accent'>
            {post.title}
          </Link>
          <p className='line-clamp-2 text-sm text-muted'>{post.excerpt}</p>
        </div>

        <Link
          to={`/post/${post.slug}`}
          className='block h-24 w-24 shrink-0 overflow-hidden rounded-lg sm:h-28 sm:w-28'
        >
          {post.coverImage ? (
            <img
              src={post.coverImage}
              alt=''
              loading='lazy'
              className='h-full w-full object-cover transition duration-300 group-hover:scale-105'
            />
          ) : (
            <div className='flex h-full w-full items-center justify-center bg-surface-2'>
              <HiOutlineDocumentText className='h-8 w-8 text-muted' />
            </div>
          )}
        </Link>
      </div>

      <div className='flex items-center gap-1.5 overflow-hidden font-mono text-xs text-muted'>
        <span className='min-w-0 truncate'>{post.author?.username ? `@${post.author.username}` : 'TechSphere'}</span>
        <span className='shrink-0'>·</span>
        <span className='shrink-0 whitespace-nowrap'>{formatDate(post.createdAt)}</span>
        <span className='shrink-0'>·</span>
        <span className='shrink-0 whitespace-nowrap'>{post.readTimeMins} min read</span>
      </div>
    </article>
  );
}
