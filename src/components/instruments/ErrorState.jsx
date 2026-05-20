import React from 'react';

const ErrorState = ({ error, onTryAgain, onClose, colors }) => (
  <div role="dialog" aria-modal="true" aria-labelledby="error-state-title" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
    <div style={{ backgroundColor: colors.surface, borderRadius: '16px', padding: '32px', maxWidth: '500px', width: '90%', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
      <h2 id="error-state-title" style={{ color: '#ef4444', marginBottom: '16px' }}>Generation Error</h2>
      <p style={{ color: colors.textSecondary, marginBottom: '24px' }}>{error}</p>
      <div style={{ display: 'flex', gap: '12px' }}>
        <button onClick={onTryAgain} style={{ flex: 1, backgroundColor: colors.primary, color: 'white', padding: '12px', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Try Again</button>
        <button onClick={onClose} style={{ flex: 1, backgroundColor: 'transparent', color: colors.text, padding: '12px', border: `1px solid ${colors.border}`, borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
      </div>
    </div>
  </div>
);

export default ErrorState;
