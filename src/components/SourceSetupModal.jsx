import React, { useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const SourceSetupModal = ({
  sourceMode, onModeChange, sources, extracting,
  onAddFile, onRemoveSource, onGenerateMatrix,
  generatingMatrix, matrix, onClose, onContinue,
  title = 'Set Up Your Sources', isPremium
}) => {
  const { colors, isDarkMode } = useTheme();
  const fileInputRef = useRef(null);

  const modes = [
    {
      id: 'user-only',
      icon: '📚',
      title: 'Use My Sources',
      description: 'Upload your own papers, articles, and screenshots. We write using ONLY your sources.',
      longDesc: 'You provide the papers. We extract key information and write your literature review based solely on what you upload. Recommended when you have specific sources you want to include.'
    },
    {
      id: 'ai-only',
      icon: '🤖',
      title: 'We Find Sources',
      description: 'We search for relevant sources automatically. No upload needed.',
      longDesc: 'We use Google Search Grounding to find and cite real academic sources relevant to your topic. This is the default behavior.'
    },
    {
      id: 'combine',
      icon: '🔗',
      title: 'Combine Both',
      description: 'Your papers plus our search. We prioritize your sources and supplement with ours.',
      longDesc: 'Upload your own papers as primary sources. We will prioritize those while also finding additional supporting sources through Google Search. Best of both worlds.'
    }
  ];

  const containerStyle = {
    padding: '24px',
    maxWidth: '700px',
    margin: '0 auto'
  };

  const cardStyle = (modeId) => ({
    padding: '20px',
    marginBottom: '16px',
    borderRadius: '12px',
    border: `2px solid ${sourceMode === modeId ? colors.primary : colors.border}`,
    backgroundColor: sourceMode === modeId
      ? (isDarkMode ? '#3a2a5c' : '#f5f3ff')
      : (isDarkMode ? '#2d2d2d' : '#ffffff'),
    cursor: 'pointer',
    transition: 'all 0.2s'
  });

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

  return (
    <div style={{
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
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: colors.text, margin: 0 }}>
              {title}
            </h2>
            <button onClick={onClose} style={{
              background: 'none', border: 'none', fontSize: '24px',
              color: colors.textSecondary, cursor: 'pointer', padding: '4px 8px'
            }}>✕</button>
          </div>
          <p style={{ color: colors.textSecondary, fontSize: '14px', marginTop: '8px' }}>
            Choose how you want to handle sources for your literature review
          </p>
        </div>

        <div style={containerStyle}>
          {modes.filter(m => isPremium || m.id === 'ai-only').map(mode => (
            <div
              key={mode.id}
              style={cardStyle(mode.id)}
              onClick={() => onModeChange(mode.id)}
              onMouseEnter={(e) => { if (sourceMode !== mode.id) e.currentTarget.style.borderColor = colors.primary; }}
              onMouseLeave={(e) => { if (sourceMode !== mode.id) e.currentTarget.style.borderColor = colors.border; }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                <span style={{ fontSize: '32px', flexShrink: 0 }}>{mode.icon}</span>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: colors.text, margin: 0 }}>{mode.title}</h3>
                    {sourceMode === mode.id && (
                      <span style={{
                        fontSize: '11px', padding: '2px 8px', borderRadius: '10px',
                        backgroundColor: colors.primary, color: 'white', fontWeight: '500'
                      }}>Selected</span>
                    )}
                  </div>
                  <p style={{ fontSize: '14px', color: colors.textSecondary, margin: '0 0 4px 0', lineHeight: '1.4' }}>
                    {mode.description}
                  </p>
                  {sourceMode === mode.id && (
                    <p style={{ fontSize: '13px', color: colors.text, marginTop: '8px', lineHeight: '1.4', fontStyle: 'italic' }}>
                      {mode.longDesc}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {(sourceMode === 'user-only' || sourceMode === 'combine') && (
            <div style={{ marginTop: '24px' }}>
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
          )}
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
            {sourceMode === 'user-only' || sourceMode === 'combine'
              ? `Continue with ${sources.length} source(s)`
              : 'Continue with Our Search'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SourceSetupModal;
