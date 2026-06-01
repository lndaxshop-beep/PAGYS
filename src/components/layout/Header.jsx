import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import logo from '../../assets/logo.png';
import ThemeToggle from '../ThemeToggle';
import ProfileMenu from '../ProfileMenu';
import useAppAuth from '../../hooks/useAppAuth';

const Header = () => {
  const { colors, isDarkMode } = useTheme();
  const { isLoggedIn, user, showProfileMenu, setShowProfileMenu, handleLogout } = useAppAuth();

  return (
    <header style={{
      backgroundColor: colors.surface,
      borderBottom: `1px solid ${colors.border}`,
      padding: '0 32px 0 0',
      margin: 0,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'stretch',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      height: '72px'
    }}>
      <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'stretch', flexShrink: 0, margin: '0 0 0 -12px' }}><img src={logo} alt="PAGYS" style={{ height: '72px', width: 'auto', display: 'block', filter: isDarkMode ? 'brightness(0) invert(1)' : 'none' }} /></Link>
      <div style={{ display: 'flex', gap: '24px', alignItems: 'center', height: '100%' }}>
        {isLoggedIn && (
          <>
            <Link to="/dashboard" style={{ color: colors.text, textDecoration: 'none' }}>Dashboard</Link>
            <Link to="/myfiles" style={{ color: colors.text, textDecoration: 'none' }}>My Files</Link>
          </>
        )}
        {isLoggedIn ? (
          <>
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                style={{
                  backgroundColor: 'transparent',
                  color: colors.text,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '30px',
                  padding: '6px 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { e.target.style.backgroundColor = colors.hover; e.target.style.borderColor = colors.primary; }}
                onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.borderColor = colors.border; }}
              >
                <span style={{ fontSize: '18px' }}>👤</span>
                {user?.fullName?.split(' ')[0] || user?.username || user?.email?.split('@')[0]}
                <span style={{ fontSize: '12px' }}>{showProfileMenu ? '▲' : '▼'}</span>
              </button>
              {showProfileMenu && (
                <ProfileMenu user={user} onLogout={handleLogout} onClose={() => setShowProfileMenu(false)} />
              )}
            </div>
          </>
        ) : (
          <>
            <Link to="/login" style={{ color: colors.text, textDecoration: 'none' }}>Login</Link>
            <Link to="/signup" style={{ backgroundColor: colors.primary, color: 'white', padding: '8px 16px', borderRadius: '6px', textDecoration: 'none' }}>Sign Up</Link>
          </>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
};

export default Header;
