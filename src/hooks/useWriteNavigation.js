import { useCallback } from 'react';
import { renumberSubsections, getChapterOrdinal } from '../utils/writeHelpers.jsx';

const useWriteNavigation = (project, projectId, navigate, chapters, setChapters, activeChapter, setActiveChapter, currentSubsectionIndex, setCurrentSubsectionIndex, generatedSubsections, chapterWordCounts, chapterWordCountSet, setChapterWordCounts, setChapterWordCountSet, generateSubtopicsForChapter, buildSubsectionsFromHeadings, handleDrop, handleGenerateCurrent, literatureReviewType) => {
  const handleChapterClick = useCallback(async (chapterId) => {
    const chapter = chapters.find(c => c.id === chapterId);
    if (chapter && chapter.unlocked) {
      const hasContent = chapter.generated || (chapter.subsections.length > 0 && chapter.subsections.some(s => s.type !== 'references'));
      if (chapterId === 'chapter2' && !hasContent && !literatureReviewType) return { action: 'showLitType', chapterId };
      if (!hasContent && !chapter.completed) return { action: 'showStructure', chapterId };
      if (!chapterWordCountSet[chapterId]) return { action: 'showWordCount', chapterId };
      return {
        action: 'openChapter',
        chapterId,
        firstIndex: chapter.subsections.findIndex(s => s.type !== 'references'),
        content: chapter.generated ? (generatedSubsections[chapterId]?.[chapter.subsections.find(s => s.type !== 'references')?.id] || '') : '',
        needsSubtopics: !chapter.generated || chapter.subsections.length === 0
      };
    }
    return { action: 'locked', chapterId };
  }, [chapters, chapterWordCountSet, generatedSubsections, literatureReviewType]);

  const handleChapterStructureSubmit = useCallback(async (referenceData, pendingChapterForStructure, instrumentsCompleted, setShowUploadFindings, setShowWordCountModal, setPendingChapterAfterWordCount, setPendingChapterForStructure, setShowChapterStructureModal, setUploadedStructureFile, setActiveChapter, setIsViewingReferences, setIsPreviewMode, setCurrentSubsectionIndex, setCurrentContent) => {
    setShowChapterStructureModal(false);
    setUploadedStructureFile(null);
    const chapterId = pendingChapterForStructure;
    if (!chapterId) return;
    if (referenceData?.editedHeadings) {
      buildSubsectionsFromHeadings(chapterId, referenceData.editedHeadings, true);
    } else {
      let finalReferenceData = referenceData;
      if (referenceData?.type === 'combined') {
        finalReferenceData = { ...referenceData, content: referenceData.text + '\n\n[Uploaded ' + referenceData.files.length + ' screenshot(s) for structure reference]' };
      } else if (referenceData?.type === 'files') {
        finalReferenceData = { ...referenceData, content: '[Uploaded ' + referenceData.files.length + ' screenshot(s) for structure reference]' };
      }
      if (chapterId === 'chapter4') {
        if (!instrumentsCompleted) { setPendingChapterForStructure(null); return { action: 'error', message: 'Please complete and download the questionnaire first.' }; }
        setShowUploadFindings(true);
        setPendingChapterAfterWordCount(chapterId);
        setPendingChapterForStructure(null);
        return;
      }
      await generateSubtopicsForChapter(chapterId, finalReferenceData);
    }
    if (!chapterWordCountSet[chapterId]) { setShowWordCountModal(true); setPendingChapterAfterWordCount(chapterId); }
    else {
      const ch = chapters.find(c => c.id === chapterId);
      setActiveChapter(chapterId);
      setIsViewingReferences(false);
      setIsPreviewMode(true);
      setCurrentSubsectionIndex(ch?.subsections.findIndex(s => s.type !== 'references') || 0);
      setCurrentContent('');
    }
    setPendingChapterForStructure(null);
  }, [chapters, chapterWordCountSet, generateSubtopicsForChapter, buildSubsectionsFromHeadings]);

  const handleWordCountSubmit = useCallback((range, useCustom, pendingChapterAfterWordCount, setShowWordCountModal) => {
    setChapterWordCounts(prev => ({ ...prev, [pendingChapterAfterWordCount]: range }));
    setChapterWordCountSet(prev => ({ ...prev, [pendingChapterAfterWordCount]: true }));
    setChapters(prev => prev.map(ch => ch.id === pendingChapterAfterWordCount ? { ...ch, wordCount: range, wordCountSet: true } : ch));
    setShowWordCountModal(false);
  }, [setChapters, setChapterWordCounts, setChapterWordCountSet]);

  const handleCustomizeSubsection = useCallback((subsectionId, value) => {
    setChapters(prev => prev.map(ch => ch.id === activeChapter ? { ...ch, subsections: ch.subsections.map(s => s.id === subsectionId ? { ...s, customValue: value } : s) } : ch));
  }, [activeChapter, setChapters]);

  const handleRenameSubsection = useCallback((subsectionId, newTitle) => {
    if (!newTitle.trim()) return;
    setChapters(prev => prev.map(ch => ch.id === activeChapter ? {
      ...ch,
      subsections: ch.subsections.map(s => s.id === subsectionId ? { ...s, title: newTitle.trim() } : s)
    } : ch));
  }, [activeChapter, setChapters]);

  const handleAddSubsection = useCallback((title, chapterId) => {
    const targetChapter = chapterId || activeChapter;
    setChapters(prev => prev.map(ch => {
      if (ch.id === targetChapter) {
        const newSubsection = { id: `${targetChapter}_custom_${Date.now()}`, title, type: 'subsection', hasPlaceholder: false, generated: false, deleted: false };
        const referencesIndex = ch.subsections.findIndex(s => s.type === 'references');
        let newSubsections;
        if (referencesIndex !== -1) { newSubsections = [...ch.subsections]; newSubsections.splice(referencesIndex, 0, newSubsection); }
        else { newSubsections = [...ch.subsections, newSubsection]; }
        const ord = getChapterOrdinal(ch, prev);
        return { ...ch, subsections: renumberSubsections(newSubsections, targetChapter, ord >= 0 ? String(ord) : undefined) };
      }
      return ch;
    }));
  }, [activeChapter, setChapters]);

  const handlePrevSubsection = useCallback(() => {
    return { action: 'prev', index: currentSubsectionIndex - 1 };
  }, [currentSubsectionIndex]);

  const handleNextSubsection = useCallback((activeSubsections) => {
    if (currentSubsectionIndex < activeSubsections.length - 1) return { action: 'next', index: currentSubsectionIndex + 1 };
    return null;
  }, [currentSubsectionIndex]);

  const isChapterComplete = useCallback(() => {
    const currentChapter = chapters.find(c => c.id === activeChapter);
    if (!currentChapter) return false;
    const activeSubs = currentChapter.subsections.filter(s => s.type !== 'references' && !s.deleted);
    const chContent = generatedSubsections[activeChapter] || {};
    const allActiveGenerated = activeSubs.length > 0 && activeSubs.every(s => !!chContent[s.id]);
    const refContent = chContent.references || chContent['References'] || '';
    const referencesGenerated = refContent && refContent.length > 0;
    return allActiveGenerated && referencesGenerated;
  }, [chapters, activeChapter, generatedSubsections]);

  const handleCompleteChapter = useCallback(() => {
    if (!isChapterComplete()) return { action: 'error', message: 'Please generate all subsections and references first.' };
    setChapters(prev => prev.map(ch => ch.id === activeChapter ? { ...ch, completed: true } : ch));
    if (activeChapter === 'chapter3') return { action: 'showDataCollection' };
    if (activeChapter === 'chapter5') return { action: 'navigateFiles' };
    const chapterOrder = ['chapter1', 'chapter2', 'chapter3', 'chapter4', 'chapter5'];
    const currentIndex = chapterOrder.indexOf(activeChapter);
    if (currentIndex < chapterOrder.length - 1) {
      const nextChapterId = chapterOrder[currentIndex + 1];
      setChapters(prev => prev.map(ch => ch.id === nextChapterId ? { ...ch, unlocked: true } : ch));
      return { action: 'nextChapter', nextChapterId, chapterTitle: chapters.find(c => c.id === activeChapter)?.title || 'Chapter' };
    }
    return { action: 'none' };
  }, [chapters, activeChapter, setChapters, isChapterComplete]);

  const calculateOverallProgress = useCallback(() => {
    if (!chapters.length) return { percentage: 0, currentStep: 1, totalSteps: 1 };
    let totalActive = 0, totalGenerated = 0;
    chapters.forEach(ch => {
      const active = ch.subsections.filter(s => s.type !== 'references' && !s.deleted);
      totalActive += active.length;
      totalGenerated += active.filter(s => s.generated).length;
    });
    const percentage = totalActive > 0 ? Math.round((totalGenerated / totalActive) * 100) : 0;
    const currentStep = Math.min(totalGenerated + 1, totalActive || 1);
    return { percentage, currentStep, totalSteps: totalActive || 1 };
  }, [chapters]);

  return {
    handleChapterClick,
    handleChapterStructureSubmit,
    handleWordCountSubmit,
    handleCustomizeSubsection,
    handleRenameSubsection,
    handleAddSubsection,
    handlePrevSubsection,
    handleNextSubsection,
    isChapterComplete,
    handleCompleteChapter,
    calculateOverallProgress
  };
};

export default useWriteNavigation;
