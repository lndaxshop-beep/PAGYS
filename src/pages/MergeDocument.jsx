import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { saveAs } from 'file-saver';
import { getProjects, getGeneratedContent, getChapters } from '../services/firestoreService';
import { getChapterDisplayTitle } from '../utils/writeHelpers.jsx';
import { loadInstruments } from '../utils/merge/instrumentExporter.js';
import generateMergedDocument from '../utils/merge/mergeDocumentEngine.js';
import generatePdfDocument from '../utils/merge/pdfExportEngine.js';
import generateLatexDocument from '../utils/merge/latexExportEngine.js';
import generateMarkdownDocument from '../utils/merge/markdownExportEngine.js';
import { PageSkeleton } from '../components/Skeleton';
import { useCurrency } from '../hooks/useCurrency';
import { PRICES_USD } from '../constants/pricing';

const PLACEHOLDER_FIELDS = [
  { key: 'fullName', label: 'Full Name', default: '' },
  { key: 'studentId', label: 'Student ID', default: '' },
  { key: 'indexNumber', label: 'Index Number', default: '' },
  { key: 'supervisorName', label: 'Supervisor Name', default: '' },
  { key: 'courseName', label: 'Course/Program Name', default: '' },
  { key: 'department', label: 'Department', default: '' },
  { key: 'faculty', label: 'Faculty', default: '' },
  { key: 'universityName', label: 'University Name', default: '' },
  { key: 'dateOfSubmission', label: 'Date of Submission', default: '' },
  { key: 'monthYear', label: 'Month, Year', default: '' },
];

const FRONT_MATTER_OPTIONS = [
  { key: 'titlePage', label: 'Title Page', default: true },
  { key: 'declaration', label: 'Declaration', default: true },
  { key: 'dedication', label: 'Dedication', default: false },
  { key: 'acknowledgements', label: 'Acknowledgements', default: false },
  { key: 'abstract', label: 'Abstract', default: true },
  { key: 'toc', label: 'Table of Contents (Word TOC Field)', default: true },
  { key: 'listOfFigures', label: 'List of Figures', default: false },
  { key: 'listOfTables', label: 'List of Tables', default: false },
  { key: 'abbreviations', label: 'List of Abbreviations', default: false },
];

