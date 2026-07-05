import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useCurrency } from '../hooks/useCurrency';
import { PRICES_GHS } from '../constants/pricing';
import LeftPane from '../components/writing/LeftPane';
import DataCollectionModal from '../components/instruments/DataCollectionModal';
import UploadFindings from '../components/UploadFindings';
import WordCountModal from '../components/WordCountModal';
import LiteratureReviewTypeModal from '../components/LiteratureReviewTypeModal';
import { useToast, ToastContainer } from '../hooks/useToast.jsx';
import ConfirmModal from '../components/ConfirmModal';
import { useAutoSave } from '../hooks/useAutoSave';
import useWriteChapter from '../hooks/useWriteChapter';
import useWriteContent from '../hooks/useWriteContent';
import useWriteNavigation from '../hooks/useWriteNavigation';
import { useWriteModals } from '../hooks/useWriteModals';
import { useWriteVisuals } from '../hooks/useWriteVisuals';
import { parseContentBlocks } from '../utils/writeHelpers.jsx';
import WriteHeader from '../components/writing/WriteHeader';

import ContentArea from '../components/writing/ContentArea';
import ContentButtons from '../components/writing/ContentButtons';
import ChapterStructureModal from '../components/writing/ChapterStructureModal';
import FeedbackModal from '../components/writing/FeedbackModal';

import LiteratureSearchModal from '../components/LiteratureSearchModal';
import DiffModal from '../components/DiffModal';
import { PageSkeleton } from '../components/Skeleton';
import { saveChapters, getChapters, saveGeneratedContent, getGeneratedContent, saveCitations, getCitations, saveVisualData, getVisualData, getProject } from '../services/firestoreService';

import { useAuth } from '../contexts/AuthContext';
import { useNavigationLoading } from '../contexts/NavigationLoadingContext';
import useSourceLibrary from '../hooks/useSourceLibrary';
import VersionBrowser from '../components/writing/VersionBrowser';
import HelpModal from '../components/writing/HelpModal';
import { saveSubsectionVersions, getSubsectionVersions } from '../services/firestoreService';
import usePayment from '../hooks/usePayment';
import MockPaymentModal from '../components/MockPaymentModal';

