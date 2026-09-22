import React from 'react';

export default function ProgressBar({ value, className = '' }) {
  const pct = Math.max(0, Math.min(100, value || 0));
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-gray-800 ${className}`}>
      <div
        className='h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500 transition-[width]'
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
