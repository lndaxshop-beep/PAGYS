import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import LeftPane from '../components/writing/LeftPane';
import DataCollectionModal from '../components/instruments/DataCollectionModal';
import UploadFindings from '../components/UploadFindings';
import WordCountModal from '../components/WordCountModal';
import LiteratureReviewTypeModal from '../components/LiteratureReviewTypeModal';
import { useToast, ToastContainer } from '../hooks/useToast.jsx';
import ConfirmModal from '../components/ConfirmModal';
import { useUndoRedo } from '../hooks/useAutoSave';
import useWriteChapter from '../hooks/useWriteChapter';
import useWriteContent from '../hooks/useWriteContent';
import useWriteNavigation from '../hooks/useWriteNavigation';
import { useWriteModals } from '../hooks/useWriteModals';
import { useWriteVisuals } from '../hooks/useWriteVisuals';
import { calculateOverallProgress, isHumaniseAvailable, isFeedbackAvailable } from '../utils/writeHelpers.jsx';
import WriteHeader from '../components/writing/WriteHeader';
import CurrentSubsectionBanner from '../components/writing/CurrentSubsectionBanner';
import ContentArea from '../components/writing/ContentArea';
import ContentButtons from '../components/writing/ContentButtons';
import ChapterStructureModal from '../components/writing/ChapterStructureModal';
import FeedbackModal from '../components/writing/FeedbackModal';
import { saveChapters, getChapters, saveGeneratedContent, getGeneratedContent, saveCitations, getCitations, saveVisualData, getVisualData } from '../services/firestoreService';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

