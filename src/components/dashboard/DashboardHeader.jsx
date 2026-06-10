import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import CountryFlag from '../CountryFlag';
import { getWelcomeMessage } from '../../utils/dashboardHelpers';
import { useResponsive } from '../../hooks/useResponsive';

const DashboardHeader = ({ user, showRecycleBin, onToggleRecycleBin, onCreateProject, deletedCount }) => {
  const { colors } = useTheme();
  const { isMobile } = useResponsive();
  const welcome = getWelcomeMessage(user);
  const message = typeof welcome === 'object' ? welcome.text : welcome;
  const isFirstVisit = typeof welcome === 'object' ? welcome.isFirstVisit : true;
  return (
    <div style={{
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      justifyContent: 'space-between',
      alignItems: isMobile ? 'stretch' : 'center',
      marginBottom: isMobile ? '20px' : '32px',
      gap: isMobile ? '16px' : 0,
    }}>
      <div>
        <h1 style={{ fontSize: isMobile ? '24px' : '32px', fontWeight: 'bold', color: colors.text, marginBottom: '8px' }}>
          {message}
        </h1>
        <p style={{ color: colors.textSecondary, display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', fontSize: isMobile ? '14px' : '15px' }}>
          {user?.country && (
            <>
              <CountryFlag countryCode={user.country} size={20} />
              <span>{user.country}</span>
              <span style={{ margin: '0 8px', color: colors.border }}>•</span>
            </>
          )}
          {isFirstVisit ? 'Start a new project.' : 'Continue from where you left off.'}
        </p>
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button onClick={onToggleRecycleBin} style={{
          backgroundColor: showRecycleBin ? colors.primary : 'transparent',
          color: showRecycleBin ? 'white' : colors.text,
          padding: isMobile ? '10px 16px' : '12px 24px', border: `1px solid ${colors.border}`, borderRadius: '8px',
          fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
          fontSize: isMobile ? '13px' : '14px', flex: isMobile ? 1 : 'initial', justifyContent: 'center',
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
          backgroundColor: colors.primary, color: 'white',
          padding: isMobile ? '10px 16px' : '12px 24px',
          border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '8px',
          fontSize: isMobile ? '13px' : '14px', flex: isMobile ? 1 : 'initial', justifyContent: 'center',
        }}>
          <span style={{ fontSize: '20px' }}>+</span> Create New Project
        </button>
      </div>
    </div>
  );
};

export default DashboardHeader;
