import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const PremiumModal = ({ onClose, isPremium }) => {
  const { colors } = useTheme();

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="premium-modal-title" style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000
    }} onClick={onClose}>
      <div style={{
        backgroundColor: colors.surface, borderRadius: '16px', padding: '32px',
        maxWidth: '500px', width: '90%', maxHeight: '80vh', overflowY: 'auto',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 id="premium-modal-title" style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: colors.text }}>💎 Premium Dashboard</h2>
          <button onClick={onClose} aria-label="Close premium dashboard" style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: colors.textSecondary, lineHeight: 1 }}>×</button>
        </div>

        {isPremium ? (
          <div style={{ backgroundColor: '#f59e0b', borderRadius: '12px', padding: '20px', color: 'white', marginBottom: '24px' }}>
            <div style={{ fontSize: '16px', fontWeight: '600' }}>Premium Active</div>
            <div style={{ fontSize: '13px', opacity: 0.9, marginTop: '4px' }}>Remove AI: 10 free uses • Feedback: 12 per chapter • Literature search • Bulk generation</div>
          </div>
        ) : (
          <div style={{ backgroundColor: '#6b7280', borderRadius: '12px', padding: '20px', color: 'white', marginBottom: '24px' }}>
            <div style={{ fontSize: '16px', fontWeight: '600' }}>Free Plan</div>
            <div style={{ fontSize: '13px', opacity: 0.9, marginTop: '4px' }}>Upgrade to unlock premium features</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PremiumModal;
