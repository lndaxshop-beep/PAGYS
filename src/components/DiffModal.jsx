import React, { useState, useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { computeDiff } from '../utils/textDiff';

const COLOR_ADD_BG = '#d1fae5';
const COLOR_ADD_TEXT = '#065f46';
const COLOR_REMOVE_BG = '#fee2e2';
const COLOR_REMOVE_TEXT = '#991b1b';
const COLOR_REPLACE_BG = '#fef3c7';

const DiffSegment = ({ segment }) => {
  if (segment.type === 'same') {
    return <span>{segment.text}</span>;
  }
  if (segment.type === 'add') {
    return <span style={{ backgroundColor: COLOR_ADD_BG, color: COLOR_ADD_TEXT, borderRadius: '2px', padding: '0 1px' }}>{segment.text}</span>;
  }
  if (segment.type === 'remove') {
    return <span style={{ backgroundColor: COLOR_REMOVE_BG, color: COLOR_REMOVE_TEXT, borderRadius: '2px', padding: '0 1px', textDecoration: 'line-through' }}>{segment.text}</span>;
  }
  if (segment.type === 'replace') {
    return (
      <span style={{ backgroundColor: COLOR_REPLACE_BG, borderRadius: '2px', padding: '0 1px' }}>
        <span style={{ backgroundColor: COLOR_REMOVE_BG, color: COLOR_REMOVE_TEXT, textDecoration: 'line-through' }}>{segment.oldText}</span>
        {'→'}
        <span style={{ backgroundColor: COLOR_ADD_BG, color: COLOR_ADD_TEXT }}>{segment.newText}</span>
      </span>
    );
  }
  return null;
};

const DiffModal = ({ isOpen, oldText, newText, title, onAccept, onReject }) => {
  const { colors, isDarkMode } = useTheme();
  const [view, setView] = useState('inline');

  const diff = useMemo(() => {
    if (!oldText || !newText) return [];
    return computeDiff(oldText, newText);
  }, [oldText, newText]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onReject}
      role="dialog"
      aria-modal="true"
      aria-labelledby="diff-modal-title"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ backgroundColor: colors.surface, borderRadius: '16px', padding: '24px', width: '90%', maxWidth: '800px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexShrink: 0 }}>
          <h2 id="diff-modal-title" style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: colors.text }}>{title || 'Changes Preview'}</h2>
          <button onClick={onReject} aria-label="Close diff modal" style={{ background: 'none', border: 'none', color: colors.textSecondary, cursor: 'pointer', fontSize: '18px', padding: '4px 8px' }}>✕</button>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexShrink: 0 }} role="tablist" aria-label="Diff view mode">
          <button
            onClick={() => setView('inline')}
            role="tab"
            aria-selected={view === 'inline'}
            style={{
              padding: '4px 12px', fontSize: '12px', borderRadius: '6px', cursor: 'pointer',
              backgroundColor: view === 'inline' ? colors.primary : 'transparent',
              color: view === 'inline' ? 'white' : colors.textSecondary,
              border: `1px solid ${view === 'inline' ? colors.primary : colors.border}`, fontWeight: view === 'inline' ? '600' : '400',
            }}
          >
            Inline Diff
          </button>
          <button
            onClick={() => setView('side-by-side')}
            role="tab"
            aria-selected={view === 'side-by-side'}
            style={{
              padding: '4px 12px', fontSize: '12px', borderRadius: '6px', cursor: 'pointer',
              backgroundColor: view === 'side-by-side' ? colors.primary : 'transparent',
              color: view === 'side-by-side' ? 'white' : colors.textSecondary,
              border: `1px solid ${view === 'side-by-side' ? colors.primary : colors.border}`, fontWeight: view === 'side-by-side' ? '600' : '400',
            }}
          >
            Side by Side
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', minHeight: '200px' }}>
          {view === 'inline' ? (
            <div style={{ padding: '12px', backgroundColor: isDarkMode ? '#1f2937' : '#f9fafb', borderRadius: '8px', fontSize: '13px', lineHeight: '1.6', fontFamily: 'monospace', whiteSpace: 'pre-wrap', border: `1px solid ${colors.border}` }}>
              {diff.length > 0 ? diff.map((seg, i) => <DiffSegment key={i} segment={seg} />) : <span style={{ color: '#059669' }}>No changes detected</span>}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '12px', height: '100%' }}>
              <div style={{ flex: 1, padding: '12px', backgroundColor: isDarkMode ? '#1f2937' : '#f9fafb', borderRadius: '8px', fontSize: '12px', lineHeight: '1.5', whiteSpace: 'pre-wrap', border: `1px solid ${colors.border}`, overflowY: 'auto' }}>
                <div style={{ fontWeight: '600', marginBottom: '8px', color: '#991b1b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Original</div>
                {oldText}
              </div>
              <div style={{ flex: 1, padding: '12px', backgroundColor: isDarkMode ? '#1f2937' : '#f9fafb', borderRadius: '8px', fontSize: '12px', lineHeight: '1.5', whiteSpace: 'pre-wrap', border: `1px solid ${colors.border}`, overflowY: 'auto' }}>
                <div style={{ fontWeight: '600', marginBottom: '8px', color: '#065f46', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Modified</div>
                {newText}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexShrink: 0, justifyContent: 'flex-end' }}>
          <button
            onClick={() => onReject?.()}
            style={{
              padding: '10px 20px', fontSize: '13px', borderRadius: '8px', cursor: 'pointer',
              backgroundColor: 'transparent', color: colors.textSecondary,
              border: `1px solid ${colors.border}`, fontWeight: '500',
            }}
          >
            Reject Changes
          </button>
          <button
            onClick={() => onAccept?.()}
            style={{
              padding: '10px 20px', fontSize: '13px', borderRadius: '8px', cursor: 'pointer',
              backgroundColor: colors.primary, color: 'white',
              border: 'none', fontWeight: '600',
            }}
          >
            Accept Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiffModal;
