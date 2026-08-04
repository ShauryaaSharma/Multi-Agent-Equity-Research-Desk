'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type AerdTheme = 'light' | 'dark';

const STORAGE_KEY = 'aerd_theme';

const ThemeContext = createContext<{
  theme: AerdTheme;
  setTheme: (t: AerdTheme) => void;
}>({ theme: 'light', setTheme: () => {} });

export function AerdThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<AerdTheme>('light');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as AerdTheme | null;
    if (stored === 'light' || stored === 'dark') setThemeState(stored);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = useCallback((t: AerdTheme) => setThemeState(t), []);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useAerdTheme() {
  return useContext(ThemeContext);
}
