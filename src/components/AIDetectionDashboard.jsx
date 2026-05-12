import React, { useMemo } from 'react';
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

const Badge = ({ label, count, color }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '500',
    backgroundColor: `${color}20`, color,
    margin: '2px',
  }}>
    {count}× {label}
  </span>
);

const AIDetectionDashboard = ({ isOpen, onClose, content }) => {
  const { colors, isDarkMode } = useTheme();

  const metrics = useMemo(() => {
    if (!content) return null;
    const burstiness = calculateBurstiness(content);
    const banned = scanBannedPhrases(content);
    const transitions = scanTransitions(content);
    const perplexity = calculatePerplexityEstimate(content);
    return { burstiness, banned, transitions, perplexity };
  }, [content]);

  if (!isOpen) return null;

  const scoreColor = metrics?.perplexity.score >= 60 ? '#059669' : metrics?.perplexity.score >= 40 ? '#f59e0b' : '#dc2626';

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ backgroundColor: colors.surface, borderRadius: '16px', padding: '24px', width: '90%', maxWidth: '520px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: colors.text }}>🤖 AI Detection Score</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: colors.textSecondary, cursor: 'pointer', fontSize: '18px', padding: '4px 8px' }}>✕</button>
        </div>

        {!content ? (
          <p style={{ color: colors.textSecondary, textAlign: 'center', padding: '40px' }}>
            No content to analyze. Generate or write content first.
          </p>
        ) : !metrics ? (
          <p style={{ color: colors.textSecondary, textAlign: 'center', padding: '40px' }}>Analyzing...</p>
        ) : (
          <>
            <div style={{
              textAlign: 'center', padding: '24px', marginBottom: '20px',
              backgroundColor: isDarkMode ? '#1f2937' : '#f9fafb', borderRadius: '12px',
              border: `1px solid ${colors.border}`,
            }}>
              <div style={{ fontSize: '48px', fontWeight: '800', color: scoreColor }}>
                {metrics.perplexity.score}/100
              </div>
              <div style={{ fontSize: '13px', color: colors.textSecondary, marginTop: '4px' }}>
                {metrics.perplexity.score >= 60 ? '✅ Likely human-written' :
                 metrics.perplexity.score >= 40 ? '⚠️ Mixed signals' :
                 '🔴 Likely AI-generated'}
              </div>
            </div>

            <Gauge label="Burstiness (Sentence Variety)" value={Math.round(metrics.burstiness.cv * 100)} max={80} unit="%" />
            <Gauge label="Vocabulary Diversity" value={metrics.perplexity.vocabScore + metrics.perplexity.wordLengthScore} max={60} unit="" goodDir="up" />
            <Gauge label="Transition Word Frequency" value={Math.round(metrics.transitions.frequency * 10)} max={20} unit="" goodDir="down" />

            <div style={{ marginTop: '12px' }}>
              <div style={{ fontSize: '13px', fontWeight: '500', color: colors.text, marginBottom: '8px' }}>
                Sentence Length Distribution
              </div>
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
                <div style={{ fontSize: '13px', fontWeight: '500', color: '#dc2626', marginBottom: '8px' }}>
                  ⚠️ {metrics.banned.length} Banned Phrase(s) Detected
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
                  {metrics.banned.slice(0, 10).map((b, i) => (
                    <Badge key={i} label={b.phrase} count={1} color="#dc2626" />
                  ))}
                  {metrics.banned.length > 10 && (
                    <span style={{ fontSize: '11px', color: colors.textSecondary, alignSelf: 'center', marginLeft: '4px' }}>
                      +{metrics.banned.length - 10} more
                    </span>
                  )}
                </div>
              </div>
            )}

            <div style={{ marginTop: '16px', padding: '12px', backgroundColor: isDarkMode ? '#1f2937' : '#f0fdf4', borderRadius: '8px', border: '1px solid #05966930' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#059669', marginBottom: '4px' }}>💡 Recommendations</div>
              <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: colors.text, lineHeight: '1.6' }}>
                {metrics.burstiness.cv < 0.4 && <li>Increase sentence length variety — mix very short and long sentences.</li>}
                {metrics.banned.length > 0 && <li>Replace detected banned phrases with more natural alternatives.</li>}
                {metrics.transitions.frequency > 1.5 && <li>Reduce transition word frequency for more natural flow.</li>}
                {metrics.perplexity.score < 60 && metrics.perplexity.score >= 40 && <li>Content shows mixed signals. Try the Humanise feature to improve naturalness.</li>}
                {metrics.perplexity.score < 40 && <li>Content appears AI-generated. Use the Humanise feature to make it read more naturally.</li>}
                {metrics.perplexity.score >= 60 && <li>Content reads naturally. No changes needed for AI detection.</li>}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AIDetectionDashboard;
