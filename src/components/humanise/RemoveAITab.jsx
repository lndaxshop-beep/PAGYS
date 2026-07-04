import React, { useState, useCallback, useEffect } from 'react';
import { getChapterDisplayTitle } from '../../utils/writeHelpers.jsx';

const REMOVE_AI_LIMIT = 6;

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
        completed.push(chapterTitle);
        setRemoveAIUsed(prev => prev + 1);
        setResults(prev => ({ ...prev, [chId]: { done: true } }));
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
      const subs = ch.subsections.filter(s => s.type !== 'references' && !s.deleted);
      const content = rawContent[chId] || {};
      const fullText = subs.map(s => content[s.id] || '').filter(Boolean).join(' ');
      if (!fullText.trim()) { setCheckingScore(prev => ({ ...prev, [chId]: false })); return; }
      const { computeAIScores } = await import('../../utils/aiScoreUtils');
      const aiResult = computeAIScores(fullText);
      const { checkPlagiarism } = await import('../../utils/plagiarismChecker');
      const plagiarismResult = checkPlagiarism(fullText, sources);
      setScores(prev => ({ ...prev, [chId]: { ai: aiResult, plagiarism: plagiarismResult } }));
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
  const canSelect = generatedChapters.filter(ch => !selectedChapters.has(ch.id));

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
                const chScore = scores[ch.id];
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

                    {chScore && (
                      <div style={{ marginTop: '10px', padding: '10px 12px', backgroundColor: isDarkMode ? '#1f2937' : 'white', borderRadius: '6px', border: `1px solid ${colors.border}` }}>
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12px' }}>
                          {chScore.ai ? (
                            <>
                              <span>AI Score: <strong style={{ color: chScore.ai.verdict === 'pass' ? '#059669' : chScore.ai.verdict === 'borderline' ? '#f59e0b' : '#dc2626' }}>{chScore.ai.score}/100 ({chScore.ai.verdictLabel})</strong></span>
                              <span>Burstiness: <strong style={{ color: (chScore.ai.burstiness?.cv || 0) >= 0.4 ? '#059669' : '#f59e0b' }}>{((chScore.ai.burstiness?.cv || 0) * 100).toFixed(0)}%</strong></span>
                              <span>Banned: <strong style={{ color: (chScore.ai.banned?.count || 0) > 0 ? '#dc2626' : '#059669' }}>{chScore.ai.banned?.count || 0}</strong></span>
                              <span>Transitions: <strong>{(chScore.ai.transitions?.frequency || 0).toFixed(1)}/sentence</strong></span>
                            </>
                          ) : (
                            <>
                              <span>AI Score: <strong style={{ color: (chScore.verdict || chScore.overall?.verdict) === 'pass' ? '#059669' : '#dc2626' }}>{chScore.score || chScore.overall?.score || 'N/A'}/100</strong></span>
                              <span>Burstiness: <strong style={{ color: (chScore.burstiness?.cv || chScore.overall?.burstiness?.cv || 0) >= 0.4 ? '#059669' : '#f59e0b' }}>{((chScore.burstiness?.cv || chScore.overall?.burstiness?.cv || 0) * 100).toFixed(0)}%</strong></span>
                              <span>Banned: <strong style={{ color: (chScore.banned || chScore.overall?.banned?.count || 0) > 0 ? '#dc2626' : '#059669' }}>{chScore.banned || chScore.overall?.banned?.count || 0}</strong></span>
                              <span>Transitions: <strong>{(chScore.transitions?.frequency || chScore.overall?.transitions?.frequency || 0).toFixed(1)}/sentence</strong></span>
                            </>
                          )}
                          <span style={{ borderLeft: `1px solid ${colors.border}`, paddingLeft: '12px' }}>Plagiarism: <strong style={{ color: (chScore.plagiarism?.score || 0) >= 30 ? '#dc2626' : (chScore.plagiarism?.score || 0) >= 15 ? '#f59e0b' : '#059669' }}>{chScore.plagiarism?.score || 0}%</strong> ({chScore.plagiarism?.matches?.length || 0} flagged)</span>
                        </div>
                      </div>
                    )}

                    {expandedChapter === ch.id && (
                      <div style={{ marginTop: '10px', padding: '12px', backgroundColor: isDarkMode ? '#1f2937' : 'white', borderRadius: '6px', maxHeight: '300px', overflowY: 'auto', fontSize: '13px', lineHeight: '1.6', color: colors.text, whiteSpace: 'pre-wrap' }}>
                        {getChapterContent(ch.id).slice(0, 2000)}{getChapterContent(ch.id).length > 2000 ? '...' : ''}
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
                {processing ? 'Processing...' : `🚀 Remove AI (${selectedChapters.size} chapter${selectedChapters.size > 1 ? 's' : ''})`}
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
