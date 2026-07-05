import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const ContentButtons = ({
  isViewingReferences,
  generatingChapter, chapterComplete,
  onGenerateChapter, onComplete, getButtonText,
  hasContent, feedbackLeft, feedbackBase, onFeedback, onResetFeedback, onOpenVersions,
  onCheckSources,
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

  const secondaryBtn = (bg) => ({
    backgroundColor: bg, color: 'white',
    padding: '10px 16px', border: 'none', borderRadius: '6px',
    fontWeight: '600', fontSize: '13px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: '6px',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
      {/* Top row: main actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {!isViewingReferences ? (
            <>
              <button data-tour="write-btn" onClick={onGenerateChapter} disabled={generatingChapter || chapterComplete} style={btnStyle(generatingChapter || chapterComplete)}>
                {generatingChapter ? 'Writing Chapter...' : chapterComplete ? 'Chapter Written ✓' : 'Write Chapter'}
              </button>
              {hasContent && (
                <>
                  {feedbackLeft > 0 ? (
                    <button onClick={onFeedback} style={secondaryBtn('#f59e0b')} title="Apply supervisor feedback">
                      ✏️ Feedback {feedbackLeft < feedbackBase && `(${feedbackLeft} left)`}
                    </button>
                  ) : (
                    <button onClick={onResetFeedback} style={secondaryBtn('#059669')}>
                      🔄 Reset Feedback
                    </button>
                  )}
                  <button onClick={onOpenVersions} style={secondaryBtn('#6b7280')} title="View written versions">
                    📋 Versions
                  </button>
                  <button onClick={onCheckSources} style={secondaryBtn('#7c3aed')} title="Check sources against library">
                    📋 Sources
                  </button>
                </>
              )}
            </>
          ) : (
            <div style={{ color: colors.textSecondary, padding: '10px 0' }}>References are auto-generated from in-text citations.</div>
          )}
        </div>
        <button data-tour="complete-btn" onClick={onComplete} disabled={!chapterComplete} style={{
          backgroundColor: chapterComplete ? '#059669' : colors.border,
          color: chapterComplete ? 'white' : colors.textSecondary,
          padding: '10px 24px', border: 'none', borderRadius: '8px',
          fontWeight: '600', cursor: chapterComplete ? 'pointer' : 'not-allowed',
          opacity: chapterComplete ? 1 : 0.5, fontSize: '13px',
          whiteSpace: 'nowrap',
        }}>{getButtonText()}</button>
      </div>
    </div>
  );
};

export default ContentButtons;
