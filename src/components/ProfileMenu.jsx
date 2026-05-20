import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const ProfileMenu = ({ user, onLogout, onClose }) => {
  const { colors, isDarkMode } = useTheme();
  const navigate = useNavigate();

  const menuItems = [
    {
      icon: '👤',
      label: 'My Profile',
      onClick: () => {
        navigate('/settings');
        onClose();
      }
    },
    {
      icon: '📊',
      label: 'Dashboard',
      onClick: () => {
        navigate('/dashboard');
        onClose();
      }
    },
    {
      icon: '📁',
      label: 'My Files',
      onClick: () => {
        navigate('/myfiles');
        onClose();
      }
    },
    {
      icon: '⚙️',
      label: 'Settings',
      onClick: () => {
        navigate('/settings');
        onClose();
      }
    },
    {
      icon: '❓',
      label: 'Help & Support',
      onClick: () => {
        navigate('/help');
        onClose();
      }
    },
    {
      icon: '🚪',
      label: 'Logout',
      onClick: () => {
        onLogout();
        onClose();
      },
      isLogout: true
    }
  ];

  return (
    <>
      {/* Overlay to close menu when clicking outside */}
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 999
        }}
      />
      
      {/* Dropdown Menu */}
      <div role="menu" aria-label="Profile menu" style={{
        position: 'absolute',
        top: '100%',
        right: 0,
        marginTop: '8px',
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: '12px',
        boxShadow: isDarkMode 
          ? '0 10px 25px rgba(0,0,0,0.5)' 
          : '0 10px 25px rgba(0,0,0,0.1)',
        minWidth: '220px',
        zIndex: 1000,
        overflow: 'hidden'
      }}>
        {/* User Info */}
        <div style={{
          padding: '16px',
          borderBottom: `1px solid ${colors.border}`,
          backgroundColor: isDarkMode ? '#2d2d2d' : '#f9fafb'
        }}>
          <div style={{ fontWeight: '600', color: colors.text }}>{user?.fullName || 'User'}</div>
          <div style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '2px' }}>
            @{user?.username || 'username'}
          </div>
          <div style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '2px' }}>
            {user?.email || 'No email'}
          </div>
        </div>

        {/* Menu Items */}
        {menuItems.map((item, index) => (
          <button
            key={index}
            onClick={item.onClick}
            style={{
              width: '100%',
              padding: '12px 16px',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: index < menuItems.length - 1 ? `1px solid ${colors.border}` : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              color: item.isLogout ? '#ef4444' : colors.text,
              fontSize: '14px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.hover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <span style={{ fontSize: '16px' }}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </>
  );
};

export default ProfileMenu;