const Write = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { colors, isDarkMode } = useTheme();
  const { fmt } = useCurrency();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingSubtopics, setGeneratingSubtopics] = useState(false);

  const [generatingReferences, setGeneratingReferences] = useState(false);
  const [feedbackUsed, setFeedbackUsed] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`feedbackUsed_${projectId}`) || '{}'); } catch { return {}; }
  });

  const [resetModalType, setResetModalType] = useState(null);
  const [processingReset, setProcessingReset] = useState(false);
  const [currentContent, setCurrentContent] = useState('');
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
  const [showLitSearchModal, setShowLitSearchModal] = useState(false);
  const [diffModal, setDiffModal] = useState({ show: false, oldText: '', newText: '', onAccept: null, title: '' });
  const [subsectionVersions, setSubsectionVersions] = useState({});
  const [versionBrowserSubsection, setVersionBrowserSubsection] = useState(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [highlightRanges, setHighlightRanges] = useState([]);
  const [showPlagiarismModal, setShowPlagiarismModal] = useState(false);
  const [plagiarismResult, setPlagiarismResult] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [regeneratingChapter, setRegeneratingChapter] = useState(null);
  const [isEditingWordCount, setIsEditingWordCount] = useState(null);

  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth <= 768);
  const touchStartX = useRef(0);
  const projectCache = useRef({});

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { endTransition } = useNavigationLoading();
  const modals = useWriteModals();
  const sourceLibrary = useSourceLibrary(projectId);
  const { toasts, addToast, removeToast, success: toastSuccess, error: toastError } = useToast();
  const { processing: processingPayment, processSmallPayment, devBypass, mockPaymentConfig, onMockPaymentSuccess, onMockPaymentClose } = usePayment(toastError);

  const { saveStatus, lastSaved, saveNow } = useAutoSave({
    saveFn: (data) => saveGeneratedContent(projectId, data),
    data: generatedSubsections,
    delay: 30000,
  });

  const { chapters, setChapters, activeChapter, setActiveChapter, chapterWordCounts, setChapterWordCounts, chapterWordCountSet, setChapterWordCountSet, initializeEmptyChapters, handleDeleteSubsection, handleRestoreSubsection, handleDrop, generateSubtopicsForChapter, buildSubsectionsFromHeadings, previewSubtopics, addChapter, removeChapter, renameChapter, handleChapterDrop } = useWriteChapter(project, projectId, { saveChapters, saveGeneratedContent, saveCitations, saveVisualData });

  const currentChapter = chapters.find(c => c.id === activeChapter);
  const activeSubsections = currentChapter?.subsections.filter(s => s.type !== 'references' && !s.deleted) || [];
  const feedbackBase = project?.tier === 'premium' ? 12 : 6;

  const { generating, generatingChapter, generatingVisual, handleGenerateConceptualFramework, handleGenerateTheoreticalFramework, handleGenerateResearchDesign, handleGenerateTable, handleGenerateChart, handleGenerateChapter, generateSubsectionContent, handleGenerateReferences, autoGenerateReferences, handleApplyFeedback, preRenderDiagrams, combineChapterContent } = useWriteContent(project, activeChapter, chapters, generatedSubsections, chapterCitations, uploadedFindings, modals.literatureReviewType, feedbackUsed, isViewingReferences, sourceLibrary.sources, sourceLibrary.sourceMode, feedbackBase);

  const { handleChapterClick, handleChapterStructureSubmit, handleWordCountSubmit, handleCustomizeSubsection, handleRenameSubsection, handleAddSubsection, isChapterComplete, handleCompleteChapter } = useWriteNavigation(project, projectId, navigate, chapters, setChapters, activeChapter, setActiveChapter, generatedSubsections, chapterWordCounts, chapterWordCountSet, setChapterWordCounts, setChapterWordCountSet, generateSubtopicsForChapter, buildSubsectionsFromHeadings, handleDrop, modals.literatureReviewType);

  const visuals = useWriteVisuals(handleGenerateConceptualFramework, handleGenerateTheoreticalFramework, handleGenerateResearchDesign, handleGenerateTable, handleGenerateChart, toastSuccess, toastError);

  // Global escape handler
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setShowLitSearchModal(false);
        setDiffModal(prev => ({ ...prev, show: false, onAccept: null }));
        modals.setShowFeedbackModal(false);
        modals.setShowWordCountModal(false);
        modals.setShowLiteratureTypeModal(false);
        modals.setShowChapterStructureModal(false);
        modals.setShowDataCollectionModal(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [modals]);

  useEffect(() => {
    const loadProject = async () => {
      const cached = projectCache.current[projectId];
      if (cached && Date.now() - cached.timestamp < 30000) {
        const c = cached.data;
        if (c.project) setProject(c.project);
        if (c.chapters?.length) { setChapters(c.chapters); setChapterWordCounts(c.wordCounts); setChapterWordCountSet(c.wordCountSet); }
        else if (c.project) initializeEmptyChapters(c.project);
        if (c.content && Object.keys(c.content).length) setGeneratedSubsections(c.content);
        if (c.citations && Object.keys(c.citations).length) setChapterCitations(c.citations);
        if (c.visuals) { if (c.visuals.diagrams) setDiagramData(c.visuals.diagrams); if (c.visuals.charts) setChartData(c.visuals.charts); if (c.visuals.tables) setTableData(c.visuals.tables); }
        setLoading(false);
        if (endTransition) endTransition();
        return;
      }

      try {
        const [currentProject, savedChapters, savedContent, savedCitations, vd] = await Promise.all([
          getProject(projectId, user?.uid),
          getChapters(projectId),
          getGeneratedContent(projectId),
          getCitations(projectId),
          getVisualData(projectId),
        ]);

        if (!currentProject) { navigate('/dashboard'); setLoading(false); if (endTransition) endTransition(); return; }

        setProject(currentProject);

        let wc, wcs;

        if (savedChapters?.length) {
          setChapters(savedChapters);
          wc = {}; wcs = {};
          savedChapters.forEach(ch => {
            if (ch.wordCount) { wc[ch.id] = ch.wordCount; wcs[ch.id] = true; }
          });
          setChapterWordCounts(wc);
          setChapterWordCountSet(wcs);
        } else {
          initializeEmptyChapters(currentProject);
        }

        if (savedContent && Object.keys(savedContent).length) setGeneratedSubsections(savedContent);
        if (savedCitations && Object.keys(savedCitations).length) setChapterCitations(savedCitations);
        if (vd.diagrams) setDiagramData(vd.diagrams);
        if (vd.charts) setChartData(vd.charts);
        if (vd.tables) setTableData(vd.tables);

        const savedVersions = await getSubsectionVersions(projectId);
        if (savedVersions && Object.keys(savedVersions).length) setSubsectionVersions(savedVersions);

        projectCache.current[projectId] = {
          timestamp: Date.now(),
          data: { project: currentProject, chapters: savedChapters || [], content: savedContent, citations: savedCitations, visuals: vd, wordCounts: wc || {}, wordCountSet: wcs || {} },
        };
      } catch (error) {
        console.error('Error loading project:', error);
        if (endTransition) endTransition();
        navigate('/dashboard');
      }
      setLoading(false);
      if (endTransition) endTransition();
    };
    loadProject();
  }, [projectId, navigate, endTransition]);

  useEffect(() => { if (projectId && Object.keys(chapterCitations).length) saveCitations(projectId, chapterCitations).catch(e => console.error('Auto-save citations failed:', e)); }, [chapterCitations, projectId]);
  useEffect(() => { if (projectId && Object.keys(diagramData).length) saveVisualData(projectId, 'diagrams', diagramData).catch(e => console.error('Auto-save diagrams failed:', e)); }, [diagramData, projectId]);
  useEffect(() => { if (projectId && Object.keys(chartData).length) saveVisualData(projectId, 'charts', chartData).catch(e => console.error('Auto-save charts failed:', e)); }, [chartData, projectId]);
  useEffect(() => { if (projectId && Object.keys(tableData).length) saveVisualData(projectId, 'tables', tableData).catch(e => console.error('Auto-save tables failed:', e)); }, [tableData, projectId]);

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

  useEffect(() => {
    if (!regeneratingChapter) return;
    const doRegenerate = async () => {
      const chapter = chapters.find(c => c.id === regeneratingChapter);
      if (!chapter) { setRegeneratingChapter(null); return; }
      const activeSubsList = chapter.subsections.filter(s => !s.deleted && s.type !== 'references');
      const generatedSubs = activeSubsList.filter(s => s.generated);
      if (generatedSubs.length === 0) { setRegeneratingChapter(null); toastSuccess('Word count updated!'); return; }
      for (let i = 0; i < generatedSubs.length; i++) {
        const sub = generatedSubs[i];
        const subIndex = activeSubsList.findIndex(s => s.id === sub.id);
        if (subIndex === -1) continue;
        const result = await generateSubsectionContent(regeneratingChapter, sub.title, sub.id, subIndex, activeSubsList, true);
        if (result?.error) { toastError(`Failed to regenerate "${sub.title}": ${result.message}`); continue; }
        if (result?.skipped) continue;
        setChapterCitations(prev => ({ ...prev, [regeneratingChapter]: [...new Set([...(prev[regeneratingChapter] || []), ...result.citations])] }));
        setGeneratedSubsections(prev => ({ ...prev, [regeneratingChapter]: { ...prev[regeneratingChapter], [result.subsectionId]: result.content } }));
      }
      setRegeneratingChapter(null);
      toastSuccess('Content regenerated with new word count!');
      autoGenerateReferences(regeneratingChapter, true).then(refResult => {
        if (refResult && refResult.content) {
          setGeneratedSubsections(prev => ({ ...prev, [refResult.chapterId]: { ...prev[refResult.chapterId], references: refResult.content } }));
        }
      }).catch(e => console.error('Auto-generate references failed:', e));
    };
    doRegenerate();
  }, [regeneratingChapter, chapters, generateSubsectionContent]);

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
      setCurrentContent(''); setShowReferenceInTextarea(false);
      if (result.needsSubtopics) handleWrappedGenerateSubtopics(chapterId);
    }
  };

  const wrappedHandleChapterStructureSubmit = async (referenceData) => {
    const setUploadedFiles = modals.setUploadedStructureFile;
    const result = await handleChapterStructureSubmit(referenceData, modals.pendingChapterForStructure, instrumentsCompleted, modals.setShowUploadFindings, modals.setShowWordCountModal, modals.setPendingChapterAfterWordCount, modals.setPendingChapterForStructure, modals.setShowChapterStructureModal, setUploadedFiles, setActiveChapter, setIsViewingReferences, setIsPreviewMode, setCurrentContent);
    if (result?.action === 'error') toastError(result.message);
  };

  const handlePreview = async (chapterId, referenceData) => {
    return await previewSubtopics(chapterId, referenceData);
  };

  const wrappedHandleWordCountSubmit = async (range, useCustom) => {
    const chapterId = modals.pendingChapterAfterWordCount;
    if (isEditingWordCount) {
      const success = await processSmallPayment(projectId, PRICES_GHS.wordCountEdit,
        { type: 'wordcount_edit', chapter: isEditingWordCount },
        () => {
          handleWordCountSubmit(range, useCustom, chapterId, modals.setShowWordCountModal, true);
          setRegeneratingChapter(chapterId);
        }
      );
      if (success) {
        setIsEditingWordCount(null);
        modals.setPendingChapterAfterWordCount(null);
      }
      return;
    }
    handleWordCountSubmit(range, useCustom, chapterId, modals.setShowWordCountModal, false);
    modals.setShowWordCountModal(false);
    if (chapterId) {
      const chapter = chapters.find(c => c.id === chapterId);
      if (chapter) {
        setActiveChapter(chapterId); setIsViewingReferences(false); setIsPreviewMode(true);
        setCurrentContent(''); setShowReferenceInTextarea(false);
      }
    }
    modals.setPendingChapterAfterWordCount(null);
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
          setCurrentContent(''); setShowReferenceInTextarea(false);
          setConfirmModal(null);
        },
        onCancel: () => setConfirmModal(null),
      });
    }
  };

  const wrappedGenerateChapter = async () => {
    try {
      const result = await handleGenerateChapter();
      if (!result || result.error) { toastError(result?.message || 'Chapter generation failed.'); return; }
      const { subsections, fullText } = result;
      for (const [subId, entry] of Object.entries(subsections)) {
        captureVersion(activeChapter, subId, generatedSubsections[activeChapter]?.[subId], 'AI Generated');
      }
      const chapterContent = {};
      for (const [subId, entry] of Object.entries(subsections)) {
        chapterContent[subId] = entry.content;
      }
      setGeneratedSubsections(prev => ({ ...prev, [activeChapter]: { ...prev[activeChapter], ...chapterContent } }));
      setChapters(prev => prev.map(ch =>
        ch.id === activeChapter ? {
          ...ch,
          subsections: ch.subsections.map(s =>
            subsections[s.id] ? { ...s, generated: true, children: (s.children || []).map(c => ({ ...c, generated: true })) } : s
          )
        } : ch
      ));
      setCurrentContent(fullText);
      setIsPreviewMode(true);
      preRenderDiagrams(fullText, isDarkMode).then(rendered => {
        if (rendered && Object.keys(rendered).length > 0) {
          const existing = JSON.parse(localStorage.getItem(`diagramSVGs_${projectId}`) || '{}');
          localStorage.setItem(`diagramSVGs_${projectId}`, JSON.stringify({ ...existing, [`${activeChapter}_fullChapter`]: rendered }));
        }
      });
      autoGenerateReferences(activeChapter, true).then(refResult => {
        if (refResult && refResult.content) {
          setGeneratedSubsections(prev => ({ ...prev, [refResult.chapterId]: { ...prev[refResult.chapterId], references: refResult.content } }));
        }
      }).catch(e => console.error('Auto-generate references failed:', e));
      const generatedCount = Object.keys(subsections).length;
      toastSuccess(`Chapter written successfully! (${generatedCount} subsection${generatedCount !== 1 ? 's' : ''})`);
    } catch (error) {
      console.error('Chapter generation failed:', error);
      toastError('Failed to write chapter. ' + error.message);
    }
  };

  const wrappedGenerateReferences = async () => {
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
    const sub = currentChapter?.subsections.find(s => s.id === subsectionId);
    if (!sub) return;
    if (sub?.type === 'references') {
      const allOthersGenerated = activeSubsections.length > 0 && activeSubsections.every(s => s.generated);
      if (!allOthersGenerated) { toastError('Please write all other subsections first.'); return; }
      const existingRefs = generatedSubsections[activeChapter]?.references;
      if (existingRefs && existingRefs.length > 0) {
        setCurrentContent(existingRefs); setShowReferenceInTextarea(true);
        setIsViewingReferences(true); setIsPreviewMode(true);
        return;
      }
      wrappedGenerateReferences(); return;
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
        setCurrentContent(modifiedContent);
        setFeedbackUsed(prev => ({ ...prev, [feedbackKey]: (prev[feedbackKey] || 0) + 1 }));
      autoGenerateReferences(activeChapter, true).then(refResult => {
          if (refResult && refResult.content) {
            setGeneratedSubsections(prev => ({ ...prev, [refResult.chapterId]: { ...prev[refResult.chapterId], references: refResult.content } }));
          }
        }).catch(e => console.error('Auto-generate references failed:', e));
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

  const handleEditWordCount = (chapterId) => {
    setIsEditingWordCount(chapterId);
    modals.setPendingChapterAfterWordCount(chapterId);
    modals.setShowWordCountModal(true);
  };

  const handleLiteratureTypeSubmit = (type) => {
    modals.setLiteratureReviewType(type);
    modals.setShowLiteratureTypeModal(false);
    if (modals.pendingChapterForStructure) {
      modals.setShowChapterStructureModal(true);
    }
  };

  const handleUploadFindings = async (findingsData) => {
    setUploadedFindings(findingsData); modals.setShowUploadFindings(false);
    await generateSubtopicsForChapter('chapter4');
    if (!chapterWordCountSet['chapter4']) { modals.setShowWordCountModal(true); modals.setPendingChapterAfterWordCount('chapter4'); }
    else { setActiveChapter('chapter4'); setIsViewingReferences(false); setIsPreviewMode(true);
      setCurrentContent(''); }
  };
  const handleGenerateWithAI = async (findingsData) => { setUploadedFindings(findingsData); modals.setShowUploadFindings(false); await generateSubtopicsForChapter('chapter4');
    if (!chapterWordCountSet['chapter4']) { modals.setShowWordCountModal(true); modals.setPendingChapterAfterWordCount('chapter4'); }
    else { setActiveChapter('chapter4'); setIsViewingReferences(false); setIsPreviewMode(true);
      setCurrentContent(''); }
  };

  const handleInstrumentsDownload = (downloadedTypes) => {
    setInstrumentsCompleted(true); modals.setShowDataCollectionModal(false);
    setChapters(prev => prev.map(ch => ch.id === 'chapter4' ? { ...ch, unlocked: true } : ch));
    try { localStorage.setItem(`instruments_${projectId}`, JSON.stringify(downloadedTypes || [])); } catch (e) { console.warn('Failed to cache instruments:', e); }
  };

  const handleResetConfirm = async () => {
    if (processingReset) return;
    const resetPrice = PRICES_GHS.feedbackReset;
    setProcessingReset(true);
    const success = await processSmallPayment(projectId, resetPrice, { type: 'feedback_reset' }, () => {
      setFeedbackUsed(prev => ({ ...prev, [activeChapter]: 0 }));
      toastSuccess('Feedback pool reset for this chapter!', 'success');
    });
    if (success) {
      setResetModalType(null);
    }
    setProcessingReset(false);
  };

  const handleResetDevBypass = async () => {
    if (processingReset) return;
    setProcessingReset(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setFeedbackUsed(prev => ({ ...prev, [activeChapter]: 0 }));
    setProcessingReset(false);
    setResetModalType(null);
    toastSuccess('Feedback pool reset (dev mode)!', 'success');
  };



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
    setCurrentContent(content);
    setVersionBrowserSubsection(null);
  };

  const handleHelpClose = () => setShowHelpModal(false);

  const chapterComplete = isChapterComplete();
  const getButtonText = () => {
    const lastIdx = chapters.length - 1;
    const curIdx = chapters.findIndex(c => c.id === activeChapter);
    return curIdx === lastIdx ? 'Complete & View Files' : 'Complete & Continue';
  };

  const feedbackLeft = feedbackBase - (feedbackUsed[activeChapter] || 0);

  const handleSaveEdit = () => {
    if (currentContent) {
      captureVersion(activeChapter, 'fullChapter', generatedSubsections[activeChapter]?.fullChapter, 'Manual Edit');
      setGeneratedSubsections(prev => ({ ...prev, [activeChapter]: { ...prev[activeChapter], fullChapter: currentContent } }));
      setIsPreviewMode(true);
    }
  };

  const currentWordCount = currentContent ? currentContent.split(/\s+/).filter(Boolean).length : 0;
  const resetPrice = PRICES_GHS.feedbackReset;

  if (loading) return <PageSkeleton />;
  if (!project || !chapters.length) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: colors.background, color: colors.text }}>Project not found</div>;

  return (
      <div style={{ display: 'flex', height: '100vh', backgroundColor: colors.background }} onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }} onTouchEnd={(e) => { const diff = e.changedTouches[0].clientX - touchStartX.current; if (diff > 60) setSidebarOpen(true); else if (diff < -60) setSidebarOpen(false); }}>
      {/* Mobile sidebar overlay */}
      <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} style={{ display: sidebarOpen && isMobile ? 'block' : 'none', position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 200 }} />
      {/* Mobile drag handle */}
      {isMobile && (
        <div onClick={() => setSidebarOpen(true)} style={{ position: 'fixed', top: '50%', left: 0, transform: 'translateY(-50%)', width: '20px', height: '60px', zIndex: 201, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: sidebarOpen ? 0 : 0.6, transition: 'opacity 0.3s ease' }}>
          <div style={{ width: '4px', height: '32px', backgroundColor: colors.textSecondary, borderRadius: '3px', opacity: 0.4 }} />
        </div>
      )}
      {/* Left pane drawer */}
      <div className={`left-pane-drawer ${sidebarOpen ? 'open' : ''}`} style={{
        width: '400px', minWidth: '400px', height: '100vh', overflowY: 'auto', backgroundColor: colors.surface,
        transition: 'transform 0.3s ease',
      }}>
        <LeftPane chapters={chapters} activeChapter={activeChapter} onChapterClick={wrappedHandleChapterClick}
          onDeleteSubsection={handleDeleteWithUndo} onRestoreSubsection={handleRestoreSubsection} onCustomizeSubsection={handleCustomizeSubsection} onRenameSubsection={handleRenameSubsection}
          onAddSubsection={handleAddSubsection} onSubsectionClick={wrappedHandleSubsectionClick} generatingSubtopics={generatingSubtopics}
          generatedSubsections={generatedSubsections} onDragStart={handleDragStart} onDragOver={handleDragOver} onDrop={handleWrappedDrop}
          onDragEnd={handleDragEnd} draggedItem={draggedItem} dragOverItem={dragOverItem} chapterWordCounts={chapterWordCounts}
          generatingChapter={generatingChapter} onGenerateChapter={(chId) => { if (chId === activeChapter) wrappedGenerateChapter(); }}
          onAddChapter={addChapter} onRemoveChapter={removeChapter} onRenameChapter={renameChapter} onChapterReorder={handleChapterDrop}
          onUpdateGuidelines={handleUpdateGuidelines}
          isPremium={project?.tier === 'premium'}
          onEditWordCount={handleEditWordCount}
          regeneratingChapter={regeneratingChapter}
          />
      </div>

      <div className="content-area" style={{ flex: 1, height: '100vh', overflowY: 'auto', backgroundColor: colors.surface, borderLeft: `1px solid ${colors.border}` }}>
        <div className="content-area-inner" style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 32px 80px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="hamburger-btn" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.text, padding: '8px', display: 'none', position: 'fixed', top: '8px', left: '8px', zIndex: 301, borderRadius: '8px', backgroundColor: colors.surface, boxShadow: '0 2px 8px rgba(0,0,0,0.15)', transition: 'transform 0.3s ease' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: sidebarOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}>
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <div style={{ flex: 1 }}>
              <WriteHeader onBack={() => navigate('/dashboard')} onToggleLitSearch={() => setShowLitSearchModal(true)} onToggleTour={() => setShowHelpModal(true)} saveStatus={saveStatus} lastSaved={lastSaved} onSaveNow={saveNow} wordCount={currentWordCount} sourceCount={sourceLibrary.sources.length} isPremium={project?.tier === 'premium'} />
            </div>
          </div>

          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: colors.text, marginBottom: '8px' }}>{currentChapter?.customTitle || currentChapter?.title}</h1>
          <p style={{ color: colors.textSecondary, fontSize: '18px', marginBottom: '4px' }}>{project?.title || 'Thesis Project'} • {project?.referenceStyle?.toUpperCase() || 'APA'} Style</p>
          <p style={{ fontSize: '12px', color: '#059669', marginBottom: '28px' }}>✅ Citations auto-verified, references auto-generated</p>
          {project?.tier === 'premium' && (
            <div style={{ fontSize: '12px', color: '#f59e0b', marginBottom: '12px', display: 'flex', gap: '16px', alignItems: 'center' }}>
              <span>💎 Premium</span>
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
               <ContentArea
                  content={currentContent}
                  isPreviewMode={isPreviewMode}
                  onTogglePreview={setIsPreviewMode}
                  onSaveEdit={handleSaveEdit}
                  onChange={setCurrentContent}
                  showReferenceInTextarea={showReferenceInTextarea}
                  generatingReferences={generatingReferences}
                  highlightRanges={highlightRanges}
                  chapterSubsections={currentChapter?.subsections}
                  subsectionsContent={generatedSubsections[activeChapter]}
                  isPremium={project?.tier === 'premium'}
                  onFeedback={(sub) => modals.openFeedbackModal(sub)}
                  onEditVisual={(blockIndex, newData) => {
                   const blocks = parseContentBlocks(currentContent);
                   const block = blocks[blockIndex];
                   if (!block) return;
                   let newContent = currentContent;
                   if (block.type === 'chart' && block.originalText) {
                     const pairs = (newData.labels || []).map((l, i) => `${l}: ${(newData.values || [])[i] || 0}`).join(', ');
                     const newMarker = `[CHART: ${newData.chartType} | ${newData.title} | ${pairs}]`;
                     newContent = currentContent.replace(block.originalText, newMarker);
                    } else if (block.type === 'diagram' && block.originalText) {
                      let newMarker = `[FRAMEWORK: ${newData.title || 'Diagram'}`;
                      if (newData.independent?.length) newMarker += `\n  Independent: ${newData.independent.join(', ')}`;
                      if (newData.dependent?.length) newMarker += `\n  Dependent: ${newData.dependent.join(', ')}`;
                      if (newData.mediating?.length) newMarker += `\n  Mediating: ${newData.mediating.join(', ')}`;
                      if (newData.moderating?.length) newMarker += `\n  Moderating: ${newData.moderating.join(', ')}`;
                      if (newData.hierarchy?.length) {
                        for (const edge of newData.hierarchy) {
                          newMarker += `\n  Hierarchy: ${edge.from} → ${edge.to}`;
                        }
                      }
                      if (newData.relationships?.length) {
                        for (const rel of newData.relationships) {
                          newMarker += `\n  H: ${rel.from} → ${rel.to}`;
                        }
                      }
                      newMarker += '\n]';
                      newContent = currentContent.replace(block.originalText, newMarker);
                   } else if (block.type === 'table' && block.originalText) {
                     const hdrs = (newData.headers || []).join(' | ');
                     const sep = (newData.headers || []).map(() => '---').join(' | ');
                     const rws = (newData.rows || []).map(r => '| ' + r.join(' | ') + ' |');
                     const newTable = `| ${hdrs} |\n| ${sep} |\n${rws.join('\n')}`;
                     newContent = currentContent.replace(block.originalText, newTable);
                   }
                   if (newContent !== currentContent) {
                     setCurrentContent(newContent);
                     setGeneratedSubsections(prev => ({ ...prev, [activeChapter]: { ...prev[activeChapter], fullChapter: newContent } }));
                   }
                 }}
               />

               <ContentButtons
                 isViewingReferences={isViewingReferences}
                 generatingChapter={generatingChapter}
                 chapterComplete={chapterComplete}
                 onGenerateChapter={wrappedGenerateChapter}
                 onComplete={wrappedHandleCompleteChapter}
                 getButtonText={getButtonText}
                 hasContent={!!currentContent || Object.keys(generatedSubsections[activeChapter] || {}).length > 0}
                 feedbackLeft={feedbackLeft}
                 feedbackBase={feedbackBase}
                 onFeedback={() => {
                   const targetSub = currentChapter?.subsections.find(s => s.type !== 'references' && !s.deleted);
                   if (targetSub) modals.openFeedbackModal(targetSub);
                 }}
                 onResetFeedback={() => setResetModalType('feedback')}
                 onOpenVersions={() => {
                   const targetSub = currentChapter?.subsections.find(s => s.type !== 'references' && !s.deleted);
                   if (targetSub) setVersionBrowserSubsection(targetSub);
                 }}
                 onCheckSources={async () => {
                   if (!currentContent) return;
                   const { checkPlagiarism } = await import('../utils/plagiarismChecker.js');
                   const result = checkPlagiarism(currentContent, sourceLibrary?.sources || []);
                   setPlagiarismResult(result);
                   setShowPlagiarismModal(true);
                 }}
                />
             </>
          )}
        </div>
      </div>

      {modals.showDataCollectionModal && project && <DataCollectionModal project={project} onClose={() => modals.setShowDataCollectionModal(false)} onDownload={handleInstrumentsDownload} onNotify={toastError} />}
      {modals.showUploadFindings && project && <UploadFindings project={project} onClose={() => modals.setShowUploadFindings(false)} onUpload={handleUploadFindings} onGenerateWithAI={handleGenerateWithAI} />}
      {modals.showWordCountModal && <WordCountModal chapter={chapters.find(c => c.id === modals.pendingChapterAfterWordCount)} level={project?.level} currentWordCount={chapterWordCounts[modals.pendingChapterAfterWordCount]} onSubmit={wrappedHandleWordCountSubmit} onClose={() => { modals.setShowWordCountModal(false); modals.setPendingChapterAfterWordCount(null); setIsEditingWordCount(null); }} stepIndicator={modals.pendingChapterAfterWordCount === 'chapter2' && modals.literatureReviewType ? 'Step 3 of 3: Word Count' : undefined} isEditing={!!isEditingWordCount} />}
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
          <div className="modal-card" style={{ backgroundColor: colors.surface, borderRadius: '16px', maxWidth: '400px', width: '90%', padding: '32px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize: '40px', textAlign: 'center', marginBottom: '16px' }}>✏️</div>
            <h2 style={{ textAlign: 'center', fontSize: '22px', fontWeight: '700', color: colors.text, margin: '0 0 8px' }}>
              Reset Feedback
            </h2>
            <p style={{ textAlign: 'center', fontSize: '14px', color: colors.textSecondary, margin: '0 0 24px' }}>
              Restore full feedback pool for this chapter.
            </p>
            <div style={{ backgroundColor: colors.background, borderRadius: '12px', padding: '20px', marginBottom: '24px', border: `1px solid ${colors.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ color: colors.textSecondary, fontSize: '14px' }}>Feature</span>
                <span style={{ color: colors.text, fontWeight: '600', fontSize: '14px' }}>Feedback</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ color: colors.textSecondary, fontSize: '14px' }}>Pool reset</span>
                <span style={{ color: colors.text, fontWeight: '500', fontSize: '14px' }}>Full chapter pool</span>
              </div>
              <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: '12px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: colors.textSecondary, fontSize: '14px' }}>Amount</span>
                <span style={{ color: colors.text, fontWeight: '700', fontSize: '18px' }}>{fmt(resetPrice)}</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button onClick={handleResetConfirm} disabled={processingReset} style={{
                backgroundColor: processingReset ? colors.border : '#059669',
                color: 'white', padding: '14px', border: 'none', borderRadius: '8px',
                fontWeight: '600', cursor: processingReset ? 'not-allowed' : 'pointer',
                fontSize: '15px', opacity: processingReset ? 0.7 : 1
              }}>
                {processingReset ? 'Processing...' : `Pay ${fmt(resetPrice)} via Paystack`}
              </button>
              {devBypass && (
                <button onClick={handleResetDevBypass} disabled={processingReset} style={{
                  backgroundColor: '#f59e0b',
                  color: 'white', padding: '12px', border: 'none', borderRadius: '8px',
                  fontWeight: '600', cursor: processingReset ? 'not-allowed' : 'pointer',
                  fontSize: '13px'
                }}>
                  ⚡ Simulate Payment (Dev Mode)
                </button>
              )}
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
      {showPlagiarismModal && plagiarismResult && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }} onClick={() => setShowPlagiarismModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ backgroundColor: colors.surface, borderRadius: '16px', padding: '24px', width: '90%', maxWidth: '480px', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: colors.text }}>📋 Similarity Check</h2>
              <button onClick={() => setShowPlagiarismModal(false)} style={{ background: 'none', border: 'none', color: colors.textSecondary, cursor: 'pointer', fontSize: '18px' }}>✕</button>
            </div>
            <div style={{ textAlign: 'center', padding: '24px', marginBottom: '20px', backgroundColor: isDarkMode ? '#1f2937' : '#f9fafb', borderRadius: '12px' }}>
              <div style={{ fontSize: '40px', fontWeight: '800', color: plagiarismResult.score >= 30 ? '#dc2626' : plagiarismResult.score >= 15 ? '#f59e0b' : '#059669' }}>{plagiarismResult.score}%</div>
              <div style={{ fontSize: '13px', color: colors.textSecondary, marginTop: '4px' }}>
                {plagiarismResult.score >= 30 ? '🔴 High similarity' : plagiarismResult.score >= 15 ? '⚠️ Moderate similarity' : '✅ Low similarity'} — {plagiarismResult.matches.length} flagged
              </div>
              <div style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '8px' }}>
                Compared against {sourceLibrary?.sources?.length || 0} uploaded source(s)
              </div>
            </div>
            {plagiarismResult.matches.length > 0 && (
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: colors.text, marginBottom: '12px' }}>Matched Paragraphs</div>
                {plagiarismResult.matches.map((m, i) => (
                  <div key={i} style={{ padding: '10px', marginBottom: '8px', backgroundColor: isDarkMode ? '#2d2d2d' : '#f9fafb', borderRadius: '8px', border: `1px solid ${colors.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '600', color: m.similarity >= 30 ? '#dc2626' : m.similarity >= 15 ? '#f59e0b' : '#059669' }}>{m.similarity}% match</span>
                      <span style={{ fontSize: '11px', color: colors.textSecondary }}>{m.wordCount} words</span>
                    </div>
                    <p style={{ fontSize: '12px', color: colors.text, margin: '0 0 4px', fontStyle: 'italic' }}>"{m.paragraph}"</p>
                    <p style={{ fontSize: '11px', color: colors.textSecondary, margin: 0 }}>Similar to: {m.source}</p>
                  </div>
                ))}
              </div>
            )}
            {plagiarismResult.matches.length === 0 && (
              <p style={{ textAlign: 'center', color: colors.textSecondary, padding: '20px' }}>No significant similarity found against your uploaded sources.</p>
            )}
          </div>
        </div>
      )}
      <LiteratureSearchModal
        isOpen={showLitSearchModal}
        onClose={() => setShowLitSearchModal(false)}
        onSaveSources={handleSaveLitSources}
        project={project}
      />
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
        @media (max-width: 768px) {
          .left-pane-drawer { position: fixed; top: 0; left: 0; z-index: 300; transform: translateX(-100%); }
          .left-pane-drawer.open { transform: translateX(0); }
          .content-area { width: 100% !important; border-left: none !important; }
          .hamburger-btn { display: block !important; }

          .content-area-inner { padding: 16px 16px 80px !important; }
          .content-buttons-row { flex-direction: column !important; gap: 8px !important; }
          .content-buttons-left { flex-wrap: wrap !important; }
          .content-buttons-right { width: 100% !important; }
          .content-buttons-right button { flex: 1 !important; }

          .modal-card { width: 100vw !important; max-width: 100vw !important; max-height: 100vh !important; border-radius: 0 !important; padding: 16px !important; }
          .modal-card-wide { width: 100vw !important; max-width: 100vw !important; max-height: 100vh !important; border-radius: 0 !important; padding: 12px !important; }
          .modal-card-wide [style*="grid-template-columns"] { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .content-area-inner { padding: 12px 12px 80px !important; }
          h1 { font-size: 24px !important; }
        }
      `}</style>
    </div>
  );
};

export default Write;