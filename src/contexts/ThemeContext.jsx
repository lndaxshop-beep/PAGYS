import React, { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // Check localStorage for saved theme preference
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark';
  });

  // Update localStorage when theme changes
  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    
    // Apply theme class to body
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
      document.documentElement.style.backgroundColor = '#1a1a1a';
    } else {
      document.body.classList.remove('dark-mode');
      document.documentElement.style.backgroundColor = '#f9fafb';
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  // Theme colors - simplified
  const theme = {
    isDarkMode,
    toggleTheme,
    colors: isDarkMode ? {
      background: '#1a1a1a',
      surface: '#2d2d2d',
      primary: '#9f7aea',
      primaryDark: '#805ad5',
      text: '#ffffff',
      textSecondary: '#a0a0a0',
      border: '#404040',
      hover: '#3d3d3d',
      input: '#3d3d3d',
      inputBorder: '#4a4a4a'
    } : {
      background: '#f9fafb',
      surface: '#ffffff',
      primary: '#7c3aed',
      primaryDark: '#6d28d9',
      text: '#111827',
      textSecondary: '#6b7280',
      border: '#e5e7eb',
      hover: '#f3f4f6',
      input: '#ffffff',
      inputBorder: '#d1d5db'
    }
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};