import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const ChapterHeader = ({ chapter, isActive, isExpanded, onClick }) => {
  const { colors, isDarkMode } = useTheme();
  const progress = chapter.subsections
    ? Math.round((chapter.subsections.filter(s => s.generated && !s.deleted).length /
        Math.max(chapter.subsections.filter(s => !s.deleted).length, 1)) * 100)
    : 0;

  return (
    <button
      onClick={() => onClick(chapter.id)}
      disabled={!chapter.unlocked}
      style={{
        width: '100%',
        textAlign: 'left',
        padding: '16px',
        borderRadius: '8px',
        border: 'none',
        borderLeft: isActive ? `4px solid ${colors.primary}` : '4px solid transparent',
        backgroundColor: isActive
          ? isDarkMode ? '#3d3d3d' : '#f5f3ff'
          : 'transparent',
        cursor: chapter.unlocked ? 'pointer' : 'not-allowed',
        opacity: chapter.unlocked ? 1 : 0.5,
        transition: 'all 0.2s',
        color: colors.text,
        marginBottom: isExpanded ? '8px' : '0'
      }}
      onMouseEnter={(e) => {
        if (chapter.unlocked && !isActive) e.currentTarget.style.backgroundColor = colors.hover;
      }}
      onMouseLeave={(e) => {
        if (chapter.unlocked && !isActive) e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
          <span style={{ fontSize: '14px', color: colors.textSecondary }}>
            {isExpanded ? '▼' : '▶'}
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '600', color: isActive ? colors.primary : colors.text }}>
              {chapter.title}
            </div>
            {chapter.completed && (
              <span style={{
                backgroundColor: isDarkMode ? '#2d6a4f' : '#d1fae5',
                color: isDarkMode ? '#d1fae5' : '#065f46',
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '999px',
                fontWeight: '500',
                marginLeft: '8px'
              }}>
                ✓ Done
              </span>
            )}
          </div>
        </div>
      </div>
      {progress > 0 && (
        <div style={{
          marginTop: '6px',
          width: '100%',
          height: '3px',
          backgroundColor: isDarkMode ? '#404040' : '#e5e7eb',
          borderRadius: '999px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${progress}%`,
            height: '3px',
            backgroundColor: colors.primary,
            borderRadius: '999px',
            transition: 'width 0.3s'
          }} />
        </div>
      )}
    </button>
  );
};

export default ChapterHeader;
