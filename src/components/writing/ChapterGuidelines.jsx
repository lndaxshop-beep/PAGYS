import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const WORD_LIMIT = 500;

const ChapterGuidelines = ({ chapter, onUpdate }) => {
  const { colors, isDarkMode } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [text, setText] = useState(chapter.guidelines || '');

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const overLimit = wordCount > WORD_LIMIT;

  const handleSave = () => {
    if (overLimit) return;
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
        <button data-tour="guidelines-btn"
          onClick={() => setExpanded(true)}
          style={{
            width: '100%', padding: '8px 12px', fontSize: '12px', fontWeight: '600',
            background: hasGuidelines
              ? (isDarkMode ? 'linear-gradient(135deg, #065f46, #047857)' : 'linear-gradient(135deg, #d1fae5, #a7f3d0)')
              : (isDarkMode ? 'linear-gradient(135deg, #1e3a5f, #1e40af)' : 'linear-gradient(135deg, #dbeafe, #bfdbfe)'),
            color: hasGuidelines ? '#d1fae5' : (isDarkMode ? '#93c5fd' : '#1e40af'),
            border: `1px solid ${hasGuidelines ? '#059669' : '#3b82f6'}`,
            borderRadius: '8px', cursor: 'pointer', textAlign: 'center',
            transition: 'all 0.2s', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: '6px',
            boxShadow: hasGuidelines
              ? '0 1px 3px rgba(5,150,105,0.2)'
              : '0 1px 3px rgba(59,130,246,0.2)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = hasGuidelines
              ? '0 3px 8px rgba(5,150,105,0.3)'
              : '0 3px 8px rgba(59,130,246,0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = hasGuidelines
              ? '0 1px 3px rgba(5,150,105,0.2)'
              : '0 1px 3px rgba(59,130,246,0.2)';
          }}
        >
          <span style={{ fontSize: '14px' }}>✨</span>
          {hasGuidelines ? 'Custom Guidelines Set' : 'Set Custom Guidelines'}
        </button>
      ) : (
        <div style={{
          padding: '8px', backgroundColor: isDarkMode ? '#2d2d2d' : '#f9fafb',
          borderRadius: '6px', border: `1px solid ${colors.border}`,
        }}>
          <p style={{ fontSize: '11px', color: colors.textSecondary, margin: '0 0 6px', fontWeight: '500' }}>
            Custom instructions for this chapter (sent to AI with every generation):
          </p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g., Focus on qualitative studies from Sub-Saharan Africa. Avoid citing papers older than 2015. Emphasize methodological rigor."
            style={{
              width: '100%', minHeight: '60px', padding: '6px', fontSize: '11px',
              border: `1px solid ${overLimit ? '#ef4444' : colors.border}`, borderRadius: '4px',
              backgroundColor: colors.input, color: colors.text, resize: 'vertical',
              fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
            }}
          />
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginTop: '4px', gap: '8px', flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                fontSize: '11px', fontWeight: '600',
                color: overLimit ? '#ef4444' : colors.textSecondary,
              }}>
                {wordCount} / {WORD_LIMIT} words
              </span>
              {overLimit && (
                <span style={{ fontSize: '10px', color: '#ef4444', fontWeight: '500' }}>
                  Limit exceeded — trim to save
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={handleCancel} style={{
                padding: '4px 10px', fontSize: '11px', borderRadius: '4px',
                backgroundColor: 'transparent', color: colors.textSecondary,
                border: `1px solid ${colors.border}`, cursor: 'pointer',
              }}>Cancel</button>
              <button onClick={handleSave} disabled={overLimit} style={{
                padding: '4px 10px', fontSize: '11px', borderRadius: '4px',
                backgroundColor: overLimit ? colors.border : colors.primary,
                color: 'white', border: 'none', cursor: overLimit ? 'not-allowed' : 'pointer',
                fontWeight: '500', opacity: overLimit ? 0.6 : 1,
              }}>Save Guidelines</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChapterGuidelines;
