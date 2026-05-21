import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { saveAs } from 'file-saver';
import { INSTRUMENT_TYPES } from '../utils/instrumentHelpers';
import { getProjects, getGeneratedContent, getChapters } from '../services/firestoreService';
import Toast from '../components/Toast';
import SourceLibrary from '../components/writing/SourceLibrary';
import useSourceLibrary from '../hooks/useSourceLibrary';
import { getChapterDisplayTitle } from '../utils/writeHelpers.jsx';
import { escapeHtml } from '../utils/htmlEscape';
import { generateChapterDocument } from '../utils/merge/chapterDownloadEngine.js';
import { computeThesisScores } from '../utils/aiScoreUtils.js';
import { useCurrency } from '../hooks/useCurrency';
import { PRICES_GHS } from '../constants/pricing';
import usePayment from '../hooks/usePayment';
import MockPaymentModal from '../components/MockPaymentModal';

const MyFiles = () => {
  const { colors, isDarkMode } = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { fmt } = useCurrency();
  const { processing: processingPayment, processSmallPayment, mockPaymentConfig, onMockPaymentSuccess, onMockPaymentClose } = usePayment(notify);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [expandedChapter, setExpandedChapter] = useState(null);

  const [activeTab, setActiveTab] = useState('chapters');
  const [abbreviations, setAbbreviations] = useState([]);
  const [defenceQuestions, setDefenceQuestions] = useState(null);
  const [loadingDefence, setLoadingDefence] = useState(false);
  const [projectData, setProjectData] = useState(null);
  const [loadingAbbr, setLoadingAbbr] = useState(false);
  const [preparingDownload, setPreparingDownload] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState('');
  const [generatedInstruments, setGeneratedInstruments] = useState([]);
  const [toast, setToast] = useState(null);
  const [defenceRegenUsed, setDefenceRegenUsed] = useState(0);
  const [showRegenResetModal, setShowRegenResetModal] = useState(false);
  const [processingRegenReset, setProcessingRegenReset] = useState(false);
  const [rawContent, setRawContent] = useState({});
  const sourceLibrary = useSourceLibrary(selectedProject, user?.uid);

  const isPremium = projectData?.tier === 'premium' || projectData?.isPremium;
  const baseDefenceRegenLimit = isPremium ? 2 : 1;
  const defenceRegenLeft = Math.max(0, baseDefenceRegenLimit - defenceRegenUsed);

  const notify = useCallback((message, type) => setToast({ message, type }), []);
  const { processing: processingPayment, processSmallPayment, mockPaymentConfig, onMockPaymentSuccess, onMockPaymentClose } = usePayment(notify);

  useEffect(() => { loadProjects(); }, []);
  useEffect(() => { if (selectedProject && activeTab === 'lists') loadAbbreviations(selectedProject); }, [selectedProject, activeTab]);
  useEffect(() => { if (selectedProject && activeTab === 'defence') loadDefenceQuestions(selectedProject); }, [selectedProject, activeTab]);
  useEffect(() => { if (selectedProject && activeTab === 'instruments') loadGeneratedInstruments(selectedProject); }, [selectedProject, activeTab]);
  useEffect(() => {
    if (selectedProject) {
      try {
        const ru = localStorage.getItem(`defenceRegenUsed_${selectedProject}`);
        setDefenceRegenUsed(ru ? JSON.parse(ru) : 0);
      } catch { setDefenceRegenUsed(0); }
    }
  }, [selectedProject]);
  useEffect(() => { try { localStorage.setItem(`defenceRegenUsed_${selectedProject}`, JSON.stringify(defenceRegenUsed)); } catch {} }, [defenceRegenUsed, selectedProject]);
  useEffect(() => { return () => { if (regenResetTimeoutRef.current) clearTimeout(regenResetTimeoutRef.current); }; }, []);

   const loadProjects = async () => {
    try {
      const projectsList = await getProjects();
      setProjects(projectsList);
      if (projectsList.length > 0) {
        setSelectedProject(projectsList[0].id);
        setProjectData(projectsList[0]);
        loadChaptersForProject(projectsList[0].id);
      }
    } catch (e) { console.error('Error loading projects:', e); }
  };

  const hasGeneratedContent = (ch) => { if (!ch) return false; const keys = Object.keys(ch); return keys.length > 0 && keys.some(k => !['references', 'complete', 'fullChapter'].includes(k)); };
  const estimateWordCount = (ch) => { if (!ch || typeof ch !== 'object') return 0; let total = 0; Object.entries(ch).forEach(([k, v]) => { if (!['references', 'complete', 'fullChapter'].includes(k) && typeof v === 'string') total += v.split(/\s+/).filter(Boolean).length; }); return total; };

    const loadChaptersForProject = async (projectId) => {
    try {
      const content = await getGeneratedContent(projectId) || {};
      setRawContent(content);
      const savedChapters = await getChapters(projectId) || [];
      const refs = {}; // References are now in citationService
      const mkChapter = (ch) => ({
        id: ch.id,
        title: getChapterDisplayTitle(ch),
        fileName: `${ch.id}.doc`, lastEdited: new Date().toLocaleDateString(),
        wordCount: estimateWordCount(content[ch.id]),
        content: content[ch.id]?.complete || '',
        subsections: (ch.subsections || []).filter(s => s.type !== 'references' && !s.deleted && content[ch.id]?.[s.id]).map(s => s.title),
        references: refs[ch.id]?.citations || [],
        hasReferences: content[ch.id]?.references ? true : false,
        generated: hasGeneratedContent(content[ch.id]),
        completed: ch.completed || false
      });
      setChapters(savedChapters.map(mkChapter));
    } catch (e) { console.error('Error loading chapters for project:', e); }
  };

  const generateCleanFilename = (chapter) => {
    const cleanTitle = (projectData?.title || 'thesis').replace(/[^a-z0-9]/gi, '_').substring(0, 30);
    const date = new Date().toISOString().split('T')[0];
    const prefix = chapter.id === 'proposal' ? 'Proposal' : chapter.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
    return `${prefix}-${cleanTitle}_${date}.docx`;
  };

  const downloadChapter = async (chapter) => {
    setPreparingDownload(true); setDownloadProgress('Preparing document...');
    try {
      const chapterContent = rawContent?.[chapter.id] || {};
      const chapterIndex = chapters.findIndex(ch => ch.id === chapter.id) + 1;
      const blob = await generateChapterDocument({
        chapter,
        content: chapterContent,
        formatConfig: null,
        chapterIndex,
      });
      saveAs(blob, generateCleanFilename(chapter));
    } catch (e) {
      console.error('Error preparing download:', e);
      notify('Error preparing download.', 'error');
    } finally { setPreparingDownload(false); setDownloadProgress(''); }
  };

  const generateAbbreviationsDocument = () => `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>List of Abbreviations</title><style>body{font-family:'Times New Roman',Times,serif;margin:2.54cm;font-size:12pt}h1{font-size:18pt;font-weight:bold;text-align:center}table{border-collapse:collapse;width:100%}th,td{border:1px solid #000;padding:10px}th{background:#f2f2f2}</style></head><body><h1>List of Abbreviations</h1>${abbreviations.length > 0 ? `<table><thead><tr><th>Abbreviation</th><th>Meaning</th></tr></thead><tbody>${abbreviations.map(a => `<tr><td>${escapeHtml(a.abbr)}</td><td>${escapeHtml(a.meaning)}</td></tr>`).join('')}</tbody></table>` : '<p>None found.</p>'}</body></html>`;
  const generateDefenceDocument = () => { if (!defenceQuestions) return ''; return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Defence Prep</title><style>body{font-family:'Times New Roman',Times,serif;margin:2.54cm;font-size:12pt}h1{font-size:18pt;font-weight:bold;text-align:center}h2{font-size:16pt;font-weight:bold;color:#2c3e50}.qa-item{margin-bottom:25px;padding:15px;background:#f9f9f9;border-left:3px solid #3498db}.question{font-weight:bold}</style></head><body><h1>Defence Preparation Guide</h1><p><strong>${escapeHtml(projectData?.title)}</strong></p>${Object.entries(defenceQuestions).map(([s, qs]) => { if (!qs || qs.length === 0) return ''; return `<h2>${escapeHtml(formatSectionName(s))}</h2>${qs.map((q, i) => `<div class="qa-item"><div class="question">Q${i+1}: ${escapeHtml(q.question)}</div><div>${escapeHtml(q.answer)}</div></div>`).join('')}`; }).join('')}</body></html>`; };
  const formatSectionName = (s) => {
    const ch = chapters.find(c => c.id === s);
    return ch ? getChapterDisplayTitle(ch) : ({ final: 'Final', proposal: 'Proposal' })[s] || s;
  };

  const loadAbbreviations = async (pid) => {
    setLoadingAbbr(true);
    try {
      const sa = localStorage.getItem(`abbreviations_${pid}`); if (sa) { setAbbreviations(JSON.parse(sa)); setLoadingAbbr(false); return; }
      const content = await getGeneratedContent(pid);
      if (!content || Object.keys(content).length === 0) { setAbbreviations([]); setLoadingAbbr(false); return; }
      let at = '';
      Object.values(content).forEach(ch => { if (ch) Object.values(ch).forEach(t => { if (typeof t === 'string') at += t + ' '; }); });
      if (at.length > 0) { const { extractAbbreviations } = await import('../services/geminiService'); const ex = await extractAbbreviations(at, projectData?.title); setAbbreviations(ex || []); localStorage.setItem(`abbreviations_${pid}`, JSON.stringify(ex || [])); }
      else setAbbreviations([]);
    } catch (e) { setAbbreviations([]); } finally { setLoadingAbbr(false); }
  };

  const loadDefenceQuestions = async (pid, forceRefresh = false) => {
    const simpleKey = `defence_${pid}`;
    if (!forceRefresh) {
      const cached = localStorage.getItem(simpleKey);
      if (cached) { setDefenceQuestions(JSON.parse(cached)); return; }
    }
    setLoadingDefence(true);
    try {
      const content = await getGeneratedContent(pid);
      const c = content || {};
      const cc = {};
      Object.entries(c).forEach(([chId, subsections]) => {
        if (!subsections || Object.keys(subsections).length === 0) return;
        const ch = chapters.find(x => x.id === chId);
        const title = ch ? getChapterDisplayTitle(ch) : chId;
        let text = '';
        Object.values(subsections).forEach(v => {
          if (typeof v === 'string') text += v + '\n';
        });
        if (text.trim()) cc[chId] = { title, content: text.slice(0, 5000) };
      });
      if (Object.keys(cc).length === 0) { setDefenceQuestions(null); setLoadingDefence(false); return; }
      const { generateDefenceQuestions } = await import('../services/geminiService');
      const qs = await generateDefenceQuestions({ title: projects.find(p => p.id === pid)?.title, researchTopic: projects.find(p => p.id === pid)?.topic, field: projects.find(p => p.id === pid)?.field, level: projects.find(p => p.id === pid)?.level, chapters: cc });
      if (qs) { setDefenceQuestions(qs); localStorage.setItem(simpleKey, JSON.stringify(qs)); }
    } catch (e) { console.error('Failed to load defence questions:', e); notify('Failed to load defence questions.', 'error'); } finally { setLoadingDefence(false); }
  };

  const handleProjectChange = (pid) => { const p = projects.find(pr => pr.id === pid); setSelectedProject(pid); setProjectData(p); loadChaptersForProject(pid); setActiveTab('chapters'); setAbbreviations([]); setDefenceQuestions(null); setGeneratedInstruments([]); };
  const downloadAbbreviations = () => saveAs(new Blob([generateAbbreviationsDocument()], { type: 'application/msword' }), `abbreviations-${(projectData?.title || 'thesis').replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.doc`);
  const downloadDefence = () => { if (!defenceQuestions) return; saveAs(new Blob([generateDefenceDocument()], { type: 'application/msword' }), `defence-${(projectData?.title || 'thesis').replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.doc`); };
  const handleDefenceRegen = async () => {
    if (loadingDefence) return;
    if (defenceRegenLeft > 0) {
      setDefenceRegenUsed(prev => prev + 1);
      await loadDefenceQuestions(selectedProject, true);
    } else {
      setShowRegenResetModal(true);
    }
  };
  const handleRegenResetConfirm = async () => {
    if (processingRegenReset) return;
    setProcessingRegenReset(true);
    const success = await processSmallPayment(selectedProject, PRICES_GHS.defenceRegen, { type: 'defence_regen_reset' }, () => {
      setDefenceRegenUsed(0);
      try { localStorage.removeItem(`defenceRegenUsed_${selectedProject}`); } catch {}
      setShowRegenResetModal(false);
    });
    if (!success) {
      setProcessingRegenReset(false);
    }
  };
  const getGeneratedChaptersCount = () => chapters.filter(ch => ch.generated).length;

  const thesisScores = useMemo(() => computeThesisScores(rawContent), [rawContent]);

  const loadGeneratedInstruments = (pid) => {
    const stored = localStorage.getItem(`instruments_${pid}`);
    if (stored) {
      try {
        setGeneratedInstruments(JSON.parse(stored));
      } catch {
        setGeneratedInstruments([]);
      }
    } else {
      setGeneratedInstruments([]);
    }
  };

  const downloadInstrument = (instrumentId) => {
    const stored = localStorage.getItem(`instrument_content_${selectedProject}_${instrumentId}`);
    if (!stored) { notify('Instrument content not found. Please regenerate it in your project.', 'error'); return; }
    const content = JSON.parse(stored);
    const type = INSTRUMENT_TYPES[instrumentId];
    if (!type) return;

    let bodyContent = `<h1>${type.icon} ${escapeHtml(type.label)}</h1>
    <div class="info"><p><strong>Project:</strong> ${escapeHtml(projectData?.title || 'Thesis')}</p><p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p></div><hr />`;

    if (content.sections) {
      content.sections.forEach(section => {
        bodyContent += `<div class="section"><h2>${escapeHtml(section.sectionName || section.title)}</h2>`;
        if (section.questions) {
          section.questions.forEach((q, qi) => {
            bodyContent += `<div class="question"><div class="question-text">${qi + 1}. ${escapeHtml(q.text)}</div>`;
            if (q.options) { q.options.forEach(opt => { bodyContent += `<div class="option">☐ ${escapeHtml(opt)}</div>`; }); }
            if (q.type === 'open-ended') { bodyContent += `<div class="open-ended-space"><div class="line"></div><div class="line"></div></div>`; }
            bodyContent += `</div>`;
          });
        }
        if (section.items) {
          section.items.forEach((item, ii) => {
            if (item.type === 'script') bodyContent += `<p class="script">"${escapeHtml(item.content)}"</p>`;
            else if (item.type === 'question') { bodyContent += `<div class="question"><div class="question-text">${ii + 1}. ${escapeHtml(item.text)}</div>`; if (item.probes) item.probes.forEach(p => { bodyContent += `<p class="probe">→ ${escapeHtml(p)}</p>`; }); bodyContent += `</div>`; }
            else if (item.type === 'note') bodyContent += `<p class="note">📝 ${escapeHtml(item.content)}</p>`;
            else if (item.type === 'activity') bodyContent += `<div class="question"><div class="question-text">Activity: ${escapeHtml(item.name)}</div><p>${escapeHtml(item.instructions || '')}</p></div>`;
          });
        }
        if (section.fields || section.indicators) {
          bodyContent += `<table class="obs-table"><tr><th>#</th><th>Indicator / Field</th><th>Type</th></tr>`;
          let count = 0;
          (section.fields || []).forEach(f => { count++; bodyContent += `<tr><td>${count}</td><td>${escapeHtml(f.label)}</td><td>${escapeHtml(f.type)}</td></tr>`; });
          (section.indicators || []).forEach(ind => { count++; bodyContent += `<tr><td>${count}</td><td>${escapeHtml(ind.label)}</td><td>${escapeHtml(ind.type)}</td></tr>`; });
          bodyContent += `</table>`;
        }
        if (section.codes) {
          bodyContent += `<table class="obs-table"><tr><th>Code</th><th>Label</th><th>Description</th></tr>`;
          section.codes.forEach(c => { bodyContent += `<tr><td>${escapeHtml(c.code)}</td><td>${escapeHtml(c.label)}</td><td>${escapeHtml(c.description || '')}</td></tr>`; });
          bodyContent += `</table>`;
        }
        if (section.criteria) {
          section.criteria.forEach((c, ci) => { bodyContent += `<div class="question"><div class="question-text">${ci + 1}. ${escapeHtml(c.criterion)}</div><p>${escapeHtml(c.description || '')}</p></div>`; });
        }
        if (section.sources) {
          bodyContent += `<table class="obs-table"><tr><th>Source</th><th>Type</th><th>Details</th></tr>`;
          section.sources.forEach(s => { bodyContent += `<tr><td>${escapeHtml(s.source)}</td><td>${escapeHtml(s.type)}</td><td>${escapeHtml(s.participants || s.duration || s.sessions || '')}</td></tr>`; });
          bodyContent += `</table>`;
        }
        if (section.description) bodyContent += `<p>${escapeHtml(section.description)}</p>`;
        if (section.methods) bodyContent += `<p><strong>Methods:</strong> ${escapeHtml(section.methods.join(', '))}</p>`;
        bodyContent += `</div>`;
      });
    }

    bodyContent += `<hr /><div class="footer"><p><em>Generated by PAGYS Thesis Assistant</em></p></div>`;

    const wordHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${type.label} - ${projectData?.title}</title>
    <style>body{font-family:'Times New Roman',Times,serif;margin:2.5cm;line-height:1.6}h1{font-size:24pt;font-weight:bold;text-align:center}h2{font-size:16pt;font-weight:bold;border-bottom:1px solid #ccc;padding-bottom:6px}.info{text-align:center;margin-bottom:20px}.section{margin-bottom:24px}.question{margin-bottom:16px;padding-left:12px}.question-text{font-weight:bold}.option{margin:4px 0}.script{font-style:italic;color:#555;padding:8px 12px;background:#f9f9f9;border-left:3px solid #059669}.note{font-style:italic;color:#f59e0b;padding:8px 12px;background:#fffbeb;border-left:3px solid #f59e0b}.probe{font-style:italic;color:#6b7280;margin-left:20px}.open-ended-space{margin:10px 0}.line{border-bottom:1px solid #999;width:100%;height:25px;margin:8px 0}table.obs-table{width:100%;border-collapse:collapse}table.obs-table th,table.obs-table td{border:1px solid #ddd;padding:8px}table.obs-table th{background:#f3f4f6}.footer{text-align:center;margin-top:30px;color:#666;font-size:10pt}</style></head><body>${bodyContent}</body></html>`;

    const blob = new Blob([wordHtml], { type: 'application/msword' });
    saveAs(blob, `${type.label.replace(/[^a-zA-Z]/g, '-')}-${(projectData?.title || 'thesis').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.doc`);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.background, padding: '32px' }}>
      {(preparingDownload) && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ backgroundColor: colors.surface, borderRadius: '16px', padding: '40px', textAlign: 'center', minWidth: '300px' }}>
            <div style={{ width: '50px', height: '50px', border: `4px solid ${colors.primary}`, borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 20px', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ color: colors.text, fontWeight: '600', fontSize: '16px' }}>{downloadProgress || 'Preparing...'}</p>
          </div>
        </div>
      )}
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div><h1 style={{ fontSize: '32px', fontWeight: 'bold', color: colors.text }}>My Files</h1><p style={{ color: colors.textSecondary }}>View and download your thesis</p></div>
          <button onClick={() => navigate(`/write/${selectedProject}`)} style={{ backgroundColor: colors.primary, color: 'white', padding: '10px 20px', border: 'none', borderRadius: '8px', fontWeight: '500', cursor: 'pointer' }}>← Back</button>
        </div>
        {projects.length > 0 && (
          <div style={{ backgroundColor: colors.surface, borderRadius: '12px', padding: '20px', marginBottom: '24px', border: `1px solid ${colors.border}` }}>
            <label htmlFor="myfilesProject" style={{ fontWeight: '500', color: colors.text }}>Select Project:</label>
            <select id="myfilesProject" value={selectedProject} onChange={(e) => handleProjectChange(e.target.value)} style={{ width: '100%', maxWidth: '400px', padding: '10px', border: `1px solid ${colors.inputBorder}`, borderRadius: '6px', marginLeft: '12px', backgroundColor: colors.input, color: colors.text }}>
              {projects.map(p => <option key={p.id} value={p.id}>{p.title} ({p.level})</option>)}
            </select>
          </div>
        )}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px', backgroundColor: colors.cardBg || colors.surface, borderRadius: '10px', padding: '16px 20px', border: `1px solid ${colors.border}` }}>
            <div style={{ fontSize: '12px', color: colors.textSecondary, fontWeight: '500', marginBottom: '4px' }}>Total Words</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: colors.text }}>{chapters.reduce((sum, ch) => sum + ch.wordCount, 0).toLocaleString()}</div>
          </div>
          <div style={{ flex: 1, minWidth: '200px', backgroundColor: colors.cardBg || colors.surface, borderRadius: '10px', padding: '16px 20px', border: `1px solid ${colors.border}` }}>
            <div style={{ fontSize: '12px', color: colors.textSecondary, fontWeight: '500', marginBottom: '4px' }}>Completion</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: colors.text }}>{chapters.length > 0 ? Math.round((chapters.filter(ch => ch.generated).length / chapters.length) * 100) : 0}%</div>
            <div style={{ width: '100%', height: '6px', backgroundColor: isDarkMode ? '#3d3d3d' : '#e5e7eb', borderRadius: '999px', marginTop: '6px', overflow: 'hidden' }}>
              <div style={{ width: `${chapters.length > 0 ? (chapters.filter(ch => ch.generated).length / chapters.length) * 100 : 0}%`, height: '100%', backgroundColor: '#4F46E5', borderRadius: '999px', transition: 'width 0.3s' }} />
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: `1px solid ${colors.border}`, paddingBottom: '4px' }}>
          {['chapters','lists','defence','instruments','sources','aiscore'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '12px 24px', backgroundColor: activeTab === tab ? colors.primary : 'transparent', color: activeTab === tab ? 'white' : colors.text, border: 'none', borderRadius: '8px 8px 0 0', cursor: 'pointer', fontWeight: '500' }}>
              {tab === 'chapters' ? `📄 Chapters (${getGeneratedChaptersCount()})` : tab === 'lists' ? `📋 Lists (${abbreviations.length})` : tab === 'defence' ? '🎯 Defence' : tab === 'instruments' ? `📦 Instruments (${generatedInstruments.length})` : tab === 'sources' ? '📚 Sources' : '🤖 AI Score'}
            </button>
          ))}
        </div>
        {(activeTab === 'chapters' && getGeneratedChaptersCount() > 0) && (
          <div style={{ marginBottom: '24px' }}>
            <button onClick={() => navigate(`/merge/${selectedProject}`)} style={{ backgroundColor: '#7c3aed', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>📑 Merge Thesis Document</button>
          </div>
        )}
        {activeTab === 'chapters' && (
          <div style={{ backgroundColor: colors.surface, borderRadius: '12px', padding: '24px', border: `1px solid ${colors.border}` }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px', color: colors.text }}>Thesis Chapters</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {chapters.map(ch => (
                  <div key={ch.id} style={{ border: `1px solid ${colors.border}`, borderRadius: '8px', opacity: ch.generated ? 1 : 0.6 }}>
                  <div onClick={() => setExpandedChapter(expandedChapter === ch.id ? null : ch.id)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: isDarkMode ? '#3d3d3d' : '#f9fafb', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                      <span>{expandedChapter === ch.id ? '▼' : '▶'}</span>
                      <div>
                        <h3 style={{ fontWeight: '600', color: colors.text }}>{ch.title}</h3>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                          {ch.id === 'proposal' && <span style={{ fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '999px', backgroundColor: isDarkMode ? '#5b21b6' : '#ede9fe', color: isDarkMode ? '#ddd6fe' : '#6d28d9' }}>Proposal</span>}
                          {!ch.generated && <span style={{ fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '999px', backgroundColor: isDarkMode ? '#92400e' : '#fef3c7', color: isDarkMode ? '#fde68a' : '#b45309' }}>Not generated</span>}
                          {ch.generated && !ch.completed && <span style={{ fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '999px', backgroundColor: isDarkMode ? '#92400e' : '#fef3c7', color: isDarkMode ? '#fde68a' : '#b45309' }}>In progress</span>}
                          {ch.completed && <span style={{ fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '999px', backgroundColor: isDarkMode ? '#064e3b' : '#d1fae5', color: isDarkMode ? '#a7f3d0' : '#047857' }}>✓ Completed</span>}
                          <span style={{ fontSize: '11px', color: colors.textSecondary }}>📝 {ch.wordCount} words</span>
                          {ch.subsections.length > 0 && <span>📄 {ch.subsections.length} subsections</span>}
                          {ch.hasReferences && <span style={{ color: '#059669' }}>📚 References</span>}
                        </div>
                      </div>
                    </div>
                    {ch.completed && <button onClick={(e) => { e.stopPropagation(); downloadChapter(ch); }} disabled={preparingDownload} style={{ backgroundColor: colors.primary, color: 'white', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>📄 Download</button>}
                  </div>
                  {expandedChapter === ch.id && (
                    <div style={{ padding: '16px', backgroundColor: colors.background }}>
                      {ch.subsections.length > 0 && <div><h4 style={{ fontWeight: '600', color: colors.text }}>Subsections:</h4>{ch.subsections.map((s, i) => <div key={i} style={{ color: colors.textSecondary }}>• {s}</div>)}</div>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {activeTab === 'lists' && (
          <div style={{ backgroundColor: colors.surface, borderRadius: '12px', padding: '24px', border: `1px solid ${colors.border}` }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: colors.text, marginBottom: '16px' }}>List of Abbreviations</h2>
            {loadingAbbr ? <p style={{ color: colors.textSecondary }}>Loading abbreviations...</p> : abbreviations.length > 0 ? (
              <div>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                  <thead>
                    <tr style={{ backgroundColor: isDarkMode ? '#3d3d3d' : '#f3f4f6' }}>
                      <th style={{ border: `1px solid ${colors.border}`, padding: '10px 12px', textAlign: 'left', fontWeight: '600', color: colors.text, fontSize: '13px' }}>Abbreviation</th>
                      <th style={{ border: `1px solid ${colors.border}`, padding: '10px 12px', textAlign: 'left', fontWeight: '600', color: colors.text, fontSize: '13px' }}>Meaning</th>
                    </tr>
                  </thead>
                  <tbody>
                    {abbreviations.map((a, i) => (
                      <tr key={i} style={{ backgroundColor: i % 2 === 0 ? 'transparent' : (isDarkMode ? '#2d2d2d' : '#f9fafb') }}>
                        <td style={{ border: `1px solid ${colors.border}`, padding: '8px 12px', fontSize: '13px', fontWeight: '600', color: colors.text }}>{a.abbr}</td>
                        <td style={{ border: `1px solid ${colors.border}`, padding: '8px 12px', fontSize: '13px', color: colors.text }}>{a.meaning}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button onClick={downloadAbbreviations} style={{ backgroundColor: '#7c3aed', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>📋 Download Abbreviations</button>
              </div>
            ) : <p style={{ color: colors.textSecondary }}>No abbreviations found. Generate thesis content first.</p>}
          </div>
        )}
        {activeTab === 'defence' && (
          <div style={{ backgroundColor: colors.surface, borderRadius: '12px', padding: '24px', border: `1px solid ${colors.border}` }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: colors.text, marginBottom: '16px' }}>Defence Preparation</h2>
            {loadingDefence ? <p style={{ color: colors.textSecondary }}>Reading your chapters and generating defence questions...</p> : defenceQuestions ? (
              <div>
                {Object.entries(defenceQuestions).map(([section, questions]) => {
                  if (!questions || questions.length === 0) return null;
                  return (
                    <div key={section} style={{ marginBottom: '24px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '600', color: colors.primary, marginBottom: '12px', paddingBottom: '4px', borderBottom: `2px solid ${colors.primary}30` }}>{formatSectionName(section)}</h3>
                      {questions.map((q, i) => (
                        <div key={i} style={{ marginBottom: '16px', padding: '12px 16px', backgroundColor: isDarkMode ? '#2d2d2d' : '#f9fafb', borderRadius: '8px', borderLeft: `3px solid ${colors.primary}` }}>
                          <p style={{ fontWeight: '600', color: colors.text, marginBottom: '4px', fontSize: '14px' }}>Q{i + 1}: {q.question}</p>
                          <p style={{ color: colors.textSecondary, fontSize: '13px', lineHeight: '1.5' }}>{q.answer}</p>
                        </div>
                      ))}
                    </div>
                  );
                })}
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px', flexWrap: 'wrap' }}>
                  <button onClick={downloadDefence} style={{ backgroundColor: '#d97706', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>🎯 Download Defence Questions</button>
                  <button onClick={handleDefenceRegen} disabled={loadingDefence} style={{ backgroundColor: 'transparent', color: defenceRegenLeft > 0 ? colors.primary : '#dc2626', padding: '10px 20px', border: `1px solid ${defenceRegenLeft > 0 ? colors.primary : '#dc2626'}`, borderRadius: '8px', cursor: loadingDefence ? 'not-allowed' : 'pointer', fontWeight: '500', fontSize: '13px' }}>
                    {defenceRegenLeft > 0 ? `🔄 Regenerate (${defenceRegenLeft} left)` : `🔄 Reset Regenerate (${fmt(PRICES_USD.defenceRegen)})`}
                  </button>
                </div>
              </div>
            ) : <p style={{ color: colors.textSecondary }}>Complete thesis chapters to generate defence preparation questions.</p>}
          </div>
        )}
        {activeTab === 'aiscore' && (
          <div style={{ backgroundColor: colors.surface, borderRadius: '12px', padding: '24px', border: `1px solid ${colors.border}` }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: colors.text, marginBottom: '16px' }}>🤖 Thesis AI Score</h2>
            {!thesisScores ? (
              <p style={{ color: colors.textSecondary, textAlign: 'center', padding: '40px' }}>No content generated yet. Write your thesis chapters first.</p>
            ) : (
              <div>
                <div style={{ textAlign: 'center', padding: '32px', marginBottom: '24px', backgroundColor: isDarkMode ? '#1f2937' : '#f9fafb', borderRadius: '12px', border: `1px solid ${colors.border}` }}>
                  <div style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '8px' }}>Overall Thesis Score</div>
                  <div style={{ fontSize: '56px', fontWeight: '800', color: thesisScores.overall.verdict === 'pass' ? '#059669' : thesisScores.overall.verdict === 'borderline' ? '#f59e0b' : '#dc2626' }}>
                    {thesisScores.overall.score}/100
                  </div>
                  <div style={{ fontSize: '15px', color: thesisScores.overall.verdict === 'pass' ? '#059669' : thesisScores.overall.verdict === 'borderline' ? '#f59e0b' : '#dc2626', marginTop: '8px', fontWeight: '500' }}>
                    {thesisScores.overall.verdictLabel}
                  </div>
                  <div style={{ fontSize: '13px', color: colors.textSecondary, marginTop: '8px' }}>
                    {thesisScores.totalWords.toLocaleString()} words across {Object.keys(thesisScores.chapters).length} chapters
                  </div>
                </div>
                <div style={{ display: 'grid', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: isDarkMode ? '#2d2d2d' : '#f9fafb', borderRadius: '8px', border: `1px solid ${colors.border}` }}>
                    <span style={{ color: colors.text, fontWeight: '500', fontSize: '14px' }}>Burstiness (sentence variety)</span>
                    <span style={{ fontWeight: '700', fontSize: '14px', color: thesisScores.overall.burstiness.cv >= 0.4 ? '#059669' : '#f59e0b' }}>{(thesisScores.overall.burstiness.cv * 100).toFixed(0)}%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: isDarkMode ? '#2d2d2d' : '#f9fafb', borderRadius: '8px', border: `1px solid ${colors.border}` }}>
                    <span style={{ color: colors.text, fontWeight: '500', fontSize: '14px' }}>Banned phrases detected</span>
                    <span style={{ fontWeight: '700', fontSize: '14px', color: thesisScores.overall.banned.count > 0 ? '#dc2626' : '#059669' }}>{thesisScores.overall.banned.count}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: isDarkMode ? '#2d2d2d' : '#f9fafb', borderRadius: '8px', border: `1px solid ${colors.border}` }}>
                    <span style={{ color: colors.text, fontWeight: '500', fontSize: '14px' }}>Transition word frequency</span>
                    <span style={{ fontWeight: '700', fontSize: '14px', color: thesisScores.overall.transitions.frequency <= 1.5 ? '#059669' : '#f59e0b' }}>{thesisScores.overall.transitions.frequency.toFixed(1)}/sentence</span>
                  </div>
                </div>
                {Object.keys(thesisScores.chapters).length > 1 && (
                  <div style={{ marginTop: '24px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: colors.text, marginBottom: '12px' }}>Score by Chapter</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {Object.entries(thesisScores.chapters).map(([chId, data]) => {
                        const ch = chapters.find(c => c.id === chId);
                        const displayTitle = ch ? getChapterDisplayTitle(ch) : chId;
                        const sc = data.scores;
                        return (
                          <div key={chId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: isDarkMode ? '#2d2d2d' : '#f9fafb', borderRadius: '8px', border: `1px solid ${colors.border}` }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: '600', color: colors.text, fontSize: '14px', marginBottom: '4px' }}>{displayTitle}</div>
                              <div style={{ fontSize: '12px', color: colors.textSecondary }}>{data.wordCount.toLocaleString()} words</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontWeight: '700', fontSize: '20px', color: sc.verdict === 'pass' ? '#059669' : sc.verdict === 'borderline' ? '#f59e0b' : '#dc2626' }}>{sc.score}</div>
                              <div style={{ fontSize: '11px', color: colors.textSecondary }}>/100</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {thesisScores.overall.banned.count > 0 && (
                  <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#dc2626', marginBottom: '8px' }}>⚠️ Banned Phrases Found in Thesis</div>
                    {thesisScores.overall.banned.items.map((b, i) => (
                      <div key={i} style={{ fontSize: '12px', color: '#991b1b', padding: '4px 0', borderBottom: i < thesisScores.overall.banned.items.length - 1 ? '1px solid #fecaca' : 'none' }}>
                        "{b.phrase}" — <span style={{ fontStyle: 'italic' }}>...{b.line.length > 100 ? b.line.slice(0, 100) + '...' : b.line}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {activeTab === 'sources' && selectedProject && (
          <SourceLibrary
            sources={sourceLibrary.sources}
            extracting={sourceLibrary.extracting}
            loading={false}
            matrix={sourceLibrary.matrix}
            generatingMatrix={sourceLibrary.generatingMatrix}
            pendingMatrixRegen={sourceLibrary.pendingMatrixRegen}
            processingMatrixPayment={sourceLibrary.processingMatrixPayment}
            onAddFile={async (e) => {
              const files = e.target.files;
              for (let i = 0; i < files.length; i++) {
                const result = await sourceLibrary.addSource(files[i]);
                if (result?.error) notify(result.message, 'warning');
              }
              e.target.value = '';
            }}
            onRemoveSource={sourceLibrary.removeSource}
            onImportBibtex={async (e) => {
              const files = e.target.files;
              if (!files?.length) return;
              try {
                const text = await files[0].text();
                const { parseBibTeX } = await import('../utils/bibtexParser.js');
                const entries = parseBibTeX(text);
                if (entries.length > 0) {
                  sourceLibrary.addSources(entries);
                  notify(`Imported ${entries.length} references from BibTeX.`, 'success');
                } else {
                  notify('No references found in the BibTeX file.', 'error');
                }
              } catch (err) {
                notify('Failed to parse BibTeX file.', 'error');
              }
              e.target.value = '';
            }}
            onGenerateMatrix={() => sourceLibrary.generateMatrix(projectData)}
            onMatrixPaymentConfirm={() => sourceLibrary.handleMatrixPaymentConfirm(projectData)}
            onMatrixPaymentCancel={sourceLibrary.handleMatrixPaymentCancel}
            onClearSources={sourceLibrary.clearSources}
          />
        )}
        {activeTab === 'instruments' && (
          <div style={{ backgroundColor: colors.surface, borderRadius: '12px', padding: '24px', border: `1px solid ${colors.border}` }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: colors.text, marginBottom: '16px' }}>Data Collection Instruments</h2>
            {generatedInstruments.length > 0 ? (
              <div style={{ display: 'grid', gap: '12px' }}>
                {generatedInstruments.map(id => {
                  const type = INSTRUMENT_TYPES[id];
                  if (!type) return null;
                  return (
                    <div key={id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: isDarkMode ? '#3d3d3d' : '#f9fafb', borderRadius: '8px', border: `1px solid ${colors.border}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '24px' }}>{type.icon}</span>
                        <div>
                          <h3 style={{ fontWeight: '600', color: colors.text }}>{type.label}</h3>
                          <p style={{ fontSize: '12px', color: colors.textSecondary }}>{type.description}</p>
                        </div>
                      </div>
                      <button onClick={() => downloadInstrument(id)} style={{ backgroundColor: colors.primary, color: 'white', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>📄 Download</button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ color: colors.textSecondary, textAlign: 'center', padding: '24px' }}>No instruments generated yet. Complete Chapter 3 to generate data collection instruments.</p>
            )}
          </div>
        )}
      </div>
      <style>{`@keyframes spin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}`}</style>
      {showRegenResetModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5000 }}>
          <div style={{ backgroundColor: colors.surface, borderRadius: '16px', maxWidth: '400px', width: '90%', padding: '32px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize: '40px', textAlign: 'center', marginBottom: '16px' }}>🔄</div>
            <h2 style={{ textAlign: 'center', fontSize: '22px', fontWeight: '700', color: colors.text, margin: '0 0 8px' }}>Reset Regenerate</h2>
            <p style={{ textAlign: 'center', fontSize: '14px', color: colors.textSecondary, margin: '0 0 24px' }}>Get {baseDefenceRegenLimit} more regenerate uses.</p>
            <div style={{ backgroundColor: colors.background, borderRadius: '12px', padding: '20px', marginBottom: '24px', border: `1px solid ${colors.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ color: colors.textSecondary, fontSize: '14px' }}>Feature</span>
                <span style={{ color: colors.text, fontWeight: '600', fontSize: '14px' }}>Regenerate</span>
              </div>
              <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: '12px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: colors.textSecondary, fontSize: '14px' }}>Amount</span>
                <span style={{ color: colors.text, fontWeight: '700', fontSize: '18px' }}>{fmt(PRICES_GHS.defenceRegen, false)}</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button onClick={handleRegenResetConfirm} disabled={processingRegenReset} style={{
                backgroundColor: processingRegenReset ? colors.border : '#2563eb',
                color: 'white', padding: '14px', border: 'none', borderRadius: '8px',
                fontWeight: '600', cursor: processingRegenReset ? 'not-allowed' : 'pointer',
                fontSize: '15px', opacity: processingRegenReset ? 0.7 : 1
              }}>
                {processingRegenReset ? 'Processing...' : `Pay ${fmt(PRICES_GHS.defenceRegen, false)}`}
              </button>
              <button onClick={() => setShowRegenResetModal(false)} disabled={processingRegenReset} style={{
                backgroundColor: 'transparent', color: colors.textSecondary,
                padding: '10px', border: `1px solid ${colors.border}`, borderRadius: '8px',
                fontWeight: '500', cursor: processingRegenReset ? 'not-allowed' : 'pointer',
                fontSize: '14px'
              }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {mockPaymentConfig && (
        <MockPaymentModal
          email={mockPaymentConfig.email}
          amount={mockPaymentConfig.amount}
          currency={mockPaymentConfig.currency}
          metadata={mockPaymentConfig.metadata}
          onClose={onMockPaymentClose}
          onSuccess={onMockPaymentSuccess}
        />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default MyFiles;