import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const ContentButtons = ({
  isViewingReferences, currentSubsection, currentSubsectionIndex, activeSubsections,
  generating, humanising, chapterComplete, overallProgress, generatedActive, totalActive,
  referencesSub, referencesGenerated,
  onGenerate, onHumanise, onFeedback, onPrev, onNext, onComplete, getButtonText,
  humaniseAvailable, feedbackAvailable, humaniseLeft, feedbackLeft
}) => {
  const { colors } = useTheme();
  const sub = activeSubsections[currentSubsectionIndex];
  const subId = sub?.id || '';
  const canGenerate = !generating && currentSubsection && !currentSubsection?.generated;
  const canHumanise = !humanising && currentSubsection?.generated && humaniseAvailable;
  const canFeedback = chapterComplete && currentSubsection?.generated && feedbackAvailable;

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          {!isViewingReferences ? (
            <>
              <button onClick={onGenerate} disabled={!canGenerate} style={btnStyle(!canGenerate)}>
                {generating ? 'Generating...' : currentSubsection?.generated ? 'Already Generated' : `Generate ${currentSubsection?.title || 'Current'}`}
              </button>
              <button onClick={onHumanise} disabled={!canHumanise} style={{
                ...btnStyle(!canHumanise),
                backgroundColor: !canHumanise ? colors.border : '#d97706'
              }}>
                {humanising ? 'Humanising...' : `✨ Humanise (${humaniseLeft} left)`}
              </button>
              <button onClick={() => onFeedback(currentSubsection)} disabled={!canFeedback} title={!chapterComplete ? 'Complete the chapter first' : 'Apply supervisor feedback'} style={{
                ...btnStyle(!canFeedback),
                backgroundColor: !canFeedback ? colors.border : '#f59e0b'
              }}>
                ✏️ Feedback ({feedbackLeft} left) {!chapterComplete && '🔒'}
              </button>
            </>
          ) : (
            <div style={{ color: colors.textSecondary, padding: '10px 0' }}>References are auto-generated from in-text citations.</div>
          )}
        </div>
        {!isViewingReferences && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={onPrev} disabled={currentSubsectionIndex === 0} style={{
              padding: '8px 16px', backgroundColor: currentSubsectionIndex === 0 ? colors.border : colors.primary,
              color: currentSubsectionIndex === 0 ? colors.textSecondary : 'white',
              border: 'none', borderRadius: '6px', fontSize: '13px',
              cursor: currentSubsectionIndex === 0 ? 'not-allowed' : 'pointer'
            }}>← Previous</button>
            <button onClick={onNext} disabled={currentSubsectionIndex === activeSubsections.length - 1} style={{
              padding: '8px 16px',
              backgroundColor: currentSubsectionIndex === activeSubsections.length - 1 ? colors.border : colors.primary,
              color: currentSubsectionIndex === activeSubsections.length - 1 ? colors.textSecondary : 'white',
              border: 'none', borderRadius: '6px', fontSize: '13px',
              cursor: currentSubsectionIndex === activeSubsections.length - 1 ? 'not-allowed' : 'pointer'
            }}>Next →</button>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
        <span style={{ color: colors.textSecondary, fontWeight: '500' }}>
          Overall Progress: {overallProgress.percentage}% • {generatedActive} of {totalActive} subsections generated
          {referencesSub && ` • References: ${referencesGenerated ? '✓' : 'pending'}`}
        </span>
        <button onClick={onComplete} disabled={!chapterComplete} style={{
          backgroundColor: chapterComplete ? '#059669' : colors.border,
          color: chapterComplete ? 'white' : colors.textSecondary,
          padding: '10px 24px', border: 'none', borderRadius: '8px',
          fontWeight: '600', cursor: chapterComplete ? 'pointer' : 'not-allowed'
        }}>{getButtonText()}</button>
      </div>
    </>
  );
};

export default ContentButtons;
