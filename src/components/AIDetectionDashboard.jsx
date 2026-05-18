import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { calculateBurstiness, scanBannedPhrases, scanTransitions, calculatePerplexityEstimate } from '../services/gemini/antiDetection';

const Gauge = ({ label, value, max, goodDir = 'up', unit = '' }) => {
  const pct = Math.min(100, (value / max) * 100);
  const { colors } = useTheme();
  const isGood = goodDir === 'up' ? value >= max * 0.6 : value <= max * 0.4;
  const isWarn = goodDir === 'up' ? value >= max * 0.3 : value <= max * 0.6;
  const barColor = isGood ? '#059669' : isWarn ? '#f59e0b' : '#dc2626';
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '13px', fontWeight: '500', color: colors.text }}>{label}</span>
        <span style={{ fontSize: '13px', fontWeight: '700', color: barColor }}>{value}{unit}</span>
      </div>
      <div style={{ width: '100%', height: '8px', backgroundColor: colors.border, borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: barColor, borderRadius: '4px', transition: 'width 0.5s' }} />
      </div>
    </div>
  );
};

const CorrectionCard = ({ icon, title, description, onClick, applying, fixed, color = '#059669' }) => (
  <div style={{ padding: '10px 12px', borderRadius: '8px', border: `1px solid ${color}40`, backgroundColor: `${color}08`, marginBottom: '8px' }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '12px', fontWeight: '600', color, marginBottom: '2px' }}>{icon} {title}</div>
        <div style={{ fontSize: '11px', color: '#6b7280', lineHeight: '1.4' }}>{description}</div>
      </div>
      {fixed ? (
        <span style={{ padding: '5px 12px', fontSize: '11px', fontWeight: '600', borderRadius: '6px', backgroundColor: '#d1fae5', color: '#065f46', whiteSpace: 'nowrap' }}>✅ Fixed</span>
      ) : (
        <button onClick={onClick} disabled={applying} style={{
          padding: '5px 12px', fontSize: '11px', fontWeight: '600', borderRadius: '6px',
          backgroundColor: applying ? '#d1d5db' : color, color: 'white', border: 'none',
          cursor: applying ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
          opacity: applying ? 0.7 : 1, transition: 'all 0.2s',
        }}>
          {applying ? 'Applying...' : '🤖 AI Fix'}
        </button>
      )}
    </div>
  </div>
);

