import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const DeletedSubsections = ({ chapterId, deletedSubsections, onRestore }) => {
  const { colors, isDarkMode } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [hoveredId, setHoveredId] = useState(null);

  if (!deletedSubsections?.length) return null;

  return (
    <div style={{ marginTop: '20px', paddingTop: '12px', borderTop: `1px solid ${colors.border}` }}>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
          fontWeight: '600',
          color: colors.textSecondary,
          marginBottom: expanded ? '8px' : '0',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          cursor: 'pointer',
          padding: '4px 0'
        }}
      >
        <span>🗑️ Deleted ({deletedSubsections.length})</span>
        <span style={{ fontSize: '10px' }}>{expanded ? '▲ Hide' : '▼ Show'}</span>
      </div>

      {expanded && deletedSubsections.map((sub) => (
        <div
          key={sub.id}
          onMouseEnter={() => setHoveredId(sub.id)}
          onMouseLeave={() => setHoveredId(null)}
          style={{
            padding: '8px 12px',
            marginBottom: '4px',
            borderRadius: '4px',
            backgroundColor: isDarkMode ? '#2d2d2d' : '#f9fafb',
            border: `1px solid ${colors.border}`,
            opacity: 0.6,
            position: 'relative',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: colors.textSecondary, textDecoration: 'line-through' }}>
              {sub.title}
            </span>
            {hoveredId === sub.id && (
              <button
                onClick={(e) => { e.stopPropagation(); onRestore?.(sub.id); }}
                style={{
                  backgroundColor: colors.primary,
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.primaryDark; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = colors.primary; }}
              >
                Restore
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DeletedSubsections;
