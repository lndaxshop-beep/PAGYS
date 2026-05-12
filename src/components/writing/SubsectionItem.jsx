import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const OUTLINE_INDENT = 16;
const OUTLINE_COLORS = ['#7c3aed', '#8b5cf6', '#a78bfa'];

const OutlineTree = ({ outline, isDarkMode, colors }) => {
  if (!outline || outline.length === 0) return null;
  return (
    <div style={{ marginTop: '6px', paddingLeft: '8px', borderLeft: `2px solid ${colors.border}`, fontSize: '11px' }}>
      {outline.map((item, i) => (
        <div key={i} style={{ paddingLeft: (item.depth - 1) * OUTLINE_INDENT, marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ color: OUTLINE_COLORS[(item.depth - 1) % OUTLINE_COLORS.length], fontWeight: '500', whiteSpace: 'nowrap' }}>{item.number}</span>
          <span style={{ color: colors.textSecondary }}>{item.title}</span>
        </div>
      ))}
    </div>
  );
};

const SubsectionItem = ({
  subsection,
  chapterId,
  index,
  isActiveChapter,
  isDraggable,
  isClickable,
  isDragged,
  isDragOver,
  wordCount,
  outline,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onClick,
  onDelete,
  onRename
}) => {
  const { colors, isDarkMode } = useTheme();
  const isReferences = subsection.type === 'references';
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(subsection.title);
  const inputRef = useRef(null);

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const handleStartEdit = (e) => {
    e.stopPropagation();
    setEditValue(subsection.title);
    setEditing(true);
  };

  const handleSaveEdit = () => {
    setEditing(false);
    if (editValue.trim() && editValue.trim() !== subsection.title) {
      onRename?.(subsection.id, editValue.trim());
    }
  };

  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter') handleSaveEdit();
    if (e.key === 'Escape') { setEditValue(subsection.title); setEditing(false); }
  };

  return (
    <div
      draggable={isDraggable && !editing}
      onDragStart={(e) => {
        if (isDraggable && !editing) {
          onDragStart(e, index);
          e.dataTransfer.setData('text/plain', index);
        } else {
          e.preventDefault();
        }
      }}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      onDragEnd={onDragEnd}
      onClick={() => !editing && isClickable && onClick(subsection)}
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
            {editing ? (
              <input
                ref={inputRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleSaveEdit}
                onKeyDown={handleEditKeyDown}
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: '100%', padding: '2px 6px', fontSize: '14px',
                  border: `1px solid ${colors.primary}`, borderRadius: '4px',
                  backgroundColor: colors.input, color: colors.text,
                  outline: 'none'
                }}
              />
            ) : (
              <span style={{ flex: 1 }}>{subsection.title}</span>
            )}
            {!isReferences && !editing && onRename && (
              <button
                onClick={handleStartEdit}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '12px', color: colors.textSecondary, padding: '2px',
                  borderRadius: '4px', opacity: 0.5, lineHeight: 1
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = colors.primary; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.5'; e.currentTarget.style.color = colors.textSecondary; }}
                title="Rename"
              >
                ✏️
              </button>
            )}
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
          {wordCount && !subsection.generated && (
            <div style={{ fontSize: '10px', color: colors.textSecondary, marginTop: '2px' }}>
              {wordCount.min}–{wordCount.max} words
            </div>
          )}
          {outline && outline.length > 0 && (
            <OutlineTree outline={outline} isDarkMode={isDarkMode} colors={colors} />
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

export default React.memo(SubsectionItem);
