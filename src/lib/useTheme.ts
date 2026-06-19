'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'shellnotes-theme';

type Theme = 'light' | 'dark';

// Admin, bounty, the public site header, and the login page each mount
// their own independent instance of this hook. They all need to agree on
// the same theme, so changes are broadcast through this listener set rather
// than relying on each instance re-deriving state independently.
const listeners = new Set<() => void>();

function getStoredTheme(): Theme | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'dark' || stored === 'light' ? stored : null;
  } catch {
    return null;
  }
}

function getSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getEffectiveTheme(): Theme {
  return getStoredTheme() ?? getSystemTheme();
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}

export function useTheme() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Re-applied on every mount (not just on toggle) so the stored
    // preference is enforced on the <html> element regardless of which
    // page's header instance happens to mount first.
    const sync = () => {
      const theme = getEffectiveTheme();
      applyTheme(theme);
      setIsDark(theme === 'dark');
    };
    sync();
    listeners.add(sync);
    return () => {
      listeners.delete(sync);
    };
  }, []);

  const toggleTheme = () => {
    const next: Theme = getEffectiveTheme() === 'dark' ? 'light' : 'dark';
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // localStorage unavailable, theme just won't persist
    }
    applyTheme(next);
    setIsDark(next === 'dark');
    listeners.forEach((listener) => listener());
  };

  return { isDark, toggleTheme };
}
