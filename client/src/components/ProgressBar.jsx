import React from 'react';

export default function ProgressBar({ value, className = '' }) {
  const pct = Math.max(0, Math.min(100, value || 0));
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-surface-2 ${className}`}>
      <div className='h-full rounded-full bg-accent transition-[width]' style={{ width: `${pct}%` }} />
    </div>
  );
}
