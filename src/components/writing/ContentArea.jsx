import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import ContentRenderer from '../../utils/writeHelpers.jsx';

const ContentArea = ({
  content, isPreviewMode, onTogglePreview, onSaveEdit, onChange, currentSubsection, showReferenceInTextarea, detectionScore, citationWarnings
}) => {
  const { colors } = useTheme();
  const isReferences = currentSubsection?.title === 'References' || currentSubsection?.type === 'references' || showReferenceInTextarea;
  const detectionBadge = detectionScore !== undefined ? (
    <span style={{
      fontSize: '11px', padding: '2px 8px', borderRadius: '10px',
      backgroundColor: detectionScore > 0.75 ? '#05966920' : detectionScore > 0.6 ? '#d9770620' : '#dc262620',
      color: detectionScore > 0.75 ? '#059669' : detectionScore > 0.6 ? '#d97706' : '#dc2626',
      fontWeight: '500', marginLeft: '8px'
    }}>
      {detectionScore > 0.75 ? '🟢 Human-like' : detectionScore > 0.6 ? '🟡 Acceptable' : '🔴 AI-like'}
    </span>
  ) : null;
  const citationWarningBadge = citationWarnings?.length > 0 ? (
    <span style={{
      fontSize: '11px', padding: '2px 8px', borderRadius: '10px',
      backgroundColor: '#dc262620', color: '#dc2626',
      fontWeight: '500', marginLeft: '8px', cursor: 'help'
    }} title={citationWarnings.map(w => `${w.raw}`).join('\n')}>
      ⚠️ {citationWarnings.length} unverifiable citation(s)
    </span>
  ) : null;
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px', alignItems: 'center' }}>
        {detectionBadge}{citationWarningBadge}
        <button
          onClick={() => isPreviewMode ? onTogglePreview(false) : onSaveEdit()}
          style={{
            backgroundColor: isPreviewMode ? '#d97706' : '#059669',
            color: 'white', padding: '8px 16px', border: 'none', borderRadius: '6px',
            fontWeight: '500', cursor: 'pointer', fontSize: '13px',
            display: 'flex', alignItems: 'center', gap: '6px'
          }}
        >
          {isPreviewMode ? '✏️ Edit' : '👁️ Save & Preview'}
        </button>
      </div>

      <div style={{ backgroundColor: colors.background, borderRadius: '12px', padding: '24px', marginBottom: '24px', border: `1px solid ${colors.border}`, minHeight: '400px' }}>
        {isPreviewMode ? (
          isReferences ? (
            <div style={{ fontFamily: "'Times New Roman', serif", fontSize: '12pt', lineHeight: '2.0', whiteSpace: 'pre-wrap', textAlign: 'left' }}>
              {content || <p style={{ color: colors.textSecondary, textAlign: 'center', fontStyle: 'italic' }}>References will appear here after generation...</p>}
            </div>
          ) : (
            <ContentRenderer content={content} />
          )
        ) : (
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: colors.text, marginBottom: '16px' }}>Edit Content</h3>
            <textarea
              value={content}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Edit your content here..."
              style={{
                width: '100%', height: '400px', padding: '16px',
                border: `1px solid ${colors.inputBorder}`, borderRadius: '8px',
                fontFamily: isReferences ? "'Times New Roman', serif" : 'monospace',
                resize: 'vertical', lineHeight: '1.6', fontSize: '12pt',
                backgroundColor: colors.input, color: colors.text,
                textAlign: 'justify'
              }}
            />
          </div>
        )}
      </div>
    </>
  );
};

export default React.memo(ContentArea);