const AIDetectionDashboard = ({ isOpen, onClose, content, onApplyCorrection, applyingCorrection }) => {
  const { colors, isDarkMode } = useTheme();
  const [applyingType, setApplyingType] = useState(null);
  const [appliedFixes, setAppliedFixes] = useState(new Set());
  const prevContentRef = useRef(content);
  const [scoreBanner, setScoreBanner] = useState(null);

  const metrics = useMemo(() => {
    if (!content) return null;
    const burstiness = calculateBurstiness(content);
    const banned = scanBannedPhrases(content);
    const transitions = scanTransitions(content);
    const perplexity = calculatePerplexityEstimate(content);
    return { burstiness, banned, transitions, perplexity };
  }, [content]);

  useEffect(() => {
    if (prevContentRef.current && content && prevContentRef.current !== content) {
      const oldScore = calculatePerplexityEstimate(prevContentRef.current).score;
      const newScore = metrics?.perplexity.score || 0;
      if (newScore > oldScore) {
        setScoreBanner(`Score improved: ${oldScore} → ${newScore}`);
        setTimeout(() => setScoreBanner(null), 5000);
      }
      setAppliedFixes(new Set());
    }
    prevContentRef.current = content;
  }, [content]);

  if (!isOpen) return null;

  const scoreColor = metrics?.perplexity.score >= 60 ? '#059669' : metrics?.perplexity.score >= 40 ? '#f59e0b' : '#dc2626';

  const handleApply = async (type, data) => {
    if (applyingType) return;
    setApplyingType(type);
    setAppliedFixes(prev => new Set(prev).add(type));
    try {
      await onApplyCorrection?.({ type, data, content });
    } finally {
      setApplyingType(null);
    }
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: colors.surface, borderRadius: '16px', padding: '24px', width: '90%', maxWidth: '520px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: colors.text }}>🤖 AI Detection Score</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: colors.textSecondary, cursor: 'pointer', fontSize: '18px', padding: '4px 8px' }}>✕</button>
        </div>

        {scoreBanner && (
          <div style={{ padding: '10px 14px', marginBottom: '16px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #05966940', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#059669' }}>
            📈 {scoreBanner}
          </div>
        )}

        {!content ? (
          <p style={{ color: colors.textSecondary, textAlign: 'center', padding: '40px' }}>No content to analyze. Generate or write content first.</p>
        ) : !metrics ? (
          <p style={{ color: colors.textSecondary, textAlign: 'center', padding: '40px' }}>Analyzing...</p>
        ) : (
          <>
            <div style={{ textAlign: 'center', padding: '24px', marginBottom: '20px', backgroundColor: isDarkMode ? '#1f2937' : '#f9fafb', borderRadius: '12px', border: `1px solid ${colors.border}` }}>
              <div style={{ fontSize: '48px', fontWeight: '800', color: scoreColor }}>{metrics.perplexity.score}/100</div>
              <div style={{ fontSize: '13px', color: colors.textSecondary, marginTop: '4px' }}>
                {metrics.perplexity.score >= 60 ? '✅ Likely human-written' : metrics.perplexity.score >= 40 ? '⚠️ Mixed signals' : '🔴 Likely AI-generated'}
              </div>
            </div>

            <Gauge label="Burstiness (Sentence Variety)" value={Math.round(metrics.burstiness.cv * 100)} max={80} unit="%" />
            <Gauge label="Vocabulary Diversity" value={metrics.perplexity.vocabScore + metrics.perplexity.wordLengthScore} max={60} unit="" goodDir="up" />
            <Gauge label="Transition Word Frequency" value={Math.round(metrics.transitions.frequency * 10)} max={20} unit="" goodDir="down" />

            <div style={{ marginTop: '12px' }}>
              <div style={{ fontSize: '13px', fontWeight: '500', color: colors.text, marginBottom: '8px' }}>Sentence Length Distribution</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '60px', marginBottom: '8px' }}>
                {metrics.burstiness.sentenceLengths.slice(0, 30).map((len, i) => {
                  const h = Math.min(60, Math.max(4, len * 2.5));
                  return <div key={i} style={{ flex: 1, height: `${h}px`, backgroundColor: colors.primary, borderRadius: '2px 2px 0 0', opacity: 0.6 + (i / metrics.burstiness.sentenceLengths.length) * 0.4 }} title={`Sentence ${i + 1}: ${len} words`} />;
                })}
              </div>
              <div style={{ fontSize: '11px', color: colors.textSecondary }}>
                Mean: {metrics.burstiness.mean.toFixed(1)} words · StdDev: {metrics.burstiness.stdDev.toFixed(1)} · CV: {metrics.burstiness.cv.toFixed(3)}
              </div>
            </div>

            {metrics.banned.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: '500', color: '#dc2626', marginBottom: '8px' }}>⚠️ {metrics.banned.length} Banned Phrase(s) Detected</div>
                {!appliedFixes.has('banned') && metrics.banned.slice(0, 3).map((b, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', marginBottom: '4px', borderRadius: '6px', backgroundColor: '#fef2f2', gap: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#991b1b', flex: 1, fontStyle: 'italic' }}>"...{b.line.length > 80 ? b.line.slice(0, 80) + '...' : b.line}"</span>
                    <span style={{ fontSize: '10px', fontWeight: '600', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#fecaca', color: '#dc2626', whiteSpace: 'nowrap' }}>{b.phrase}</span>
                  </div>
                ))}
                <CorrectionCard icon="✂️" title={`Replace all ${metrics.banned.length} banned phrases`} description="AI will replace each detected banned phrase with a more natural alternative." onClick={() => handleApply('banned', { phrases: metrics.banned.map(b => b.phrase) })} applying={applyingType === 'banned'} fixed={appliedFixes.has('banned')} color="#dc2626" />
              </div>
            )}

            {metrics.burstiness.cv < 0.4 && (
              <CorrectionCard icon="📊" title="Improve sentence variety" description="Sentences are too uniform in length. AI will vary sentence structure for more natural flow." onClick={() => handleApply('burstiness', {})} applying={applyingType === 'burstiness'} fixed={appliedFixes.has('burstiness')} color="#d97706" />
            )}

            {metrics.transitions.frequency > 1.5 && (
              <CorrectionCard icon="🔗" title="Reduce transition word frequency" description={`${metrics.transitions.found.length} transition words detected. AI will reduce them for more natural flow.`} onClick={() => handleApply('transitions', {})} applying={applyingType === 'transitions'} fixed={appliedFixes.has('transitions')} color="#0891b2" />
            )}

            {metrics.perplexity.score < 40 && (
              <CorrectionCard icon="✨" title="Humanise entire content" description="Low AI score detected. AI will rewrite the content to sound more naturally human-written." onClick={() => handleApply('humanise', {})} applying={applyingType === 'humanise'} fixed={appliedFixes.has('humanise')} color="#7c3aed" />
            )}

            {metrics.perplexity.score >= 60 && appliedFixes.size === 0 && (
              <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #05966930' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#059669', textAlign: 'center' }}>✅ No corrections needed — content reads naturally</div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AIDetectionDashboard;
