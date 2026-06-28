import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useCurrency } from '../../hooks/useCurrency';
import { PRICES_GHS } from '../../constants/pricing';

const ContentButtons = ({
  isViewingReferences, currentSubsection, currentSubsectionIndex, activeSubsections,
  generating, humanising, chapterComplete, overallProgress, generatedActive, totalActive,
  referencesSub, referencesGenerated,
  onGenerate, onHumanise, onFeedback, onPrev, onNext, onComplete, getButtonText,
  humaniseAvailable, feedbackAvailable, humaniseLeft, feedbackLeft,
  onResetHumanise, onResetFeedback, onOpenVersions,
  generatingAll,
}) => {
  const { colors } = useTheme();
  const { fmt } = useCurrency();
  const sub = activeSubsections[currentSubsectionIndex];
  const subId = sub?.id || '';
  const canGenerate = !generating && !generatingAll && currentSubsection && !currentSubsection?.generated;
  const canHumanise = !humanising && currentSubsection?.generated && humaniseAvailable;
  const canFeedback = currentSubsection?.generated && feedbackAvailable;

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
              <button data-tour="write-btn" onClick={onGenerate} disabled={!canGenerate} style={btnStyle(!canGenerate)}>
                {generating ? 'Writing...' : currentSubsection?.generated ? 'Written' : `Write ${currentSubsection?.title || 'Current'}`}
              </button>
              {currentSubsection?.generated && (
                <>
                  {humaniseLeft > 0 ? (
                    <button data-tour="humanise-btn" onClick={onHumanise} disabled={humanising} style={{
                      ...btnStyle(false),
                      backgroundColor: '#d97706'
                    }}>
                      {humanising ? 'Humanising...' : `✨ Humanise (${humaniseLeft} left)`}
                    </button>
                  ) : (
                    <button onClick={() => onResetHumanise?.()} style={{
                      backgroundColor: '#2563eb',
                      color: 'white', padding: '10px 20px', border: 'none', borderRadius: '6px',
                      fontWeight: '600', fontSize: '13px', cursor: 'pointer'
                    }}>
                      🔄 Reset Humanise ({fmt(PRICES_GHS.humaniseReset)})
                    </button>
                  )}
                  {feedbackLeft > 0 ? (
                    <button data-tour="feedback-btn" onClick={() => onFeedback(currentSubsection)} title="Apply supervisor feedback" style={{
                      ...btnStyle(false),
                      backgroundColor: '#f59e0b'
                    }}>
                      ✏️ Feedback ({feedbackLeft} left)
                    </button>
                  ) : (
                    <button onClick={() => onResetFeedback?.()} style={{
                      backgroundColor: '#059669',
                      color: 'white', padding: '10px 20px', border: 'none', borderRadius: '6px',
                      fontWeight: '600', fontSize: '13px', cursor: 'pointer'
                    }}>
                      🔄 Reset Feedback ({fmt(PRICES_GHS.feedbackReset)})
                    </button>
                  )}
                  <button data-tour="versions-btn" onClick={onOpenVersions} style={{
                    backgroundColor: '#6b7280',
                    color: 'white', padding: '10px 16px', border: 'none', borderRadius: '6px',
                    fontWeight: '600', fontSize: '13px', cursor: 'pointer'
                  }}>
                    📋 Written Versions
                  </button>
                </>
              )}
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
          Overall Progress: {overallProgress.percentage}% • {generatedActive} of {totalActive} subsections written
          {referencesSub && ` • References: ${referencesGenerated ? '✓' : 'pending'}`}
        </span>
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
