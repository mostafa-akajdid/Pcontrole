import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const AppearanceContext = createContext();

const DEFAULT_THEME = 'light';
const DEFAULT_ACCENT_COLOR = '#0f4c3a';

function applyThemeClass(newTheme) {
  document.documentElement.classList.remove('dark');
  if (newTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else if (newTheme === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      document.documentElement.classList.add('dark');
    }
  }
}

export function AppearanceProvider({ children }) {
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [accentColor, setAccentColor] = useState(DEFAULT_ACCENT_COLOR);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || DEFAULT_THEME;
    const savedAccentColor = localStorage.getItem('accentColor') || DEFAULT_ACCENT_COLOR;
    setTheme(savedTheme);
    setAccentColor(savedAccentColor);
    applyThemeClass(savedTheme);
    document.documentElement.style.setProperty('--accent-color', savedAccentColor);
  }, []);

  const updateTheme = useCallback((newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyThemeClass(newTheme);
  }, []);

  const updateAccentColor = useCallback((newColor) => {
    setAccentColor(newColor);
    localStorage.setItem('accentColor', newColor);
    document.documentElement.style.setProperty('--accent-color', newColor);
  }, []);

  const value = useMemo(
    () => ({ theme, accentColor, updateTheme, updateAccentColor }),
    [theme, accentColor, updateTheme, updateAccentColor]
  );

  return (
    <AppearanceContext.Provider value={value}>
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance() {
  const context = useContext(AppearanceContext);
  if (!context) {
    throw new Error('useAppearance must be used within AppearanceProvider');
  }
  return context;
}
