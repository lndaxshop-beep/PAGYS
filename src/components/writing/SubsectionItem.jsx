import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const SubsectionItem = ({
  subsection,
  chapterId,
  index,
  isActiveChapter,
  isDraggable,
  isClickable,
  isDragged,
  isDragOver,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onClick,
  onDelete
}) => {
  const { colors, isDarkMode } = useTheme();
  const isReferences = subsection.title === 'References' || subsection.type === 'references';

  return (
    <div
      draggable={isDraggable}
      onDragStart={(e) => {
        if (isDraggable) {
          onDragStart(e, index);
          e.dataTransfer.setData('text/plain', index);
        } else {
          e.preventDefault();
        }
      }}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      onDragEnd={onDragEnd}
      onClick={() => isClickable && onClick(subsection)}
      style={{
        opacity: isDragged ? 0.5 : (isReferences && !isClickable ? 0.5 : 1),
        border: isDragOver && !isDragged ? `2px dashed ${colors.primary}` : 'none',
        padding: isDragOver && !isDragged ? '4px' : '0',
        borderRadius: '4px',
        marginBottom: '2px',
        cursor: isClickable ? (isDraggable ? 'grab' : 'pointer') : 'not-allowed',
        position: 'relative',
        backgroundColor: isActiveChapter
          ? (isDarkMode ? '#3d3d3d' : '#f0f0ff')
          : 'transparent',
        transition: 'background-color 0.2s'
      }}
      onMouseEnter={(e) => {
        if (isActiveChapter && isClickable) {
          e.currentTarget.style.backgroundColor = isDarkMode ? '#4d4d4d' : '#e0e0ff';
        }
      }}
      onMouseLeave={(e) => {
        if (isActiveChapter) {
          e.currentTarget.style.backgroundColor = isDarkMode ? '#3d3d3d' : '#f0f0ff';
        }
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: '500', color: colors.text, fontSize: '14px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {subsection.title}
            {isReferences && !isClickable && (
              <span style={{
                fontSize: '10px',
                backgroundColor: isDarkMode ? '#7f1d1d' : '#fee2e2',
                color: isDarkMode ? '#fca5a5' : '#dc2626',
                padding: '2px 6px',
                borderRadius: '4px'
              }}>
                🔒 Locked
              </span>
            )}
          </div>
          {subsection.hasPlaceholder && subsection.customValue && (
            <div style={{ fontSize: '11px', color: colors.textSecondary, marginBottom: '4px', fontStyle: 'italic' }}>
              Using: <span style={{ color: colors.primary }}>{subsection.customValue}</span>
            </div>
          )}
          {subsection.generated && (
            <div style={{ fontSize: '10px', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>✓ Generated</span>
            </div>
          )}
        </div>
        {!isReferences && onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(subsection.id); }}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              fontSize: '16px',
              cursor: 'pointer',
              color: colors.textSecondary,
              padding: '4px',
              borderRadius: '4px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#fee2e2';
              e.currentTarget.style.color = '#ef4444';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = colors.textSecondary;
            }}
            title="Delete subsection"
          >
            🗑️
          </button>
        )}
      </div>
      {isDraggable && (
        <div style={{
          position: 'absolute',
          right: '8px',
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: '12px',
          color: colors.textSecondary,
          cursor: 'grab'
        }}>
          ⋮⋮
        </div>
      )}
    </div>
  );
};

export default SubsectionItem;
