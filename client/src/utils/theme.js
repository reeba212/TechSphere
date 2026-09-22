import { useCallback, useState } from 'react';

export const THEMES = [
  { id: 'dark', label: 'Dark' },
  { id: 'light', label: 'Light' },
  { id: 'pookie-dark', label: 'Pookie Dark' },
  { id: 'pookie-light', label: 'Pookie Light' },
  { id: 'forest-dark', label: 'Forest Dark' },
  { id: 'forest-light', label: 'Forest Light' },
];

const STORAGE_KEY = 'theme';
const DEFAULT_THEME = 'dark';
const isValidTheme = (id) => THEMES.some((t) => t.id === id);

function readStoredTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isValidTheme(stored) ? stored : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

// Runs before React renders to avoid a flash of the wrong theme.
export function applyStoredTheme() {
  document.documentElement.setAttribute('data-theme', readStoredTheme());
}

export function useTheme() {
  const [theme, setThemeState] = useState(readStoredTheme);

  const setTheme = useCallback((next) => {
    if (!isValidTheme(next)) return;
    document.documentElement.setAttribute('data-theme', next);
    setThemeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // storage blocked — theme won't persist
    }
  }, []);

  return { theme, setTheme };
}
