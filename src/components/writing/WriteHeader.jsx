import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const formatRelativeTime = (date) => {
  if (!date) return '';
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 30) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
};

const SaveIndicator = ({ saveStatus, lastSaved, onSaveNow }) => {
  const { colors } = useTheme();

  if (saveStatus === 'saving') {
    return (
      <span style={{ fontSize: '12px', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span style={{ display: 'inline-block', width: '10px', height: '10px', border: '2px solid #f59e0b', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        Saving...
      </span>
    );
  }
  if (saveStatus === 'saved') {
    return (
      <span style={{ fontSize: '12px', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
        Saved {formatRelativeTime(lastSaved)}
      </span>
    );
  }
  if (saveStatus === 'error') {
    return (
      <span style={{ fontSize: '12px', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '4px' }}>
        Save failed
        <button onClick={onSaveNow} style={{ background: 'none', border: 'none', color: '#dc2626', textDecoration: 'underline', cursor: 'pointer', fontSize: '12px', padding: 0 }}>Retry</button>
      </span>
    );
  }
  return (
    <span style={{ fontSize: '12px', color: colors.textSecondary, display: 'flex', alignItems: 'center', gap: '4px' }}>
      ○ Unsaved
    </span>
  );
};

const WordCount = ({ count }) => {
  if (count === undefined || count === null) return null;
  return (
    <span style={{ fontSize: '12px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#f3f4f6', whiteSpace: 'nowrap' }}>
      {count.toLocaleString()} words
    </span>
  );
};

const SourceModeBadge = ({ sourceMode, sourceCount }) => {
  const config = {
    'user-only': { icon: '📚', label: 'My Sources', bg: '#f5f3ff', color: '#7c3aed' },
    'ai-only': { icon: '🤖', label: 'AI Sources', bg: '#f0fdf4', color: '#16a34a' },
    'combine': { icon: '🔗', label: 'Combined', bg: '#fff7ed', color: '#ea580c' },
  };
  const c = config[sourceMode] || config['ai-only'];
  return (
    <span style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 10px', borderRadius: '12px', backgroundColor: c.bg, color: c.color, fontWeight: '500', whiteSpace: 'nowrap' }}>
      {c.icon} {c.label}{sourceCount > 0 ? ` (${sourceCount})` : ''}
    </span>
  );
};

const WriteHeader = ({ onBack, onToggleShortcuts, onToggleLitSearch, onToggleAIDetection, projectId, saveStatus, lastSaved, onSaveNow, wordCount, sourceMode, sourceCount, isPremium }) => {
  const { colors } = useTheme();
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <button onClick={onBack} style={{ color: colors.primary, background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>← Back to Dashboard</button>
        {sourceMode && <SourceModeBadge sourceMode={sourceMode} sourceCount={sourceCount || 0} />}
        <SaveIndicator saveStatus={saveStatus} lastSaved={lastSaved} onSaveNow={onSaveNow} />
        <WordCount count={wordCount} />
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button onClick={onToggleShortcuts} title="Keyboard Shortcuts" style={{ backgroundColor: 'transparent', color: colors.textSecondary, border: `1px solid ${colors.border}`, borderRadius: '6px', padding: '6px 8px', fontSize: '14px', cursor: 'pointer', lineHeight: '1' }}>⌨</button>
        {isPremium && <button onClick={onToggleLitSearch} title="Literature Search" style={{ backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: '500', cursor: 'pointer', boxShadow: '0 1px 3px rgba(79,70,229,0.3)' }}>📚 Search Literature</button>}
        <button onClick={onToggleAIDetection} title="Check content originality" style={{ backgroundColor: '#0891b2', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: '500', cursor: 'pointer', boxShadow: '0 1px 3px rgba(8,145,178,0.3)' }}>🤖 AI Score</button>
      </div>
    </div>
  );
};

export default WriteHeader;
