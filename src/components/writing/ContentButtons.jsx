import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const ContentButtons = ({
  isViewingReferences,
  generatingChapter, chapterComplete,
  onGenerateChapter, onComplete, getButtonText,
}) => {
  const { colors } = useTheme();

  const btnStyle = (disabled) => ({
    backgroundColor: disabled ? colors.border : (colors.primary || '#7c3aed'),
    color: disabled ? colors.textSecondary : 'white',
    padding: '10px 20px', border: 'none', borderRadius: '6px',
    fontWeight: '600', fontSize: '13px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1
  });

  return (
    <>
      <div className="content-buttons-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div className="content-buttons-left" style={{ display: 'flex', gap: '12px' }}>
          {!isViewingReferences ? (
            <button data-tour="write-btn" onClick={onGenerateChapter} disabled={generatingChapter || chapterComplete} style={btnStyle(generatingChapter || chapterComplete)}>
              {generatingChapter ? 'Writing Chapter...' : chapterComplete ? 'Chapter Written ✓' : 'Write Chapter'}
            </button>
          ) : (
            <div style={{ color: colors.textSecondary, padding: '10px 0' }}>References are auto-generated from in-text citations.</div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
        <div />
        <button data-tour="complete-btn" onClick={onComplete} disabled={!chapterComplete} style={{
          backgroundColor: chapterComplete ? '#059669' : colors.border,
          color: chapterComplete ? 'white' : colors.textSecondary,
          padding: '10px 24px', border: 'none', borderRadius: '8px',
          fontWeight: '600', cursor: chapterComplete ? 'pointer' : 'not-allowed',
          opacity: chapterComplete ? 1 : 0.5
        }}>{getButtonText()}</button>
      </div>
    </>
  );
};

export default ContentButtons;
