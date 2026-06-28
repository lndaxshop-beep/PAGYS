import React, { useMemo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const MAX_WORDS = 100;

const countWords = (text) => text.trim() ? text.trim().split(/\s+/).length : 0;

const FeedbackModal = ({ isOpen, onClose, subsection, feedbackText, setFeedbackText, feedbackFiles, onFileUpload, onRemoveFile, onApply, applying }) => {
  const { colors } = useTheme();
  const wordCount = useMemo(() => countWords(feedbackText), [feedbackText]);
  const atLimit = wordCount >= MAX_WORDS;

  const handleChange = (e) => {
    const newText = e.target.value;
    const wc = countWords(newText);
    if (wc <= MAX_WORDS || newText.length < feedbackText.length) {
      setFeedbackText(newText);
    }
  };

  if (!isOpen || !subsection) return null;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="feedback-modal-title" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: colors.surface, borderRadius: '16px', padding: '32px', maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 id="feedback-modal-title" style={{ fontSize: '24px', fontWeight: 'bold', color: colors.text }}>{applying ? 'Applying Feedback...' : 'Supervisor Feedback'}</h2>
          <button onClick={onClose} disabled={applying} aria-label="Close feedback" style={{ background: 'none', border: 'none', fontSize: '28px', cursor: applying ? 'not-allowed' : 'pointer' }}>×</button>
        </div>
        <p style={{ color: colors.textSecondary, marginBottom: '20px' }}>Subsection: <strong>{subsection.title}</strong></p>
        {applying ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ width: '50px', height: '50px', border: `3px solid ${colors.primary}`, borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 20px', animation: 'spin 1s linear infinite' }} />
            <p>Applying feedback...</p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="feedbackNotes" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Correction notes:</label>
              <textarea id="feedbackNotes" value={feedbackText} onChange={handleChange} rows="5" style={{ width: '100%', padding: '12px', border: `1px solid ${atLimit ? '#ef4444' : colors.border}`, borderRadius: '8px', outline: atLimit ? '2px solid #ef4444' : 'none' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                <span style={{ fontSize: '12px', color: atLimit ? '#ef4444' : colors.textSecondary }}>
                  {wordCount} / {MAX_WORDS} words
                </span>
                {atLimit && (
                  <span style={{ fontSize: '12px', color: '#ef4444', fontWeight: '600' }}>Maximum words reached ({MAX_WORDS}/{MAX_WORDS})</span>
                )}
              </div>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="feedbackFiles" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Upload screenshots (optional):</label>
              <input id="feedbackFiles" type="file" multiple accept=".jpg,.jpeg,.png,.pdf" onChange={onFileUpload} style={{ width: '100%' }} />
              {feedbackFiles.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  {feedbackFiles.map((file, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', backgroundColor: colors.background, borderRadius: '4px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', color: colors.text }}>{file.name}</span>
                      <button onClick={() => onRemoveFile(i)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button onClick={onApply} disabled={(!feedbackText && feedbackFiles.length === 0) || atLimit || applying} style={{ flex: 1, backgroundColor: ((!feedbackText && feedbackFiles.length === 0) || atLimit || applying) ? colors.border : '#f59e0b', color: 'white', padding: '14px', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: applying ? 'not-allowed' : 'pointer' }}>{applying ? 'Applying...' : 'Apply Feedback'}</button>
              <button onClick={onClose} style={{ flex: 1, backgroundColor: 'transparent', color: colors.text, padding: '14px', border: `1px solid ${colors.border}`, borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FeedbackModal;
