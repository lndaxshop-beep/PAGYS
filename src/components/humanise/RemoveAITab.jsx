import React, { useState, useCallback, useEffect, useRef } from 'react';
import { getChapterDisplayTitle } from '../../utils/writeHelpers.jsx';
import { PRICES_GHS } from '../../constants/pricing';
import { saveRemoveAIData, getRemoveAIData, saveGeneratedContent, saveSubsectionVersions, getSubsectionVersions } from '../../services/firestoreService';

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

const RemoveAITab = ({ projectId, chapters, rawContent, projectData, colors, isDarkMode, notify, fmt, onContentUpdated, sources = [], processSmallPayment }) => {
  const isPremium = projectData?.tier === 'premium' || projectData?.isPremium;
  const baseLimit = isPremium ? 10 : 5;
  const resetPrice = isPremium ? PRICES_GHS.removeAIResetPremium : PRICES_GHS.removeAIReset;

  const [selectedChapters, setSelectedChapters] = useState(new Set());
  const [removeAIUsed, setRemoveAIUsed] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`removeAIUsed_${projectId}`) || '0'); } catch { return 0; }
  });
  const [removeAIResets, setRemoveAIResets] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`removeAIResets_${projectId}`) || '0'); } catch { return 0; }
  });
  const [processing, setProcessing] = useState(false);
  const [processingChapter, setProcessingChapter] = useState(null);
  const [chapterVersions, setChapterVersions] = useState({});
  const [selectedVersionIdx, setSelectedVersionIdx] = useState({});
  const [showResetModal, setShowResetModal] = useState(false);
  const [processingReset, setProcessingReset] = useState(false);
  const [expandedChapter, setExpandedChapter] = useState(null);
  const [checkingScore, setCheckingScore] = useState({});
  const [selectedSentence, setSelectedSentence] = useState(null);
  const [sentenceEdits, setSentenceEdits] = useState({});
  const [showManualEdit, setShowManualEdit] = useState(null);
  const [manualEditDraft, setManualEditDraft] = useState('');
  const initialLoad = useRef(true);
  const saveTimer = useRef(null);

  useEffect(() => { try { localStorage.setItem(`removeAIUsed_${projectId}`, JSON.stringify(removeAIUsed)); } catch {} }, [removeAIUsed, projectId]);
  useEffect(() => { try { localStorage.setItem(`removeAIResets_${projectId}`, JSON.stringify(removeAIResets)); } catch {} }, [removeAIResets, projectId]);

  useEffect(() => {
    (async () => {
      try {
        const saved = await getRemoveAIData(projectId);
        if (saved) {
          if (saved.sentenceEdits) setSentenceEdits(saved.sentenceEdits);
          if (saved.chapterVersions) setChapterVersions(saved.chapterVersions);
        }
      } catch (e) { console.error('Failed to load Remove AI data:', e); }
      initialLoad.current = false;
    })();
  }, [projectId]);

  const persistData = useCallback((edits, versions) => {
    if (initialLoad.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveRemoveAIData(projectId, {
        sentenceEdits: edits !== undefined ? edits : sentenceEdits,
        chapterVersions: versions !== undefined ? versions : chapterVersions,
      });
    }, 1500);
  }, [projectId, sentenceEdits, chapterVersions]);

  useEffect(() => {
    if (initialLoad.current) return;
    persistData();
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [sentenceEdits, chapterVersions]);

  useEffect(() => {
    try { localStorage.setItem(`removeAIResets_${projectId}`, JSON.stringify(removeAIResets)); } catch {}
  }, [removeAIResets, projectId]);

  const effectiveLimit = baseLimit + removeAIResets * 3;
  const removeAILeft = effectiveLimit - removeAIUsed;

  const getChapterContent = useCallback((chapterId) => {
    const content = rawContent[chapterId] || {};
    if (content.fullChapter) return content.fullChapter;
    const ch = chapters.find(c => c.id === chapterId);
    if (!ch) return '';
    const subs = ch.subsections.filter(s => s.type !== 'references' && !s.deleted);
    const parts = [];
    for (let i = 0; i < subs.length; i++) {
      const text = content[subs[i].id];
      if (text) parts.push(`${subs[i].title}\n\n${text}`);
    }
    return parts.join('\n\n');
  }, [chapters, rawContent]);

  const getChapterFlatText = useCallback((chapterId) => {
    const content = rawContent[chapterId] || {};
    if (content.fullChapter) return content.fullChapter;
    const ch = chapters.find(c => c.id === chapterId);
    if (!ch) return '';
    const subs = ch.subsections.filter(s => s.type !== 'references' && !s.deleted);
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
        const level = getNextLevel(chId);
        const { humaniseContent } = await import('../../services/geminiService');
        const { computeAIScores } = await import('../../utils/aiScoreUtils');
        const { enrichSentencesWithSuggestions } = await import('../../services/gemini/sentenceSuggestions');
        const preScore = computeAIScores(fullContent);
        const preSentences = preScore?.sentences || [];
        const preEnriched = enrichSentencesWithSuggestions(preSentences);
        const flaggedSentences = preEnriched.filter(s => s.aiProbability > 0.5);
        const diagnosticReport = `## PRE-HUMANISE DIAGNOSTICS\n- Burstiness CV: ${preScore?.burstiness?.cv?.toFixed(3) || 'N/A'}\n- Banned phrases: ${preScore?.banned?.count || 0}\n- Flagged sentences: ${flaggedSentences.length} of ${preSentences.length}`;
        const humanisedText = await humaniseContent(fullContent, {
          topic: projectData?.title,
          researchTopic: projectData?.topic,
          field: projectData?.field,
          chapter: chapterTitle,
          subsection: '',
          diagnosticReport,
          flaggedSentences: flaggedSentences.map(s => ({ text: s.text, flags: s.flags, suggestions: s.suggestions, aiProbability: s.aiProbability }))
        }, level);
        if (!humanisedText || humanisedText === fullContent) {
          notify(`Chapter "${chapterTitle}" returned no changes.`, 'warning');
          continue;
        }
        const { checkPlagiarism } = await import('../../utils/plagiarismChecker');
        const flatText = getChapterFlatText(chId);
        let postScore = null;
        if (flatText.trim()) {
          const aiResult = computeAIScores(humanisedText);
          const plagiarismResult = checkPlagiarism(humanisedText, sources);
          postScore = aiResult ? { ai: aiResult, plagiarism: plagiarismResult } : null;
        }
        const newVersion = {
          level,
          text: humanisedText,
          preScore: preScore?.score || null,
          postScore: postScore?.ai?.score || null,
          scoreBreakdown: postScore?.ai || null,
          plagiarismResult: postScore?.plagiarism || null,
          timestamp: Date.now(),
          applied: false,
        };
        setChapterVersions(prev => {
          const existing = prev[chId] || [];
          return { ...prev, [chId]: [...existing, newVersion] };
        });
        setSelectedVersionIdx(prev => {
          const versions = chapterVersions[chId] || [];
          return { ...prev, [chId]: versions.length };
        });
        setExpandedChapter(chId);
        completed.push(chapterTitle + ` (Level ${level})`);
        setRemoveAIUsed(prev => prev + 1);
      } catch (e) {
        console.error(`Remove AI failed for chapter ${chId}:`, e);
        notify(`Failed to process "${getChapterDisplayTitle(ch)}". Try again.`, 'error');
      }
    }
    setProcessingChapter(null);
    setProcessing(false);
    setSelectedChapters(new Set());
    if (completed.length > 0) {
      notify(`✅ ${completed.join(', ')} generated! Review and click Apply to save.`, 'success');
    }
  };

  const handleCheckScore = async (chId, versionIdx) => {
    if (checkingScore[chId]) return;
    const versions = chapterVersions[chId] || [];
    let textToCheck;
    if (versionIdx !== undefined && versions[versionIdx]) {
      textToCheck = versions[versionIdx].text;
    } else {
      textToCheck = getChapterFlatText(chId);
    }
    if (!textToCheck || !textToCheck.trim()) { notify('No content to check.', 'warning'); return; }
    setCheckingScore(prev => ({ ...prev, [chId]: true }));
    try {
      const { computeAIScores } = await import('../../utils/aiScoreUtils');
      const aiResult = computeAIScores(textToCheck);
      const { checkPlagiarism } = await import('../../utils/plagiarismChecker');
      const plagiarismResult = checkPlagiarism(textToCheck, sources);
      if (versionIdx !== undefined && versions[versionIdx]) {
        setChapterVersions(prev => {
          const list = [...(prev[chId] || [])];
          if (list[versionIdx]) {
            list[versionIdx] = {
              ...list[versionIdx],
              preScore: list[versionIdx].preScore !== null ? list[versionIdx].preScore : aiResult.score,
              postScore: aiResult.score,
              scoreBreakdown: aiResult,
              plagiarismResult,
            };
          }
          return { ...prev, [chId]: list };
        });
      } else {
        notify(`Score: ${Math.round(aiResult.score)}/100`, 'info');
      }
    } catch (e) {
      console.error('Score check failed:', e);
    }
    setCheckingScore(prev => ({ ...prev, [chId]: false }));
  };

  const handleApplyVersion = async (chId, versionIdx) => {
    const versions = chapterVersions[chId] || [];
    const version = versions[versionIdx];
    if (!version) { notify('Version not found.', 'error'); return; }
    if (processing) return;
    setProcessing(true);
    setProcessingChapter(chId);
    try {
      const ch = chapters.find(c => c.id === chId);
      if (!ch) { setProcessing(false); setProcessingChapter(null); return; }
      let updatedContent = { ...(rawContent[chId] || {}), fullChapter: version.text };
      const merged = { ...rawContent, [chId]: updatedContent };
      await saveGeneratedContent(projectId, merged);
      if (onContentUpdated) onContentUpdated(chId, updatedContent);
      setChapterVersions(prev => {
        const list = [...(prev[chId] || [])];
        return { ...prev, [chId]: list.map((v, i) => ({ ...v, applied: i === versionIdx })) };
      });
      setSelectedVersionIdx(prev => ({ ...prev, [chId]: versionIdx }));
      notify(`✅ Level ${version.level} applied to "${getChapterDisplayTitle(ch)}"!`, 'success');
    } catch (e) {
      console.error('Apply version failed:', e);
      notify('Failed to apply version.', 'error');
    }
    setProcessingChapter(null);
    setProcessing(false);
  };

  const handleRevertVersion = (chId) => {
    setChapterVersions(prev => {
      const list = [...(prev[chId] || [])];
      return { ...prev, [chId]: list.map(v => ({ ...v, applied: false })) };
    });
    notify('Reverted. The writing page now shows content before Remove AI.', 'info');
  };

  const handleApplySuggestion = (chId, idx, newText) => {
    setSentenceEdits(prev => ({
      ...prev,
      [chId]: { ...(prev[chId] || {}), [idx]: newText }
    }));
    setSelectedSentence(null);
    setShowManualEdit(null);
    setManualEditDraft('');
    notify('Suggestion applied!', 'success');
  };

  const handleFixAll = (chId, sentenceData) => {
    const edits = {};
    for (const s of sentenceData) {
      if (s.aiProbability > 0.5 && s.suggestions && s.suggestions.length > 0) {
        edits[s.index] = s.suggestions[0];
      }
    }
    const count = Object.keys(edits).length;
    if (count === 0) { notify('No flagged sentences to fix.', 'info'); return; }
    setSentenceEdits(prev => ({ ...prev, [chId]: { ...(prev[chId] || {}), ...edits } }));
    setSelectedSentence(null);
    setShowManualEdit(null);
    setManualEditDraft('');
    notify(`Fixed ${count} sentence${count > 1 ? 's' : ''}! Re-check score to see improvement.`, 'success');
  };

  const handleDismissSentence = (chId, idx) => {
    setSentenceEdits(prev => {
      const chEdits = { ...(prev[chId] || {}) };
      delete chEdits[idx];
      return { ...prev, [chId]: chEdits };
    });
    setSelectedSentence(null);
    setShowManualEdit(null);
    setManualEditDraft('');
  };

  const handleSaveManualEdit = (chId, idx, text) => {
    if (!text.trim()) { notify('Cannot save empty text.', 'error'); return; }
    setSentenceEdits(prev => ({
      ...prev,
      [chId]: { ...(prev[chId] || {}), [idx]: text.trim() }
    }));
    setShowManualEdit(null);
    setManualEditDraft('');
    notify('Manual edit saved!', 'success');
  };

  const getEditedSentenceText = (chId, sentence, idx) => {
    return sentenceEdits[chId]?.[idx] !== undefined ? sentenceEdits[chId][idx] : sentence.text;
  };

  const hasUnsavedEdits = (chId) => {
    return sentenceEdits[chId] && Object.keys(sentenceEdits[chId]).length > 0;
  };

  const getNextLevel = (chId) => {
    const versions = chapterVersions[chId] || [];
    const levelsDone = versions.map(v => v.level);
    for (let l = 1; l <= 3; l++) {
      if (!levelsDone.includes(l)) return l;
    }
    return 3;
  };

  const getAppliedVersion = (chId) => {
    const versions = chapterVersions[chId] || [];
    return versions.find(v => v.applied) || null;
  };

  const handleResetConfirm = async () => {
    if (processingReset) return;
    setProcessingReset(true);
    const success = await processSmallPayment(projectId, resetPrice, { type: 'remove_ai_reset' }, () => {
      setRemoveAIResets(prev => prev + 1);
      setShowResetModal(false);
      notify('Remove AI refilled with 3 more uses!', 'success');
    });
    setProcessingReset(false);
  };

  const handleApplyChanges = async (chId) => {
    const ch = chapters.find(c => c.id === chId);
    if (!ch) return;
    const edits = sentenceEdits[chId];
    if (!edits || Object.keys(edits).length === 0) { notify('No pending edits for this chapter.', 'info'); return; }
    setProcessing(true);
    setProcessingChapter(chId);
    try {
      const { splitSentences } = await import('../../services/gemini/antiDetection');
      const fullText = getChapterFlatText(chId);
      if (!fullText.trim()) { notify('Chapter has no content.', 'warning'); setProcessing(false); setProcessingChapter(null); return; }
      const origSentences = splitSentences(fullText);
      if (origSentences.length === 0) { notify('Could not parse chapter sentences.', 'error'); setProcessing(false); setProcessingChapter(null); return; }
      const mergedSentences = origSentences.map((s, i) => (edits[i] !== undefined ? edits[i] : s));
      const mergedText = mergedSentences.join(' ');
      const subs = ch.subsections.filter(s => s.type !== 'references' && !s.deleted);
      let remainingText = mergedText;
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
      const existingVersions = await getSubsectionVersions(projectId) || {};
      const newVersions = { ...existingVersions };
      for (const sub of subs) {
        const key = `${chId}_${sub.id}`;
        const oldContent = rawContent[chId]?.[sub.id];
        if (oldContent) {
          const list = existingVersions[key] || [];
          if (list.length === 0 || list[list.length - 1].content !== oldContent) {
            newVersions[key] = [...list, { content: oldContent, label: 'Sentence Edits Applied', timestamp: Date.now() }];
          }
        }
      }
      await saveSubsectionVersions(projectId, newVersions);
      const merged = { ...rawContent, [chId]: updatedContent };
      await saveGeneratedContent(projectId, merged);
      if (onContentUpdated) onContentUpdated(chId, updatedContent);
      setSentenceEdits(prev => {
        const n = { ...prev };
        delete n[chId];
        return n;
      });
      notify('✅ Sentence edits applied and saved to project!', 'success');
    } catch (e) {
      console.error('Apply changes failed:', e);
      notify('Failed to apply changes. Try again.', 'error');
    }
    setProcessingChapter(null);
    setProcessing(false);
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
                const versions = chapterVersions[ch.id] || [];
                const versionCount = versions.length;
                const selectedIdx = selectedVersionIdx[ch.id] !== undefined ? selectedVersionIdx[ch.id] : (versionCount - 1);
                const selectedVersion = versionCount > 0 ? versions[Math.max(0, selectedIdx)] : null;
                const appliedVersion = getAppliedVersion(ch.id);
                const sentenceData = selectedVersion?.scoreBreakdown?.sentences || [];
                const flaggedCount = selectedVersion?.scoreBreakdown?.flaggedSentenceCount || 0;
                const totalSentences = selectedVersion?.scoreBreakdown?.totalSentences || 0;
                const breakdown = selectedVersion?.scoreBreakdown?.breakdown;
                const topIssues = selectedVersion?.scoreBreakdown?.topIssues || [];
                return (
                  <div key={ch.id} style={{
                    display: 'flex', flexDirection: 'column',
                    padding: '14px 16px', borderRadius: '8px',
                    backgroundColor: isSelected ? (isDarkMode ? '#2d6a4f30' : '#d1fae5') : (isDarkMode ? '#2d2d2d' : '#f9fafb'),
                    border: `1px solid ${isSelected ? '#059669' : appliedVersion ? '#7c3aed' : colors.border}`,
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
                            {versionCount > 0 && <span style={{ fontSize: '11px', color: '#7c3aed' }}>✨ {versionCount} version{versionCount > 1 ? 's' : ''}</span>}
                            {appliedVersion && <span style={{ fontSize: '11px', color: '#059669' }}>✓ Level {appliedVersion.level} Applied</span>}
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

                    {selectedVersion && selectedVersion.scoreBreakdown && (
                      <div style={{ marginTop: '12px', padding: '16px', backgroundColor: isDarkMode ? '#1f2937' : 'white', borderRadius: '8px', border: `1px solid ${colors.border}` }}>
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '120px', height: '120px' }}>
                            <svg width="120" height="120" style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
                              <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                              <circle cx="60" cy="60" r="50" fill="none" stroke={getScoreColor(selectedVersion.postScore || 0)} strokeWidth="10"
                                strokeDasharray={Math.PI * 100} strokeDashoffset={Math.PI * 100 * (1 - (selectedVersion.postScore || 0) / 100)}
                                strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease-in-out' }} />
                            </svg>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: '22px', fontWeight: '700', color: getScoreColor(selectedVersion.postScore || 0) }}>{Math.round(selectedVersion.postScore || 0)}<span style={{ fontSize: '11px', fontWeight: '400', color: '#9ca3af' }}>/100</span></div>
                              {selectedVersion.preScore !== null && <div style={{ fontSize: '9px', color: '#9ca3af' }}>Pre: {Math.round(selectedVersion.preScore)}</div>}
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
                      </div>
                    )}

                    {expandedChapter === ch.id && (
                      <div style={{ marginTop: '10px' }}>
                        {versionCount > 0 && selectedVersion ? (
                          <>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <button onClick={(e) => { e.stopPropagation(); const nv = Math.max(0, (selectedVersionIdx[ch.id] || 0) - 1); setSelectedVersionIdx(prev => ({ ...prev, [ch.id]: nv })); }}
                                  style={{ padding: '4px 10px', fontSize: '14px', borderRadius: '4px', backgroundColor: 'transparent', color: colors.primary, border: `1px solid ${colors.primary}`, cursor: 'pointer', opacity: selectedIdx > 0 ? 1 : 0.3 }}>
                                  ◄
                                </button>
                                <span style={{ fontSize: '13px', fontWeight: '600', color: colors.text, minWidth: '80px', textAlign: 'center' }}>Level {selectedVersion.level}/3</span>
                                <button onClick={(e) => { e.stopPropagation(); const nv = Math.min(versionCount - 1, (selectedVersionIdx[ch.id] || 0) + 1); setSelectedVersionIdx(prev => ({ ...prev, [ch.id]: nv })); }}
                                  style={{ padding: '4px 10px', fontSize: '14px', borderRadius: '4px', backgroundColor: 'transparent', color: colors.primary, border: `1px solid ${colors.primary}`, cursor: 'pointer', opacity: selectedIdx < versionCount - 1 ? 1 : 0.3 }}>
                                  ►
                                </button>
                              </div>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                {versions.map((v, vi) => (
                                  <div key={vi} onClick={(e) => { e.stopPropagation(); setSelectedVersionIdx(prev => ({ ...prev, [ch.id]: vi })); }}
                                    style={{ width: '10px', height: '10px', borderRadius: '50%', cursor: 'pointer', backgroundColor: vi === selectedIdx ? (v.applied ? '#059669' : '#7c3aed') : '#d1d5db', border: vi === selectedIdx ? '2px solid #374151' : 'none' }} />
                                ))}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                <span style={{ fontSize: '12px', color: colors.textSecondary }}>Score: <strong style={{ color: getScoreColor(selectedVersion.postScore || 0) }}>{selectedVersion.postScore !== null ? `${Math.round(selectedVersion.postScore)}/100` : 'Not checked'}</strong>{selectedVersion.preScore !== null ? ` (was ${Math.round(selectedVersion.preScore)})` : ''}</span>
                                <button onClick={(e) => { e.stopPropagation(); handleCheckScore(ch.id, selectedIdx); }}
                                  style={{ padding: '3px 8px', fontSize: '10px', borderRadius: '4px', backgroundColor: 'transparent', color: '#7c3aed', border: '1px solid #7c3aed', cursor: checkingScore[ch.id] ? 'not-allowed' : 'pointer' }}>
                                  {checkingScore[ch.id] ? '⏳' : '📊 Check Score'}
                                </button>
                              </div>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                {selectedVersion.applied ? (
                                  <>
                                    <span style={{ fontSize: '11px', color: '#059669', fontWeight: '600', padding: '4px 10px' }}>✓ Applied</span>
                                    <button onClick={(e) => { e.stopPropagation(); handleRevertVersion(ch.id); }}
                                      style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '4px', backgroundColor: 'transparent', color: '#dc2626', border: '1px solid #dc2626', cursor: 'pointer' }}>↩ Revert</button>
                                  </>
                                ) : (
                                  <button onClick={(e) => { e.stopPropagation(); handleApplyVersion(ch.id, selectedIdx); }}
                                    style={{ padding: '6px 16px', fontSize: '12px', fontWeight: '600', borderRadius: '6px', backgroundColor: '#059669', color: 'white', border: 'none', cursor: processing ? 'not-allowed' : 'pointer', opacity: processing ? 0.7 : 1 }}>
                                    {processing && processingChapter === ch.id ? '⏳ Applying...' : '✅ Apply This Version'}
                                  </button>
                                )}
                              </div>
                            </div>
                            {selectedVersion.scoreBreakdown && sentenceData.length > 0 && selectedVersion.applied ? (
                              <>
                                {flaggedCount > 0 && (
                                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '8px' }}>
                                    <button onClick={(e) => { e.stopPropagation(); handleFixAll(ch.id, sentenceData); }}
                                      style={{ padding: '6px 16px', fontSize: '12px', fontWeight: '600', borderRadius: '6px', backgroundColor: '#7c3aed', color: 'white', border: 'none', cursor: 'pointer' }}>
                                      🚀 Fix All ({flaggedCount} flagged)
                                    </button>
                                  </div>
                                )}
                                <div style={{ padding: '8px 12px', backgroundColor: isDarkMode ? '#1f2937' : 'white', borderRadius: '6px', maxHeight: '400px', overflowY: 'auto', fontSize: '13px', lineHeight: '1.7', color: colors.text }}>
                                  {sentenceData.map((s, i) => {
                                    const editedText = getEditedSentenceText(ch.id, s, i);
                                    const isEdited = sentenceEdits[ch.id]?.[i] !== undefined;
                                    const isSelected = selectedSentence?.chId === ch.id && selectedSentence?.idx === i;
                                    const isManual = showManualEdit?.chId === ch.id && showManualEdit?.idx === i;
                                    const hasSuggestions = s.suggestions && s.suggestions.length > 0;
                                    const isFlagged = s.aiProbability > 0.5;
                                    const leftColor = isEdited ? '#059669' : isFlagged ? (s.aiProbability > 0.8 ? '#dc2626' : '#f59e0b') : 'transparent';
                                    return (
                                      <div key={i} style={{ marginBottom: '6px' }}>
                                        <div onClick={() => isFlagged && setSelectedSentence(isSelected ? null : { chId: ch.id, idx: i })}
                                          style={{
                                            display: 'flex', gap: '8px', cursor: isFlagged ? 'pointer' : 'default',
                                            padding: '4px 6px', borderRadius: '4px',
                                            backgroundColor: isSelected ? (isDarkMode ? '#374151' : '#f3f4f6') : 'transparent',
                                            borderLeft: `3px solid ${leftColor}`,
                                            transition: 'background-color 0.15s',
                                          }}>
                                          <span style={{ flex: 1 }}>
                                            {isEdited ? <span style={{ color: '#059669' }}>{editedText}</span> : s.text}{' '}
                                          </span>
                                          {isFlagged && <span style={{ fontSize: '10px', color: '#9ca3af', flexShrink: 0, marginTop: '2px' }}>
                                            {Math.round(s.aiProbability * 100)}%
                                          </span>}
                                          {isEdited && <span style={{ fontSize: '10px', color: '#059669', flexShrink: 0, marginTop: '2px' }}>✓</span>}
                                        </div>
                                        {isSelected && (
                                          <div style={{ marginTop: '4px', marginLeft: '12px', padding: '8px 10px', backgroundColor: isDarkMode ? '#2d2d2d' : '#fefce8', borderRadius: '6px', border: '1px solid #fde68a' }}>
                                            <div style={{ fontSize: '10px', color: '#92400e', marginBottom: '6px' }}>
                                              💡 Flags: {s.flags.join(', ') || 'none'}
                                            </div>
                                            {isManual ? (
                                              <div>
                                                <textarea value={manualEditDraft}
                                                  onChange={(e) => setManualEditDraft(e.target.value)}
                                                  style={{ width: '100%', minHeight: '60px', padding: '6px', fontSize: '12px', border: '1px solid #d1d5db', borderRadius: '4px', resize: 'vertical', backgroundColor: isDarkMode ? '#1f2937' : 'white', color: colors.text }}
                                                />
                                                <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                                                  <button onClick={() => handleSaveManualEdit(ch.id, i, manualEditDraft)}
                                                    style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '4px', backgroundColor: '#059669', color: 'white', border: 'none', cursor: 'pointer', fontWeight: '500' }}>Save</button>
                                                  <button onClick={() => { setShowManualEdit(null); setManualEditDraft(''); }}
                                                    style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '4px', backgroundColor: 'transparent', color: '#6b7280', border: '1px solid #d1d5db', cursor: 'pointer' }}>Cancel</button>
                                                </div>
                                              </div>
                                            ) : (
                                              <>
                                                {hasSuggestions ? (
                                                  <div>
                                                    <div style={{ fontSize: '10px', color: '#92400e', marginBottom: '4px' }}>📝 Suggested fixes:</div>
                                                    {s.suggestions.map((sug, si) => {
                                                      const alreadyApplied = sentenceEdits[ch.id]?.[i] === sug;
                                                      return (
                                                        <div key={si} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', padding: '4px 6px', backgroundColor: alreadyApplied ? '#d1fae5' : (isDarkMode ? '#374151' : 'white'), borderRadius: '4px', border: '1px solid #e5e7eb' }}>
                                                          <span style={{ flex: 1, fontSize: '12px', color: colors.text }}>{sug}</span>
                                                          {alreadyApplied ? (
                                                            <span style={{ fontSize: '11px', color: '#059669', fontWeight: '500' }}>Applied ✓</span>
                                                          ) : (
                                                            <button onClick={() => handleApplySuggestion(ch.id, i, sug)}
                                                              style={{ padding: '2px 8px', fontSize: '10px', borderRadius: '3px', backgroundColor: '#7c3aed', color: 'white', border: 'none', cursor: 'pointer', fontWeight: '500', flexShrink: 0 }}>Apply</button>
                                                          )}
                                                        </div>
                                                      );
                                                    })}
                                                  </div>
                                                ) : (
                                                  <div style={{ fontSize: '11px', color: '#92400e', marginBottom: '6px' }}>No automatic suggestions available for this combination of flags.</div>
                                                )}
                                                <div style={{ display: 'flex', gap: '6px', marginTop: '6px', borderTop: '1px solid #e5e7eb', paddingTop: '6px' }}>
                                                  <button onClick={() => { setShowManualEdit({ chId: ch.id, idx: i }); setManualEditDraft(sentenceEdits[ch.id]?.[i] || s.text); }}
                                                    style={{ padding: '3px 8px', fontSize: '10px', borderRadius: '3px', backgroundColor: 'transparent', color: '#6b7280', border: '1px solid #d1d5db', cursor: 'pointer' }}>✏️ Edit manually</button>
                                                  <button onClick={() => handleDismissSentence(ch.id, i)}
                                                    style={{ padding: '3px 8px', fontSize: '10px', borderRadius: '3px', backgroundColor: 'transparent', color: '#9ca3af', border: '1px solid #d1d5db', cursor: 'pointer' }}>Dismiss</button>
                                                </div>
                                              </>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                                {hasUnsavedEdits(ch.id) && (
                                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginTop: '8px' }}>
                                    <button onClick={() => handleApplyChanges(ch.id)}
                                      style={{ padding: '6px 14px', fontSize: '11px', borderRadius: '6px', backgroundColor: '#059669', color: 'white', border: 'none', cursor: processingChapter === ch.id ? 'not-allowed' : 'pointer', fontWeight: '600', opacity: processingChapter === ch.id ? 0.7 : 1 }}>
                                      {processingChapter === ch.id ? '⏳ Applying...' : '✅ Apply Changes'}
                                    </button>
                                    <button onClick={() => { setSentenceEdits(prev => { const n = { ...prev }; delete n[ch.id]; return n; }); notify('Edits reverted.', 'info'); }}
                                      style={{ padding: '6px 14px', fontSize: '11px', borderRadius: '6px', backgroundColor: 'transparent', color: '#dc2626', border: '1px solid #dc2626', cursor: 'pointer', fontWeight: '500' }}>Revert All</button>
                                  </div>
                                )}
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
                                      const isFixed = sentenceEdits[ch.id]?.[i] !== undefined;
                                      const origProb = s.aiProbability;
                                      const effectiveProb = isFixed ? 0 : origProb;
                                      const h = Math.max(4, Math.round(effectiveProb * 14));
                                      const color = isFixed ? '#059669' : (origProb > 0.8 ? '#dc2626' : origProb > 0.5 ? '#f59e0b' : '#059669');
                                      return <div key={i} title={`${isFixed ? '[FIXED] ' : ''}"${s.text.slice(0, 60)}..."\nAI: ${Math.round(origProb * 100)}%`}
                                        style={{ flex: 1, height: `${h}px`, backgroundColor: color, borderRadius: '1px', minWidth: '2px', cursor: 'pointer', transition: 'height 0.2s' }} />;
                                    })}
                                  </div>
                                </div>
                              </>
                            ) : (
                              <div style={{ padding: '12px', backgroundColor: isDarkMode ? '#1f2937' : 'white', borderRadius: '6px', maxHeight: '300px', overflowY: 'auto', fontSize: '13px', lineHeight: '1.7', color: colors.text, whiteSpace: 'pre-wrap' }}>
                                {selectedVersion.text}
                              </div>
                            )}
                          </>
                        ) : (
                          <div style={{ padding: '12px', backgroundColor: isDarkMode ? '#1f2937' : 'white', borderRadius: '6px', maxHeight: '300px', overflowY: 'auto', fontSize: '13px', lineHeight: '1.7', color: colors.text, whiteSpace: 'pre-wrap' }}>
                            {getChapterContent(ch.id)}
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
                {processing ? 'Processing...' : `🚀 Remove AI (Level ${getNextLevel([...selectedChapters][0])}) (${selectedChapters.size} chapter${selectedChapters.size > 1 ? 's' : ''})`}
              </button>
            </div>
          )}

          {removeAILeft <= 0 && (
            <div style={{ textAlign: 'center', padding: '16px', backgroundColor: isDarkMode ? '#1f2937' : '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
              <p style={{ color: '#dc2626', fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>You've used all your Remove AI uses.</p>
              <button onClick={() => setShowResetModal(true)}
                style={{ padding: '10px 20px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '500', cursor: 'pointer', fontSize: '13px' }}>
                Reset Remove AI ({fmt(resetPrice)})
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
            <p style={{ textAlign: 'center', fontSize: '14px', color: colors.textSecondary, margin: '0 0 24px' }}>Get 3 more Remove AI uses.</p>
            <div style={{ backgroundColor: colors.background, borderRadius: '12px', padding: '20px', marginBottom: '24px', border: `1px solid ${colors.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ color: colors.textSecondary, fontSize: '14px' }}>Feature</span>
                <span style={{ color: colors.text, fontWeight: '600', fontSize: '14px' }}>Remove AI Reset</span>
              </div>
              <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: '12px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: colors.textSecondary, fontSize: '14px' }}>Amount</span>
                <span style={{ color: colors.text, fontWeight: '700', fontSize: '18px' }}>{fmt(resetPrice)}</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button onClick={handleResetConfirm} disabled={processingReset}
                style={{ backgroundColor: processingReset ? colors.border : '#2563eb', color: 'white', padding: '14px', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: processingReset ? 'not-allowed' : 'pointer', fontSize: '15px', opacity: processingReset ? 0.7 : 1 }}>
                {processingReset ? 'Processing...' : `Pay ${fmt(resetPrice)}`}
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
