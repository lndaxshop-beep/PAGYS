import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const ChapterGuidelines = ({ chapter, onUpdate }) => {
  const { colors, isDarkMode } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [text, setText] = useState(chapter.guidelines || '');

  const handleSave = () => {
    onUpdate?.(chapter.id, text);
    setExpanded(false);
  };

  const handleCancel = () => {
    setText(chapter.guidelines || '');
    setExpanded(false);
  };

  const hasGuidelines = !!chapter.guidelines;

  return (
    <div style={{ marginTop: '8px' }}>
      {!expanded ? (
        <button
          onClick={() => setExpanded(true)}
          style={{
            width: '100%', padding: '6px 8px', fontSize: '11px',
            backgroundColor: hasGuidelines ? (isDarkMode ? '#2d6a4f20' : '#d1fae5') : 'transparent',
            color: hasGuidelines ? '#059669' : colors.textSecondary,
            border: `1px dashed ${hasGuidelines ? '#059669' : colors.border}`,
            borderRadius: '6px', cursor: 'pointer', textAlign: 'center',
            transition: 'all 0.2s',
          }}
        >
          {hasGuidelines ? '📋 AI Guidelines Set' : '✏️ Set AI Writing Guidelines'}
        </button>
      ) : (
        <div style={{
          padding: '8px', backgroundColor: isDarkMode ? '#2d2d2d' : '#f9fafb',
          borderRadius: '6px', border: `1px solid ${colors.border}`,
        }}>
          <p style={{ fontSize: '11px', color: colors.textSecondary, margin: '0 0 6px', fontWeight: '500' }}>
            Custom AI instructions for this chapter:
          </p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g., Focus on qualitative studies from Sub-Saharan Africa. Avoid citing papers older than 2015. Emphasize methodological rigor."
            style={{
              width: '100%', minHeight: '60px', padding: '6px', fontSize: '11px',
              border: `1px solid ${colors.border}`, borderRadius: '4px',
              backgroundColor: colors.input, color: colors.text, resize: 'vertical',
              fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', gap: '6px', marginTop: '6px', justifyContent: 'flex-end' }}>
            <button
              onClick={handleCancel}
              style={{
                padding: '4px 10px', fontSize: '11px', borderRadius: '4px',
                backgroundColor: 'transparent', color: colors.textSecondary,
                border: `1px solid ${colors.border}`, cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              style={{
                padding: '4px 10px', fontSize: '11px', borderRadius: '4px',
                backgroundColor: colors.primary, color: 'white',
                border: 'none', cursor: 'pointer', fontWeight: '500',
              }}
            >
              Save Guidelines
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChapterGuidelines;
