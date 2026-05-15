import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import logo from '../../assets/logo.png';
import ThemeToggle from '../ThemeToggle';
import ProfileMenu from '../ProfileMenu';
import useAppAuth from '../../hooks/useAppAuth';

const Header = () => {
  const { colors } = useTheme();
  const { isLoggedIn, user, showProfileMenu, setShowProfileMenu, handleLogout } = useAppAuth();

  return (
    <header style={{
      backgroundColor: colors.surface,
      borderBottom: `1px solid ${colors.border}`,
      padding: '16px 32px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}><img src={logo} alt="PAGYS" style={{ height: '32px', display: 'block' }} /></Link>
      <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
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
                {user?.fullName?.split(' ')[0] || user?.username}
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
