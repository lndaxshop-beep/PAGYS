import React from 'react';

const TestimonialCard = ({ name, role, content, colors, isDarkMode }) => (
  <div style={{
    backgroundColor: colors.surface,
    padding: '28px 24px',
    borderRadius: '16px',
    border: `1px solid ${colors.border}`,
    boxShadow: isDarkMode ? '0 4px 6px rgba(0,0,0,0.3)' : '0 4px 6px rgba(0,0,0,0.05)',
    height: '200px',
    display: 'flex',
    flexDirection: 'column',
    transition: 'all 0.3s',
    cursor: 'default',
  }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = isDarkMode ? '0 8px 20px rgba(0,0,0,0.4)' : `0 8px 20px ${colors.primary}20`;
      e.currentTarget.style.borderColor = colors.primary;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = isDarkMode ? '0 4px 6px rgba(0,0,0,0.3)' : '0 4px 6px rgba(0,0,0,0.05)';
      e.currentTarget.style.borderColor = colors.border;
    }}
  >
    <div style={{ flex: 1 }}>
      <p style={{ color: colors.text, fontSize: '14px', lineHeight: '1.65', margin: 0, fontStyle: 'italic' }}>"{content}"</p>
    </div>
    <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: `1px solid ${colors.border}60` }}>
      <p style={{ fontWeight: '600', color: colors.text, marginBottom: '2px', fontSize: '14px' }}>{name}</p>
      <p style={{ color: colors.primary, fontSize: '12px', fontWeight: '500', margin: 0 }}>{role}</p>
    </div>
  </div>
);

export default TestimonialCard;
