import React from 'react';

const TestimonialCard = ({ name, role, content, colors, isDarkMode }) => (
  <div style={{
    backgroundColor: colors.surface,
    padding: '32px',
    borderRadius: '16px',
    border: `1px solid ${colors.border}`,
    boxShadow: isDarkMode ? '0 4px 6px rgba(0,0,0,0.3)' : '0 4px 6px rgba(0,0,0,0.05)'
  }}>
    <p style={{ color: colors.text, fontSize: '16px', lineHeight: '1.7', marginBottom: '24px', fontStyle: 'italic' }}>"{content}"</p>
    <div>
      <p style={{ fontWeight: '600', color: colors.text, marginBottom: '4px' }}>{name}</p>
      <p style={{ color: colors.textSecondary, fontSize: '14px' }}>{role}</p>
    </div>
  </div>
);

export default TestimonialCard;
