import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className='flex min-h-[60vh] flex-col items-center justify-center gap-4 p-10 text-center'>
      <h1 className='text-5xl'>404</h1>
      <p className='text-muted'>We couldn't find that page.</p>
      <Link to='/' className='btn-primary'>
        Back to home
      </Link>
    </div>
  );
}
