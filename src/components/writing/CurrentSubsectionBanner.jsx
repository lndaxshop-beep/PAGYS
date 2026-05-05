import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const CurrentSubsectionBanner = ({ subsection, currentIndex, totalCount, isViewingReferences }) => {
  const { colors } = useTheme();
  if (!subsection && !isViewingReferences) return null;
  return (
    <div style={{ backgroundColor: colors.primary + '10', borderRadius: '8px', padding: '16px', marginBottom: '24px', border: `1px solid ${colors.primary}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <span style={{ fontSize: '14px', color: colors.textSecondary }}>Currently Writing:</span>
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: colors.primary, marginTop: '4px' }}>
          {subsection?.title || 'No subsection selected'}
        </h3>
      </div>
      <div style={{
        backgroundColor: isViewingReferences ? '#059669' : colors.primary,
        color: 'white', padding: '4px 12px', borderRadius: '999px', fontSize: '14px', fontWeight: '500'
      }}>
        {isViewingReferences ? 'References' : `${currentIndex + 1} of ${totalCount}`}
      </div>
    </div>
  );
};

export default CurrentSubsectionBanner;
