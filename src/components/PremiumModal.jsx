import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const PremiumModal = ({ onClose }) => {
  const { colors } = useTheme();
  const [usageData, setUsageData] = useState([]);

  useEffect(() => {
    try {
      const projects = JSON.parse(localStorage.getItem('thesisProjects') || '[]');
      const premium = projects.filter(p => p.isPremium);
      const data = premium.map(project => {
        const humaniseKey = `humaniseUsed_${project.id}`;
        const feedbackKey = `feedbackUsed_${project.id}`;
        const humaniseUsed = JSON.parse(localStorage.getItem(humaniseKey) || '{}');
        const feedbackUsed = JSON.parse(localStorage.getItem(feedbackKey) || '{}');
        return {
          title: project.title || 'Untitled',
          totalHumanise: Object.values(humaniseUsed).reduce((s, v) => s + v, 0),
          totalFeedback: Object.values(feedbackUsed).reduce((s, v) => s + v, 0),
        };
      });
      setUsageData(data);
    } catch (e) { console.warn('Failed to load premium usage data:', e); }
  }, []);

  const totals = usageData.reduce((acc, d) => ({
    humanise: acc.humanise + d.totalHumanise,
    feedback: acc.feedback + d.totalFeedback,
  }), { humanise: 0, feedback: 0 });

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000
    }} onClick={onClose}>
      <div style={{
        backgroundColor: colors.surface, borderRadius: '16px', padding: '32px',
        maxWidth: '500px', width: '90%', maxHeight: '80vh', overflowY: 'auto',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: colors.text }}>💎 Premium Dashboard</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: colors.textSecondary, lineHeight: 1 }}>×</button>
        </div>

        <div style={{ backgroundColor: '#f59e0b', borderRadius: '12px', padding: '20px', color: 'white', marginBottom: '24px' }}>
          <div style={{ fontSize: '16px', fontWeight: '600' }}>Premium Active</div>
          <div style={{ fontSize: '13px', opacity: 0.9, marginTop: '4px' }}>Humanise & Feedback: up to 4 times per subsection</div>
        </div>

        {usageData.length > 0 && (
          <div style={{ padding: '16px', backgroundColor: colors.background, borderRadius: '8px', border: `1px solid ${colors.border}`, marginBottom: '16px' }}>
            <div style={{ fontWeight: '500', color: colors.text, marginBottom: '8px' }}>Total Across All Projects</div>
            <div style={{ display: 'flex', gap: '24px', fontSize: '13px', color: colors.textSecondary }}>
              <span>✨ Humanise: {totals.humanise}</span>
              <span>✏️ Feedback: {totals.feedback}</span>
            </div>
          </div>
        )}

        <h3 style={{ fontSize: '16px', fontWeight: '600', color: colors.text, marginBottom: '12px' }}>Per-Project Breakdown</h3>
        <div style={{ display: 'grid', gap: '12px' }}>
          {usageData.map((d, i) => (
            <div key={i} style={{ backgroundColor: colors.background, borderRadius: '8px', padding: '16px', border: `1px solid ${colors.border}` }}>
              <div style={{ fontWeight: '500', color: colors.text, marginBottom: '8px', fontSize: '14px' }}>{d.title}</div>
              <div style={{ display: 'flex', gap: '24px', fontSize: '13px', color: colors.textSecondary }}>
                <span>✨ Humanise used: {d.totalHumanise}</span>
                <span>✏️ Feedback used: {d.totalFeedback}</span>
              </div>
            </div>
          ))}
          {usageData.length === 0 && (
            <div style={{ color: colors.textSecondary, fontSize: '14px', padding: '16px', textAlign: 'center' }}>No premium usage data available yet.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PremiumModal;
