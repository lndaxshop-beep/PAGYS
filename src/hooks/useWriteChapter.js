import { useState, useEffect, useCallback } from 'react';
import { getWordCountPresets, getFallbackSubtopics, renumberSubsections } from '../utils/writeHelpers.jsx';

const useWriteChapter = (project, projectId, firestoreFunctions) => {
  const { saveChapters, saveGeneratedContent, saveCitations, saveVisualData } = firestoreFunctions || {};
  
  const [chapters, setChapters] = useState([]);
  const [activeChapter, setActiveChapter] = useState(null);
  const [chapterWordCounts, setChapterWordCounts] = useState({});
  const [chapterWordCountSet, setChapterWordCountSet] = useState({});

  useEffect(() => {
    if (projectId && chapters.length > 0 && saveChapters) {
      saveChapters(projectId, chapters);
    }
  }, [chapters, projectId, saveChapters]);

  const initializeEmptyChapters = useCallback(() => {
    const presets = getWordCountPresets(project?.level);
    const chaptersData = [
      { id: 'proposal', title: 'Proposal', unlocked: true, completed: false, generated: false, wordCount: presets.proposal || { min: 1000, max: 1500 }, wordCountSet: false, subsections: [], deletedSubsections: [] },
      { id: 'chapter1', title: 'Chapter 1: Introduction', unlocked: false, completed: false, generated: false, wordCount: presets.chapter1 || { min: 1000, max: 1800 }, wordCountSet: false, subsections: [], deletedSubsections: [] },
      { id: 'chapter2', title: 'Chapter 2: Literature Review', unlocked: false, completed: false, generated: false, wordCount: presets.chapter2 || { min: 2500, max: 4000 }, wordCountSet: false, subsections: [], deletedSubsections: [] },
      { id: 'chapter3', title: 'Chapter 3: Methodology', unlocked: false, completed: false, generated: false, wordCount: presets.chapter3 || { min: 1500, max: 2500 }, wordCountSet: false, subsections: [], deletedSubsections: [] },
      { id: 'chapter4', title: 'Chapter 4: Results/Analysis', unlocked: false, completed: false, generated: false, wordCount: presets.chapter4 || { min: 1500, max: 3000 }, wordCountSet: false, subsections: [], deletedSubsections: [] },
      { id: 'chapter5', title: 'Chapter 5: Discussion & Conclusion', unlocked: false, completed: false, generated: false, wordCount: presets.chapter5 || { min: 1000, max: 2000 }, wordCountSet: false, subsections: [], deletedSubsections: [] }
    ];
    if (chaptersData.length > 0) chaptersData[0].projectTitle = project?.title || 'Thesis Project';
    setChapters(chaptersData);
    const wordCounts = {}, wordCountSet = {};
    chaptersData.forEach(ch => { wordCounts[ch.id] = ch.wordCount; wordCountSet[ch.id] = false; });
    setChapterWordCounts(wordCounts);
    setChapterWordCountSet(wordCountSet);
  }, [project]);

  const handleDeleteSubsection = useCallback((subsectionId, chapterId) => {
    setChapters(prev => prev.map(ch => {
      if (ch.id === (chapterId || activeChapter)) {
        const subsectionToDelete = ch.subsections.find(s => s.id === subsectionId);
        if (subsectionToDelete && subsectionToDelete.title !== 'References') {
          const markedDeleted = { ...subsectionToDelete, deleted: true };
          const updatedDeleted = [...(ch.deletedSubsections || []), markedDeleted];
          const updatedSubsections = ch.subsections.filter(s => s.id !== subsectionId);
          const renumbered = renumberSubsections(updatedSubsections, ch.id);
          return { ...ch, subsections: renumbered, deletedSubsections: updatedDeleted };
        }
      }
      return ch;
    }));
  }, [activeChapter]);

  const handleRestoreSubsection = useCallback((subsectionId, chapterId) => {
    setChapters(prev => prev.map(ch => {
      if (ch.id === (chapterId || activeChapter)) {
        const subsectionToRestore = (ch.deletedSubsections || []).find(s => s.id === subsectionId);
        if (subsectionToRestore) {
          const updatedDeleted = (ch.deletedSubsections || []).filter(s => s.id !== subsectionId);
          const restored = { ...subsectionToRestore, deleted: false };
          const referencesIndex = ch.subsections.findIndex(s => s.title === 'References');
          let updatedSubsections = [...ch.subsections];
          if (referencesIndex !== -1) updatedSubsections.splice(referencesIndex, 0, restored);
          else updatedSubsections.push(restored);
          return { ...ch, subsections: renumberSubsections(updatedSubsections, ch.id), deletedSubsections: updatedDeleted };
        }
      }
      return ch;
    }));
  }, [activeChapter]);

  const handleDrop = useCallback((draggedItem, dropIndex, chapterId) => {
    if (draggedItem === null || draggedItem === dropIndex) return;
    setChapters(prev => prev.map(ch => {
      if (ch.id === (chapterId || activeChapter)) {
        const subsections = [...ch.subsections];
        if (subsections[dropIndex]?.title === 'References') return ch;
        const [movedItem] = subsections.splice(draggedItem, 1);
        subsections.splice(dropIndex, 0, movedItem);
        return { ...ch, subsections: renumberSubsections(subsections, ch.id) };
      }
      return ch;
    }));
  }, [activeChapter]);

  const handleSubtopicsFallback = useCallback((chapterId) => {
    const fallbackSubtopics = getFallbackSubtopics(chapterId).filter(sub => !sub.title.toLowerCase().includes('reference'));
    const chapterNum = chapterId === 'proposal' ? '1' : chapterId === 'chapter1' ? '1' : chapterId === 'chapter2' ? '2' : chapterId === 'chapter3' ? '3' : chapterId === 'chapter4' ? '4' : '5';
    const numberedFallback = fallbackSubtopics.map((sub, index) => {
      let cleanTitle = sub.title.replace(/^\d+\.\d+(\.\d+)?\s*/, '').replace(/^\d+\.\s*/, '');
      return { id: `${chapterId}_${index}`, title: `${chapterNum}.${index + 1} ${cleanTitle}`, type: 'subsection', hasPlaceholder: cleanTitle.toLowerCase().includes('organisation'), placeholder: 'Organization', customValue: project?.organizationName || '', generated: false, deleted: false };
    });
    const referencesSubsection = { id: `${chapterId}_references`, title: 'References', type: 'references', hasPlaceholder: false, generated: false, deleted: false };
    setChapters(prev => prev.map(ch => ch.id === chapterId ? { ...ch, subsections: [...numberedFallback, referencesSubsection], generated: true } : ch));
  }, [project]);

  const generateSubtopicsForChapter = useCallback(async (chapterId, referenceData = null) => {
    const chapter = chapters.find(c => c.id === chapterId);
    if (!chapter) return;
    try {
      const { generateSubtopics } = await import('../services/geminiService');
      const subtopics = await generateSubtopics({ chapterId, chapterTitle: chapter.title, topic: project.title, field: project.field, level: project.level, methodology: project.methodology, referenceData });
      if (!subtopics || !Array.isArray(subtopics)) { handleSubtopicsFallback(chapterId); return; }
      const filteredSubtopics = subtopics.filter(title => !title.toLowerCase().includes('reference'));
      const chapterNum = chapterId === 'proposal' ? '1' : chapterId === 'chapter1' ? '1' : chapterId === 'chapter2' ? '2' : chapterId === 'chapter3' ? '3' : chapterId === 'chapter4' ? '4' : '5';
      const numberedSubtopics = filteredSubtopics.map((title, index) => {
        let cleanTitle = title.replace(/^\d+\.\d+(\.\d+)?\s*/, '').replace(/^\d+\.\s*/, '');
        return { id: `${chapterId}_${index}`, title: `${chapterNum}.${index + 1} ${cleanTitle}`, type: 'subsection', hasPlaceholder: cleanTitle.toLowerCase().includes('organisation') || cleanTitle.toLowerCase().includes('organization') || cleanTitle.toLowerCase().includes('company') || cleanTitle.toLowerCase().includes('institution'), placeholder: 'Organization', customValue: project?.organizationName || '', generated: false, deleted: false };
      });
      const referencesSubsection = { id: `${chapterId}_references`, title: 'References', type: 'references', hasPlaceholder: false, generated: false, deleted: false };
      setChapters(prev => prev.map(ch => ch.id === chapterId ? { ...ch, subsections: [...numberedSubtopics, referencesSubsection], generated: true } : ch));
    } catch (error) {
      console.error('Error generating subtopics:', error);
      handleSubtopicsFallback(chapterId);
    }
  }, [chapters, project, handleSubtopicsFallback]);

  const setChapterWordCount = useCallback((chapterId, min, max) => {
    setChapterWordCounts(prev => ({ ...prev, [chapterId]: { min, max } }));
    setChapterWordCountSet(prev => ({ ...prev, [chapterId]: true }));
    setChapters(prev => prev.map(ch => ch.id === chapterId ? { ...ch, wordCount: { min, max }, wordCountSet: true } : ch));
  }, []);

  return {
    chapters,
    setChapters,
    activeChapter,
    setActiveChapter,
    chapterWordCounts,
    setChapterWordCounts,
    chapterWordCountSet,
    setChapterWordCountSet,
    initializeEmptyChapters,
    handleDeleteSubsection,
    handleRestoreSubsection,
    handleDrop,
    generateSubtopicsForChapter,
    setChapterWordCount
  };
};

export default useWriteChapter;
