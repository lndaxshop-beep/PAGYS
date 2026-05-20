import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const ConfirmModal = ({ title, message, confirmText, cancelText, danger, onConfirm, onCancel }) => {
  const { colors, isDarkMode } = useTheme();
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-desc" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }} onClick={onCancel}>
      <div style={{ backgroundColor: colors.surface, borderRadius: '16px', padding: '32px', maxWidth: '420px', width: '90%', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }} onClick={(e) => e.stopPropagation()}>
        <h3 id="confirm-title" style={{ fontSize: '20px', fontWeight: '600', color: colors.text, marginBottom: '8px' }}>{title}</h3>
        <p id="confirm-desc" style={{ color: colors.textSecondary, fontSize: '14px', marginBottom: '24px', lineHeight: '1.5' }}>{message}</p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={onCancel} aria-label={cancelText || 'Cancel'} style={{ flex: 1, backgroundColor: 'transparent', color: colors.text, padding: '12px', border: `1px solid ${colors.border}`, borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
            {cancelText || 'Cancel'}
          </button>
          <button onClick={onConfirm} aria-label={confirmText || 'Confirm'} style={{ flex: 1, backgroundColor: danger ? '#ef4444' : colors.primary, color: 'white', padding: '12px', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
            {confirmText || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
