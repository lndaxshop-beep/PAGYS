import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import logo from '../../assets/logo.png';
import ThemeToggle from '../ThemeToggle';
import ProfileMenu from '../ProfileMenu';
import useAppAuth from '../../hooks/useAppAuth';
import { useResponsive } from '../../hooks/useResponsive';

const Header = () => {
  const { colors, isDarkMode } = useTheme();
  const { isLoggedIn, user, showProfileMenu, setShowProfileMenu, handleLogout } = useAppAuth();
  const { isMobile } = useResponsive();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const drawerLinkStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '14px 24px',
    color: colors.text,
    textDecoration: 'none',
    fontSize: '16px',
    fontWeight: '500',
    borderBottom: `1px solid ${colors.border}`,
    cursor: 'pointer',
    background: 'none',
    width: '100%',
    textAlign: 'left',
    transition: 'background-color 0.2s',
  };

  const navItems = isLoggedIn
    ? [
        { icon: '📊', label: 'Dashboard', to: '/dashboard' },
        { icon: '📁', label: 'My Files', to: '/myfiles' },
      ]
    : [];

  return (
    <>
      <header style={{
        backgroundColor: colors.surface,
        borderBottom: `1px solid ${colors.border}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'stretch',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        height: isMobile ? '60px' : '72px',
      }}>
        {/* Hamburger (mobile only) */}
        {isMobile && (
          <button
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
            style={{
              background: 'none',
              border: 'none',
              color: colors.text,
              fontSize: '28px',
              cursor: 'pointer',
              padding: '0 16px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            ☰
          </button>
        )}

        {/* Logo */}
        <Link to="/" style={{
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'stretch',
          flexShrink: 0,
          margin: isMobile ? '0' : '0 0 0 -12px',
        }}>
          <img
            src={logo}
            alt="PAGYS"
            style={{
              height: isMobile ? '60px' : '72px',
              width: 'auto',
              display: 'block',
              filter: isDarkMode
                ? 'brightness(0) invert(1) drop-shadow(0 0 4px rgba(0,0,0,0.5))'
                : 'drop-shadow(0 0 4px rgba(255,255,255,0.6))',
            }}
          />
        </Link>

        {/* Desktop nav */}
        {!isMobile && (
          <div style={{
            display: 'flex',
            gap: '24px',
            alignItems: 'center',
            height: '100%',
            flex: 1,
            justifyContent: 'flex-end',
          }}>
            {isLoggedIn && (
              <>
                <Link to="/dashboard" style={{ color: colors.text, textDecoration: 'none', fontSize: '14px' }}>Dashboard</Link>
                <Link to="/myfiles" style={{ color: colors.text, textDecoration: 'none', fontSize: '14px' }}>My Files</Link>
              </>
            )}
            {isLoggedIn ? (
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
                    transition: 'all 0.2s',
                  }}
                >
                  <span style={{ fontSize: '18px' }}>👤</span>
                  {user?.fullName?.split(' ')[0] || user?.username || user?.email?.split('@')[0]}
                  <span style={{ fontSize: '12px' }}>{showProfileMenu ? '▲' : '▼'}</span>
                </button>
                {showProfileMenu && (
                  <ProfileMenu user={user} onLogout={handleLogout} onClose={() => setShowProfileMenu(false)} />
                )}
              </div>
            ) : (
              <>
                <Link to="/login" style={{ color: colors.text, textDecoration: 'none', fontSize: '14px' }}>Login</Link>
                <Link to="/signup" style={{
                  backgroundColor: colors.primary,
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontSize: '14px',
                }}>Sign Up</Link>
              </>
            )}
            <ThemeToggle />
          </div>
        )}

        {/* Mobile: theme toggle inline */}
        {isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', paddingRight: '16px' }}>
            <ThemeToggle />
          </div>
        )}
      </header>

      {/* Mobile Drawer */}
      {isMobile && (
        <>
          {/* Overlay */}
          {mobileMenuOpen && (
            <div
              onClick={() => setMobileMenuOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                zIndex: 199,
              }}
            />
          )}

          {/* Drawer */}
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            bottom: 0,
            width: '280px',
            backgroundColor: colors.surface,
            zIndex: 200,
            transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.25s ease',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: mobileMenuOpen ? '4px 0 20px rgba(0,0,0,0.3)' : 'none',
          }}>
            {/* Drawer header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 20px',
              borderBottom: `1px solid ${colors.border}`,
            }}>
              <span style={{ fontSize: '20px', fontWeight: 'bold', color: colors.primary }}>PAGYS</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
                style={{
                  background: 'none',
                  border: 'none',
                  color: colors.text,
                  fontSize: '28px',
                  cursor: 'pointer',
                  padding: 0,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            {/* User info (logged in) */}
            {isLoggedIn && user && (
              <div style={{
                padding: '16px 24px',
                borderBottom: `1px solid ${colors.border}`,
                backgroundColor: isDarkMode ? '#2d2d2d' : '#f9fafb',
              }}>
                <div style={{ fontWeight: '600', color: colors.text, fontSize: '15px' }}>
                  {user?.fullName || 'User'}
                </div>
                <div style={{ fontSize: '13px', color: colors.textSecondary, marginTop: '2px' }}>
                  @{user?.username || 'username'}
                </div>
                <div style={{ fontSize: '13px', color: colors.textSecondary, marginTop: '2px' }}>
                  {user?.email || ''}
                </div>
              </div>
            )}

            {/* Nav links */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {/* Always visible links */}
              <div
                style={drawerLinkStyle}
                onClick={() => { navigate('/'); setMobileMenuOpen(false); }}
              >
                🏠 Home
              </div>

              {navItems.map((item, i) => (
                <div
                  key={i}
                  style={drawerLinkStyle}
                  onClick={() => { navigate(item.to); setMobileMenuOpen(false); }}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              ))}

              {/* Spacer */}
              <div style={{ borderBottom: `8px solid ${colors.background}` }} />

              {/* Auth links */}
              {isLoggedIn ? (
                <>
                  <div
                    style={drawerLinkStyle}
                    onClick={() => { navigate('/settings'); setMobileMenuOpen(false); }}
                  >
                    ⚙️ Settings
                  </div>
                  <div
                    style={drawerLinkStyle}
                    onClick={() => { navigate('/help'); setMobileMenuOpen(false); }}
                  >
                    ❓ Help & Support
                  </div>
                  <div
                    style={{ ...drawerLinkStyle, color: '#ef4444' }}
                    onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                  >
                    🚪 Logout
                  </div>
                </>
              ) : (
                <>
                  <div
                    style={drawerLinkStyle}
                    onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}
                  >
                    🔑 Login
                  </div>
                  <div
                    style={drawerLinkStyle}
                    onClick={() => { navigate('/signup'); setMobileMenuOpen(false); }}
                  >
                    📝 Sign Up
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Header;
