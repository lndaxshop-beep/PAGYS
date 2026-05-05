import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const WritingGuidelines = ({ guidelines }) => {
  const { colors, isDarkMode } = useTheme();

  const defaultGuidelines = [
    'Write in formal academic language',
    'Use proper citations (APA, MLA, etc.)',
    'Be thorough and comprehensive',
    'Support claims with evidence',
    'Maintain logical flow between sections'
  ];

  const guidelinesToShow = guidelines || defaultGuidelines;

  return (
    <div style={{
      background: isDarkMode 
        ? 'linear-gradient(135deg, #2d2d2d 0%, #3d3d3d 100%)' 
        : 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '24px',
      border: `1px solid ${colors.border}`,
      boxShadow: isDarkMode ? '0 4px 6px rgba(0,0,0,0.3)' : '0 4px 6px rgba(0,0,0,0.05)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{
          backgroundColor: colors.primary,
          borderRadius: '50%',
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: '12px'
        }}>
          <span style={{ color: 'white', fontSize: '16px' }}>📝</span>
        </div>
        <h3 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          color: colors.text,
          margin: 0
        }}>
          Writing Guidelines
        </h3>
      </div>
      <ul style={{ 
        margin: 0, 
        padding: 0, 
        listStyle: 'none'
      }}>
        {guidelinesToShow.map((guideline, index) => (
          <li key={index} style={{
            display: 'flex',
            alignItems: 'flex-start',
            marginBottom: '12px',
            color: colors.textSecondary,
            fontSize: '14px',
            lineHeight: '1.6'
          }}>
            <span style={{ 
              color: colors.primary, 
              marginRight: '12px',
              fontSize: '16px'
            }}>•</span>
            <span>{guideline}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default WritingGuidelines;