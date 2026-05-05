import React from 'react';

const GenerationState = ({ generationProgress, colors, isDarkMode }) => (
  <div style={{ textAlign: 'center', padding: '60px' }}>
    <div style={{ width: '50px', height: '50px', border: `3px solid ${colors.primary}`, borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 20px', animation: 'spin 1s linear infinite' }} />
    <p style={{ color: colors.primary, fontSize: '16px', marginBottom: '8px' }}>Generating instruments...</p>
    <div style={{ maxWidth: '300px', margin: '16px auto', backgroundColor: isDarkMode ? '#3d3d3d' : '#e5e7eb', borderRadius: '999px', height: '8px' }}>
      <div style={{ width: `${generationProgress}%`, backgroundColor: colors.primary, height: '8px', borderRadius: '999px', transition: 'width 0.3s' }} />
    </div>
    <p style={{ color: colors.textSecondary, fontSize: '14px' }}>{generationProgress}% complete</p>
  </div>
);

export default GenerationState;
