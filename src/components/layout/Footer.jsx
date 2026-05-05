import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';

const Footer = () => {
  const { colors } = useTheme();
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  const navStyle = { background: 'none', border: 'none', color: colors.textSecondary, fontSize: '14px', cursor: 'pointer', transition: 'color 0.2s' };
  const hoverStyle = (e) => { e.target.style.color = colors.primary; };
  const leaveStyle = (e) => { e.target.style.color = colors.textSecondary; };

  return (
    <footer style={{
      backgroundColor: colors.surface,
      borderTop: `1px solid ${colors.border}`,
      padding: '32px',
      marginTop: 'auto'
    }}>
      <div style={{
        maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '20px', fontWeight: 'bold', color: colors.primary }}>PAGYS</span>
          <span style={{ color: colors.textSecondary, fontSize: '14px' }}>© {currentYear} A&P Firms. All rights reserved.</span>
        </div>
        <div style={{ display: 'flex', gap: '32px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/privacy')} style={navStyle} onMouseEnter={hoverStyle} onMouseLeave={leaveStyle}>Privacy Policy</button>
          <button onClick={() => navigate('/terms')} style={navStyle} onMouseEnter={hoverStyle} onMouseLeave={leaveStyle}>Terms of Service</button>
          <button onClick={() => navigate('/refund')} style={navStyle} onMouseEnter={hoverStyle} onMouseLeave={leaveStyle}>Refund Policy</button>
          <button onClick={() => navigate('/help')} style={navStyle} onMouseEnter={hoverStyle} onMouseLeave={leaveStyle}>Help & Support</button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
