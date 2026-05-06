import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';

const WriteHeader = ({ onBack, onEditWordCount, projectId }) => {
  const { colors } = useTheme();
  const navigate = useNavigate();
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
      <button onClick={onBack} style={{ color: colors.primary, background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>← Back to Dashboard</button>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={() => navigate(`/citations/${projectId}`)} style={{ backgroundColor: 'transparent', color: colors.primary, border: `1px solid ${colors.primary}60`, borderRadius: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer' }}>Review Citations</button>
        <button onClick={onEditWordCount} style={{ backgroundColor: 'transparent', color: colors.primary, border: `1px solid ${colors.primary}`, borderRadius: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer' }}>✎ Edit Word Count</button>
      </div>
    </div>
  );
};

export default WriteHeader;
