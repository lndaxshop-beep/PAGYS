import React from 'react';
import { useNavigate } from 'react-router-dom';
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

const WriteHeader = ({ onBack, onEditWordCount, onToggleShortcuts, onToggleLitSearch, onToggleAIDetection, projectId, saveStatus, lastSaved, onSaveNow, wordCount }) => {
  const { colors } = useTheme();
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <button onClick={onBack} style={{ color: colors.primary, background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>← Back to Dashboard</button>
        <SaveIndicator saveStatus={saveStatus} lastSaved={lastSaved} onSaveNow={onSaveNow} />
        <WordCount count={wordCount} />
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button onClick={onToggleShortcuts} title="Keyboard Shortcuts" style={{ backgroundColor: 'transparent', color: colors.textSecondary, border: `1px solid ${colors.border}`, borderRadius: '6px', padding: '6px 8px', fontSize: '14px', cursor: 'pointer', lineHeight: '1' }}>⌨</button>
        <button onClick={onToggleLitSearch} title="Literature Search" style={{ backgroundColor: 'transparent', color: colors.primary, border: `1px solid ${colors.primary}60`, borderRadius: '6px', padding: '6px 10px', fontSize: '12px', cursor: 'pointer' }}>📚 Search Literature</button>
        <button onClick={onToggleAIDetection} title="Check content originality" style={{ backgroundColor: 'transparent', color: '#dc2626', border: `1px solid #dc262660`, borderRadius: '6px', padding: '6px 10px', fontSize: '12px', cursor: 'pointer' }}>🤖 AI Score</button>
        <button onClick={() => navigate(`/citations/${projectId}`)} style={{ backgroundColor: 'transparent', color: colors.primary, border: `1px solid ${colors.primary}60`, borderRadius: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer' }}>Review Citations</button>
        <button onClick={onEditWordCount} style={{ backgroundColor: 'transparent', color: colors.primary, border: `1px solid ${colors.primary}`, borderRadius: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer' }}>✎ Edit Word Count</button>
      </div>
    </div>
  );
};

export default WriteHeader;
