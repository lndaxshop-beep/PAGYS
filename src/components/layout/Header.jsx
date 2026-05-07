import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import ThemeToggle from '../ThemeToggle';
import ProfileMenu from '../ProfileMenu';
import useAppAuth from '../../hooks/useAppAuth';

const Header = ({ onPremiumClick, isPremium: propIsPremium }) => {
  const { colors } = useTheme();
  const { isLoggedIn, user, showProfileMenu, isPremium: authIsPremium, setShowProfileMenu, handleLogout } = useAppAuth();
  const isPremium = propIsPremium || authIsPremium;

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
      <Link to="/" style={{ fontSize: '24px', fontWeight: 'bold', color: colors.primary, textDecoration: 'none' }}>PAGYS</Link>
      <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
        {isLoggedIn && (
          <>
            <Link to="/dashboard" style={{ color: colors.text, textDecoration: 'none' }}>Dashboard</Link>
            <Link to="/myfiles" style={{ color: colors.text, textDecoration: 'none' }}>My Files</Link>
          </>
        )}
        {isLoggedIn ? (
          <>
            <button
              onClick={onPremiumClick}
              title={isPremium ? 'Premium Active' : 'Upgrade to Premium'}
              style={{
                backgroundColor: isPremium ? '#f59e0b' : 'transparent',
                color: isPremium ? 'white' : '#f59e0b',
                border: `1px solid #f59e0b`,
                borderRadius: '20px',
                padding: '5px 14px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { if (!isPremium) { e.target.style.backgroundColor = '#f59e0b'; e.target.style.color = 'white'; } }}
              onMouseLeave={(e) => { if (!isPremium) { e.target.style.backgroundColor = 'transparent'; e.target.style.color = '#f59e0b'; } }}
            >
              💎 {isPremium ? 'Premium' : 'Upgrade'}
            </button>
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
