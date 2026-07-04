import React, { useState, useCallback, useEffect, useRef } from 'react';
import { getChapterDisplayTitle } from '../../utils/writeHelpers.jsx';

const REMOVE_AI_LIMIT = 6;

const AIGauge = ({ score, confidence, size = 160 }) => {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const [animatedScore, setAnimatedScore] = useState(0);
  const r = useRef(null);
  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 100);
    return () => clearTimeout(timer);
  }, [score]);
  const offset = circumference - (animatedScore / 100) * circumference;
  const color = score >= 60 ? '#059669' : score >= 40 ? '#f59e0b' : '#dc2626';
  const label = score >= 60 ? 'Likely Human' : score >= 40 ? 'Needs Work' : 'Likely AI';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth="12" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth="12"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease-in-out' }} />
      </svg>
      <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '28px', fontWeight: '700', color }}>{Math.round(animatedScore)}<span style={{ fontSize: '14px', fontWeight: '400' }}>/100</span></span>
        <span style={{ fontSize: '11px', fontWeight: '500', color: colors?.textSecondary || '#6b7280', marginTop: '2px' }}>{label}</span>
        {confidence > 0 && <span style={{ fontSize: '10px', color: '#9ca3af', marginTop: '1px' }}>{confidence}% confidence</span>}
      </div>
    </div>
  );
};

const BreakdownBar = ({ label, value, color, invertColor = false }) => {
  const effectiveColor = value >= 60 ? '#059669' : value >= 40 ? '#f59e0b' : '#dc2626';
  const barColor = invertColor ? (value <= 40 ? '#059669' : value <= 60 ? '#f59e0b' : '#dc2626') : effectiveColor;
  const displayValue = invertColor ? 100 - value : value;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
      <span style={{ width: '90px', fontSize: '11px', color: '#6b7280', flexShrink: 0, textAlign: 'right' }}>{label}</span>
      <div style={{ flex: 1, height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ width: `${displayValue}%`, height: '100%', backgroundColor: barColor, borderRadius: '4px', transition: 'width 0.8s ease-in-out' }} />
      </div>
      <span style={{ width: '30px', fontSize: '11px', fontWeight: '600', color: barColor, textAlign: 'right' }}>{displayValue}%</span>
    </div>
  );
};

const ScoreChart = ({ history, colors }) => {
  const canvasRef = useRef(null);
  useEffect(() => {
    if (!canvasRef.current || !history || history.length < 2) return;
    const ctx = canvasRef.current.getContext('2d');
    const w = canvasRef.current.width;
    const h = canvasRef.current.height;
    const pad = { top: 4, bottom: 12, left: 4, right: 4 };
    ctx.clearRect(0, 0, w, h);
    const max = Math.max(...history, 100);
    const min = Math.min(...history, 0);
    const range = max - min || 1;
    const xStep = (w - pad.left - pad.right) / (history.length - 1);
    const points = history.map((v, i) => ({
      x: pad.left + i * xStep,
      y: pad.top + (h - pad.top - pad.bottom) * (1 - (v - min) / range)
    }));
    ctx.beginPath();
    ctx.strokeStyle = '#7c3aed';
    ctx.lineWidth = 2;
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      const cpX = (points[i - 1].x + points[i].x) / 2;
      ctx.bezierCurveTo(cpX, points[i - 1].y, cpX, points[i].y, points[i].x, points[i].y);
    }
    ctx.stroke();
    ctx.fillStyle = '#7c3aed';
    points.forEach((p, i) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, i === points.length - 1 ? 3 : 2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = '#9ca3af';
    ctx.font = '8px sans-serif';
    history.forEach((v, i) => {
      ctx.fillText(v, points[i].x - 4, h - 1);
    });
  }, [history]);
  if (!history || history.length < 2) return null;
  return (
    <div style={{ marginTop: '8px' }}>
      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Score History</div>
      <canvas ref={canvasRef} width={160} height={50} style={{ width: '100%', height: '50px', backgroundColor: '#f9fafb', borderRadius: '4px' }} />
    </div>
  );
};

