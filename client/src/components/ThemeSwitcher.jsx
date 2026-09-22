import React from 'react';
import { useTheme } from '../utils/theme';

// Hardcoded: the accent/canvas tokens only reflect the active theme.
const OPTIONS = [
  { id: 'dark', label: 'Dark', canvas: '#0a0b0d', accent: '#5c8dc5' },
  { id: 'light', label: 'Light', canvas: '#f4f6f8', accent: '#5c8dc5' },
  { id: 'pookie-dark', label: 'Pookie Dark', canvas: '#121212', accent: '#f075ab' },
  { id: 'pookie-light', label: 'Pookie Light', canvas: '#fff6fb', accent: '#f075ab' },
  { id: 'forest-dark', label: 'Forest Dark', canvas: '#0a0b0d', accent: '#2f6b45' },
  { id: 'forest-light', label: 'Forest Light', canvas: '#f3f7f1', accent: '#2f6b45' },
];

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div>
      <h2 className='mb-3 text-sm font-semibold uppercase tracking-wide text-muted'>Theme</h2>
      <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
        {OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type='button'
            onClick={() => setTheme(opt.id)}
            aria-pressed={theme === opt.id}
            className={`flex flex-col items-center gap-2 rounded-lg border p-3 text-xs font-medium transition ${
              theme === opt.id ? 'border-accent text-ink' : 'border-line text-muted hover:border-accent hover:text-ink'
            }`}
          >
            <span
              className='block h-8 w-8 rounded-full border border-line'
              style={{ background: opt.canvas, boxShadow: `inset 0 0 0 3px ${opt.accent}` }}
              aria-hidden='true'
            />
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
