import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import LeftPane from '../components/writing/LeftPane';
import DataCollectionModal from '../components/instruments/DataCollectionModal';
import UploadFindings from '../components/UploadFindings';
import WordCountModal from '../components/WordCountModal';
import LiteratureReviewTypeModal from '../components/LiteratureReviewTypeModal';
import { useToast, ToastContainer } from '../hooks/useToast.jsx';
import ConfirmModal from '../components/ConfirmModal';
import { useAutoSave, useUndoRedo } from '../hooks/useAutoSave';
import useWriteChapter from '../hooks/useWriteChapter';
import useWriteContent from '../hooks/useWriteContent';
import useWriteNavigation from '../hooks/useWriteNavigation';
import { useWriteModals } from '../hooks/useWriteModals';
import { useWriteVisuals } from '../hooks/useWriteVisuals';
import { calculateOverallProgress } from '../utils/writeHelpers.jsx';
import WriteHeader from '../components/writing/WriteHeader';
import CurrentSubsectionBanner from '../components/writing/CurrentSubsectionBanner';
import ContentArea from '../components/writing/ContentArea';
import ContentButtons from '../components/writing/ContentButtons';
import ChapterStructureModal from '../components/writing/ChapterStructureModal';
import FeedbackModal from '../components/writing/FeedbackModal';
import ShortcutsModal from '../components/ShortcutsModal';
import LiteratureSearchModal from '../components/LiteratureSearchModal';
import AIDetectionDashboard from '../components/AIDetectionDashboard';
import DiffModal from '../components/DiffModal';
import { PageSkeleton } from '../components/Skeleton';
import { saveChapters, getChapters, saveGeneratedContent, getGeneratedContent, saveCitations, getCitations, saveVisualData, getVisualData } from '../services/firestoreService';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import useSourceLibrary from '../hooks/useSourceLibrary';
import VersionBrowser from '../components/writing/VersionBrowser';
import HelpModal from '../components/writing/HelpModal';
import { saveSubsectionVersions, getSubsectionVersions } from '../services/firestoreService';
import { fixBannedPhrase, fixBurstiness, fixTransitionOveruse, humaniseContent } from '../services/gemini/aiCorrectionService';

