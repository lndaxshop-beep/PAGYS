import React from 'react';

const FeatureCard = ({ icon, title, description, colors, isDarkMode, index = 0 }) => (
  <div
    className="feature-card"
    style={{
      backgroundColor: colors.surface,
      padding: '36px 28px',
      borderRadius: '20px',
      border: `1px solid ${colors.border}`,
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: isDarkMode ? '0 4px 6px rgba(0,0,0,0.3)' : '0 4px 6px rgba(0,0,0,0.05)',
      animation: 'fadeInUp 0.6s ease both',
      animationDelay: `${index * 0.1}s`,
      cursor: 'default',
      position: 'relative',
      overflow: 'hidden',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-6px)';
      e.currentTarget.style.boxShadow = isDarkMode
        ? `0 12px 32px rgba(0,0,0,0.5)`
        : `0 12px 32px ${colors.primary}25`;
      e.currentTarget.style.borderColor = colors.primary;
      e.currentTarget.style.backgroundColor = isDarkMode
        ? colors.surface
        : '#fafaff';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = isDarkMode ? '0 4px 6px rgba(0,0,0,0.3)' : '0 4px 6px rgba(0,0,0,0.05)';
      e.currentTarget.style.borderColor = colors.border;
      e.currentTarget.style.backgroundColor = colors.surface;
    }}
  >
    <div
      className="feature-icon"
      style={{
        width: '56px',
        height: '56px',
        borderRadius: '16px',
        backgroundColor: `${colors.primary}15`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '28px',
        marginBottom: '20px',
        transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {icon}
    </div>
    <h3 style={{
      fontSize: '20px',
      fontWeight: '700',
      color: colors.text,
      marginBottom: '10px',
      lineHeight: '1.3',
    }}>{title}</h3>
    <p style={{
      color: colors.textSecondary,
      lineHeight: '1.7',
      fontSize: '14.5px',
      margin: 0,
    }}>{description}</p>
  </div>
);

export default FeatureCard;
