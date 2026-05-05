import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import CountryFlag from '../CountryFlag';
import { getWelcomeMessage } from '../../utils/dashboardHelpers';

const DashboardHeader = ({ user, showRecycleBin, onToggleRecycleBin, onCreateProject, deletedCount }) => {
  const { colors } = useTheme();
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
      <div>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: colors.text, marginBottom: '8px' }}>
          {getWelcomeMessage(user)}
        </h1>
        <p style={{ color: colors.textSecondary, display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
          {user?.country && (
            <>
              <CountryFlag countryCode={user.country} size={20} />
              <span>{user.country}</span>
              <span style={{ margin: '0 8px', color: colors.border }}>•</span>
            </>
          )}
          Continue your thesis from where you left off.
        </p>
      </div>
      <div style={{ display: 'flex', gap: '12px' }}>
        <button onClick={onToggleRecycleBin} style={{
          backgroundColor: showRecycleBin ? colors.primary : 'transparent',
          color: showRecycleBin ? 'white' : colors.text,
          padding: '12px 24px', border: `1px solid ${colors.border}`, borderRadius: '8px',
          fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          🗑️ {showRecycleBin ? 'Hide' : 'Recycle Bin'}
          {deletedCount > 0 && (
            <span style={{
              backgroundColor: showRecycleBin ? 'white' : colors.primary,
              color: showRecycleBin ? colors.primary : 'white',
              padding: '2px 8px', borderRadius: '999px', fontSize: '12px'
            }}>{deletedCount}</span>
          )}
        </button>
        <button onClick={onCreateProject} style={{
          backgroundColor: colors.primary, color: 'white', padding: '12px 24px',
          border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <span style={{ fontSize: '20px' }}>+</span> Create New Project
        </button>
      </div>
    </div>
  );
};

export default DashboardHeader;