const Write = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { colors, isDarkMode } = useTheme();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingSubtopics, setGeneratingSubtopics] = useState(false);
  const [generatingAll, setGeneratingAll] = useState(null);
  const [generatingReferences, setGeneratingReferences] = useState(false);
  const [humaniseUsed, setHumaniseUsed] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`humaniseUsed_${projectId}`) || '{}'); } catch { return {}; }
  });
  const [feedbackUsed, setFeedbackUsed] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`feedbackUsed_${projectId}`) || '{}'); } catch { return {}; }
  });

  const [resetModalType, setResetModalType] = useState(null);
  const [processingReset, setProcessingReset] = useState(false);
  const resetTimeoutRef = useRef(null);
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
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showLitSearchModal, setShowLitSearchModal] = useState(false);
  const [showAIDetection, setShowAIDetection] = useState(false);
  const [diffModal, setDiffModal] = useState({ show: false, oldText: '', newText: '', onAccept: null, title: '' });
  const [subsectionVersions, setSubsectionVersions] = useState({});
  const [versionBrowserSubsection, setVersionBrowserSubsection] = useState(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [highlightRanges, setHighlightRanges] = useState([]);
  const [applyingAICorrection, setApplyingAICorrection] = useState(false);

  const modals = useWriteModals();
  const sourceLibrary = useSourceLibrary(projectId);
  const { toasts, addToast, removeToast, success: toastSuccess, error: toastError } = useToast();
  const { state: editorContent, set: setEditorContent, undo, redo, canUndo, canRedo } = useUndoRedo('');

  const { saveStatus, lastSaved, saveNow } = useAutoSave({
    saveFn: (data) => saveGeneratedContent(projectId, data),
    data: generatedSubsections,
    delay: 30000,
  });

  const { chapters, setChapters, activeChapter, setActiveChapter, chapterWordCounts, setChapterWordCounts, chapterWordCountSet, setChapterWordCountSet, initializeEmptyChapters, handleDeleteSubsection, handleRestoreSubsection, handleDrop, generateSubtopicsForChapter, buildSubsectionsFromHeadings, previewSubtopics, addChapter, removeChapter, renameChapter, handleChapterDrop } = useWriteChapter(project, projectId, { saveChapters, saveGeneratedContent, saveCitations, saveVisualData });

  const currentChapter = chapters.find(c => c.id === activeChapter);
  const activeSubsections = currentChapter?.subsections.filter(s => s.type !== 'references' && !s.deleted) || [];
  const currentSubsection = isViewingReferences ? { id: 'references', title: 'References', type: 'references', generated: true } : activeSubsections[currentSubsectionIndex];

  const humaniseBase = project?.tier === 'premium' ? 15 : 10;
  const feedbackBase = project?.tier === 'premium' ? 12 : 6;

  const { generating, generatingVisual, humanising, handleGenerateConceptualFramework, handleGenerateTheoreticalFramework, handleGenerateResearchDesign, handleGenerateTable, handleGenerateChart, handleGenerateCurrent, generateSubsectionContent, handleGenerateReferences, autoGenerateReferences, handleHumanise, handleApplyFeedback, preRenderDiagrams } = useWriteContent(project, activeChapter, currentSubsection, currentSubsectionIndex, chapters, generatedSubsections, chapterCitations, uploadedFindings, modals.literatureReviewType, humaniseUsed, feedbackUsed, isViewingReferences, sourceLibrary.sources, sourceLibrary.sourceMode, humaniseBase, feedbackBase);

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
      toggleShortcuts: () => setShowShortcutsModal(prev => !prev),
      escape: () => {
        setShowShortcutsModal(false);
        setShowLitSearchModal(false);
        setShowAIDetection(false);
        setDiffModal(prev => ({ ...prev, show: false, onAccept: null }));
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
    getSubsectionVersions(projectId).then(v => {
      if (v && Object.keys(v).length > 0) setSubsectionVersions(v);
    }).catch(() => {});
  }, [projectId, navigate]);

  useEffect(() => { if (projectId && Object.keys(chapterCitations).length) saveCitations(projectId, chapterCitations).catch(e => console.error('Auto-save citations failed:', e)); }, [chapterCitations, projectId]);
  useEffect(() => { if (projectId && Object.keys(diagramData).length) saveVisualData(projectId, 'diagrams', diagramData).catch(e => console.error('Auto-save diagrams failed:', e)); }, [diagramData, projectId]);
  useEffect(() => { if (projectId && Object.keys(chartData).length) saveVisualData(projectId, 'charts', chartData).catch(e => console.error('Auto-save charts failed:', e)); }, [chartData, projectId]);
  useEffect(() => { if (projectId && Object.keys(tableData).length) saveVisualData(projectId, 'tables', tableData).catch(e => console.error('Auto-save tables failed:', e)); }, [tableData, projectId]);

  useEffect(() => { try { localStorage.setItem(`humaniseUsed_${projectId}`, JSON.stringify(humaniseUsed)); } catch {} }, [humaniseUsed, projectId]);
  useEffect(() => { try { localStorage.setItem(`feedbackUsed_${projectId}`, JSON.stringify(feedbackUsed)); } catch {} }, [feedbackUsed, projectId]);
  useEffect(() => { try { localStorage.setItem(`subsectionVersions_${projectId}`, JSON.stringify(subsectionVersions)); } catch {} }, [subsectionVersions, projectId]);

  const versionsTimerRef = useRef(null);
  useEffect(() => {
    if (!projectId || Object.keys(subsectionVersions).length === 0) return;
    if (versionsTimerRef.current) clearTimeout(versionsTimerRef.current);
    versionsTimerRef.current = setTimeout(() => {
      saveSubsectionVersions(projectId, subsectionVersions).catch(e => console.warn('Failed to save versions:', e));
    }, 15000);
    return () => { if (versionsTimerRef.current) clearTimeout(versionsTimerRef.current); };
  }, [subsectionVersions, projectId]);

  useEffect(() => {
    const onUpgraded = (e) => {
      if (e.detail?.projectId === projectId) {
        setProject(prev => prev ? { ...prev, tier: 'premium', isPremium: true } : prev);
      }
    };
    window.addEventListener('projectUpgraded', onUpgraded);
    return () => window.removeEventListener('projectUpgraded', onUpgraded);
  }, [projectId]);

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
    if (subsection?.type === 'references') { e.preventDefault(); return; }
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

  const handleSaveLitSources = (newSources) => {
    if (!newSources?.length) return;
    sourceLibrary.addSources(newSources);
    toastSuccess(`${newSources.length} source(s) added to your library!`);
    setShowLitSearchModal(false);
  };

  const handleUpdateGuidelines = (chapterId, guidelines) => {
    setChapters(prev => prev.map(ch => ch.id === chapterId ? { ...ch, guidelines } : ch));
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
        const idx = chapter.subsections.findIndex(s => s.type !== 'references');
        setCurrentSubsectionIndex(idx >= 0 ? idx : 0); setCurrentContent(''); setShowReferenceInTextarea(false);
      }
    }
    modals.setPendingChapterAfterWordCount(null);
  };

  const wrappedHandlePrevSubsection = () => {
    const result = handlePrevSubsection();
    if (result?.action === 'prev' && result.index >= 0) {
      setCurrentSubsectionIndex(result.index); setIsViewingReferences(false); setIsPreviewMode(true);
      setCurrentContent(generatedSubsections[activeChapter]?.[activeSubsections[result.index].id] || '');
      setShowReferenceInTextarea(false);
    }
  };

  const wrappedHandleNextSubsection = () => {
    const result = handleNextSubsection(activeSubsections);
    if (result?.action === 'next') {
      setCurrentSubsectionIndex(result.index); setIsViewingReferences(false); setIsPreviewMode(true);
      setCurrentContent(generatedSubsections[activeChapter]?.[activeSubsections[result.index].id] || '');
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

  const wrappedGenerateCurrent = async () => {
    try {
      const result = await handleGenerateCurrent(activeSubsections);
      if (!result || result.error) { toastError(result?.message || 'Writing failed.'); return; }
      if (result.skipped) return;
      const { content, citations, subsectionId } = result;
      setChapterCitations(prev => ({ ...prev, [activeChapter]: [...new Set([...(prev[activeChapter] || []), ...citations])] }));
      captureVersion(activeChapter, subsectionId, generatedSubsections[activeChapter]?.[subsectionId], 'AI Generated');
      setGeneratedSubsections(prev => ({ ...prev, [activeChapter]: { ...prev[activeChapter], [subsectionId]: content } }));
      setCurrentContent(content);
      setChapters(prev => prev.map(ch => ch.id === activeChapter ? { ...ch, subsections: ch.subsections.map(s => s.id === subsectionId ? { ...s, generated: true, children: (s.children || []).map(c => ({ ...c, generated: true })) } : s) } : ch));
      setIsPreviewMode(true);
      preRenderDiagrams(content, isDarkMode).then(rendered => {
        if (rendered && Object.keys(rendered).length > 0) {
          const existing = JSON.parse(localStorage.getItem(`diagramSVGs_${projectId}`) || '{}');
          localStorage.setItem(`diagramSVGs_${projectId}`, JSON.stringify({ ...existing, [`${activeChapter}_${subsectionId}`]: rendered }));
        }
      });
      autoGenerateReferences(activeChapter).then(refResult => {
        if (refResult && refResult.content) {
          setGeneratedSubsections(prev => ({ ...prev, [refResult.chapterId]: { ...prev[refResult.chapterId], references: refResult.content } }));
        }
      });
    } catch (error) {
      console.error('Generation failed:', error);
      toastError('Failed to write content. ' + error.message);
    }
  };

  const wrappedGenerateReferences = async () => {
    if (currentSubsection && currentSubsection.type !== 'references') {
      setGeneratedSubsections(prev => ({ ...prev, [activeChapter]: { ...prev[activeChapter], [currentSubsection.id]: currentContent } }));
    }
    setGeneratingReferences(true);
    try {
      const result = await handleGenerateReferences(currentChapter, currentContent);
      if (!result || result.error) { toastError(result?.message || 'References writing failed.'); return; }
      const { content, usedGrounding } = result;
      setCurrentContent(content); setShowReferenceInTextarea(true); setIsViewingReferences(true); setIsPreviewMode(true);
      setChapters(prev => prev.map(ch => ch.id === activeChapter ? { ...ch, subsections: ch.subsections.map(s => s.type === 'references' ? { ...s, generated: true } : s) } : ch));
      setGeneratedSubsections(prev => ({ ...prev, [activeChapter]: { ...prev[activeChapter], references: content } }));
      toastSuccess(usedGrounding ? 'References written from real sources!' : 'References written from your citations. Verify entries before submitting.');
    } finally {
      setGeneratingReferences(false);
    }
  };

  const wrappedHandleSubsectionClick = (subsectionId) => {
    const activeSubs = currentChapter?.subsections.filter(s => s.type !== 'references' && !s.deleted) || [];
    let sub = currentChapter?.subsections.find(s => s.id === subsectionId);
    let parentSub = null;
    if (!sub) {
      for (const s of (currentChapter?.subsections || [])) {
        const child = (s.children || []).find(c => c.id === subsectionId);
        if (child) { sub = child; parentSub = s; break; }
      }
    }
    if (!sub) return;
    if (sub?.type === 'references') {
      const allOthersGenerated = activeSubs.length > 0 && activeSubs.every(s => s.generated);
      if (!allOthersGenerated) { toastError('Please write all other subsections first.'); return; }
      const existingRefs = generatedSubsections[activeChapter]?.references;
      if (existingRefs && existingRefs.length > 0) {
        setCurrentContent(existingRefs); setShowReferenceInTextarea(true);
        setIsViewingReferences(true); setIsPreviewMode(true); setCurrentSubsection(sub);
        return;
      }
      wrappedGenerateReferences(); return;
    }
    const targetId = parentSub ? parentSub.id : sub.id;
    const index = activeSubs.findIndex(s => s.id === targetId);
    if (index !== -1) {
      setCurrentSubsectionIndex(index); setIsViewingReferences(false); setIsPreviewMode(true);
      setCurrentContent(generatedSubsections[activeChapter]?.[activeSubs[index].id] || '');
      setShowReferenceInTextarea(false);
    }
  };

  const wrappedHumanise = async () => {
    try {
      if (!currentContent) { toastError('No content to humanise.'); return; }
      const result = await handleHumanise(currentContent);
      if (!result || result.error) { toastError(result?.message || 'Humanise failed.'); return; }
      const { humanisedText, humaniseKey } = result;
      setDiffModal({
        show: true,
        oldText: currentContent,
        newText: humanisedText,
        title: 'Humanise Changes',
        onAccept: () => {
          captureVersion(activeChapter, currentSubsection?.id, currentContent, 'Humanised');
          setCurrentContent(humanisedText);
          if (currentSubsection) setGeneratedSubsections(prev => ({ ...prev, [activeChapter]: { ...prev[activeChapter], [currentSubsection.id]: humanisedText } }));
          setHumaniseUsed(prev => ({ ...prev, [humaniseKey]: (prev[humaniseKey] || 0) + 1 }));
          setDiffModal(prev => ({ ...prev, show: false, onAccept: null }));
        },
      });
    } catch (error) {
      console.error('Humanise failed:', error);
      toastError('Humanise failed: ' + error.message);
    }
  };

  const wrappedApplyFeedback = async (skipDiff) => {
    try {
      if (!modals.feedbackText && modals.feedbackFiles.length === 0) { toastError('Please enter feedback or upload files'); return; }
      modals.setApplyingSubFeedback(true);
      const currentContentText = generatedSubsections[activeChapter]?.[modals.currentFeedbackSubsection.id] || '';
      const result = await handleApplyFeedback(currentContentText, modals.feedbackText, modals.feedbackFiles, modals.currentFeedbackSubsection);
      if (!result || result.error) { modals.setApplyingSubFeedback(false); toastError(result?.message || 'Feedback application failed.'); return; }
      const { modifiedContent, feedbackKey } = result;
      modals.setApplyingSubFeedback(false);

      const applyChanges = () => {
        captureVersion(activeChapter, modals.currentFeedbackSubsection.id, currentContentText, 'Feedback Applied');
        setGeneratedSubsections(prev => ({ ...prev, [activeChapter]: { ...prev[activeChapter], [modals.currentFeedbackSubsection.id]: modifiedContent } }));
        if (currentSubsection?.id === modals.currentFeedbackSubsection.id) setCurrentContent(modifiedContent);
        setFeedbackUsed(prev => ({ ...prev, [feedbackKey]: (prev[feedbackKey] || 0) + 1 }));
      autoGenerateReferences(activeChapter, true).then(refResult => {
          if (refResult && refResult.content) {
            setGeneratedSubsections(prev => ({ ...prev, [refResult.chapterId]: { ...prev[refResult.chapterId], references: refResult.content } }));
          }
        });
        toastSuccess('Feedback applied successfully!');
        modals.setShowFeedbackModal(false); modals.setCurrentFeedbackSubsection(null); modals.setFeedbackText(''); modals.setFeedbackFiles([]);
      };

      if (skipDiff) {
        applyChanges();
      } else {
        setDiffModal({
          show: true,
          oldText: currentContentText,
          newText: modifiedContent,
          title: 'Feedback Changes',
          onAccept: () => {
            applyChanges();
            setDiffModal(prev => ({ ...prev, show: false, onAccept: null }));
          },
        });
      }
    } catch (error) {
      modals.setApplyingSubFeedback(false);
      console.error('Feedback application failed:', error);
      toastError('Feedback application failed: ' + error.message);
    }
  };

  const handleLiteratureTypeSubmit = (type) => {
    modals.setLiteratureReviewType(type);
    modals.setShowLiteratureTypeModal(false);
    if (modals.pendingChapterForStructure) {
      modals.setShowChapterStructureModal(true);
    }
  };

  const handleUploadFindings = (findingsData) => {
    setUploadedFindings(findingsData); modals.setShowUploadFindings(false);
    generateSubtopicsForChapter('chapter4');
    if (!chapterWordCountSet['chapter4']) { modals.setShowWordCountModal(true); modals.setPendingChapterAfterWordCount('chapter4'); }
    else { setActiveChapter('chapter4'); setIsViewingReferences(false); setIsPreviewMode(true);
      const idx = chapters.find(c => c.id === 'chapter4')?.subsections.findIndex(s => s.type !== 'references') || 0;
      setCurrentSubsectionIndex(idx); setCurrentContent(''); }
  };
  const handleGenerateWithAI = (findingsData) => { setUploadedFindings(findingsData); modals.setShowUploadFindings(false); generateSubtopicsForChapter('chapter4');
    if (!chapterWordCountSet['chapter4']) { modals.setShowWordCountModal(true); modals.setPendingChapterAfterWordCount('chapter4'); }
    else { setActiveChapter('chapter4'); setIsViewingReferences(false); setIsPreviewMode(true);
      const idx = chapters.find(c => c.id === 'chapter4')?.subsections.findIndex(s => s.type !== 'references') || 0;
      setCurrentSubsectionIndex(idx); setCurrentContent(''); }
  };

  const handleGenerateAll = async (chapterId) => {
    const chapter = chapters.find(c => c.id === chapterId);
    if (!chapter) return;
    const subs = chapter.subsections.filter(s => !s.generated && s.type !== 'references' && !s.deleted);
    if (subs.length === 0) { toastError('All subsections already written.'); return; }
    setGeneratingAll({ total: subs.length, completed: 0, errors: 0, chapterId });
    const activeSubsList = chapter.subsections.filter(s => !s.deleted && s.type !== 'references');
    let errorCount = 0;
    for (let i = 0; i < subs.length; i++) {
      const sub = subs[i];
      const subIndex = activeSubsList.findIndex(s => s.id === sub.id);
      if (subIndex === -1) continue;
      const result = await generateSubsectionContent(chapterId, sub.title, sub.id, subIndex, activeSubsList);
      if (result?.error) { errorCount++; setGeneratingAll(prev => prev ? { ...prev, errors: prev.errors + 1, completed: prev.completed + 1 } : null); continue; }
      if (result?.skipped) { setGeneratingAll(prev => prev ? { ...prev, completed: prev.completed + 1 } : null); continue; }
      setChapterCitations(prev => ({ ...prev, [chapterId]: [...new Set([...(prev[chapterId] || []), ...result.citations])] }));
      setGeneratedSubsections(prev => ({ ...prev, [chapterId]: { ...prev[chapterId], [result.subsectionId]: result.content } }));
      setChapters(prev => prev.map(ch => ch.id === chapterId ? { ...ch, subsections: ch.subsections.map(s => s.id === result.subsectionId ? { ...s, generated: true, children: (s.children || []).map(c => ({ ...c, generated: true })) } : s) } : ch));
      setGeneratingAll(prev => prev ? { ...prev, completed: prev.completed + 1 } : null);
    }
    setGeneratingAll(null);
    if (errorCount > 0) toastError(`${errorCount} subsection(s) failed to write.`);
    else toastSuccess(`All ${subs.length} subsection(s) written successfully!`);
  };

  const handleInstrumentsDownload = (downloadedTypes) => {
    setInstrumentsCompleted(true); modals.setShowDataCollectionModal(false);
    setChapters(prev => prev.map(ch => ch.id === 'chapter4' ? { ...ch, unlocked: true } : ch));
    try { localStorage.setItem(`instruments_${projectId}`, JSON.stringify(downloadedTypes || [])); } catch (e) { console.warn('Failed to cache instruments:', e); }
  };

  const handleResetConfirm = () => {
    if (processingReset) return;
    setProcessingReset(true);
    resetTimeoutRef.current = setTimeout(() => {
      if (resetModalType === 'humanise') {
        setHumaniseUsed(prev => ({ ...prev, [activeChapter]: 0 }));
      } else if (resetModalType === 'feedback') {
        setFeedbackUsed(prev => ({ ...prev, [activeChapter]: 0 }));
      }
      setProcessingReset(false);
      setResetModalType(null);
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    };
  }, []);

  const captureVersion = (chapterId, subsectionId, content, label) => {
    if (!content || !subsectionId) return;
    setSubsectionVersions(prev => {
      const key = `${chapterId}_${subsectionId}`;
      const list = prev[key] || [];
      if (list.length > 0 && list[list.length - 1].content === content) return prev;
      return { ...prev, [key]: [...list, { content, label, timestamp: Date.now() }] };
    });
  };

  const handleRestoreVersion = (chapterId, subsectionId, content) => {
    captureVersion(chapterId, subsectionId, generatedSubsections[chapterId]?.[subsectionId] || currentContent, 'Restored');
    setGeneratedSubsections(prev => ({
      ...prev, [chapterId]: { ...prev[chapterId], [subsectionId]: content }
    }));
    if (currentSubsection?.id === subsectionId) setCurrentContent(content);
    setVersionBrowserSubsection(null);
  };

  const handleHelpClose = () => setShowHelpModal(false);

  const handleAICorrection = async (suggestion) => {
    if (!currentContent || !currentSubsection) return;
    setApplyingAICorrection(true);
    try {
      const subId = currentSubsection.id;
      let result;
      if (suggestion.type === 'banned') {
        let corrected = currentContent;
        for (const phrase of suggestion.data.phrases) {
          const ctxStart = Math.max(0, currentContent.toLowerCase().indexOf(phrase.toLowerCase()) - 40);
          const ctxEnd = Math.min(currentContent.length, currentContent.toLowerCase().indexOf(phrase.toLowerCase()) + phrase.length + 40);
          const context = currentContent.slice(ctxStart, ctxEnd);
          const res = await fixBannedPhrase(corrected, phrase, context);
          corrected = res.correctedContent;
        }
        result = { correctedContent: corrected };
      } else if (suggestion.type === 'burstiness') {
        result = await fixBurstiness(currentContent);
      } else if (suggestion.type === 'transitions') {
        result = await fixTransitionOveruse(currentContent);
      } else if (suggestion.type === 'humanise') {
        const humaniseKey = activeChapter;
        if ((humaniseUsed[humaniseKey] || 0) >= humaniseBase) {
          addToast('Humanise limit reached for this chapter. Use Reset Humanise to restore your chapter pool.', 'error');
          setApplyingAICorrection(false);
          return;
        }
        result = await humaniseContent(currentContent);
        if (result?.correctedContent) {
          setHumaniseUsed(prev => ({ ...prev, [humaniseKey]: (prev[humaniseKey] || 0) + 1 }));
        }
      }
      if (!result || !result.correctedContent || result.correctedContent === currentContent) return;
      setDiffModal({
        show: true,
        oldText: currentContent,
        newText: result.correctedContent,
        title: 'AI Fix Changes',
        onAccept: () => {
          captureVersion(activeChapter, subId, currentContent, 'AI Score Suggestion');
          setCurrentContent(result.correctedContent);
          setGeneratedSubsections(prev => ({ ...prev, [activeChapter]: { ...prev[activeChapter], [subId]: result.correctedContent } }));
          setDiffModal(prev => ({ ...prev, show: false, onAccept: null }));
          addToast('AI fix applied! New score will show when you open AI Score again.', 'success');
        },
      });
    } catch (error) {
      console.error('AI Correction failed:', error);
      addToast('AI correction failed. Please try again.', 'error');
    } finally {
      setApplyingAICorrection(false);
    }
  };

  const overallProgress = calculateOverallProgress(chapters, generatedSubsections);
  const totalActive = activeSubsections.length;
  const generatedActive = activeSubsections.filter(s => s.generated).length;
  const chapterComplete = isChapterComplete();
  const referencesSub = currentChapter?.subsections.find(s => s.type === 'references');
  const refContent = generatedSubsections[activeChapter]?.references || generatedSubsections[activeChapter]?.['References'] || '';
  const referencesGenerated = referencesSub?.generated || (refContent && refContent.length > 0);

  const getButtonText = () => {
    const lastIdx = chapters.length - 1;
    const curIdx = chapters.findIndex(c => c.id === activeChapter);
    return curIdx === lastIdx ? 'Complete & View Files' : 'Complete & Continue';
  };

  const humaniseLeft = humaniseBase - (humaniseUsed[activeChapter] || 0);
  const feedbackLeft = feedbackBase - (feedbackUsed[activeChapter] || 0);

  const handleSaveEdit = () => {
    if (currentSubsection) {
      const key = currentSubsection.id || 'references';
      captureVersion(activeChapter, key, generatedSubsections[activeChapter]?.[key], 'Manual Edit');
      setGeneratedSubsections(prev => ({ ...prev, [activeChapter]: { ...prev[activeChapter], [key]: currentContent } }));
    }
    setIsPreviewMode(true);
  };

  const currentWordCount = currentContent ? currentContent.split(/\s+/).filter(Boolean).length : 0;

  if (loading) return <PageSkeleton />;
  if (!project || !chapters.length) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: colors.background, color: colors.text }}>Project not found</div>;

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: colors.background }}>
      <div style={{ width: '400px', height: '100vh', overflowY: 'auto', backgroundColor: colors.surface }}>
        <LeftPane chapters={chapters} activeChapter={activeChapter} onChapterClick={wrappedHandleChapterClick} progress={overallProgress}
          onDeleteSubsection={handleDeleteWithUndo} onRestoreSubsection={handleRestoreSubsection} onCustomizeSubsection={handleCustomizeSubsection} onRenameSubsection={handleRenameSubsection}
          onAddSubsection={handleAddSubsection} onSubsectionClick={wrappedHandleSubsectionClick} generatingSubtopics={generatingSubtopics}
          generatedSubsections={generatedSubsections} onDragStart={handleDragStart} onDragOver={handleDragOver} onDrop={handleWrappedDrop}
          onDragEnd={handleDragEnd} draggedItem={draggedItem} dragOverItem={dragOverItem} chapterWordCounts={chapterWordCounts}
          generatingAll={generatingAll} onGenerateAll={handleGenerateAll}
          onAddChapter={addChapter} onRemoveChapter={removeChapter} onRenameChapter={renameChapter} onChapterReorder={handleChapterDrop}
          onUpdateGuidelines={handleUpdateGuidelines}
          isPremium={project?.tier === 'premium'}
          />
      </div>

      <div style={{ flex: 1, height: '100vh', overflowY: 'auto', backgroundColor: colors.surface, borderLeft: `1px solid ${colors.border}` }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 32px 80px' }}>
          <WriteHeader onBack={() => navigate('/dashboard')} onToggleShortcuts={() => setShowShortcutsModal(true)} onToggleLitSearch={() => setShowLitSearchModal(true)} onToggleAIDetection={() => setShowAIDetection(true)} onToggleTour={() => setShowHelpModal(true)} projectId={projectId} saveStatus={saveStatus} lastSaved={lastSaved} onSaveNow={saveNow} wordCount={currentWordCount} sourceMode={sourceLibrary.sourceMode} sourceCount={sourceLibrary.sources.length} isPremium={project?.tier === 'premium'} />

          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: colors.text, marginBottom: '8px' }}>{currentChapter?.customTitle || currentChapter?.title}</h1>
          <p style={{ color: colors.textSecondary, fontSize: '18px', marginBottom: '4px' }}>{project?.title || 'Thesis Project'} • {project?.referenceStyle?.toUpperCase() || 'APA'} Style</p>
          <p style={{ fontSize: '12px', color: '#059669', marginBottom: '28px' }}>✅ Citations auto-verified, references auto-generated</p>
          {project?.tier === 'premium' && (
            <div style={{ fontSize: '12px', color: '#f59e0b', marginBottom: '12px', display: 'flex', gap: '16px', alignItems: 'center' }}>
              <span>💎 Premium</span>
              <span>Humanise: {humaniseUsed[activeChapter] || 0}/{humaniseBase} used</span>
              <span>Feedback: {feedbackUsed[activeChapter] || 0}/{feedbackBase} used</span>
            </div>
          )}

          {generatingSubtopics ? (
            <div style={{ backgroundColor: colors.background, borderRadius: '12px', padding: '32px', textAlign: 'center', border: `1px solid ${colors.border}` }}>
              <p style={{ color: colors.primary }}>We're preparing appropriate subtopics for this chapter...</p>
            </div>
          ) : generatingReferences ? (
            <div style={{ backgroundColor: colors.background, borderRadius: '12px', padding: '40px', textAlign: 'center', border: `1px solid ${colors.border}` }}>
              <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid #e5e7eb', borderTopColor: colors.primary, borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '16px' }} />
              <p style={{ color: colors.text, fontWeight: '500', marginBottom: '4px' }}>Generating reference list...</p>
              <p style={{ color: colors.textSecondary, fontSize: '13px' }}>Searching sources and formatting citations in {project?.referenceStyle?.toUpperCase() || 'APA'} style</p>
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
                generatingReferences={generatingReferences}
                highlightRanges={highlightRanges}
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
                onFeedback={modals.openFeedbackModal}
                onPrev={wrappedHandlePrevSubsection}
                onNext={wrappedHandleNextSubsection}
                onComplete={wrappedHandleCompleteChapter}
                getButtonText={getButtonText}
                humaniseAvailable={humaniseLeft > 0}
                feedbackAvailable={feedbackLeft > 0}
                humaniseLeft={humaniseLeft}
                feedbackLeft={feedbackLeft}
                onResetHumanise={() => setResetModalType('humanise')}
                onResetFeedback={() => setResetModalType('feedback')}
                onOpenVersions={() => setVersionBrowserSubsection(currentSubsection)}
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

      {versionBrowserSubsection && (
        <VersionBrowser
          isOpen={!!versionBrowserSubsection}
          onClose={() => setVersionBrowserSubsection(null)}
          subsection={versionBrowserSubsection}
          versions={subsectionVersions[`${activeChapter}_${versionBrowserSubsection.id}`] || []}
          currentContent={generatedSubsections[activeChapter]?.[versionBrowserSubsection.id] || ''}
          onRestore={(content) => handleRestoreVersion(activeChapter, versionBrowserSubsection.id, content)}
        />
      )}

      {resetModalType && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5000 }}>
          <div style={{ backgroundColor: colors.surface, borderRadius: '16px', maxWidth: '400px', width: '90%', padding: '32px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize: '40px', textAlign: 'center', marginBottom: '16px' }}>
              {resetModalType === 'humanise' ? '✨' : '✏️'}
            </div>
            <h2 style={{ textAlign: 'center', fontSize: '22px', fontWeight: '700', color: colors.text, margin: '0 0 8px' }}>
              Reset {resetModalType === 'humanise' ? 'Humanise' : 'Feedback'}
            </h2>
            <p style={{ textAlign: 'center', fontSize: '14px', color: colors.textSecondary, margin: '0 0 24px' }}>
              Restore full {resetModalType} pool for this chapter.
            </p>
            <div style={{ backgroundColor: colors.background, borderRadius: '12px', padding: '20px', marginBottom: '24px', border: `1px solid ${colors.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ color: colors.textSecondary, fontSize: '14px' }}>Feature</span>
                <span style={{ color: colors.text, fontWeight: '600', fontSize: '14px', textTransform: 'capitalize' }}>{resetModalType}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ color: colors.textSecondary, fontSize: '14px' }}>Pool reset</span>
                <span style={{ color: colors.text, fontWeight: '500', fontSize: '14px' }}>Full chapter pool</span>
              </div>
              <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: '12px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: colors.textSecondary, fontSize: '14px' }}>Amount</span>
                <span style={{ color: colors.text, fontWeight: '700', fontSize: '18px' }}>₵2</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button onClick={handleResetConfirm} disabled={processingReset} style={{
                backgroundColor: processingReset ? colors.border : (resetModalType === 'humanise' ? '#2563eb' : '#059669'),
                color: 'white', padding: '14px', border: 'none', borderRadius: '8px',
                fontWeight: '600', cursor: processingReset ? 'not-allowed' : 'pointer',
                fontSize: '15px', opacity: processingReset ? 0.7 : 1
              }}>
                {processingReset ? 'Processing...' : 'Pay ₵2'}
              </button>
              <button onClick={() => setResetModalType(null)} disabled={processingReset} style={{
                backgroundColor: 'transparent', color: colors.textSecondary,
                padding: '10px', border: `1px solid ${colors.border}`, borderRadius: '8px',
                fontWeight: '500', cursor: processingReset ? 'not-allowed' : 'pointer',
                fontSize: '14px'
              }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <AIDetectionDashboard isOpen={showAIDetection} onClose={() => setShowAIDetection(false)} content={currentContent} onApplyCorrection={handleAICorrection} applyingCorrection={applyingAICorrection} />
      <LiteratureSearchModal
        isOpen={showLitSearchModal}
        onClose={() => setShowLitSearchModal(false)}
        onSaveSources={handleSaveLitSources}
        project={project}
      />
      <ShortcutsModal isOpen={showShortcutsModal} onClose={() => setShowShortcutsModal(false)} />
      <DiffModal
        isOpen={diffModal.show}
        oldText={diffModal.oldText}
        newText={diffModal.newText}
        title={diffModal.title}
        onAccept={diffModal.onAccept || (() => {})}
        onReject={() => setDiffModal(prev => ({ ...prev, show: false, onAccept: null }))}
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

      <HelpModal isOpen={showHelpModal} onClose={handleHelpClose} />

      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes correctionBlink {
          0%   { background-color: #10b981; color: #fff; border-radius: 3px; padding: 0 2px; }
          50%  { background-color: #10b98180; color: inherit; }
          100% { background-color: transparent; color: inherit; padding: 0; }
        }
        .correction-blink {
          animation: correctionBlink 1.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Write;