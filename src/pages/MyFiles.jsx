import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { saveAs } from 'file-saver';
import { INSTRUMENT_TYPES } from '../utils/instrumentHelpers';
import { getProjects, getGeneratedContent, getChapters } from '../services/firestoreService';
import Toast from '../components/Toast';

const MyFiles = () => {
  const { colors, isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [expandedChapter, setExpandedChapter] = useState(null);
  const [merging, setMerging] = useState(false);
  const [user, setUser] = useState(null);
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

  const notify = (message, type) => setToast({ message, type });

  useEffect(() => { const savedUser = localStorage.getItem('currentUser'); if (savedUser) setUser(JSON.parse(savedUser)); }, []);
  useEffect(() => { loadProjects(); }, []);
  useEffect(() => { if (selectedProject && activeTab === 'lists') loadAbbreviations(selectedProject); }, [selectedProject, activeTab]);
  useEffect(() => { if (selectedProject && activeTab === 'defence') loadDefenceQuestions(selectedProject); }, [selectedProject, activeTab]);
  useEffect(() => { if (selectedProject && activeTab === 'instruments') loadGeneratedInstruments(selectedProject); }, [selectedProject, activeTab]);

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
    const content = await getGeneratedContent(projectId) || {};
    const savedChapters = await getChapters(projectId) || [];
    const refs = {}; // References are now in citationService
    const mkChapter = (id, title) => ({
      id, title, fileName: `${id}.doc`, lastEdited: new Date().toLocaleDateString(),
      wordCount: estimateWordCount(content[id]),
      content: content[id]?.complete || '',
      subsections: content[id] ? Object.keys(content[id]).filter(k => !['references','complete','fullChapter'].includes(k)) : [],
      references: refs[id]?.citations || [],
      hasReferences: content[id]?.references ? true : false,
      generated: hasGeneratedContent(content[id])
    });
    setChapters([
      mkChapter('proposal','Proposal'), mkChapter('chapter1','Chapter 1: Introduction'),
      mkChapter('chapter2','Chapter 2: Literature Review'), mkChapter('chapter3','Chapter 3: Methodology'),
      mkChapter('chapter4','Chapter 4: Results/Analysis'), mkChapter('chapter5','Chapter 5: Discussion & Conclusion')
    ]);
  };

  const generateCleanFilename = (chapter) => {
    const cleanTitle = (projectData?.title || 'thesis').replace(/[^a-z0-9]/gi, '_').substring(0, 30);
    const date = new Date().toISOString().split('T')[0];
    const prefix = chapter.id === 'proposal' ? 'Proposal' : 'Chapter-' + chapter.id.replace('chapter', '');
    return `${prefix}-${cleanTitle}_${date}.doc`;
  };

  const captureChartAsImage = (chartData) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 600; canvas.height = 400;
      const ctx = canvas.getContext('2d');
      const barColors = ['#7c3aed','#8b5cf6','#a78bfa','#c4b5fd','#ddd6fe','#ede9fe'];
      const labels = chartData.labels || [];
      const values = (chartData.values || []).map(v => parseFloat(v) || 0);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (chartData.type === 'pie') {
        const cx = canvas.width / 2, cy = canvas.height / 2, r = Math.min(cx, cy) - 60;
        const total = values.reduce((s, v) => s + v, 0);
        let sa = 0;
        values.forEach((v, i) => {
          const angle = (v / total) * 2 * Math.PI;
          ctx.beginPath(); ctx.fillStyle = barColors[i % barColors.length];
          ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, sa, sa + angle); ctx.closePath(); ctx.fill();
          const la = sa + angle / 2;
          ctx.fillStyle = '#fff'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
          ctx.fillText(`${((v/total)*100).toFixed(1)}%`, cx + Math.cos(la) * r * 0.65, cy + Math.sin(la) * r * 0.65);
          sa += angle;
        });
      } else {
        const pad = 50, cw = canvas.width - 2 * pad, ch = canvas.height - 2 * pad;
        const maxV = Math.max(...values) * 1.15, bw = (cw / values.length) * 0.6, bs = cw / values.length;
        ctx.strokeStyle = '#333'; ctx.lineWidth = 2; ctx.beginPath();
        ctx.moveTo(pad, pad); ctx.lineTo(pad, canvas.height - pad); ctx.lineTo(canvas.width - pad, canvas.height - pad); ctx.stroke();
        values.forEach((v, i) => {
          const x = pad + i * bs + (bs - bw) / 2, bh = (v / maxV) * ch, y = canvas.height - pad - bh;
          ctx.fillStyle = barColors[i % barColors.length]; ctx.fillRect(x, y, bw, bh);
          ctx.fillStyle = '#333'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
          ctx.fillText(v, x + bw / 2, y - 5);
          ctx.fillText(labels[i] || '', x + bw / 2, canvas.height - pad + 18);
        });
      }
      if (chartData.title) { ctx.fillStyle = '#111'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(chartData.title, canvas.width / 2, 25); }
      resolve(canvas.toDataURL('image/png'));
    });
  };

  const getSavedDiagrams = (chapterId, subsectionTitle) => {
    try {
      const saved = localStorage.getItem(`diagramSVGs_${selectedProject}`);
      if (saved) {
        const allDiagrams = JSON.parse(saved);
        const key = `${chapterId}_${subsectionTitle}`;
        return allDiagrams[key] || null;
      }
    } catch (e) {}
    return null;
  };

  const svgToDataUrl = (svgString) => {
    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
  };

  const parseContentForWord = async (rawContent, chapterId = null) => {
    if (!rawContent) return '';
    let html = '';
    const lines = rawContent.split('\n');
    let inTable = false, tableHtml = '', inMermaid = false, mermaidLines = [];
    let figureCounter = 0, diagramIdx = 0;
    let pendingPromises = [], pendingPlaceholders = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.startsWith('```mermaid')) { inMermaid = true; mermaidLines = []; continue; }
      if (inMermaid && line.startsWith('```')) {
        inMermaid = false; figureCounter++;
        const savedDiagrams = chapterId ? getSavedDiagrams(chapterId, null) : null;
        const svgKey = `diagram_${diagramIdx}`;
        diagramIdx++;
        
        if (savedDiagrams && savedDiagrams[svgKey]) {
          html += `<div style="text-align:center;margin:20px 0;"><p style="font-weight:bold;font-size:11pt;margin-bottom:8px;">Figure ${figureCounter}: Diagram</p><img src="${svgToDataUrl(savedDiagrams[svgKey])}" style="max-width:100%;border:1px solid #ddd;" alt="Figure ${figureCounter}" /></div>`;
        } else {
          html += `<div style="border:1px solid #999;padding:15px;margin:20px 0;background:#fafafa;text-align:center;"><p style="font-weight:bold;">Figure ${figureCounter}: Diagram</p><pre style="text-align:left;font-size:9pt;background:#f5f5f5;padding:10px;">${mermaidLines.join('\n').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre></div>`;
        }
        continue;
      }
      if (inMermaid) { mermaidLines.push(line); continue; }

      if (line.match(/\[CHART:\{.*\}\]/)) {
        try {
          const chartMatch = line.match(/\[CHART:(\{.*\})\]/);
          if (chartMatch) {
            const chartData = JSON.parse(chartMatch[1]);
            figureCounter++;
            const placeholder = `__CHART_${figureCounter}__`;
            pendingPlaceholders.push({ placeholder });
            pendingPromises.push(
              new Promise((resolve) => {
                const timeout = setTimeout(() => resolve(null), 3000);
                captureChartAsImage(chartData).then(img => { clearTimeout(timeout); resolve(img); }).catch(() => { clearTimeout(timeout); resolve(null); });
              }).then(img => ({
                placeholder,
                replacement: img ? `<div style="text-align:center;margin:20px 0;"><p style="font-weight:bold;font-size:11pt;">Figure ${figureCounter}: ${chartData.title || 'Chart'}</p><img src="${img}" style="max-width:100%;border:1px solid #ddd;" />${chartData.caption ? `<p style="font-size:9pt;font-style:italic;">${chartData.caption}</p>` : ''}</div>` : `<div style="text-align:center;margin:20px 0;padding:15px;border:1px solid #ccc;background:#f9f9f9;"><p style="font-weight:bold;">Figure ${figureCounter}: ${chartData.title || 'Chart'}</p><p style="font-size:10pt;">[View in PAGYS app]</p></div>`
              }))
            );
            html += placeholder;
          }
        } catch (e) { html += '<p style="font-style:italic;">[Chart]</p>'; }
        continue;
      }

      if (line.startsWith('|') && line.endsWith('|')) {
        if (line.match(/^\|[\s\-:]+\|$/)) continue;
        if (!inTable) { inTable = true; tableHtml = '<table style="border-collapse:collapse;width:100%;margin:20px 0;font-size:11pt;">'; }
        const cells = line.split('|').filter(c => c.trim() !== '');
        const isH = i + 2 < lines.length && lines[i + 1]?.trim().match(/^\|[\s\-:]+\|$/);
        tableHtml += '<tr>';
        cells.forEach(c => { tableHtml += `<${isH ? 'th' : 'td'} style="border:1px solid #000;padding:8px;text-align:left;${isH ? 'background:#f2f2f2;font-weight:bold;' : ''}">${c.trim()}</${isH ? 'th' : 'td'}>`; });
        tableHtml += '</tr>';
        continue;
      } else if (inTable) { tableHtml += '</table>'; html += tableHtml; tableHtml = ''; inTable = false; }

      // Headings - no indent
      if (line.match(/^\d+\.\d+\s/)) html += `<h3 style="font-size:14pt;font-weight:bold;margin-top:30px;margin-bottom:15px;">${line}</h3>`;
      else if (line.match(/^\d+\.\d+\.\d+\s/)) html += `<h4 style="font-size:13pt;font-weight:bold;margin-top:20px;margin-bottom:10px;font-style:italic;">${line}</h4>`;
      else if (line === 'References' || line === 'REFERENCES') html += `<h3 style="font-size:14pt;font-weight:bold;margin-top:40px;margin-bottom:20px;">${line}</h3>`;
      // Regular paragraph - Word default: 2.0 line spacing, justified, 0.5in first-line indent
      else if (line.length > 0) html += `<p style="font-size:12pt;line-height:2.0;margin-bottom:0;text-align:justify;text-indent:0.5in;">${line}</p>`;
    }
    if (inTable && tableHtml) { tableHtml += '</table>'; html += tableHtml; }
    if (pendingPromises.length > 0) { const results = await Promise.all(pendingPromises); results.forEach(r => { html = html.replace(r.placeholder, r.replacement); }); }
    return html;
  };

  // Generate Word document - Word default formatting
  const generateWordDocument = async (chapter) => {
        let fc = '';
    try {
      const content = await getGeneratedContent(selectedProject);
      if (content) { const cc = content[chapter.id]; if (cc) { (chapter.subsections || []).forEach(s => { if (cc[s]) fc += cc[s] + '\n\n'; }); if (cc.references) fc += '\n' + cc.references; } }
    } catch (e) {}

    const parsed = await parseContentForWord(fc, chapter.id);
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${chapter.title}</title>
    <style>body{font-family:'Times New Roman',Times,serif;margin:2.54cm;line-height:2.0;color:#000;font-size:12pt}.chapter-title{font-size:18pt;font-weight:bold;text-align:center;margin-bottom:40px;text-transform:uppercase}h3{font-size:14pt;font-weight:bold;margin-top:30px;margin-bottom:15px;text-indent:0}h4{font-size:13pt;font-weight:bold;margin-top:20px;margin-bottom:10px;font-style:italic;text-indent:0}p{font-size:12pt;line-height:2.0;margin-bottom:0;text-align:justify;text-indent:0.5in}table{border-collapse:collapse;width:100%;margin:20px 0}th,td{border:1px solid #000;padding:8px;text-align:left;font-size:11pt}th{background:#f2f2f2;font-weight:bold}img{max-width:100%;height:auto}</style></head>
    <body>${chapter.id === 'proposal' ? `<div class="chapter-title">PROPOSAL</div>` : ''}<div class="content">${parsed || '<p>Content not available.</p>'}</div></body></html>`;
  };

  const downloadChapter = async (chapter) => {
    setPreparingDownload(true); setDownloadProgress('Preparing document...');
    try { const c = await generateWordDocument(chapter); saveAs(new Blob([c], { type: 'application/msword' }), generateCleanFilename(chapter)); }
    catch (e) { notify('Error preparing download.', 'error'); }
    finally { setPreparingDownload(false); setDownloadProgress(''); }
  };

  const mergeAllChapters = async () => {
    setMerging(true); setDownloadProgress('Preparing merged document...');
    try {
      const cp = projects.find(p => p.id === selectedProject);
      let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${cp?.title} - Complete Thesis</title>
      <style>body{font-family:'Times New Roman',Times,serif;margin:2.54cm;line-height:2.0;color:#000;font-size:12pt}h1{font-size:28pt;font-weight:bold;text-align:center;margin:60px 0 20px}h2{font-size:24pt;font-weight:bold;text-align:center;margin:50px 0 30px;page-break-before:always;text-indent:0}h3{font-size:14pt;font-weight:bold;margin-top:30px;margin-bottom:15px;text-indent:0}p{font-size:12pt;line-height:2.0;margin-bottom:0;text-align:justify;text-indent:0.5in}table{border-collapse:collapse;width:100%;margin:20px 0}th,td{border:1px solid #000;padding:8px;text-align:left;font-size:11pt}th{background:#f2f2f2;font-weight:bold}img{max-width:100%;height:auto}.title-page{text-align:center;margin-top:150px}.author-name{font-size:18pt;font-weight:bold;margin:40px 0}.date{font-size:14pt;margin-top:50px}.page-break{page-break-before:always}</style></head>
      <body><div class="title-page"><h1 style="font-size:32pt;margin-bottom:60px;">${cp?.title}</h1><div class="author-name">${user?.fullName || 'Student'}</div><div class="date">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div></div>`;
      for (let i = 1; i < chapters.length; i++) {
        const ch = chapters[i];
        if (ch.generated) {
                   const content = await getGeneratedContent(selectedProject); let cc = '';
          if (content) { const chC = content[ch.id]; if (chC) { (ch.subsections || []).forEach(s => { if (chC[s]) cc += chC[s] + '\n\n'; }); if (chC.references) cc += '\n' + chC.references; } }
          if (!cc && ch.content) cc = ch.content;
          cc = cc.replace(/Generated by PAGYS.*?\n/g, '').replace(/This (was )?generated by.*?\n/gi, '');
          const parsed = await parseContentForWord(cc, ch.id);
          html += `<div class="page-break"><h2>${ch.title}</h2>${parsed}</div>`;
        }
      }
      html += '</body></html>';
      saveAs(new Blob([html], { type: 'application/msword' }), `${cp?.title.replace(/[^a-z0-9]/gi, '_')}_Complete_Thesis_${new Date().toISOString().split('T')[0]}.doc`);
    } catch (e) { notify('Error merging chapters.', 'error'); }
    finally { setMerging(false); setDownloadProgress(''); }
  };

  const generateAbbreviationsDocument = () => `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>List of Abbreviations</title><style>body{font-family:'Times New Roman',Times,serif;margin:2.54cm;font-size:12pt}h1{font-size:18pt;font-weight:bold;text-align:center}table{border-collapse:collapse;width:100%}th,td{border:1px solid #000;padding:10px}th{background:#f2f2f2}</style></head><body><h1>List of Abbreviations</h1>${abbreviations.length > 0 ? `<table><thead><tr><th>Abbreviation</th><th>Meaning</th></tr></thead><tbody>${abbreviations.map(a => `<tr><td>${a.abbr}</td><td>${a.meaning}</td></tr>`).join('')}</tbody></table>` : '<p>None found.</p>'}</body></html>`;
  const generateDefenceDocument = () => { if (!defenceQuestions) return ''; return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Defence Prep</title><style>body{font-family:'Times New Roman',Times,serif;margin:2.54cm;font-size:12pt}h1{font-size:18pt;font-weight:bold;text-align:center}h2{font-size:16pt;font-weight:bold;color:#2c3e50}.qa-item{margin-bottom:25px;padding:15px;background:#f9f9f9;border-left:3px solid #3498db}.question{font-weight:bold}</style></head><body><h1>Defence Preparation Guide</h1><p><strong>${projectData?.title}</strong></p>${Object.entries(defenceQuestions).map(([s, qs]) => { if (!qs || qs.length === 0) return ''; return `<h2>${formatSectionName(s)}</h2>${qs.map((q, i) => `<div class="qa-item"><div class="question">Q${i+1}: ${q.question}</div><div>${q.answer}</div></div>`).join('')}`; }).join('')}</body></html>`; };
  const formatSectionName = (s) => ({ proposal: 'Proposal', chapter1: 'Ch 1', chapter2: 'Ch 2', chapter3: 'Ch 3', chapter4: 'Ch 4', chapter5: 'Ch 5', final: 'Final' })[s] || s;

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

  const loadDefenceQuestions = async (pid) => {
    setLoadingDefence(true);
    try {
      const sd = localStorage.getItem(`defence_${pid}`); if (sd) { setDefenceQuestions(JSON.parse(sd)); setLoadingDefence(false); return; }
      const content = await getGeneratedContent(pid);
      const c = content || {}; const cc = {};
      Object.entries(c).forEach(([id, ch]) => { if (ch && Object.keys(ch).length > 0) cc[id] = true; });
      if (Object.keys(cc).length === 0) { setDefenceQuestions(null); setLoadingDefence(false); return; }
      const { generateDefenceQuestions } = await import('../services/geminiService');
      const qs = await generateDefenceQuestions({ title: projects.find(p => p.id === pid)?.title, field: projects.find(p => p.id === pid)?.field, level: projects.find(p => p.id === pid)?.level, completedChapters: cc });
      if (qs) { setDefenceQuestions(qs); localStorage.setItem(`defence_${pid}`, JSON.stringify(qs)); }
    } catch (e) {} finally { setLoadingDefence(false); }
  };

  const handleProjectChange = (pid) => { const p = projects.find(pr => pr.id === pid); setSelectedProject(pid); setProjectData(p); loadChaptersForProject(pid); setActiveTab('chapters'); setAbbreviations([]); setDefenceQuestions(null); setGeneratedInstruments([]); };
  const downloadAbbreviations = () => saveAs(new Blob([generateAbbreviationsDocument()], { type: 'application/msword' }), `abbreviations-${(projectData?.title || 'thesis').replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.doc`);
  const downloadDefence = () => { if (!defenceQuestions) return; saveAs(new Blob([generateDefenceDocument()], { type: 'application/msword' }), `defence-${(projectData?.title || 'thesis').replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.doc`); };
  const getGeneratedChaptersCount = () => chapters.filter(ch => ch.generated).length;

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

    let bodyContent = `<h1>${type.icon} ${type.label}</h1>
    <div class="info"><p><strong>Project:</strong> ${projectData?.title || 'Thesis'}</p><p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p></div><hr />`;

    if (content.sections) {
      content.sections.forEach(section => {
        bodyContent += `<div class="section"><h2>${section.sectionName || section.title}</h2>`;
        if (section.questions) {
          section.questions.forEach((q, qi) => {
            bodyContent += `<div class="question"><div class="question-text">${qi + 1}. ${q.text}</div>`;
            if (q.options) { q.options.forEach(opt => { bodyContent += `<div class="option">☐ ${opt}</div>`; }); }
            if (q.type === 'open-ended') { bodyContent += `<div class="open-ended-space"><div class="line"></div><div class="line"></div></div>`; }
            bodyContent += `</div>`;
          });
        }
        if (section.items) {
          section.items.forEach((item, ii) => {
            if (item.type === 'script') bodyContent += `<p class="script">"${item.content}"</p>`;
            else if (item.type === 'question') { bodyContent += `<div class="question"><div class="question-text">${ii + 1}. ${item.text}</div>`; if (item.probes) item.probes.forEach(p => { bodyContent += `<p class="probe">→ ${p}</p>`; }); bodyContent += `</div>`; }
            else if (item.type === 'note') bodyContent += `<p class="note">📝 ${item.content}</p>`;
            else if (item.type === 'activity') bodyContent += `<div class="question"><div class="question-text">Activity: ${item.name}</div><p>${item.instructions || ''}</p></div>`;
          });
        }
        if (section.fields || section.indicators) {
          bodyContent += `<table class="obs-table"><tr><th>#</th><th>Indicator / Field</th><th>Type</th></tr>`;
          let count = 0;
          (section.fields || []).forEach(f => { count++; bodyContent += `<tr><td>${count}</td><td>${f.label}</td><td>${f.type}</td></tr>`; });
          (section.indicators || []).forEach(ind => { count++; bodyContent += `<tr><td>${count}</td><td>${ind.label}</td><td>${ind.type}</td></tr>`; });
          bodyContent += `</table>`;
        }
        if (section.codes) {
          bodyContent += `<table class="obs-table"><tr><th>Code</th><th>Label</th><th>Description</th></tr>`;
          section.codes.forEach(c => { bodyContent += `<tr><td>${c.code}</td><td>${c.label}</td><td>${c.description || ''}</td></tr>`; });
          bodyContent += `</table>`;
        }
        if (section.criteria) {
          section.criteria.forEach((c, ci) => { bodyContent += `<div class="question"><div class="question-text">${ci + 1}. ${c.criterion}</div><p>${c.description || ''}</p></div>`; });
        }
        if (section.sources) {
          bodyContent += `<table class="obs-table"><tr><th>Source</th><th>Type</th><th>Details</th></tr>`;
          section.sources.forEach(s => { bodyContent += `<tr><td>${s.source}</td><td>${s.type}</td><td>${s.participants || s.duration || s.sessions || ''}</td></tr>`; });
          bodyContent += `</table>`;
        }
        if (section.description) bodyContent += `<p>${section.description}</p>`;
        if (section.methods) bodyContent += `<p><strong>Methods:</strong> ${section.methods.join(', ')}</p>`;
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
      {(preparingDownload || (merging && downloadProgress)) && (
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
          <button onClick={() => navigate('/dashboard')} style={{ backgroundColor: colors.primary, color: 'white', padding: '10px 20px', border: 'none', borderRadius: '8px', fontWeight: '500', cursor: 'pointer' }}>← Back</button>
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
          <div style={{ flex: 1, minWidth: '200px', backgroundColor: colors.cardBg || colors.surface, borderRadius: '10px', padding: '16px 20px', border: `1px solid ${colors.border}`, cursor: selectedProject ? 'pointer' : 'default' }} onClick={() => { if (selectedProject) navigate(`/citations/${selectedProject}`); }}>
            <div style={{ fontSize: '12px', color: colors.textSecondary, fontWeight: '500', marginBottom: '4px' }}>Citations</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: colors.text }}>
              {(() => { try { const vc = JSON.parse(localStorage.getItem(`verifiedCitations_${selectedProject}`) || '{}'); return `${Object.keys(vc).length} verified`; } catch { return '0 verified'; }})()}
            </div>
            <div style={{ fontSize: '11px', color: '#4F46E5', marginTop: '4px' }}>Click to verify →</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: `1px solid ${colors.border}`, paddingBottom: '4px' }}>
          {['chapters','lists','defence','instruments'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '12px 24px', backgroundColor: activeTab === tab ? colors.primary : 'transparent', color: activeTab === tab ? 'white' : colors.text, border: 'none', borderRadius: '8px 8px 0 0', cursor: 'pointer', fontWeight: '500' }}>
              {tab === 'chapters' ? `📄 Chapters (${getGeneratedChaptersCount()})` : tab === 'lists' ? `📋 Lists (${abbreviations.length})` : tab === 'defence' ? '🎯 Defence' : `📦 Instruments (${generatedInstruments.length})`}
            </button>
          ))}
        </div>
        {(activeTab === 'chapters' && getGeneratedChaptersCount() > 0) && (
          <div style={{ marginBottom: '24px' }}>
            <button onClick={mergeAllChapters} disabled={merging} style={{ backgroundColor: '#059669', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: merging ? 'not-allowed' : 'pointer' }}>{merging ? 'Preparing...' : '📄 Merge All Chapters'}</button>
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
                          {ch.generated && <span style={{ fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '999px', backgroundColor: isDarkMode ? '#064e3b' : '#d1fae5', color: isDarkMode ? '#a7f3d0' : '#047857' }}>✓ Ready to download</span>}
                          <span style={{ fontSize: '11px', color: colors.textSecondary }}>📝 {ch.wordCount} words</span>
                          {ch.subsections.length > 0 && <span>📄 {ch.subsections.length} subsections</span>}
                          {ch.hasReferences && <span style={{ color: '#059669' }}>📚 References</span>}
                        </div>
                      </div>
                    </div>
                    {ch.generated && <button onClick={(e) => { e.stopPropagation(); downloadChapter(ch); }} disabled={preparingDownload} style={{ backgroundColor: colors.primary, color: 'white', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>📄 Download</button>}
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
            {loadingDefence ? <p style={{ color: colors.textSecondary }}>Generating defence questions...</p> : defenceQuestions ? (
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
                <button onClick={downloadDefence} style={{ backgroundColor: '#d97706', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>🎯 Download Defence Questions</button>
              </div>
            ) : <p style={{ color: colors.textSecondary }}>Complete thesis chapters to generate defence preparation questions.</p>}
          </div>
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
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default MyFiles;