const RemoveAITab = ({ projectId, chapters, rawContent, projectData, colors, isDarkMode, notify, fmt, onContentUpdated, sources = [] }) => {
  const [selectedChapters, setSelectedChapters] = useState(new Set());
  const [removeAIUsed, setRemoveAIUsed] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`removeAIUsed_${projectId}`) || '0'); } catch { return 0; }
  });
  const [processing, setProcessing] = useState(false);
  const [processingChapter, setProcessingChapter] = useState(null);
  const [results, setResults] = useState({});
  const [scores, setScores] = useState({});
  const [showResetModal, setShowResetModal] = useState(false);
  const [processingReset, setProcessingReset] = useState(false);
  const [expandedChapter, setExpandedChapter] = useState(null);
  const [checkingScore, setCheckingScore] = useState({});
  const [scoreHistory, setScoreHistory] = useState({});

  useEffect(() => {
    try { localStorage.setItem(`removeAIUsed_${projectId}`, JSON.stringify(removeAIUsed)); } catch {}
  }, [removeAIUsed, projectId]);

  const removeAILeft = REMOVE_AI_LIMIT - removeAIUsed;

  const getChapterContent = useCallback((chapterId) => {
    const ch = chapters.find(c => c.id === chapterId);
    if (!ch) return '';
    const subs = ch.subsections.filter(s => s.type !== 'references' && !s.deleted);
    const content = rawContent[chapterId] || {};
    const parts = [];
    for (let i = 0; i < subs.length; i++) {
      const text = content[subs[i].id];
      if (text) parts.push(`${subs[i].title}\n\n${text}`);
    }
    return parts.join('\n\n');
  }, [chapters, rawContent]);

  const getChapterFlatText = useCallback((chapterId) => {
    const ch = chapters.find(c => c.id === chapterId);
    if (!ch) return '';
    const subs = ch.subsections.filter(s => s.type !== 'references' && !s.deleted);
    const content = rawContent[chapterId] || {};
    return subs.map(s => content[s.id] || '').filter(Boolean).join(' ');
  }, [chapters, rawContent]);

  const toggleChapter = (id) => {
    setSelectedChapters(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleRemoveAI = async () => {
    if (selectedChapters.size === 0 || processing) return;
    if (removeAILeft < selectedChapters.size) {
      notify(`You only have ${removeAILeft} Remove AI use(s) left. Select fewer chapters or reset.`, 'error');
      return;
    }
    setProcessing(true);
    const chapterIds = [...selectedChapters];
    const completed = [];
    for (let i = 0; i < chapterIds.length; i++) {
      const chId = chapterIds[i];
      const ch = chapters.find(c => c.id === chId);
      if (!ch) continue;
      setProcessingChapter(chId);
      try {
        const fullContent = getChapterContent(chId);
        if (!fullContent) {
          notify(`Chapter "${getChapterDisplayTitle(ch)}" has no content.`, 'warning');
          continue;
        }
        const chapterTitle = getChapterDisplayTitle(ch);
        const { humaniseContent } = await import('../../services/geminiService');
        const { calculateBurstiness, scanBannedPhrases } = await import('../../services/gemini/antiDetection');
        const preBurstiness = calculateBurstiness(fullContent);
        const preBanned = scanBannedPhrases(fullContent);
        const diagnosticReport = `## PRE-HUMANISE DIAGNOSTICS\n- Burstiness coefficient of variation: ${preBurstiness.cv.toFixed(3)}\n- Banned phrases detected: ${preBanned.length}`;
        const humanisedText = await humaniseContent(fullContent, {
          topic: projectData?.title,
          researchTopic: projectData?.topic,
          field: projectData?.field,
          chapter: chapterTitle,
          subsection: '',
          diagnosticReport
        });
        if (!humanisedText || humanisedText === fullContent) {
          notify(`Chapter "${chapterTitle}" returned no changes.`, 'warning');
          continue;
        }
        const subs = ch.subsections.filter(s => s.type !== 'references' && !s.deleted);
        let remainingText = humanisedText;
        let updatedContent = { ...(rawContent[chId] || {}) };
        for (let j = 0; j < subs.length; j++) {
          const sub = subs[j];
          const header = sub.title;
          const headerIdx = remainingText.indexOf(header);
          if (headerIdx < 0) continue;
          const nextSub = j < subs.length - 1 ? subs[j + 1] : null;
          const nextHeader = nextSub ? nextSub.title : null;
          let subContent;
          if (nextHeader) {
            const nextIdx = remainingText.indexOf(nextHeader, headerIdx + header.length);
            subContent = nextIdx >= 0 ? remainingText.slice(headerIdx, nextIdx).trim() : remainingText.slice(headerIdx).trim();
          } else {
            subContent = remainingText.slice(headerIdx).trim();
          }
          const contentStart = subContent.indexOf('\n');
          updatedContent[sub.id] = contentStart >= 0 ? subContent.slice(contentStart).trim() : '';
        }
        const { saveGeneratedContent } = await import('../../services/firestoreService');
        const merged = { ...rawContent, [chId]: updatedContent };
        await saveGeneratedContent(projectId, merged);
        if (onContentUpdated) onContentUpdated(chId, updatedContent);
        const currentIter = (results[chId]?.iterations || 0) + 1;
        setResults(prev => ({ ...prev, [chId]: { done: true, iterations: currentIter } }));
        completed.push(chapterTitle);
        setRemoveAIUsed(prev => prev + 1);
        const { computeAIScores } = await import('../../utils/aiScoreUtils');
        const { checkPlagiarism } = await import('../../utils/plagiarismChecker');
        const flatText = getChapterFlatText(chId);
        if (flatText.trim()) {
          const aiResult = computeAIScores(flatText);
          const plagiarismResult = checkPlagiarism(flatText, sources);
          if (aiResult) {
            setScores(prev => ({ ...prev, [chId]: { ai: aiResult, plagiarism: plagiarismResult } }));
            setScoreHistory(prev => {
              const existing = prev[chId] || [];
              const next = [...existing, aiResult.score];
              return { ...prev, [chId]: next.slice(-5) };
            });
          }
        }
      } catch (e) {
        console.error(`Remove AI failed for chapter ${chId}:`, e);
        notify(`Failed to process "${getChapterDisplayTitle(ch)}". Try again.`, 'error');
      }
    }
    setProcessingChapter(null);
    setProcessing(false);
    setSelectedChapters(new Set());
    if (completed.length > 0) {
      notify(`✅ ${completed.join(', ')} humanised successfully!`, 'success');
    }
  };

  const handleCheckScore = async (chId) => {
    if (checkingScore[chId]) return;
    const ch = chapters.find(c => c.id === chId);
    if (!ch) return;
    setCheckingScore(prev => ({ ...prev, [chId]: true }));
    try {
      const fullText = getChapterFlatText(chId);
      if (!fullText.trim()) { setCheckingScore(prev => ({ ...prev, [chId]: false })); return; }
      const { computeAIScores } = await import('../../utils/aiScoreUtils');
      const aiResult = computeAIScores(fullText);
      const { checkPlagiarism } = await import('../../utils/plagiarismChecker');
      const plagiarismResult = checkPlagiarism(fullText, sources);
      setScores(prev => ({ ...prev, [chId]: { ai: aiResult, plagiarism: plagiarismResult } }));
      if (aiResult) {
        setScoreHistory(prev => {
          const existing = prev[chId] || [];
          return existing.length > 0 ? prev : { ...prev, [chId]: [aiResult.score] };
        });
      }
    } catch (e) {
      console.error('Score check failed:', e);
    }
    setCheckingScore(prev => ({ ...prev, [chId]: false }));
  };

  const handleResetConfirm = async () => {
    setProcessingReset(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setRemoveAIUsed(0);
    setShowResetModal(false);
    setProcessingReset(false);
    notify('Remove AI uses have been reset to 6!', 'success');
  };

  const generatedChapters = chapters.filter(ch => {
    const content = rawContent[ch.id];
    if (!content) return false;
    const subs = (ch.subsections || []).filter(s => s.type !== 'references' && !s.deleted);
    return subs.some(s => content[s.id]);
  });

  const getScoreColor = (score) => score >= 60 ? '#059669' : score >= 40 ? '#f59e0b' : '#dc2626';

  return (
    <div style={{ backgroundColor: colors.surface, borderRadius: '12px', padding: '24px', border: `1px solid ${colors.border}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: colors.text, margin: 0 }}>🚀 Remove AI</h2>
          <p style={{ color: colors.textSecondary, fontSize: '14px', marginTop: '4px' }}>
            Rewrite entire chapters in natural human voice — bypass AI detection
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '24px', fontWeight: '700', color: removeAILeft > 0 ? colors.primary : '#dc2626' }}>{removeAILeft}</div>
          <div style={{ fontSize: '12px', color: colors.textSecondary }}>uses remaining</div>
        </div>
      </div>

      {generatedChapters.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', border: `2px dashed ${colors.border}`, borderRadius: '8px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📝</div>
          <p style={{ color: colors.text, fontWeight: '500', marginBottom: '8px' }}>No generated chapters yet</p>
          <p style={{ color: colors.textSecondary, fontSize: '13px' }}>Generate thesis content first, then return here to humanise it.</p>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: colors.text, marginBottom: '12px' }}>Select Chapters to Humanise</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {generatedChapters.map(ch => {
                const subs = ch.subsections.filter(s => s.type !== 'references' && !s.deleted);
                const hasContent = subs.some(s => rawContent[ch.id]?.[s.id]);
                const isSelected = selectedChapters.has(ch.id);
                const isDone = results[ch.id]?.done;
                const chIterations = results[ch.id]?.iterations || 0;
                const chScore = scores[ch.id];
                const chScoreHistory = scoreHistory[ch.id] || [];
                const sentenceData = chScore?.ai?.sentences || [];
                const flaggedCount = chScore?.ai?.flaggedSentenceCount || 0;
                const totalSentences = chScore?.ai?.totalSentences || 0;
                const breakdown = chScore?.ai?.breakdown;
                const topIssues = chScore?.ai?.topIssues || [];
                return (
                  <div key={ch.id} style={{
                    display: 'flex', flexDirection: 'column',
                    padding: '14px 16px', borderRadius: '8px',
                    backgroundColor: isSelected ? (isDarkMode ? '#2d6a4f30' : '#d1fae5') : (isDarkMode ? '#2d2d2d' : '#f9fafb'),
                    border: `1px solid ${isSelected ? '#059669' : isDone ? '#7c3aed' : colors.border}`,
                    cursor: hasContent ? 'pointer' : 'not-allowed',
                    opacity: hasContent ? 1 : 0.5,
                    transition: 'all 0.2s',
                  }} onClick={() => hasContent && toggleChapter(ch.id)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                        <div style={{
                          width: '20px', height: '20px', borderRadius: '4px', flexShrink: 0,
                          backgroundColor: isSelected ? '#059669' : 'transparent',
                          border: `2px solid ${isSelected ? '#059669' : colors.border}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontSize: '12px', fontWeight: '700',
                        }}>{isSelected ? '✓' : ''}</div>
                        <div>
                          <div style={{ fontWeight: '600', color: colors.text, fontSize: '14px' }}>
                            {getChapterDisplayTitle(ch)}
                          </div>
                          <div style={{ display: 'flex', gap: '8px', marginTop: '2px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '11px', color: colors.textSecondary }}>{subs.length} subsections</span>
                            {ch.completed && <span style={{ fontSize: '11px', color: '#059669' }}>✓ Completed</span>}
                            {isDone && <span style={{ fontSize: '11px', color: '#7c3aed' }}>✨ Humanised</span>}
                            {chIterations > 0 && <span style={{ fontSize: '11px', color: '#7c3aed' }}>Iteration {chIterations}</span>}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <button onClick={(e) => { e.stopPropagation(); handleCheckScore(ch.id); }}
                          style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '4px', backgroundColor: '#7c3aed', color: 'white', border: 'none', cursor: checkingScore[ch.id] ? 'not-allowed' : 'pointer', fontWeight: '500', opacity: checkingScore[ch.id] ? 0.7 : 1 }}>
                          {checkingScore[ch.id] ? '⏳ Checking...' : hasContent ? '📊 Check Score' : ''}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setExpandedChapter(expandedChapter === ch.id ? null : ch.id); }}
                          style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '4px', backgroundColor: 'transparent', color: colors.primary, border: `1px solid ${colors.primary}`, cursor: 'pointer' }}>
                          {expandedChapter === ch.id ? '▲' : '▼'} Preview
                        </button>
                      </div>
                    </div>

                    {chScore && chScore.ai && (
                      <div style={{ marginTop: '12px', padding: '16px', backgroundColor: isDarkMode ? '#1f2937' : 'white', borderRadius: '8px', border: `1px solid ${colors.border}` }}>
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '120px', height: '120px' }}>
                            <svg width="120" height="120" style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
                              <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                              <circle cx="60" cy="60" r="50" fill="none" stroke={getScoreColor(chScore.ai.score)} strokeWidth="10"
                                strokeDasharray={Math.PI * 100} strokeDashoffset={Math.PI * 100 * (1 - (chScore.ai.score || 0) / 100)}
                                strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease-in-out' }} />
                            </svg>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: '22px', fontWeight: '700', color: getScoreColor(chScore.ai.score) }}>{chScore.ai.score}<span style={{ fontSize: '11px', fontWeight: '400', color: '#9ca3af' }}>/100</span></div>
                              <div style={{ fontSize: '10px', fontWeight: '500', color: '#6b7280', marginTop: '1px' }}>{chScore.ai.verdictLabel.replace(/[✅🔴⚠️]/g, '').trim()}</div>
                              {chScore.ai.confidence > 0 && <div style={{ fontSize: '9px', color: '#9ca3af' }}>{chScore.ai.confidence}% conf</div>}
                            </div>
                          </div>
                          <div style={{ flex: 1, minWidth: '200px' }}>
                            <div style={{ fontSize: '12px', fontWeight: '600', color: colors.text, marginBottom: '8px' }}>Breakdown</div>
                            {breakdown && (
                              <>
                                <BreakdownBar label="Perplexity" value={breakdown.perplexityScore} />
                                <BreakdownBar label="Burstiness" value={breakdown.burstinessScore} />
                                <BreakdownBar label="Stylometrics" value={breakdown.stylometricScore} />
                                <BreakdownBar label="Formality" value={breakdown.formalityScore} invertColor />
                                <BreakdownBar label="Repetition" value={breakdown.repetitionScore} invertColor />
                                {breakdown.plagiarismScore > 0 && <BreakdownBar label="Plagiarism" value={100 - breakdown.plagiarismScore} />}
                              </>
                            )}
                          </div>
                        </div>
                        {topIssues.length > 0 && (
                          <div style={{ marginTop: '12px', padding: '8px 10px', backgroundColor: isDarkMode ? '#2d2d2d' : '#fefce8', borderRadius: '6px', border: '1px solid #fde68a' }}>
                            <div style={{ fontSize: '11px', fontWeight: '600', color: '#92400e', marginBottom: '4px' }}>Top Issues ({flaggedCount} of {totalSentences} sentences flagged)</div>
                            {topIssues.map((issue, i) => (
                              <div key={i} style={{ fontSize: '11px', color: '#92400e', paddingLeft: '12px' }}>• {issue}</div>
                            ))}
                          </div>
                        )}
                        <ScoreChart history={chScoreHistory} colors={colors} />
                      </div>
                    )}

                    {expandedChapter === ch.id && (
                      <div style={{ marginTop: '10px' }}>
                        <div style={{ padding: '12px', backgroundColor: isDarkMode ? '#1f2937' : 'white', borderRadius: '6px', maxHeight: '300px', overflowY: 'auto', fontSize: '13px', lineHeight: '1.7', color: colors.text }}>
                          {sentenceData.length > 0 ? (
                            sentenceData.map((s, i) => {
                              const bg = s.aiProbability > 0.8 ? 'rgba(239,68,68,0.12)' : s.aiProbability > 0.5 ? 'rgba(234,179,8,0.12)' : 'transparent';
                              const border = s.aiProbability > 0.8 ? '1px solid rgba(239,68,68,0.2)' : s.aiProbability > 0.5 ? '1px solid rgba(234,179,8,0.2)' : 'none';
                              return (
                                <span key={i} title={s.flags.length > 0 ? `Flags: ${s.flags.join(', ')}\nSuggestions: ${s.suggestions.join(', ')}` : 'No issues'}
                                  style={{ backgroundColor: bg, border, borderRadius: '2px', cursor: 'pointer', padding: '1px 0' }}>
                                  {s.text}{' '}
                                </span>
                              );
                            })
                          ) : (
                            <>
                              <div style={{ whiteSpace: 'pre-wrap' }}>{getChapterContent(ch.id).slice(0, 2000)}</div>
                              {getChapterContent(ch.id).length > 2000 && (
                                <span style={{ color: '#9ca3af', fontSize: '12px' }}>... (content truncated)</span>
                              )}
                            </>
                          )}
                        </div>
                        {sentenceData.length > 0 && (
                          <div style={{ marginTop: '6px', padding: '8px 10px', backgroundColor: isDarkMode ? '#2d2d2d' : '#f9fafb', borderRadius: '6px', border: `1px solid ${colors.border}` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <span style={{ fontSize: '10px', color: '#6b7280', fontWeight: '500' }}>Sentence Density Map</span>
                              <span style={{ fontSize: '10px', color: '#9ca3af' }}>{flaggedCount} flagged of {totalSentences}</span>
                              <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto', fontSize: '10px' }}>
                                <span style={{ color: '#dc2626' }}>■ High AI</span>
                                <span style={{ color: '#f59e0b' }}>■ Medium</span>
                                <span style={{ color: '#059669' }}>■ Low</span>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1px', height: '14px', alignItems: 'flex-end' }}>
                              {sentenceData.map((s, i) => {
                                const h = Math.max(4, Math.round(s.aiProbability * 14));
                                const color = s.aiProbability > 0.8 ? '#dc2626' : s.aiProbability > 0.5 ? '#f59e0b' : '#059669';
                                return <div key={i} title={`"${s.text.slice(0, 80)}..."\nAI: ${Math.round(s.aiProbability * 100)}%\nFlags: ${s.flags.join(', ') || 'none'}`}
                                  style={{ flex: 1, height: `${h}px`, backgroundColor: color, borderRadius: '1px', minWidth: '2px', cursor: 'pointer', transition: 'height 0.2s' }} />;
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {processingChapter === ch.id && (
                      <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px', color: colors.primary, fontSize: '13px' }}>
                        <div style={{ width: '16px', height: '16px', border: `2px solid ${colors.primary}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                        Humanising...
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {selectedChapters.size > 0 && (
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '20px' }}>
              <button onClick={handleRemoveAI} disabled={processing}
                style={{
                  padding: '12px 32px', fontSize: '15px', fontWeight: '600', borderRadius: '8px',
                  backgroundColor: processing ? '#9ca3af' : colors.primary, color: 'white',
                  border: 'none', cursor: processing ? 'not-allowed' : 'pointer',
                  opacity: processing ? 0.7 : 1,
                }}>
                {processing ? 'Processing...' : `🚀 Remove AI${selectedChapters.size === 1 && results[[...selectedChapters][0]]?.iterations > 0 ? ` More (iter ${results[[...selectedChapters][0]].iterations + 1})` : ''} (${selectedChapters.size} chapter${selectedChapters.size > 1 ? 's' : ''})`}
              </button>
            </div>
          )}

          {removeAILeft <= 0 && (
            <div style={{ textAlign: 'center', padding: '16px', backgroundColor: isDarkMode ? '#1f2937' : '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
              <p style={{ color: '#dc2626', fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>You've used all your Remove AI uses.</p>
              <button onClick={() => setShowResetModal(true)}
                style={{ padding: '10px 20px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '500', cursor: 'pointer', fontSize: '13px' }}>
                Reset Remove AI ({fmt(2)})
              </button>
            </div>
          )}

          {!processing && removeAILeft > 0 && selectedChapters.size === 0 && (
            <div style={{ textAlign: 'center', padding: '12px', color: colors.textSecondary, fontSize: '13px' }}>
              Select generated chapters above to humanise them
            </div>
          )}
        </>
      )}

      <style>{`@keyframes spin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}`}</style>

      {showResetModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5000 }}>
          <div style={{ backgroundColor: colors.surface, borderRadius: '16px', maxWidth: '400px', width: '90%', padding: '32px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize: '40px', textAlign: 'center', marginBottom: '16px' }}>🔄</div>
            <h2 style={{ textAlign: 'center', fontSize: '22px', fontWeight: '700', color: colors.text, margin: '0 0 8px' }}>Reset Remove AI</h2>
            <p style={{ textAlign: 'center', fontSize: '14px', color: colors.textSecondary, margin: '0 0 24px' }}>Get 6 more Remove AI uses.</p>
            <div style={{ backgroundColor: colors.background, borderRadius: '12px', padding: '20px', marginBottom: '24px', border: `1px solid ${colors.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ color: colors.textSecondary, fontSize: '14px' }}>Feature</span>
                <span style={{ color: colors.text, fontWeight: '600', fontSize: '14px' }}>Remove AI Reset</span>
              </div>
              <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: '12px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: colors.textSecondary, fontSize: '14px' }}>Amount</span>
                <span style={{ color: colors.text, fontWeight: '700', fontSize: '18px' }}>{fmt(2)}</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button onClick={handleResetConfirm} disabled={processingReset}
                style={{ backgroundColor: processingReset ? colors.border : '#2563eb', color: 'white', padding: '14px', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: processingReset ? 'not-allowed' : 'pointer', fontSize: '15px', opacity: processingReset ? 0.7 : 1 }}>
                {processingReset ? 'Processing...' : `Pay ${fmt(2)}`}
              </button>
              <button onClick={() => setShowResetModal(false)} disabled={processingReset}
                style={{ backgroundColor: 'transparent', color: colors.textSecondary, padding: '10px', border: `1px solid ${colors.border}`, borderRadius: '8px', fontWeight: '500', cursor: processingReset ? 'not-allowed' : 'pointer', fontSize: '14px' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RemoveAITab;
