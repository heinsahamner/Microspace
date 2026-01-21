import React, { createContext, useContext, useEffect, useState } from 'react';
import { Theme } from '../types';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  accentColor: string;
  setAccentColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as Theme) || 'light';
  });

  const [accentColor, setAccentColorState] = useState<string>(() => {
      return localStorage.getItem('accentColor') || '#7900c5';
  });

  // Handle Dark/Light Mode
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Handle Dynamic Brand Color
  useEffect(() => {
      const root = window.document.documentElement;
      root.style.setProperty('--primary-color', accentColor);
      localStorage.setItem('accentColor', accentColor);
  }, [accentColor]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setAccentColor = (color: string) => {
      setAccentColorState(color);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, accentColor, setAccentColor }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};