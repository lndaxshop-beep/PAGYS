import React, { useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';

// Which sources are used is no longer a choice: anything in the library is used,
// and Google Search Grounding covers the rest. The modal is therefore just the
// upload surface, with the derived behaviour stated rather than selected.
const SourceSetupModal = ({
  sources, extracting,
  onAddFile, onRemoveSource, onGenerateMatrix,
  generatingMatrix, matrix, onClose, onContinue,
  title = 'Set Up Your Sources'
}) => {
  const { colors, isDarkMode } = useTheme();
  const fileInputRef = useRef(null);

  const uploadAreaStyle = {
    border: `2px dashed ${colors.primary}`,
    borderRadius: '12px',
    padding: '32px',
    textAlign: 'center',
    marginBottom: '20px',
    backgroundColor: isDarkMode ? '#2d2d2d' : '#f5f3ff'
  };

  const sourceCardStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    marginBottom: '8px',
    borderRadius: '8px',
    backgroundColor: isDarkMode ? '#1a1a1a' : '#f9fafb',
    border: `1px solid ${colors.border}`
  };

  const containerStyle = { padding: '24px', maxWidth: '700px', margin: '0 auto' };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="source-setup-title" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 2000
    }}>
      <div style={{
        backgroundColor: colors.surface, borderRadius: '16px',
        maxWidth: '750px', width: '90%', maxHeight: '90vh',
        overflowY: 'auto', padding: '0'
      }}>
        <div style={{ padding: '24px', borderBottom: `1px solid ${colors.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 id="source-setup-title" style={{ fontSize: '20px', fontWeight: '700', color: colors.text, margin: 0 }}>
              {title}
            </h2>
            <button onClick={onClose} aria-label="Close source setup" style={{
              background: 'none', border: 'none', fontSize: '24px',
              color: colors.textSecondary, cursor: 'pointer', padding: '4px 8px'
            }}>✕</button>
          </div>
          <p style={{ color: colors.textSecondary, fontSize: '14px', marginTop: '8px' }}>
            Add any literature you want cited. We write from the papers you provide and
            ground everything else in published research.
          </p>
        </div>

        <div style={containerStyle}>
          <div>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: colors.text, marginBottom: '16px' }}>
                Upload Your Sources
              </h3>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.jpg,.jpeg,.png"
                multiple
                onChange={onAddFile}
                style={{ display: 'none' }}
              />

              <div style={uploadAreaStyle}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>📎</div>
                <p style={{ color: colors.text, fontWeight: '500', marginBottom: '8px' }}>
                  Drop your files here or click to upload
                </p>
                <p style={{ color: colors.textSecondary, fontSize: '13px', marginBottom: '16px' }}>
                  PDF, Word (.docx), or screenshots
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    backgroundColor: colors.primary, color: 'white',
                    padding: '10px 24px', border: 'none', borderRadius: '8px',
                    fontWeight: '600', cursor: 'pointer', fontSize: '14px'
                  }}
                >
                  Choose Files
                </button>
              </div>

              {extracting && (
                <div style={{ textAlign: 'center', padding: '16px' }}>
                  <div style={{
                    width: '32px', height: '32px', border: `3px solid ${colors.primary}`,
                    borderTopColor: 'transparent', borderRadius: '50%',
                    margin: '0 auto 12px', animation: 'spin 0.8s linear infinite'
                  }} />
                  <p style={{ color: colors.textSecondary }}>Extracting paper metadata...</p>
                </div>
              )}

              {sources.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', color: colors.text, marginBottom: '12px' }}>
                    Uploaded Sources ({sources.length})
                  </h4>
                  {sources.map(source => (
                    <div key={source.id} style={sourceCardStyle}>
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontSize: '14px', color: colors.text, fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {source.fileType === 'image' ? '🖼️' : source.fileType === 'pdf' ? '📕' : '📝'} {source.title}
                        </div>
                        <div style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '2px' }}>
                          {source.authors} ({source.year}) — {source.methodology}
                        </div>
                      </div>
                      <button
                        onClick={() => onRemoveSource(source.id)}
                        style={{
                          color: '#ef4444', background: 'none', border: 'none',
                          cursor: 'pointer', fontSize: '18px', padding: '4px 8px',
                          borderRadius: '4px', flexShrink: 0
                        }}
                      >✕</button>
                    </div>
                  ))}

                  {sources.length >= 2 && (
                    <button
                      onClick={onGenerateMatrix}
                      disabled={generatingMatrix}
                      style={{
                        width: '100%', marginTop: '12px',
                        backgroundColor: colors.primary, color: 'white',
                        padding: '12px', border: 'none', borderRadius: '8px',
                        fontWeight: '600', cursor: generatingMatrix ? 'not-allowed' : 'pointer',
                        fontSize: '14px', opacity: generatingMatrix ? 0.7 : 1
                      }}
                    >
                      {generatingMatrix ? 'Creating Literature Matrix...' : '📊 Create Literature Matrix'}
                    </button>
                  )}
                </div>
              )}
          </div>
        </div>

        <div style={{ padding: '16px 24px', borderTop: `1px solid ${colors.border}`, textAlign: 'right' }}>
          <button
            onClick={onContinue || onClose}
            style={{
              backgroundColor: colors.primary, color: 'white',
              padding: '10px 24px', border: 'none', borderRadius: '8px',
              fontWeight: '600', cursor: 'pointer', fontSize: '14px'
            }}
          >
            {sources.length > 0
              ? `Continue with ${sources.length} source(s)`
              : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SourceSetupModal;
