import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className='flex min-h-[60vh] flex-col items-center justify-center gap-4 p-10 text-center'>
      <h1 className='text-5xl font-bold'>404</h1>
      <p className='text-gray-400'>We couldn't find that page.</p>
      <Link to='/' className='rounded-md bg-gradient-to-r from-purple-500 to-blue-500 px-5 py-2 font-semibold'>
        Back to home
      </Link>
    </div>
  );
}
