import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle = () => {
  const { isDarkMode, toggleTheme, colors } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      style={{
        background: 'transparent',
        border: `1px solid ${colors.border}`,
        borderRadius: '30px',
        padding: '8px 16px',
        cursor: 'pointer',
        color: colors.text,
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}
    >
      {isDarkMode ? '☀️ Light' : '🌙 Dark'}
    </button>
  );
};

export default ThemeToggle;