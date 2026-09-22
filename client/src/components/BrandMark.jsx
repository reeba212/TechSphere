import React from 'react';

export default function BrandMark({ size = 'md' }) {
  const textSize = size === 'lg' ? 'text-3xl' : 'text-xl';

  return (
    <span className={`inline-flex items-center gap-2 font-display font-semibold text-ink ${textSize}`}>
      <span className='orbit-mark' aria-hidden='true' />
      TechSphere
    </span>
  );
}