const MergeDocument = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { colors, isDarkMode } = useTheme();
  const { fmt } = useCurrency();

  const [project, setProject] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [generatedSubsections, setGeneratedSubsections] = useState({});
  const [loading, setLoading] = useState(true);

  const [selectedChapterIds, setSelectedChapterIds] = useState([]);
  const [frontMatter, setFrontMatter] = useState(() => {
    const fm = {};
    FRONT_MATTER_OPTIONS.forEach(o => { fm[o.key] = o.default; });
    return fm;
  });
  const [placeholders, setPlaceholders] = useState(() => {
    const p = {};
    PLACEHOLDER_FIELDS.forEach(f => { p[f.key] = ''; });
    p.dedicationText = '';
    p.acknowledgementsText = '';
    p.abstractText = '';
    return p;
  });
  const [instruments, setInstruments] = useState([]);
  const [selectedInstrumentIds, setSelectedInstrumentIds] = useState([]);
  const [templateFile, setTemplateFile] = useState(null);
  const [templateFileName, setTemplateFileName] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatingAbstract, setGeneratingAbstract] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [showAbstractPaymentModal, setShowAbstractPaymentModal] = useState(false);
  const [processingAbstractPayment, setProcessingAbstractPayment] = useState(false);
  const abstractPaymentTimeoutRef = useRef(null);

  const [dedicationNames, setDedicationNames] = useState(() => {
    try { return localStorage.getItem(`dedicationNames_${projectId}`) || ''; } catch { return ''; }
  });
  const [acknowledgementNames, setAcknowledgementNames] = useState(() => {
    try { return localStorage.getItem(`acknowledgementNames_${projectId}`) || ''; } catch { return ''; }
  });
  const [dedicationGenerated, setDedicationGenerated] = useState(() => {
    return !!localStorage.getItem(`dedicationGenerated_${projectId}`);
  });
  const [acknowledgementGenerated, setAcknowledgementGenerated] = useState(() => {
    return !!localStorage.getItem(`acknowledgementGenerated_${projectId}`);
  });
  const [generatingDedication, setGeneratingDedication] = useState(false);
  const [generatingAcknowledgements, setGeneratingAcknowledgements] = useState(false);

  const getAbstractCacheKey = () => `abstract_${projectId}_${JSON.stringify(generatedSubsections).length.toString(36)}`;

  useEffect(() => {
    if (!projectId || Object.keys(generatedSubsections).length === 0) return;
    const key = `abstract_${projectId}_${JSON.stringify(generatedSubsections).length.toString(36)}`;
    const cached = localStorage.getItem(key);
    if (cached) {
      setPlaceholders(prev => ({ ...prev, abstractText: cached }));
    }
  }, [projectId, generatedSubsections]);

  useEffect(() => {
    if (!projectId) return;
    try {
      const stored = localStorage.getItem(`dedicationCache_${projectId}`);
      if (stored) {
        const { names, text, generated } = JSON.parse(stored);
        setDedicationNames(names || '');
        if (text) setPlaceholders(prev => ({ ...prev, dedicationText: text }));
        if (generated) setDedicationGenerated(true);
      }
      const storedAck = localStorage.getItem(`acknowledgementsCache_${projectId}`);
      if (storedAck) {
        const { names, text, generated } = JSON.parse(storedAck);
        setAcknowledgementNames(names || '');
        if (text) setPlaceholders(prev => ({ ...prev, acknowledgementsText: text }));
        if (generated) setAcknowledgementGenerated(true);
      }
    } catch {}
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;
    try {
      localStorage.setItem(`dedicationNames_${projectId}`, dedicationNames);
      localStorage.setItem(`dedicationGenerated_${projectId}`, dedicationGenerated ? '1' : '');
      if (dedicationGenerated) {
        localStorage.setItem(`dedicationCache_${projectId}`, JSON.stringify({ names: dedicationNames, text: placeholders.dedicationText, generated: true }));
      }
    } catch {}
  }, [projectId, dedicationNames, dedicationGenerated, placeholders.dedicationText]);

  useEffect(() => {
    if (!projectId) return;
    try {
      localStorage.setItem(`acknowledgementNames_${projectId}`, acknowledgementNames);
      localStorage.setItem(`acknowledgementGenerated_${projectId}`, acknowledgementGenerated ? '1' : '');
      if (acknowledgementGenerated) {
        localStorage.setItem(`acknowledgementsCache_${projectId}`, JSON.stringify({ names: acknowledgementNames, text: placeholders.acknowledgementsText, generated: true }));
      }
    } catch {}
  }, [projectId, acknowledgementNames, acknowledgementGenerated, placeholders.acknowledgementsText]);

  const handleGenerateDedication = async () => {
    if (generatingDedication || dedicationGenerated || !dedicationNames.trim()) return;
    setGeneratingDedication(true);
    setError('');
    try {
      const { genAI, MODEL } = await import('../services/gemini/config');
      const model = genAI.getGenerativeModel({ model: MODEL });
      const prompt = `You are writing the dedication page for an academic thesis.\n\nProject Title: "${project?.title || ''}"\nField: ${project?.field || ''}\n\nDedicate to (in order of priority):\n${dedicationNames}\n\nWrite a formal, heartfelt dedication. Use first person. Keep it to one paragraph of 3-5 sentences. Return ONLY the dedication text.`;
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      if (text) {
        setPlaceholders(prev => ({ ...prev, dedicationText: text }));
        setDedicationGenerated(true);
      }
    } catch (e) {
      setError('Failed to generate dedication: ' + (e.message || 'Unknown error'));
    }
    setGeneratingDedication(false);
  };

  const handleGenerateAcknowledgements = async () => {
    if (generatingAcknowledgements || acknowledgementGenerated || !acknowledgementNames.trim()) return;
    setGeneratingAcknowledgements(true);
    setError('');
    try {
      const { genAI, MODEL } = await import('../services/gemini/config');
      const model = genAI.getGenerativeModel({ model: MODEL });
      const prompt = `You are writing the acknowledgements page for an academic thesis.\n\nProject Title: "${project?.title || ''}"\nField: ${project?.field || ''}\n\nThank the following people (in order of priority):\n${acknowledgementNames}\n\nWrite formal academic acknowledgements. Use first person. Keep it 2-3 short paragraphs. Return ONLY the acknowledgements text.`;
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      if (text) {
        setPlaceholders(prev => ({ ...prev, acknowledgementsText: text }));
        setAcknowledgementGenerated(true);
      }
    } catch (e) {
      setError('Failed to generate acknowledgements: ' + (e.message || 'Unknown error'));
    }
    setGeneratingAcknowledgements(false);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const projectsList = await getProjects();
        const currentProject = projectsList.find(p => p.id.toString() === projectId);
        if (!currentProject) { navigate('/dashboard'); return; }
        setProject(currentProject);

        const [savedContent, savedChapters] = await Promise.all([
          getGeneratedContent(projectId),
          getChapters(projectId)
        ]);

        if (savedContent && Object.keys(savedContent).length) setGeneratedSubsections(savedContent);
        if (savedChapters && Array.isArray(savedChapters)) {
          setChapters(savedChapters);
          const contentChapters = savedChapters.filter(ch => ch.id !== 'proposal');
          setSelectedChapterIds(contentChapters.map(ch => ch.id));
        }

        const loadedInstruments = loadInstruments(projectId);
        setInstruments(loadedInstruments);
        if (loadedInstruments.length > 0) {
          setSelectedInstrumentIds(loadedInstruments.map(inst => inst.id));
        }
      } catch (e) {
        console.error('Error loading project:', e);
        navigate('/dashboard');
      }
      setLoading(false);
    };
    load();
  }, [projectId, navigate]);

  const toggleChapter = (id) => {
    setSelectedChapterIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleFrontMatter = (key) => {
    setFrontMatter(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleInstrument = (id) => {
    setSelectedInstrumentIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const updatePlaceholder = (key, value) => {
    setPlaceholders(prev => ({ ...prev, [key]: value }));
  };

  const handleTemplateUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setTemplateFile(file);
      setTemplateFileName(file.name);
    }
  };

  const ensureAbstract = async () => {
    if (placeholders.abstractText?.trim()) return placeholders.abstractText;

    const key = getAbstractCacheKey();
    const cached = localStorage.getItem(key);
    if (cached) {
      setPlaceholders(prev => ({ ...prev, abstractText: cached }));
      return cached;
    }

    setProgress('Generating abstract from thesis content...');
    try {
      const { generateAbstract } = await import('../services/geminiService');
      const text = await generateAbstract(project, generatedSubsections);
      if (text) {
        setPlaceholders(prev => ({ ...prev, abstractText: text }));
        localStorage.setItem(key, text);
      }
      return text || null;
    } catch { return null; }
  };

  const handleGenerateAbstractClick = async () => {
    if (generatingAbstract) return;

    const key = getAbstractCacheKey();
    const cached = localStorage.getItem(key);

    if (cached) {
      setShowAbstractPaymentModal(true);
      return;
    }

    setGeneratingAbstract(true);
    setError('');
    try {
      const { generateAbstract } = await import('../services/geminiService');
      const text = await generateAbstract(project, generatedSubsections);
      if (text) {
        setPlaceholders(prev => ({ ...prev, abstractText: text }));
        localStorage.setItem(key, text);
      } else {
        setError('Failed to generate abstract. Try again.');
      }
    } catch (e) {
      setError('Failed to generate abstract: ' + (e.message || 'Unknown error'));
    }
    setGeneratingAbstract(false);
  };

  const handleAbstractPaymentConfirm = () => {
    setProcessingAbstractPayment(true);
    abstractPaymentTimeoutRef.current = setTimeout(async () => {
      setProcessingAbstractPayment(false);
      setShowAbstractPaymentModal(false);

      const key = getAbstractCacheKey();

      setGeneratingAbstract(true);
      setError('');
      try {
        const { generateAbstract } = await import('../services/geminiService');
        const text = await generateAbstract(project, generatedSubsections);
        if (text) {
          setPlaceholders(prev => ({ ...prev, abstractText: text }));
          localStorage.setItem(key, text);
        } else {
          setError('Failed to generate abstract. Try again.');
        }
      } catch (e) {
        setError('Failed to generate abstract: ' + (e.message || 'Unknown error'));
      }
      setGeneratingAbstract(false);
    }, 800);
  };

  const handleAbstractPaymentCancel = () => {
    setShowAbstractPaymentModal(false);
  };

  const handleGenerateLatex = async () => {
    if (selectedChapterIds.length === 0) {
      setError('Please select at least one chapter to include.');
      return;
    }
    setError('');
    setGenerating(true);
    setProgress('Preparing LaTeX...');

    try {
      const abstractText = await ensureAbstract();
      const updatedPlaceholders = { ...placeholders, abstractText: abstractText || placeholders.abstractText || '' };
      const style = project?.referenceStyle || 'apa';
      await generateLatexDocument({
        project, chapters, generatedSubsections, selectedChapterIds,
        frontMatter, placeholders: updatedPlaceholders, templateFile, selectedInstrumentIds,
        projectId, style, onProgress: setProgress,
      });
      setProgress('LaTeX ready!');
    } catch (e) {
      console.error('LaTeX generation failed:', e);
      setError('Failed to generate LaTeX: ' + (e.message || 'Unknown error'));
    }
    setGenerating(false);
  };

  const handleGenerateMarkdown = async () => {
    if (selectedChapterIds.length === 0) {
      setError('Please select at least one chapter to include.');
      return;
    }
    setError('');
    setGenerating(true);
    setProgress('Preparing Markdown...');

    try {
      const abstractText = await ensureAbstract();
      const updatedPlaceholders = { ...placeholders, abstractText: abstractText || placeholders.abstractText || '' };
      const style = project?.referenceStyle || 'apa';
      await generateMarkdownDocument({
        project, chapters, generatedSubsections, selectedChapterIds,
        frontMatter, placeholders: updatedPlaceholders, templateFile, selectedInstrumentIds,
        projectId, style, onProgress: setProgress,
      });
      setProgress('Markdown ready!');
    } catch (e) {
      console.error('Markdown generation failed:', e);
      setError('Failed to generate Markdown: ' + (e.message || 'Unknown error'));
    }
    setGenerating(false);
  };

  const handleGeneratePdf = async () => {
    if (selectedChapterIds.length === 0) {
      setError('Please select at least one chapter to include.');
      return;
    }
    setError('');
    setGenerating(true);
    setProgress('Preparing PDF...');

    try {
      const abstractText = await ensureAbstract();
      const updatedPlaceholders = { ...placeholders, abstractText: abstractText || placeholders.abstractText || '' };
      const style = project?.referenceStyle || 'apa';
      await generatePdfDocument({
        project,
        chapters,
        generatedSubsections,
        selectedChapterIds,
        frontMatter,
        placeholders: updatedPlaceholders,
        templateFile,
        selectedInstrumentIds,
        projectId,
        style,
        onProgress: setProgress,
      });
      setProgress('PDF ready!');
    } catch (e) {
      console.error('PDF generation failed:', e);
      setError('Failed to generate PDF: ' + (e.message || 'Unknown error'));
    }
    setGenerating(false);
  };

  const handleGenerate = async () => {
    if (selectedChapterIds.length === 0) {
      setError('Please select at least one chapter to include.');
      return;
    }
    setError('');
    setGenerating(true);
    setProgress('Initializing...');

    try {
      const abstractText = await ensureAbstract();
      const updatedPlaceholders = { ...placeholders, abstractText: abstractText || placeholders.abstractText || '' };
      const style = project?.referenceStyle || 'apa';
      const blob = await generateMergedDocument({
        project,
        chapters,
        generatedSubsections,
        selectedChapterIds,
        frontMatter,
        placeholders: updatedPlaceholders,
        templateFile,
        selectedInstrumentIds: selectedInstrumentIds,
        projectId,
        style,
        onProgress: setProgress,
      });

      const safeTitle = (project?.title || 'thesis').replace(/[^a-z0-9]/gi, '_').substring(0, 30);
      const date = new Date().toISOString().split('T')[0];
      const filename = `${safeTitle}_Complete_Thesis_${date}.docx`;

      saveAs(blob, filename);
      setProgress('Download complete!');
    } catch (e) {
      console.error('Merge failed:', e);
      setError('Failed to generate document: ' + (e.message || 'Unknown error'));
    }
    setGenerating(false);
  };

  const contentChapters = chapters.filter(ch => ch.id !== 'proposal');

  if (loading) return <PageSkeleton />;

  if (!project) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: colors.background, color: colors.text }}>
        Project not found
      </div>
    );
  }

  const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: '6px',
    border: `1px solid ${colors.inputBorder}`,
    backgroundColor: colors.input, color: colors.text, fontSize: '14px',
    boxSizing: 'border-box', outline: 'none',
  };

  const textareaStyle = {
    ...inputStyle, minHeight: '80px', resize: 'vertical', fontFamily: 'inherit',
  };

  const labelStyle = {
    display: 'block', fontSize: '13px', fontWeight: '500', color: colors.text, marginBottom: '4px',
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.background, padding: '32px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <button
          onClick={() => navigate('/myfiles')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '24px', padding: '8px 16px', backgroundColor: 'transparent', border: `1px solid ${colors.text}40`, borderRadius: '6px', color: colors.text, cursor: 'pointer', fontSize: '14px' }}
        >
          &larr; Back to My Files
        </button>

        <h1 style={{ fontSize: '28px', fontWeight: '700', color: colors.text, margin: '0 0 4px' }}>Merge Thesis Document</h1>
        <p style={{ fontSize: '15px', color: `${colors.text}99`, margin: '0 0 24px' }}>{project?.title} &bull; {project?.referenceStyle?.toUpperCase() || 'APA'} Style</p>

        {error && (
          <div style={{ padding: '12px 16px', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
            ⚠️ {error}
          </div>
        )}

        {showAbstractPaymentModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
            <div style={{ backgroundColor: colors.surface, borderRadius: '16px', padding: '40px', textAlign: 'center', minWidth: '320px' }}>
              <p style={{ color: colors.text, fontWeight: '600', fontSize: '16px', marginBottom: '16px' }}>
                {processingAbstractPayment ? 'Processing payment...' : `Pay ${fmt(PRICES_USD.abstractRegen)} to regenerate abstract?`}
              </p>
              {processingAbstractPayment ? (
                <div style={{ width: '48px', height: '48px', border: `4px solid ${colors.primary}`, borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto', animation: 'spin 0.8s linear infinite' }} />
              ) : (
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button onClick={handleAbstractPaymentCancel} style={{ padding: '10px 24px', backgroundColor: colors.border, color: colors.text, border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
                  <button onClick={handleAbstractPaymentConfirm} style={{ padding: '10px 24px', backgroundColor: '#7c3aed', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>Pay {fmt(PRICES_USD.abstractRegen, false)}</button>
                </div>
              )}
            </div>
          </div>
        )}

        {generating && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
            <div style={{ backgroundColor: colors.surface, borderRadius: '16px', padding: '40px', textAlign: 'center', minWidth: '320px' }}>
              <div style={{ width: '48px', height: '48px', border: `4px solid ${colors.primary}`, borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 20px', animation: 'spin 0.8s linear infinite' }} />
              <p style={{ color: colors.text, fontWeight: '600', fontSize: '16px', marginBottom: '8px' }}>Generating Your Document</p>
              <p style={{ color: colors.textSecondary, fontSize: '13px' }}>{progress}</p>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Section 1: Chapter Selection */}
          <div style={{ backgroundColor: colors.surface, borderRadius: '12px', padding: '24px', border: `1px solid ${colors.border}` }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: colors.text, marginBottom: '4px' }}>Select Chapters to Include</h2>
            <p style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '16px' }}>Choose which chapters to merge into the final document. Proposal is excluded.</p>
            {contentChapters.length === 0 ? (
              <p style={{ color: colors.textSecondary, fontSize: '14px' }}>No chapters available. Generate content first.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {contentChapters.map(ch => (
                  <label key={ch.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', backgroundColor: isDarkMode ? '#2d2d2d' : '#f9fafb', borderRadius: '8px', border: `1px solid ${colors.border}`, cursor: 'pointer' }}>
                    <input type="checkbox" checked={selectedChapterIds.includes(ch.id)} onChange={() => toggleChapter(ch.id)} style={{ width: '18px', height: '18px', accentColor: colors.primary }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '500', color: colors.text, fontSize: '14px' }}>{getChapterDisplayTitle(ch)}</div>
                      <div style={{ fontSize: '12px', color: colors.textSecondary }}>{ch.subsections?.filter(s => s.generated).length || 0} subsections generated</div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Template Upload */}
          <div style={{ backgroundColor: colors.surface, borderRadius: '12px', padding: '24px', border: `1px solid ${colors.border}` }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: colors.text, marginBottom: '4px' }}>University Template (Optional)</h2>
            <p style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '16px' }}>Upload your university's .docx or .pdf thesis format guide. The app will extract the section order, fonts, margins, and styling.</p>

            <div style={{ border: `2px dashed ${colors.border}`, borderRadius: '8px', padding: '24px', textAlign: 'center' }}>
              <input type="file" id="template-upload" accept=".docx,.pdf" style={{ display: 'none' }} onChange={handleTemplateUpload} />
              <label htmlFor="template-upload" style={{ backgroundColor: colors.primary, color: 'white', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', display: 'inline-block', fontSize: '14px' }}>
                📎 Upload Template
              </label>
              {templateFileName && (
                <p style={{ marginTop: '12px', fontSize: '13px', color: '#059669' }}>✓ Loaded: {templateFileName}</p>
              )}
              <p style={{ marginTop: '8px', fontSize: '12px', color: colors.textSecondary }}>Supported: .docx, .pdf</p>
            </div>
          </div>

          {/* Section 3: Placeholder Fields */}
          <div style={{ backgroundColor: colors.surface, borderRadius: '12px', padding: '24px', border: `1px solid ${colors.border}` }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: colors.text, marginBottom: '4px' }}>Personal Details</h2>
            <p style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '16px' }}>Fill in the fields below. Blanks will appear as placeholders in the document.</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {PLACEHOLDER_FIELDS.map(field => (
                <div key={field.key}>
                  <label style={labelStyle}>{field.label}</label>
                  <input
                    style={inputStyle}
                    value={placeholders[field.key] || ''}
                    onChange={(e) => updatePlaceholder(field.key, e.target.value)}
                    placeholder={`[${field.label}]`}
                  />
                </div>
              ))}
            </div>

          {/* Dedication Section */}
            <div style={{ marginTop: '16px', padding: '16px', backgroundColor: isDarkMode ? '#1f2937' : '#fefce8', borderRadius: '8px', border: `1px solid ${colors.border}` }}>
              <label style={{ fontWeight: '600', color: colors.text, marginBottom: '8px', display: 'block' }}>🙏 Dedication</label>
              <p style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '8px' }}>List who you want to dedicate this work to (one per line, order of priority):</p>
              <textarea
                style={{ ...textareaStyle, minHeight: '60px' }}
                value={dedicationNames}
                onChange={(e) => { setDedicationNames(e.target.value); setDedicationGenerated(false); }}
                placeholder="My parents, Mr. &amp; Mrs. Mensah&#10;My supervisor, Dr. Kwame Asare&#10;My siblings"
                disabled={dedicationGenerated}
              />
              <button
                onClick={handleGenerateDedication}
                disabled={generatingDedication || dedicationGenerated || !dedicationNames.trim()}
                style={{
                  marginTop: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: '600',
                  backgroundColor: dedicationGenerated ? '#d1d5db' : (generatingDedication ? colors.border : colors.primary),
                  color: dedicationGenerated ? '#6b7280' : 'white',
                  border: 'none', borderRadius: '6px',
                  cursor: dedicationGenerated ? 'not-allowed' : (generatingDedication ? 'not-allowed' : 'pointer'),
                  opacity: dedicationGenerated ? 0.7 : 1,
                }}
              >
                {generatingDedication ? '⏳ Generating...' : dedicationGenerated ? '✅ Generated' : '🤖 Generate Dedication'}
              </button>
              <textarea
                style={{ ...textareaStyle, minHeight: '100px', marginTop: '12px' }}
                value={placeholders.dedicationText || ''}
                onChange={(e) => updatePlaceholder('dedicationText', e.target.value)}
                placeholder="[Your dedication text will appear here after generation, or write your own]"
              />
            </div>

            {/* Acknowledgements Section */}
            <div style={{ marginTop: '16px', padding: '16px', backgroundColor: isDarkMode ? '#1f2937' : '#f0fdf4', borderRadius: '8px', border: `1px solid ${colors.border}` }}>
              <label style={{ fontWeight: '600', color: colors.text, marginBottom: '8px', display: 'block' }}>🙏 Acknowledgements</label>
              <p style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '8px' }}>List who you want to acknowledge (one per line, order of priority):</p>
              <textarea
                style={{ ...textareaStyle, minHeight: '60px' }}
                value={acknowledgementNames}
                onChange={(e) => { setAcknowledgementNames(e.target.value); setAcknowledgementGenerated(false); }}
                placeholder="My supervisor, Dr. Kwame Asare&#10;My lecturers at the department&#10;My family and friends"
                disabled={acknowledgementGenerated}
              />
              <button
                onClick={handleGenerateAcknowledgements}
                disabled={generatingAcknowledgements || acknowledgementGenerated || !acknowledgementNames.trim()}
                style={{
                  marginTop: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: '600',
                  backgroundColor: acknowledgementGenerated ? '#d1d5db' : (generatingAcknowledgements ? colors.border : colors.primary),
                  color: acknowledgementGenerated ? '#6b7280' : 'white',
                  border: 'none', borderRadius: '6px',
                  cursor: acknowledgementGenerated ? 'not-allowed' : (generatingAcknowledgements ? 'not-allowed' : 'pointer'),
                  opacity: acknowledgementGenerated ? 0.7 : 1,
                }}
              >
                {generatingAcknowledgements ? '⏳ Generating...' : acknowledgementGenerated ? '✅ Generated' : '🤖 Generate Acknowledgements'}
              </button>
              <textarea
                style={{ ...textareaStyle, minHeight: '100px', marginTop: '12px' }}
                value={placeholders.acknowledgementsText || ''}
                onChange={(e) => updatePlaceholder('acknowledgementsText', e.target.value)}
                placeholder="[Your acknowledgements text will appear here after generation, or write your own]"
              />
            </div>

            <div style={{ marginTop: '16px' }}>
              <label style={labelStyle}>Abstract</label>
              <textarea
                style={{ ...textareaStyle, minHeight: '120px' }}
                value={placeholders.abstractText || ''}
                onChange={(e) => updatePlaceholder('abstractText', e.target.value)}
                placeholder="[Write your abstract here or leave blank for AI generation]"
              />
              <button
                onClick={handleGenerateAbstractClick}
                disabled={generatingAbstract}
                style={{
                  marginTop: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: '600',
                  backgroundColor: generatingAbstract ? colors.border : '#7c3aed',
                  color: 'white', border: 'none', borderRadius: '6px',
                  cursor: generatingAbstract ? 'not-allowed' : 'pointer',
                  opacity: generatingAbstract ? 0.7 : 1,
                }}
              >
                {generatingAbstract ? '⏳ Generating...' : '🤖 Generate Abstract from Thesis'}
              </button>
            </div>
          </div>

          {/* Section 4: Front Matter */}
          <div style={{ backgroundColor: colors.surface, borderRadius: '12px', padding: '24px', border: `1px solid ${colors.border}` }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: colors.text, marginBottom: '4px' }}>Preliminary Pages</h2>
            <p style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '16px' }}>Toggle which front matter sections to include.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {FRONT_MATTER_OPTIONS.map(option => (
                <label key={option.key} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', backgroundColor: frontMatter[option.key] ? (isDarkMode ? '#2d2d2d' : '#f5f3ff') : 'transparent' }}>
                  <input type="checkbox" checked={frontMatter[option.key]} onChange={() => toggleFrontMatter(option.key)} style={{ width: '18px', height: '18px', accentColor: colors.primary }} />
                  <span style={{ fontSize: '14px', color: colors.text }}>{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Section 5: References Info */}
          <div style={{ backgroundColor: colors.surface, borderRadius: '12px', padding: '24px', border: `1px solid ${colors.border}` }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: colors.text, marginBottom: '4px' }}>References</h2>
            <p style={{ fontSize: '13px', color: colors.textSecondary }}>
              All in-text citations from selected chapters will be collected, deduplicated, matched against grounded sources, sorted alphabetically, and formatted in {project?.referenceStyle?.toUpperCase() || 'APA'} style.
            </p>
          </div>

          {/* Section 6: Appendices */}
          {instruments.length > 0 && (
            <div style={{ backgroundColor: colors.surface, borderRadius: '12px', padding: '24px', border: `1px solid ${colors.border}` }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: colors.text, marginBottom: '4px' }}>Appendices — Data Collection Instruments</h2>
              <p style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '16px' }}>Select instruments to include as appendices.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {instruments.map(inst => (
                  <label key={inst.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', backgroundColor: isDarkMode ? '#2d2d2d' : '#f9fafb', borderRadius: '8px', border: `1px solid ${colors.border}`, cursor: 'pointer' }}>
                    <input type="checkbox" checked={selectedInstrumentIds.includes(inst.id)} onChange={() => toggleInstrument(inst.id)} style={{ width: '18px', height: '18px', accentColor: colors.primary }} />
                    <span style={{ fontSize: '14px', color: colors.text }}>{inst.icon || '📋'} {inst.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Generate Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '40px', flexWrap: 'wrap' }}>
            <button
              onClick={handleGenerate}
              disabled={generating || selectedChapterIds.length === 0}
              style={{
                flex: '1 1 180px', padding: '14px 12px', fontSize: '14px', fontWeight: '700',
                backgroundColor: generating ? colors.textSecondary : '#059669',
                color: 'white', border: 'none', borderRadius: '10px',
                cursor: generating || selectedChapterIds.length === 0 ? 'not-allowed' : 'pointer',
                opacity: generating ? 0.6 : 1,
                transition: 'all 0.2s',
              }}
            >
              {generating ? 'Generating...' : '⚡ Download .docx'}
            </button>
            <button
              onClick={handleGeneratePdf}
              disabled={generating || selectedChapterIds.length === 0}
              style={{
                flex: '1 1 180px', padding: '14px 12px', fontSize: '14px', fontWeight: '700',
                backgroundColor: generating ? colors.textSecondary : colors.primary,
                color: 'white', border: 'none', borderRadius: '10px',
                cursor: generating || selectedChapterIds.length === 0 ? 'not-allowed' : 'pointer',
                opacity: generating ? 0.6 : 1,
                transition: 'all 0.2s',
              }}
            >
              {generating ? 'Generating...' : '🖨️ Save as PDF'}
            </button>
            <button
              onClick={handleGenerateLatex}
              disabled={generating || selectedChapterIds.length === 0}
              style={{
                flex: '1 1 180px', padding: '14px 12px', fontSize: '14px', fontWeight: '700',
                backgroundColor: generating ? colors.textSecondary : '#dc2626',
                color: 'white', border: 'none', borderRadius: '10px',
                cursor: generating || selectedChapterIds.length === 0 ? 'not-allowed' : 'pointer',
                opacity: generating ? 0.6 : 1,
                transition: 'all 0.2s',
              }}
            >
              {generating ? 'Generating...' : '📄 Download .tex'}
            </button>
            <button
              onClick={handleGenerateMarkdown}
              disabled={generating || selectedChapterIds.length === 0}
              style={{
                flex: '1 1 180px', padding: '14px 12px', fontSize: '14px', fontWeight: '700',
                backgroundColor: generating ? colors.textSecondary : '#2563eb',
                color: 'white', border: 'none', borderRadius: '10px',
                cursor: generating || selectedChapterIds.length === 0 ? 'not-allowed' : 'pointer',
                opacity: generating ? 0.6 : 1,
                transition: 'all 0.2s',
              }}
            >
              {generating ? 'Generating...' : '📝 Download .md'}
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default MergeDocument;