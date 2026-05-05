import React from 'react';

const FeatureCard = ({ icon, title, description, colors, isDarkMode }) => (
  <div style={{
    backgroundColor: colors.surface,
    padding: '32px',
    borderRadius: '16px',
    border: `1px solid ${colors.border}`,
    transition: 'all 0.3s',
    boxShadow: isDarkMode ? '0 4px 6px rgba(0,0,0,0.3)' : '0 4px 6px rgba(0,0,0,0.05)'
  }}>
    <div style={{ fontSize: '40px', marginBottom: '20px' }}>{icon}</div>
    <h3 style={{ fontSize: '20px', fontWeight: '600', color: colors.text, marginBottom: '12px' }}>{title}</h3>
    <p style={{ color: colors.textSecondary, lineHeight: '1.6' }}>{description}</p>
  </div>
);

export default FeatureCard;
