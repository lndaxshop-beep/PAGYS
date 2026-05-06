import { useCallback } from 'react';
import { renumberSubsections } from '../utils/writeHelpers.jsx';

const useWriteNavigation = (project, projectId, navigate, chapters, setChapters, activeChapter, setActiveChapter, currentSubsectionIndex, setCurrentSubsectionIndex, generatedSubsections, chapterWordCounts, chapterWordCountSet, setChapterWordCounts, setChapterWordCountSet, generateSubtopicsForChapter, handleDrop, handleGenerateCurrent) => {
  const handleChapterClick = useCallback(async (chapterId) => {
    const chapter = chapters.find(c => c.id === chapterId);
    if (chapter && chapter.unlocked) {
      const hasContent = chapter.generated || (chapter.subsections.length > 0 && chapter.subsections.some(s => s.title !== 'References'));
      if (!hasContent && !chapter.completed) return { action: 'showStructure', chapterId };
      if (chapterId === 'chapter2' && !chapter.generated) return { action: 'showLitType', chapterId };
      if (!chapterWordCountSet[chapterId]) return { action: 'showWordCount', chapterId };
      return {
        action: 'openChapter',
        chapterId,
        firstIndex: chapter.subsections.findIndex(s => s.title !== 'References'),
        content: chapter.generated ? (generatedSubsections[chapterId]?.[chapter.subsections.find(s => s.title !== 'References')?.title] || '') : '',
        needsSubtopics: !chapter.generated || chapter.subsections.length === 0
      };
    }
  }, [chapters, chapterWordCountSet, generatedSubsections]);

  const handleChapterStructureSubmit = useCallback(async (referenceData, pendingChapterForStructure, instrumentsCompleted, setShowUploadFindings, setShowWordCountModal, setPendingChapterAfterWordCount, setPendingChapterForStructure, setShowChapterStructureModal, setUploadedStructureFile, setActiveChapter, setIsViewingReferences, setIsPreviewMode, setCurrentSubsectionIndex, setCurrentContent) => {
    setShowChapterStructureModal(false);
    setUploadedStructureFile(null);
    const chapterId = pendingChapterForStructure;
    if (!chapterId) return;
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
    if (!chapterWordCountSet[chapterId]) { setShowWordCountModal(true); setPendingChapterAfterWordCount(chapterId); }
    else {
      const ch = chapters.find(c => c.id === chapterId);
      setActiveChapter(chapterId);
      setIsViewingReferences(false);
      setIsPreviewMode(true);
      setCurrentSubsectionIndex(ch?.subsections.findIndex(s => s.title !== 'References') || 0);
      setCurrentContent('');
    }
    setPendingChapterForStructure(null);
  }, [chapters, chapterWordCountSet, generateSubtopicsForChapter]);

  const handleWordCountSubmit = useCallback((range, useCustom, pendingChapterAfterWordCount, setShowWordCountModal) => {
    setChapterWordCounts(prev => ({ ...prev, [pendingChapterAfterWordCount]: range }));
    setChapterWordCountSet(prev => ({ ...prev, [pendingChapterAfterWordCount]: true }));
    setChapters(prev => prev.map(ch => ch.id === pendingChapterAfterWordCount ? { ...ch, wordCount: range, wordCountSet: true } : ch));
    setShowWordCountModal(false);
    if (pendingChapterAfterWordCount) {
      const chapter = chapters.find(c => c.id === pendingChapterAfterWordCount);
      if (chapter) {
        if (pendingChapterAfterWordCount !== 'chapter4' && (!chapter.generated || chapter.subsections.length === 0)) generateSubtopicsForChapter(pendingChapterAfterWordCount);
      }
    }
  }, [chapters, setChapters, setChapterWordCounts, setChapterWordCountSet, generateSubtopicsForChapter]);

  const handleCustomizeSubsection = useCallback((subsectionId, value) => {
    setChapters(prev => prev.map(ch => ch.id === activeChapter ? { ...ch, subsections: ch.subsections.map(s => s.id === subsectionId ? { ...s, customValue: value } : s) } : ch));
  }, [activeChapter, setChapters]);

  const handleAddSubsection = useCallback((title) => {
    setChapters(prev => prev.map(ch => {
      if (ch.id === activeChapter) {
        const newSubsection = { id: `${activeChapter}_custom_${Date.now()}`, title, type: 'subsection', hasPlaceholder: false, generated: false, deleted: false };
        const referencesIndex = ch.subsections.findIndex(s => s.title === 'References');
        let newSubsections;
        if (referencesIndex !== -1) { newSubsections = [...ch.subsections]; newSubsections.splice(referencesIndex, 0, newSubsection); }
        else { newSubsections = [...ch.subsections, newSubsection]; }
        return { ...ch, subsections: renumberSubsections(newSubsections, activeChapter) };
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
    const activeSubs = currentChapter.subsections.filter(s => s.title !== 'References' && !s.deleted);
    const referencesSub = currentChapter.subsections.find(s => s.title === 'References');
    const allActiveGenerated = activeSubs.length > 0 && activeSubs.every(s => s.generated);
    const refContent = generatedSubsections[activeChapter]?.references || generatedSubsections[activeChapter]?.['References'] || '';
    const referencesGenerated = referencesSub?.generated || (refContent && refContent.length > 0);
    return allActiveGenerated && referencesGenerated;
  }, [chapters, activeChapter, generatedSubsections]);

  const handleCompleteChapter = useCallback(() => {
    if (!isChapterComplete()) return { action: 'error', message: 'Please generate all subsections and references first.' };
    setChapters(prev => prev.map(ch => ch.id === activeChapter ? { ...ch, completed: true } : ch));
    if (activeChapter === 'chapter3') return { action: 'showDataCollection' };
    if (activeChapter === 'chapter5') return { action: 'navigateFiles' };
    const currentIndex = chapters.findIndex(ch => ch.id === activeChapter);
    if (currentIndex < chapters.length - 1) {
      const nextChapterId = chapters[currentIndex + 1].id;
      setChapters(prev => prev.map((ch, index) => index === currentIndex + 1 ? { ...ch, unlocked: true } : ch));
      return { action: 'nextChapter', nextChapterId, chapterTitle: chapters.find(c => c.id === activeChapter)?.title || 'Chapter' };
    }
    return { action: 'none' };
  }, [chapters, activeChapter, setChapters, isChapterComplete]);

  const calculateOverallProgress = useCallback(() => {
    if (!chapters.length) return { percentage: 0, currentStep: 1, totalSteps: 1 };
    let totalActive = 0, totalGenerated = 0;
    chapters.forEach(ch => {
      const active = ch.subsections.filter(s => s.title !== 'References' && !s.deleted);
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
    handleAddSubsection,
    handlePrevSubsection,
    handleNextSubsection,
    isChapterComplete,
    handleCompleteChapter,
    calculateOverallProgress
  };
};

export default useWriteNavigation;