const Write = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { colors, isDarkMode } = useTheme();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingSubtopics, setGeneratingSubtopics] = useState(false);
  const [generatingAll, setGeneratingAll] = useState(null);
  const [humaniseUsed, setHumaniseUsed] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`humaniseUsed_${projectId}`) || '{}'); } catch { return {}; }
  });
  const [feedbackUsed, setFeedbackUsed] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`feedbackUsed_${projectId}`) || '{}'); } catch { return {}; }
  });
  const [currentContent, setCurrentContent] = useState('');
  const [currentSubsectionIndex, setCurrentSubsectionIndex] = useState(0);
  const [generatedSubsections, setGeneratedSubsections] = useState({});
  const [chapterCitations, setChapterCitations] = useState({});
  const [uploadedFindings, setUploadedFindings] = useState(null);
  const [instrumentsCompleted, setInstrumentsCompleted] = useState(() => {
    try {
      const saved = localStorage.getItem(`instruments_${projectId}`);
      return saved ? JSON.parse(saved).length > 0 : false;
    } catch { return false; }
  });
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);
  const [showReferenceInTextarea, setShowReferenceInTextarea] = useState(false);
  const [diagramData, setDiagramData] = useState({});
  const [chartData, setChartData] = useState({});
  const [tableData, setTableData] = useState({});
  const [isViewingReferences, setIsViewingReferences] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(true);
  const [confirmModal, setConfirmModal] = useState(null);

  const modals = useWriteModals();
  const { toasts, addToast, removeToast, success: toastSuccess, error: toastError } = useToast();
  const { state: editorContent, set: setEditorContent, undo, redo, canUndo, canRedo } = useUndoRedo('');

  const { chapters, setChapters, activeChapter, setActiveChapter, chapterWordCounts, setChapterWordCounts, chapterWordCountSet, setChapterWordCountSet, initializeEmptyChapters, handleDeleteSubsection, handleRestoreSubsection, handleDrop, generateSubtopicsForChapter, buildSubsectionsFromHeadings, previewSubtopics } = useWriteChapter(project, projectId, { saveChapters, saveGeneratedContent, saveCitations, saveVisualData });

  const currentChapter = chapters.find(c => c.id === activeChapter);
  const activeSubsections = currentChapter?.subsections.filter(s => s.title !== 'References' && !s.deleted) || [];
  const currentSubsection = isViewingReferences ? { title: 'References', generated: true } : activeSubsections[currentSubsectionIndex];

  const { generating, generatingVisual, humanising, humaniseLimit, feedbackLimit, handleGenerateConceptualFramework, handleGenerateTheoreticalFramework, handleGenerateResearchDesign, handleGenerateTable, handleGenerateChart, handleGenerateCurrent, generateSubsectionContent, handleGenerateReferences, handleHumanise, handleApplyFeedback, preRenderDiagrams } = useWriteContent(project, activeChapter, currentSubsection, currentSubsectionIndex, chapters, generatedSubsections, chapterCitations, uploadedFindings, modals.literatureReviewType, humaniseUsed, feedbackUsed, isViewingReferences);

  const { handleChapterClick, handleChapterStructureSubmit, handleWordCountSubmit, handleCustomizeSubsection, handleRenameSubsection, handleAddSubsection, handlePrevSubsection, handleNextSubsection, isChapterComplete, handleCompleteChapter } = useWriteNavigation(project, projectId, navigate, chapters, setChapters, activeChapter, setActiveChapter, currentSubsectionIndex, setCurrentSubsectionIndex, generatedSubsections, chapterWordCounts, chapterWordCountSet, setChapterWordCounts, setChapterWordCountSet, generateSubtopicsForChapter, buildSubsectionsFromHeadings, handleDrop, handleGenerateCurrent, modals.literatureReviewType);

  const visuals = useWriteVisuals(handleGenerateConceptualFramework, handleGenerateTheoreticalFramework, handleGenerateResearchDesign, handleGenerateTable, handleGenerateChart, toastSuccess, toastError);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    handlers: {
      save: () => {
        const saveBtn = document.querySelector('[data-save-btn]');
        if (saveBtn) saveBtn.click();
        toastSuccess('Content saved');
      },
      undo: canUndo ? undo : null,
      redo: canRedo ? redo : null,
      toggleEdit: () => setIsPreviewMode(prev => !prev),
      escape: () => {
        modals.setShowFeedbackModal(false);
        modals.setShowWordCountModal(false);
        modals.setShowLiteratureTypeModal(false);
        modals.setShowChapterStructureModal(false);
        modals.setShowDataCollectionModal(false);
      }
    }
  });

  useEffect(() => {
    const loadProject = async () => {
      try {
        const { getProjects: fbGetProjects } = await import('../services/firestoreService');
        const projects = await fbGetProjects();
        const currentProject = projects.find(p => p.id.toString() === projectId);
        if (currentProject) {
          setProject(currentProject);
          const savedChapters = await getChapters(projectId);
          if (savedChapters?.length) {
            setChapters(savedChapters);
            const wc = {}, wcs = {};
            savedChapters.forEach(ch => {
              if (ch.wordCount) { wc[ch.id] = ch.wordCount; wcs[ch.id] = true; }
              else if (ch.subsections?.length > 0 || ch.generated) { wc[ch.id] = { min: 1000, max: 2000 }; wcs[ch.id] = true; }
            });
            setChapterWordCounts(wc);
            setChapterWordCountSet(wcs);
          } else {
            initializeEmptyChapters(currentProject);
          }
          const savedContent = await getGeneratedContent(projectId);
          if (savedContent && Object.keys(savedContent).length) setGeneratedSubsections(savedContent);
          const savedCitations = await getCitations(projectId);
          if (savedCitations && Object.keys(savedCitations).length) setChapterCitations(savedCitations);
          const vd = await getVisualData(projectId);
          if (vd.diagrams) setDiagramData(vd.diagrams);
          if (vd.charts) setChartData(vd.charts);
          if (vd.tables) setTableData(vd.tables);
        } else {
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Error loading project:', error);
        navigate('/dashboard');
      }
      setLoading(false);
    };
    loadProject();
  }, [projectId, navigate]);

  useEffect(() => { if (projectId && Object.keys(generatedSubsections).length) saveGeneratedContent(projectId, generatedSubsections).catch(e => console.error('Auto-save generated content failed:', e)); }, [generatedSubsections, projectId]);
  useEffect(() => { if (projectId && Object.keys(chapterCitations).length) saveCitations(projectId, chapterCitations).catch(e => console.error('Auto-save citations failed:', e)); }, [chapterCitations, projectId]);
  useEffect(() => { if (projectId && Object.keys(diagramData).length) saveVisualData(projectId, 'diagrams', diagramData).catch(e => console.error('Auto-save diagrams failed:', e)); }, [diagramData, projectId]);
  useEffect(() => { if (projectId && Object.keys(chartData).length) saveVisualData(projectId, 'charts', chartData).catch(e => console.error('Auto-save charts failed:', e)); }, [chartData, projectId]);
  useEffect(() => { if (projectId && Object.keys(tableData).length) saveVisualData(projectId, 'tables', tableData).catch(e => console.error('Auto-save tables failed:', e)); }, [tableData, projectId]);

  useEffect(() => { try { localStorage.setItem(`humaniseUsed_${projectId}`, JSON.stringify(humaniseUsed)); } catch {} }, [humaniseUsed, projectId]);
  useEffect(() => { try { localStorage.setItem(`feedbackUsed_${projectId}`, JSON.stringify(feedbackUsed)); } catch {} }, [feedbackUsed, projectId]);

  useEffect(() => {
    const onPremiumActivated = () => setProject(prev => prev ? { ...prev, isPremium: true } : prev);
    window.addEventListener('premiumActivated', onPremiumActivated);
    return () => window.removeEventListener('premiumActivated', onPremiumActivated);
  }, []);

  const handleDeleteWithUndo = (subsectionId, chapterId) => {
    const chapter = chapters.find(c => c.id === (chapterId || activeChapter));
    const sub = chapter?.subsections.find(s => s.id === subsectionId);
    handleDeleteSubsection(subsectionId, chapterId);
    if (sub) {
      addToast(`"${sub.title}" deleted`, 'info', 5000, {
        label: 'Undo',
        onClick: () => handleRestoreSubsection(subsectionId, chapterId)
      });
    }
  };

  const handleDragStart = (e, index) => {
    const subsection = chapters.find(c => c.id === activeChapter)?.subsections[index];
    if (subsection?.title === 'References') { e.preventDefault(); return; }
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => { e.preventDefault(); setDragOverItem(index); };
  const handleDragEnd = () => { setDraggedItem(null); setDragOverItem(null); };

  const handleWrappedDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === dropIndex) { setDraggedItem(null); setDragOverItem(null); return; }
    handleDrop(draggedItem, dropIndex);
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleWrappedGenerateSubtopics = async (chapterId, referenceData = null) => {
    setGeneratingSubtopics(true);
    try {
      await generateSubtopicsForChapter(chapterId, referenceData);
    } finally {
      setGeneratingSubtopics(false);
    }
  };

  const wrappedHandleChapterClick = async (chapterId) => {
    const result = await handleChapterClick(chapterId);
    if (!result) return;
    if (result.action === 'showStructure') { modals.setPendingChapterForStructure(chapterId); modals.setShowChapterStructureModal(true); }
    else if (result.action === 'showLitType') { modals.setShowLiteratureTypeModal(true); modals.setPendingChapterForStructure(chapterId); }
    else if (result.action === 'showWordCount') { modals.setShowWordCountModal(true); modals.setPendingChapterAfterWordCount(chapterId); }
    else if (result.action === 'openChapter') {
      setActiveChapter(chapterId); setIsViewingReferences(false); setIsPreviewMode(true);
      const idx = result.firstIndex; setCurrentSubsectionIndex(idx >= 0 ? idx : 0);
      setCurrentContent(result.content); setShowReferenceInTextarea(false);
      if (result.needsSubtopics) handleWrappedGenerateSubtopics(chapterId);
    }
  };

  const wrappedHandleChapterStructureSubmit = async (referenceData) => {
    const setUploadedFiles = modals.setUploadedStructureFile;
    const result = await handleChapterStructureSubmit(referenceData, modals.pendingChapterForStructure, instrumentsCompleted, modals.setShowUploadFindings, modals.setShowWordCountModal, modals.setPendingChapterAfterWordCount, modals.setPendingChapterForStructure, modals.setShowChapterStructureModal, setUploadedFiles, setActiveChapter, setIsViewingReferences, setIsPreviewMode, setCurrentSubsectionIndex, setCurrentContent);
    if (result?.action === 'error') toastError(result.message);
  };

  const handlePreview = async (chapterId, referenceData) => {
    return await previewSubtopics(chapterId, referenceData);
  };

  const wrappedHandleWordCountSubmit = (range, useCustom) => {
    handleWordCountSubmit(range, useCustom, modals.pendingChapterAfterWordCount, modals.setShowWordCountModal);
    modals.setShowWordCountModal(false);
    if (modals.pendingChapterAfterWordCount) {
      const chapter = chapters.find(c => c.id === modals.pendingChapterAfterWordCount);
      if (chapter) {
        setActiveChapter(modals.pendingChapterAfterWordCount); setIsViewingReferences(false); setIsPreviewMode(true);
        const idx = chapter.subsections.findIndex(s => s.title !== 'References');
        setCurrentSubsectionIndex(idx >= 0 ? idx : 0); setCurrentContent(''); setShowReferenceInTextarea(false);
      }
    }
    modals.setPendingChapterAfterWordCount(null);
  };

  const wrappedHandlePrevSubsection = () => {
    const result = handlePrevSubsection();
    if (result?.action === 'prev' && result.index >= 0) {
      setCurrentSubsectionIndex(result.index); setIsViewingReferences(false); setIsPreviewMode(true);
      setCurrentContent(generatedSubsections[activeChapter]?.[activeSubsections[result.index].title] || '');
      setShowReferenceInTextarea(false);
    }
  };

  const wrappedHandleNextSubsection = () => {
    const result = handleNextSubsection(activeSubsections);
    if (result?.action === 'next') {
      setCurrentSubsectionIndex(result.index); setIsViewingReferences(false); setIsPreviewMode(true);
      setCurrentContent(generatedSubsections[activeChapter]?.[activeSubsections[result.index].title] || '');
      setShowReferenceInTextarea(false);
    }
  };

  const wrappedHandleCompleteChapter = async () => {
    const result = await handleCompleteChapter();
    if (result.action === 'error') { toastError(result.message); return; }
    if (result.action === 'showDataCollection') { modals.setShowDataCollectionModal(true); return; }
    if (result.action === 'navigateFiles') { navigate('/myfiles'); return; }
    if (result.action === 'nextChapter') {
      setConfirmModal({
        title: 'Chapter Completed',
        message: `${result.chapterTitle} completed! Continue to the next chapter?`,
        confirmText: 'Continue',
        onConfirm: () => {
          setActiveChapter(result.nextChapterId); setIsViewingReferences(false); setIsPreviewMode(true);
          setCurrentSubsectionIndex(0); setCurrentContent(''); setShowReferenceInTextarea(false);
          setConfirmModal(null);
        },
        onCancel: () => setConfirmModal(null),
      });
    }
  };

  const openFeedbackModal = (subsection) => {
    modals.setCurrentFeedbackSubsection(subsection);
    modals.setFeedbackText('');
    modals.setFeedbackFiles([]);
    modals.setShowFeedbackModal(true);
  };

  const wrappedGenerateCurrent = async () => {
    try {
      const result = await handleGenerateCurrent(activeSubsections);
      if (!result || result.error) { toastError(result?.message || 'Generation failed.'); return; }
      if (result.skipped) return;
      const { content, citations, subsectionId, subsectionTitle } = result;
      setChapterCitations(prev => ({ ...prev, [activeChapter]: [...new Set([...(prev[activeChapter] || []), ...citations])] }));
      setGeneratedSubsections(prev => ({ ...prev, [activeChapter]: { ...prev[activeChapter], [subsectionTitle]: content } }));
      setCurrentContent(content);
      setChapters(prev => prev.map(ch => ch.id === activeChapter ? { ...ch, subsections: ch.subsections.map(s => s.id === subsectionId ? { ...s, generated: true } : s) } : ch));
      setIsPreviewMode(true);
      preRenderDiagrams(content, isDarkMode).then(rendered => {
        if (rendered && Object.keys(rendered).length > 0) {
          const existing = JSON.parse(localStorage.getItem(`diagramSVGs_${projectId}`) || '{}');
          localStorage.setItem(`diagramSVGs_${projectId}`, JSON.stringify({ ...existing, [`${activeChapter}_${subsectionTitle}`]: rendered }));
        }
      });
    } catch (error) {
      console.error('Generation failed:', error);
      toastError('Failed to generate content. Please try again.');
    }
  };

  const wrappedGenerateReferences = async () => {
    if (currentSubsection && currentSubsection.title !== 'References') {
      setGeneratedSubsections(prev => ({ ...prev, [activeChapter]: { ...prev[activeChapter], [currentSubsection.title]: currentContent } }));
    }
    const result = await handleGenerateReferences(currentChapter, currentContent);
    if (!result || result.error) { toastError(result?.message || 'References generation failed.'); return; }
    const { content, usedGrounding } = result;
    setCurrentContent(content); setShowReferenceInTextarea(true); setIsViewingReferences(true); setIsPreviewMode(true);
    setChapters(prev => prev.map(ch => ch.id === activeChapter ? { ...ch, subsections: ch.subsections.map(s => s.title === 'References' ? { ...s, generated: true } : s) } : ch));
    setGeneratedSubsections(prev => ({ ...prev, [activeChapter]: { ...prev[activeChapter], references: content } }));
    toastSuccess(usedGrounding ? 'References generated from real sources!' : 'References generated from citations. Verify entries before submitting.');
  };

  const wrappedHandleSubsectionClick = (subsectionTitle) => {
    const activeSubs = currentChapter?.subsections.filter(s => s.title !== 'References' && !s.deleted) || [];
    if (subsectionTitle === 'References') {
      const allOthersGenerated = activeSubs.length > 0 && activeSubs.every(s => s.generated);
      if (!allOthersGenerated) { toastError('Please generate all other subsections first.'); return; }
      wrappedGenerateReferences(); return;
    }
    const index = activeSubs.findIndex(s => s.title === subsectionTitle);
    if (index !== -1) {
      setCurrentSubsectionIndex(index); setIsViewingReferences(false); setIsPreviewMode(true);
      setCurrentContent(generatedSubsections[activeChapter]?.[activeSubs[index].title] || '');
      setShowReferenceInTextarea(false);
    }
  };

  const wrappedHumanise = async () => {
    if (!currentContent) { toastError('No content to humanise.'); return; }
    const result = await handleHumanise(currentContent);
    if (!result || result.error) { toastError(result?.message || 'Humanise failed.'); return; }
    const { humanisedText, humaniseKey } = result;
    setCurrentContent(humanisedText);
    if (currentSubsection) setGeneratedSubsections(prev => ({ ...prev, [activeChapter]: { ...prev[activeChapter], [currentSubsection.title]: humanisedText } }));
    setHumaniseUsed(prev => ({ ...prev, [humaniseKey]: (prev[humaniseKey] || 0) + 1 }));
  };

  const wrappedApplyFeedback = async () => {
    if (!modals.feedbackText && modals.feedbackFiles.length === 0) { toastError('Please enter feedback or upload files'); return; }
    const currentContentText = generatedSubsections[activeChapter]?.[modals.currentFeedbackSubsection.title] || '';
    const result = await handleApplyFeedback(currentContentText, modals.feedbackText, modals.feedbackFiles, modals.currentFeedbackSubsection);
    if (!result || result.error) { toastError(result?.message || 'Feedback application failed.'); return; }
    const { modifiedContent, feedbackKey } = result;
    setGeneratedSubsections(prev => ({ ...prev, [activeChapter]: { ...prev[activeChapter], [modals.currentFeedbackSubsection.title]: modifiedContent } }));
    if (currentSubsection?.title === modals.currentFeedbackSubsection.title) setCurrentContent(modifiedContent);
    setFeedbackUsed(prev => ({ ...prev, [feedbackKey]: (prev[feedbackKey] || 0) + 1 }));
    toastSuccess('Feedback applied successfully!');
    modals.setShowFeedbackModal(false); modals.setCurrentFeedbackSubsection(null); modals.setFeedbackText(''); modals.setFeedbackFiles([]);
  };

  const handleEditWordCount = () => { modals.setShowWordCountModal(true); };
  const handleLiteratureTypeSubmit = (type) => {
    modals.setLiteratureReviewType(type);
    modals.setShowLiteratureTypeModal(false);
    if (modals.pendingChapterForStructure) modals.setShowChapterStructureModal(true);
  };

  const handleUploadFindings = (findingsData) => {
    setUploadedFindings(findingsData); modals.setShowUploadFindings(false);
    generateSubtopicsForChapter('chapter4');
    if (!chapterWordCountSet['chapter4']) { modals.setShowWordCountModal(true); modals.setPendingChapterAfterWordCount('chapter4'); }
    else { setActiveChapter('chapter4'); setIsViewingReferences(false); setIsPreviewMode(true);
      const idx = chapters.find(c => c.id === 'chapter4')?.subsections.findIndex(s => s.title !== 'References') || 0;
      setCurrentSubsectionIndex(idx); setCurrentContent(''); }
  };
  const handleGenerateWithAI = () => { modals.setShowUploadFindings(false); generateSubtopicsForChapter('chapter4');
    if (!chapterWordCountSet['chapter4']) { modals.setShowWordCountModal(true); modals.setPendingChapterAfterWordCount('chapter4'); }
    else { setActiveChapter('chapter4'); setIsViewingReferences(false); setIsPreviewMode(true);
      const idx = chapters.find(c => c.id === 'chapter4')?.subsections.findIndex(s => s.title !== 'References') || 0;
      setCurrentSubsectionIndex(idx); setCurrentContent(''); }
  };

  const handleGenerateAll = async (chapterId) => {
    const chapter = chapters.find(c => c.id === chapterId);
    if (!chapter) return;
    const subs = chapter.subsections.filter(s => !s.generated && s.title !== 'References' && !s.deleted);
    if (subs.length === 0) { toastError('All subsections already generated.'); return; }
    setGeneratingAll({ total: subs.length, completed: 0, errors: 0, chapterId });
    const activeSubsList = chapter.subsections.filter(s => !s.deleted);
    let errorCount = 0;
    for (let i = 0; i < subs.length; i++) {
      const sub = subs[i];
      const subIndex = activeSubsList.findIndex(s => s.id === sub.id);
      if (subIndex === -1) continue;
      const result = await generateSubsectionContent(chapterId, sub.title, sub.id, subIndex, activeSubsList);
      if (result?.error) { errorCount++; setGeneratingAll(prev => prev ? { ...prev, errors: prev.errors + 1, completed: prev.completed + 1 } : null); continue; }
      if (result?.skipped) { setGeneratingAll(prev => prev ? { ...prev, completed: prev.completed + 1 } : null); continue; }
      setChapterCitations(prev => ({ ...prev, [chapterId]: [...new Set([...(prev[chapterId] || []), ...result.citations])] }));
      setGeneratedSubsections(prev => ({ ...prev, [chapterId]: { ...prev[chapterId], [result.subsectionTitle]: result.content } }));
      setChapters(prev => prev.map(ch => ch.id === chapterId ? { ...ch, subsections: ch.subsections.map(s => s.id === result.subsectionId ? { ...s, generated: true } : s) } : ch));
      setGeneratingAll(prev => prev ? { ...prev, completed: prev.completed + 1 } : null);
    }
    setGeneratingAll(null);
    if (errorCount > 0) toastError(`${errorCount} subsection(s) failed to generate.`);
    else toastSuccess(`All ${subs.length} subsection(s) generated successfully!`);
  };

  const handleInstrumentsDownload = (downloadedTypes) => {
    setInstrumentsCompleted(true); modals.setShowDataCollectionModal(false);
    setChapters(prev => prev.map(ch => ch.id === 'chapter4' ? { ...ch, unlocked: true } : ch));
    try { localStorage.setItem(`instruments_${projectId}`, JSON.stringify(downloadedTypes || [])); } catch (e) { console.warn('Failed to cache instruments:', e); }
  };

  const overallProgress = calculateOverallProgress(chapters, generatedSubsections);
  const totalActive = activeSubsections.length;
  const generatedActive = activeSubsections.filter(s => s.generated).length;
  const chapterComplete = isChapterComplete();
  const referencesSub = currentChapter?.subsections.find(s => s.title === 'References');
  const refContent = generatedSubsections[activeChapter]?.references || generatedSubsections[activeChapter]?.['References'] || '';
  const referencesGenerated = referencesSub?.generated || (refContent && refContent.length > 0);

  const getButtonText = () => activeChapter === 'chapter5' ? 'Complete & View Files' : 'Complete & Continue';

  const humaniseLeft = humaniseLimit - (humaniseUsed[`${activeChapter}_${activeSubsections[currentSubsectionIndex]?.id}`] || 0);
  const feedbackLeft = feedbackLimit - (feedbackUsed[`${activeChapter}_${activeSubsections[currentSubsectionIndex]?.id}`] || 0);

  const handleSaveEdit = () => {
    if (currentSubsection && currentSubsection.title !== 'References') {
      setGeneratedSubsections(prev => ({ ...prev, [activeChapter]: { ...prev[activeChapter], [currentSubsection.title]: currentContent } }));
    }
    setIsPreviewMode(true);
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: colors.background, color: colors.text }}>Loading your thesis project...</div>;
  if (!project || !chapters.length) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: colors.background, color: colors.text }}>Project not found</div>;

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: colors.background }}>
      <div style={{ width: '400px', height: '100vh', overflowY: 'auto', backgroundColor: colors.surface }}>
        <LeftPane chapters={chapters} activeChapter={activeChapter} onChapterClick={wrappedHandleChapterClick} progress={overallProgress}
          onDeleteSubsection={handleDeleteWithUndo} onRestoreSubsection={handleRestoreSubsection} onCustomizeSubsection={handleCustomizeSubsection} onRenameSubsection={handleRenameSubsection}
          onAddSubsection={handleAddSubsection} onSubsectionClick={wrappedHandleSubsectionClick} generatingSubtopics={generatingSubtopics}
          generatedSubsections={generatedSubsections} onDragStart={handleDragStart} onDragOver={handleDragOver} onDrop={handleWrappedDrop}
          onDragEnd={handleDragEnd} draggedItem={draggedItem} dragOverItem={dragOverItem} chapterWordCounts={chapterWordCounts}
          generatingAll={generatingAll} onGenerateAll={handleGenerateAll} />
      </div>

      <div style={{ flex: 1, height: '100vh', overflowY: 'auto', backgroundColor: colors.surface, borderLeft: `1px solid ${colors.border}` }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 32px 80px' }}>
          <WriteHeader onBack={() => navigate('/dashboard')} onEditWordCount={handleEditWordCount} projectId={projectId} />

          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: colors.text, marginBottom: '8px' }}>{currentChapter?.title}</h1>
          <p style={{ color: colors.textSecondary, fontSize: '18px', marginBottom: '32px' }}>{project?.title || 'Thesis Project'} • {project?.referenceStyle?.toUpperCase() || 'APA'} Style</p>
          {humaniseLimit > 1 && (() => {
            const chHumanise = Object.entries(humaniseUsed).filter(([k]) => k.startsWith(activeChapter)).reduce((s, [,v]) => s + v, 0);
            const chFeedback = Object.entries(feedbackUsed).filter(([k]) => k.startsWith(activeChapter)).reduce((s, [,v]) => s + v, 0);
            const genCount = activeSubsections.filter(s => s.generated).length;
            const hMax = humaniseLimit * genCount || humaniseLimit;
            const fMax = feedbackLimit * genCount || feedbackLimit;
            return (
              <div style={{ fontSize: '12px', color: '#f59e0b', marginBottom: '12px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                <span>💎 Premium</span>
                <span>Humanise: {chHumanise}/{hMax} used</span>
                <span>Feedback: {chFeedback}/{fMax} used</span>
              </div>
            );
          })()}

          {generatingSubtopics ? (
            <div style={{ backgroundColor: colors.background, borderRadius: '12px', padding: '32px', textAlign: 'center', border: `1px solid ${colors.border}` }}>
              <p style={{ color: colors.primary }}>AI is generating appropriate subtopics for this chapter...</p>
            </div>
          ) : (
            <>
              <CurrentSubsectionBanner subsection={currentSubsection} currentIndex={currentSubsectionIndex} totalCount={activeSubsections.length} isViewingReferences={isViewingReferences} />

              <ContentArea
                content={currentContent}
                isPreviewMode={isPreviewMode}
                onTogglePreview={setIsPreviewMode}
                onSaveEdit={handleSaveEdit}
                onChange={setCurrentContent}
                currentSubsection={currentSubsection}
                showReferenceInTextarea={showReferenceInTextarea}
              />

              <ContentButtons
                isViewingReferences={isViewingReferences}
                currentSubsection={currentSubsection}
                currentSubsectionIndex={currentSubsectionIndex}
                activeSubsections={activeSubsections}
                generating={generating}
                humanising={humanising}
                chapterComplete={chapterComplete}
                overallProgress={overallProgress}
                generatedActive={generatedActive}
                totalActive={totalActive}
                referencesSub={referencesSub}
                referencesGenerated={referencesGenerated}
                onGenerate={wrappedGenerateCurrent}
                onHumanise={wrappedHumanise}
                onFeedback={openFeedbackModal}
                onPrev={wrappedHandlePrevSubsection}
                onNext={wrappedHandleNextSubsection}
                onComplete={wrappedHandleCompleteChapter}
                getButtonText={getButtonText}
                humaniseAvailable={humaniseLeft > 0}
                feedbackAvailable={feedbackLeft > 0}
                humaniseLeft={humaniseLeft}
                feedbackLeft={feedbackLeft}
              />
            </>
          )}
        </div>
      </div>

      {modals.showDataCollectionModal && project && <DataCollectionModal project={project} onClose={() => {}} onDownload={handleInstrumentsDownload} onNotify={toastError} />}
      {modals.showUploadFindings && project && <UploadFindings project={project} onClose={() => modals.setShowUploadFindings(false)} onUpload={handleUploadFindings} onGenerateWithAI={handleGenerateWithAI} />}
      {modals.showWordCountModal && <WordCountModal chapter={chapters.find(c => c.id === modals.pendingChapterAfterWordCount)} level={project?.level} currentWordCount={chapterWordCounts[modals.pendingChapterAfterWordCount]} onSubmit={handleWordCountSubmit} onClose={() => { modals.setShowWordCountModal(false); modals.setPendingChapterAfterWordCount(null); }} stepIndicator={modals.pendingChapterAfterWordCount === 'chapter2' && modals.literatureReviewType ? 'Step 3 of 3: Word Count' : undefined} />}
      {modals.showLiteratureTypeModal && <LiteratureReviewTypeModal topic={project?.title} field={project?.field} project={project} onSubmit={handleLiteratureTypeSubmit} onClose={() => { modals.setShowLiteratureTypeModal(false); modals.setPendingChapterForStructure(null); }} />}

      <ChapterStructureModal
        isOpen={modals.showChapterStructureModal}
        onClose={() => { modals.setShowChapterStructureModal(false); modals.setUploadedStructureFile(null); }}
        onSubmit={wrappedHandleChapterStructureSubmit}
        onPreview={(chapterId, referenceData) => handlePreview(chapterId, referenceData)}
        uploadedFiles={modals.uploadedStructureFile}
        setUploadedFiles={modals.setUploadedStructureFile}
        pendingChapter={modals.pendingChapterForStructure}
        onError={(msg) => toastError(msg)}
        stepIndicator={modals.pendingChapterForStructure === 'chapter2' && modals.literatureReviewType ? 'Step 2 of 3: Chapter Structure' : undefined}
      />

      <FeedbackModal
        isOpen={modals.showFeedbackModal}
        onClose={() => modals.setShowFeedbackModal(false)}
        subsection={modals.currentFeedbackSubsection}
        feedbackText={modals.feedbackText}
        setFeedbackText={modals.setFeedbackText}
        feedbackFiles={modals.feedbackFiles}
        onFileUpload={modals.handleFeedbackFileUpload}
        onRemoveFile={modals.handleRemoveFeedbackFile}
        onApply={wrappedApplyFeedback}
        applying={modals.applyingSubFeedback}
      />

      {confirmModal && (
        <ConfirmModal
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText={confirmModal.confirmText}
          onConfirm={confirmModal.onConfirm}
          onCancel={confirmModal.onCancel}
        />
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Write;