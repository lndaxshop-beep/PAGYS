import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const PremiumModal = ({ onClose, projectId, isPremium }) => {
  const { colors } = useTheme();
  const [usageData, setUsageData] = useState(null);

  useEffect(() => {
    if (!projectId) return;
    try {
      const humaniseKey = `humaniseUsed_${projectId}`;
      const feedbackKey = `feedbackUsed_${projectId}`;
      const humaniseUsed = JSON.parse(localStorage.getItem(humaniseKey) || '{}');
      const feedbackUsed = JSON.parse(localStorage.getItem(feedbackKey) || '{}');
      setUsageData({
        totalHumanise: Object.values(humaniseUsed).reduce((s, v) => s + v, 0),
        totalFeedback: Object.values(feedbackUsed).reduce((s, v) => s + v, 0),
      });
    } catch (e) { console.warn('Failed to load premium usage data:', e); }
  }, [projectId]);

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
            <div style={{ fontSize: '13px', opacity: 0.9, marginTop: '4px' }}>Humanise: 15 uses per chapter • Feedback: 12 uses per chapter • Literature search • Bulk generation</div>
          </div>
        ) : (
          <div style={{ backgroundColor: '#6b7280', borderRadius: '12px', padding: '20px', color: 'white', marginBottom: '24px' }}>
            <div style={{ fontSize: '16px', fontWeight: '600' }}>Free Plan</div>
            <div style={{ fontSize: '13px', opacity: 0.9, marginTop: '4px' }}>Upgrade to unlock premium features</div>
          </div>
        )}

        {usageData ? (
          <div style={{ padding: '16px', backgroundColor: colors.background, borderRadius: '8px', border: `1px solid ${colors.border}`, marginBottom: '16px' }}>
            <div style={{ fontWeight: '500', color: colors.text, marginBottom: '8px' }}>Usage for this project</div>
            <div style={{ display: 'flex', gap: '24px', fontSize: '13px', color: colors.textSecondary }}>
              <span>✨ Humanise used: {usageData.totalHumanise}</span>
              <span>✏️ Feedback used: {usageData.totalFeedback}</span>
            </div>
          </div>
        ) : (
          <div style={{ color: colors.textSecondary, fontSize: '14px', padding: '16px', textAlign: 'center' }}>No premium usage data available yet.</div>
        )}
      </div>
    </div>
  );
};

export default PremiumModal;
