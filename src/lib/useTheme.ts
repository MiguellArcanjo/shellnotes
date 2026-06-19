'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'shellnotes-theme';

export function useTheme() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {
      stored = null;
    }
    // localStorage is only available client-side, so the initial theme
    // must be synced after mount rather than computed during render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDark(stored === 'dark');
  }, []);

  const toggleTheme = () => {
    const next = isDark ? 'light' : 'dark';
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // localStorage unavailable, theme just won't persist
    }
    document.documentElement.dataset.theme = next;
    setIsDark(!isDark);
  };

  return { isDark, toggleTheme };
}
