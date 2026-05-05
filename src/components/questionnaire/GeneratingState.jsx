import React from 'react';

const GeneratingState = ({ colors }) => (
  <div style={{ textAlign: 'center', padding: '60px' }}>
    <div style={{
      width: '50px',
      height: '50px',
      border: `3px solid ${colors.primary}`,
      borderTopColor: 'transparent',
      borderRadius: '50%',
      margin: '0 auto 20px',
      animation: 'spin 1s linear infinite'
    }} />
    <p style={{ color: colors.primary, fontSize: '16px' }}>AI is generating your questionnaire...</p>
    <p style={{ color: colors.textSecondary, fontSize: '14px', marginTop: '10px' }}>
      This may take a moment
    </p>
  </div>
);

export default GeneratingState;
