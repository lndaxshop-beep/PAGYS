import React, { useRef, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const ChapterHeader = ({ chapter, isActive, isExpanded, onClick, onRename, onDelete, isRenaming, renameValue, onRenameChange, onRenameConfirm, onRenameCancel, draggable, onDragStart }) => {
  const { colors, isDarkMode } = useTheme();
  const inputRef = useRef(null);

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  const progress = chapter.subsections
    ? Math.round((chapter.subsections.filter(s => s.generated && !s.deleted).length /
        Math.max(chapter.subsections.filter(s => !s.deleted).length, 1)) * 100)
    : 0;

  const displayTitle = chapter.customTitle || chapter.title;

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') onRenameConfirm?.();
    if (e.key === 'Escape') onRenameCancel?.();
  };

  return (
    <div
      style={{
        display: 'flex', alignItems: 'stretch', gap: '0',
        marginBottom: isExpanded ? '8px' : '0'
      }}
    >
      {draggable && (
        <div
          draggable
          onDragStart={onDragStart}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '24px', cursor: 'grab', flexShrink: 0,
            color: colors.textSecondary, fontSize: '14px',
            userSelect: 'none', opacity: 0.4
          }}
          title="Drag to reorder"
        >
          ⋮⋮
        </div>
      )}
      <button
        onClick={() => onClick(chapter.id)}
        disabled={!chapter.unlocked}
        style={{
          flex: 1,
          textAlign: 'left',
          padding: '12px 16px',
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
          position: 'relative'
        }}
        onMouseEnter={(e) => {
          if (chapter.unlocked && !isActive) e.currentTarget.style.backgroundColor = colors.hover;
        }}
        onMouseLeave={(e) => {
          if (chapter.unlocked && !isActive) e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: '14px', color: colors.textSecondary, flexShrink: 0 }}>
              {isExpanded ? '▼' : '▶'}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              {isRenaming ? (
                <input
                  ref={inputRef}
                  value={renameValue}
                  onChange={(e) => onRenameChange?.(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={() => onRenameConfirm?.()}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    width: '100%', padding: '4px 8px', fontSize: '14px', fontWeight: '600',
                    border: `1px solid ${colors.primary}`, borderRadius: '4px',
                    backgroundColor: colors.input, color: colors.text,
                    outline: 'none', boxSizing: 'border-box'
                  }}
                />
              ) : (
                <div style={{ fontWeight: '600', color: isActive ? colors.primary : colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {displayTitle}
                </div>
              )}
              {chapter.completed && !isRenaming && (
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
          {!isRenaming && (
            <div style={{ display: 'flex', gap: '4px', flexShrink: 0, marginLeft: '8px' }}>
              {chapter.unlocked && (
                <span
                  onClick={(e) => { e.stopPropagation(); onRename?.(); }}
                  style={{ cursor: 'pointer', fontSize: '13px', color: colors.textSecondary, padding: '2px 4px', borderRadius: '4px' }}
                  title="Rename chapter"
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.hover}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  ✏️
                </span>
              )}
              {!chapter.isDefault && chapter.unlocked && (
                <span
                  onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
                  style={{ cursor: 'pointer', fontSize: '13px', color: '#ef4444', padding: '2px 4px', borderRadius: '4px' }}
                  title="Delete chapter"
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  🗑️
                </span>
              )}
            </div>
          )}
        </div>
        {progress > 0 && !isRenaming && (
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
    </div>
  );
};

export default ChapterHeader;
