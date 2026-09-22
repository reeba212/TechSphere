import React from 'react';
import { Link } from 'react-router-dom';

const values = [
  {
    title: 'Depth over noise',
    body: "Every article aims to actually explain the idea, not just skim the surface for clicks.",
  },
  {
    title: 'Organized by topic',
    body: 'Articles are grouped by category and tag so you can go deep on one subject instead of scrolling an endless feed.',
  },
  {
    title: 'Built to be read',
    body: 'Table of contents, read time and syntax-highlighted code, so long technical articles stay easy to follow.',
  },
];

export default function About() {
  return (
    <main className='mx-auto w-full max-w-3xl px-4 py-16'>
      <h1 className='text-4xl font-bold sm:text-5xl'>About TechSphere</h1>
      <p className='mt-6 text-lg leading-relaxed text-gray-400'>
        TechSphere is a place to actually learn something, not just skim it. It's a
        collection of in-depth technical articles on web development, machine learning,
        cloud computing, cybersecurity and more — written to build real understanding of
        how things work, one topic at a time.
      </p>
      <p className='mt-4 text-lg leading-relaxed text-gray-400'>
        No feeds, no algorithms chasing engagement — just organized, well-structured
        writing you can search, filter by topic, and come back to.
      </p>

      <div className='mt-12 grid gap-6 sm:grid-cols-3'>
        {values.map((v) => (
          <div key={v.title} className='rounded-xl border border-gray-800 bg-[#121212] p-5'>
            <h2 className='font-semibold text-white'>{v.title}</h2>
            <p className='mt-2 text-sm text-gray-400'>{v.body}</p>
          </div>
        ))}
      </div>

      <div className='mt-12 border-t border-gray-800 pt-8 text-center'>
        <p className='text-gray-400'>Ready to dig in?</p>
        <Link
          to='/search'
          className='mt-3 inline-block rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 px-6 py-2.5 font-semibold transition hover:opacity-90'
        >
          Browse all articles
        </Link>
      </div>
    </main>
  );
}
