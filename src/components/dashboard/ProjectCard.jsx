import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const ProjectCard = ({ project, isHovered, onHover, onContinue, onDelete, onUpgrade }) => {
  const { colors, isDarkMode } = useTheme();
  const progress = project.progress || 0;
  const isComplete = progress === 100 && project.status === 'complete';
  const isPremium = project.tier === 'premium' || project.isPremium;

  return (
    <div
      onMouseEnter={() => onHover(project.id)}
      onMouseLeave={() => onHover(null)}
      style={{
        backgroundColor: colors.surface, borderRadius: '12px', padding: '20px',
        border: `1px solid ${isComplete ? '#059669' : colors.border}`,
        boxShadow: isHovered ? (isDarkMode ? '0 8px 16px rgba(0,0,0,0.3)' : '0 8px 16px rgba(0,0,0,0.1)') : 'none',
        transition: 'all 0.2s', position: 'relative'
      }}
    >
      {isHovered && (
        <button onClick={() => onDelete(project.id)} style={{
          position: 'absolute', top: '12px', right: '12px',
          backgroundColor: '#ef4444', color: 'white', width: '32px', height: '32px',
          borderRadius: '50%', border: 'none', fontSize: '16px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>🗑️</button>
      )}
      {isComplete && (
        <div style={{
          position: 'absolute', top: '12px', right: isHovered ? '50px' : '12px',
          backgroundColor: '#059669', color: 'white', padding: '4px 10px',
          borderRadius: '20px', fontSize: '12px', fontWeight: '600'
        }}>✅ Complete</div>
      )}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <h3 style={{ fontWeight: '600', color: colors.text, margin: 0 }}>
            {project.title}
          </h3>
          <span style={{
            fontSize: '11px', padding: '2px 8px', borderRadius: '10px',
            fontWeight: '600', whiteSpace: 'nowrap',
            backgroundColor: isPremium ? (isDarkMode ? '#3d2d1a' : '#fffbe6') : (isDarkMode ? '#2d2d2d' : '#f3f4f6'),
            color: isPremium ? '#d97706' : colors.textSecondary,
            border: `1px solid ${isPremium ? '#f59e0b' : colors.border}`
          }}>
            {isPremium ? '💎 Premium' : '📘 Regular'}
          </span>
        </div>
        {project.useOrganization && project.organizationName && (
          <p style={{ fontSize: '12px', color: colors.primary, marginBottom: '4px' }}>
            🏢 Case study: {project.organizationName}{project.hideOrganization && ' (internal)'}
          </p>
        )}
        <p style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '8px' }}>
          Last edited: {new Date(project.lastEdited).toLocaleDateString()}
        </p>
      </div>
      <div style={{ marginBottom: '12px', marginTop: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
          <span style={{ color: colors.textSecondary }}>Progress</span>
          <span style={{ fontWeight: '600', color: isComplete ? '#059669' : colors.primary }}>{progress}%</span>
        </div>
        <div style={{ width: '100%', backgroundColor: isDarkMode ? '#3d3d3d' : '#f3f4f6', borderRadius: '999px', height: '6px' }}>
          <div style={{ width: `${progress}%`, backgroundColor: isComplete ? '#059669' : colors.primary, height: '6px', borderRadius: '999px', transition: 'width 0.3s' }} />
        </div>
      </div>
      {!isPremium && onUpgrade && (
        <button onClick={() => onUpgrade(project)} style={{
          width: '100%', marginBottom: '8px',
          backgroundColor: '#f59e0b', color: 'white', padding: '8px',
          border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer',
          fontSize: '12px'
        }}>
          ⚡ Upgrade to Premium (+₵10)
        </button>
      )}
      <button onClick={() => onContinue(project.id)} style={{
        width: '100%', backgroundColor: isComplete ? '#059669' : colors.primary,
        color: 'white', padding: '10px', border: 'none', borderRadius: '6px',
        fontWeight: '500', cursor: 'pointer'
      }}>
        {isComplete ? 'View / Edit Thesis' : 'Continue Writing'}
      </button>
    </div>
  );
};

export default ProjectCard;
