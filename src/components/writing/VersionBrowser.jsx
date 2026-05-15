import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import ContentRenderer from '../../utils/writeHelpers.jsx';

const LABEL_COLORS = {
  'AI Generated': { bg: '#ede9fe', text: '#5b21b6' },
  'Humanised': { bg: '#fef3c7', text: '#92400e' },
  'Feedback Applied': { bg: '#dbeafe', text: '#1e40af' },
  'Manual Edit': { bg: '#d1fae5', text: '#065f46' },
  'Restored': { bg: '#f3e8ff', text: '#7c3aed' },
  'AI Score Suggestion': { bg: '#ccfbf1', text: '#0f766e' },
};

const VersionBrowser = ({ isOpen, onClose, versions, currentContent, onRestore, subsection }) => {
  const { colors, isDarkMode } = useTheme();
  const [selectedVersion, setSelectedVersion] = React.useState(null);

  const formatTime = (ts) => {
    const d = new Date(ts);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) return null;

  const findPreviousContent = (v) => {
    const idx = versions.indexOf(v);
    if (idx <= 0) return null;
    return versions[idx - 1].content;
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: colors.surface, borderRadius: '16px', padding: '24px', width: '90%', maxWidth: '900px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexShrink: 0 }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: colors.text }}>
            Written Versions — {subsection?.title || ''}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: colors.textSecondary, cursor: 'pointer', fontSize: '18px', padding: '4px 8px' }}>✕</button>
        </div>

        {versions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: colors.textSecondary }}>
            No version history available for this subsection.
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '16px', flex: 1, minHeight: 0 }}>
            <div style={{ width: '280px', flexShrink: 0, overflowY: 'auto', borderRight: `1px solid ${colors.border}`, paddingRight: '12px' }}>
              {[...versions].reverse().map((v, i) => {
                const idx = versions.length - 1 - i;
                const isActive = v.content === currentContent;
                const colors2 = LABEL_COLORS[v.label] || { bg: '#f3f4f6', text: '#6b7280' };
                return (
                  <div key={idx} onClick={() => setSelectedVersion(v)}
                    style={{
                      padding: '10px 12px', borderRadius: '8px', marginBottom: '6px', cursor: 'pointer',
                      backgroundColor: selectedVersion === v ? (isDarkMode ? '#374151' : '#f3f4f6') : 'transparent',
                      border: `1px solid ${isActive ? colors.primary : 'transparent'}`,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', fontWeight: '600', backgroundColor: colors2.bg, color: colors2.text }}>
                        {v.label}
                      </span>
                      {isActive && (
                        <span style={{ fontSize: '10px', color: colors.primary, fontWeight: '600' }}>Active</span>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: colors.textSecondary }}>{formatTime(v.timestamp)}</div>
                  </div>
                );
              })}
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              {selectedVersion ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexShrink: 0 }}>
                    <span style={{ fontSize: '13px', color: colors.textSecondary }}>
                      <strong>{selectedVersion.label}</strong> — {formatTime(selectedVersion.timestamp)}
                    </span>
                    <button onClick={() => onRestore(selectedVersion.content)} style={{
                      padding: '8px 18px', fontSize: '13px', borderRadius: '8px', cursor: 'pointer',
                      backgroundColor: colors.primary, color: 'white', border: 'none', fontWeight: '600',
                    }}>
                      Restore This Version
                    </button>
                  </div>
                  <div style={{ flex: 1, display: 'flex', gap: '12px', minHeight: 0 }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                      <div style={{ fontWeight: '600', marginBottom: '8px', color: '#991b1b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', flexShrink: 0 }}>
                        Original — {selectedVersion.label}
                      </div>
                      <div style={{ flex: 1, padding: '12px', backgroundColor: isDarkMode ? '#1f2937' : '#f9fafb', borderRadius: '8px', fontSize: '12pt', lineHeight: '1.6', fontFamily: "'Times New Roman', serif", textAlign: 'justify', border: `1px solid ${colors.border}`, overflowY: 'auto' }}>
                        <ContentRenderer content={selectedVersion.content} />
                      </div>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                      <div style={{ fontWeight: '600', marginBottom: '8px', color: '#065f46', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', flexShrink: 0 }}>
                        Modified — Current Active
                      </div>
                      <div style={{ flex: 1, padding: '12px', backgroundColor: isDarkMode ? '#1f2937' : '#f9fafb', borderRadius: '8px', fontSize: '12pt', lineHeight: '1.6', fontFamily: "'Times New Roman', serif", textAlign: 'justify', border: `1px solid ${colors.border}`, overflowY: 'auto' }}>
                        <ContentRenderer content={currentContent} />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: colors.textSecondary }}>
                  Select a version from the list to compare
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VersionBrowser;
