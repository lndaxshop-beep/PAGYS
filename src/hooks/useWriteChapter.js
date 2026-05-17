import { useState, useEffect, useCallback } from 'react';
import { getWordCountPresets, getFallbackSubtopics, renumberSubsections, getChapterDisplayTitle, getChapterOrdinal } from '../utils/writeHelpers.jsx';

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
      { id: 'proposal', title: 'Proposal', unlocked: true, completed: false, generated: false, wordCount: presets.proposal || { min: 1000, max: 1500 }, wordCountSet: false, subsections: [], deletedSubsections: [], isDefault: true, customTitle: null },
      { id: 'chapter1', title: 'Chapter 1: Introduction', unlocked: false, completed: false, generated: false, wordCount: presets.chapter1 || { min: 1000, max: 1800 }, wordCountSet: false, subsections: [], deletedSubsections: [], isDefault: true, customTitle: null },
      { id: 'chapter2', title: 'Chapter 2: Literature Review', unlocked: false, completed: false, generated: false, wordCount: presets.chapter2 || { min: 2500, max: 4000 }, wordCountSet: false, subsections: [], deletedSubsections: [], isDefault: true, customTitle: null },
      { id: 'chapter3', title: 'Chapter 3: Methodology', unlocked: false, completed: false, generated: false, wordCount: presets.chapter3 || { min: 1500, max: 2500 }, wordCountSet: false, subsections: [], deletedSubsections: [], isDefault: true, customTitle: null },
      { id: 'chapter4', title: 'Chapter 4: Results/Analysis', unlocked: false, completed: false, generated: false, wordCount: presets.chapter4 || { min: 1500, max: 3000 }, wordCountSet: false, subsections: [], deletedSubsections: [], isDefault: true, customTitle: null },
      { id: 'chapter5', title: 'Chapter 5: Discussion & Conclusion', unlocked: false, completed: false, generated: false, wordCount: presets.chapter5 || { min: 1000, max: 2000 }, wordCountSet: false, subsections: [], deletedSubsections: [], isDefault: true, customTitle: null }
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
        if (subsectionToDelete && subsectionToDelete.type !== 'references') {
          const markedDeleted = { ...subsectionToDelete, deleted: true };
          const updatedDeleted = [...(ch.deletedSubsections || []), markedDeleted];
          const updatedSubsections = ch.subsections.filter(s => s.id !== subsectionId);
          const ord = getChapterOrdinal(ch, prev);
          const renumbered = renumberSubsections(updatedSubsections, ch.id, ord >= 0 ? String(ord) : undefined);
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
          const referencesIndex = ch.subsections.findIndex(s => s.type === 'references');
          let updatedSubsections = [...ch.subsections];
          if (referencesIndex !== -1) updatedSubsections.splice(referencesIndex, 0, restored);
          else updatedSubsections.push(restored);
          const ord = getChapterOrdinal(ch, prev);
          return { ...ch, subsections: renumberSubsections(updatedSubsections, ch.id, ord >= 0 ? String(ord) : undefined), deletedSubsections: updatedDeleted };
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
        if (subsections[dropIndex]?.type === 'references') return ch;
        const [movedItem] = subsections.splice(draggedItem, 1);
        subsections.splice(dropIndex, 0, movedItem);
        const ord = getChapterOrdinal(ch, prev);
        return { ...ch, subsections: renumberSubsections(subsections, ch.id, ord >= 0 ? String(ord) : undefined) };
      }
      return ch;
    }));
  }, [activeChapter]);

  const buildSubsectionsFromHeadings = useCallback((chapterId, headings, preserveNumbering = false) => {
    const chapter = chapters.find(c => c.id === chapterId);
    const ordinal = chapter ? getChapterOrdinal(chapter, chapters) : -1;
    const chapterNum = ordinal >= 0 ? String(ordinal) : chapterId.replace('chapter', '');
    const filtered = headings.filter(t => !t.toLowerCase().includes('reference'));

    const subsections = [];
    let currentParent = null;
    let parentIdx = -1;

    const hasPlaceholderCheck = (title) =>
      title.toLowerCase().includes('organisation') ||
      title.toLowerCase().includes('organization') ||
      title.toLowerCase().includes('company') ||
      title.toLowerCase().includes('institution');

    filtered.forEach((title) => {
      const match = title.match(/^(\d+)\.(\d+)(?:\.(\d+))?\s+(.+)/);
      if (match) {
        const sub = match[3] ? parseInt(match[3]) : NaN;
        const cleanTitle = match[4];
        const headingNumber = preserveNumbering ? `${match[1]}.${match[2]}` : null;
        const displayTitle = headingNumber ? `${headingNumber} ${cleanTitle}` : cleanTitle;

        if (isNaN(sub)) {
          const subObj = {
            id: `${chapterId}_sub_${Date.now()}_${subsections.length}`,
            number: headingNumber,
            title: displayTitle,
            type: 'subsection',
            hasPlaceholder: hasPlaceholderCheck(cleanTitle),
            placeholder: 'Organization',
            customValue: project?.organizationName || '',
            generated: false, deleted: false,
            children: []
          };
          subsections.push(subObj);
          currentParent = subObj;
          parentIdx = subsections.length - 1;
        } else if (currentParent && parentIdx >= 0) {
          const childNumber = preserveNumbering ? `${match[1]}.${match[2]}.${match[3]}` : null;
          subsections[parentIdx].children.push({
            id: `${subsections[parentIdx].id}_child_${subsections[parentIdx].children.length}`,
            number: childNumber,
            title: childNumber ? `${childNumber} ${cleanTitle}` : cleanTitle,
            type: 'sub-subsection',
            generated: false
          });
        }
      } else {
        const cleanTitle = title.replace(/^\d+\.\d+(\.\d+)?\s*/, '').replace(/^\d+\.\s*/, '');
        const subObj = {
          id: `${chapterId}_sub_${Date.now()}_${subsections.length}`,
          number: null,
          title: cleanTitle,
          type: 'subsection',
          hasPlaceholder: hasPlaceholderCheck(cleanTitle),
          placeholder: 'Organization',
          customValue: project?.organizationName || '',
          generated: false, deleted: false,
          children: []
        };
        subsections.push(subObj);
        currentParent = subObj;
        parentIdx = subsections.length - 1;
      }
    });

    const ref = { id: `${chapterId}_references`, title: 'References', type: 'references', hasPlaceholder: false, generated: false, deleted: false, children: [] };
    if (preserveNumbering) {
      setChapters(prev => prev.map(ch => ch.id === chapterId ? { ...ch, subsections: [...subsections, ref], generated: true } : ch));
    } else {
      const numbered = renumberSubsections([...subsections, ref], chapterId, chapterNum);
      setChapters(prev => prev.map(ch => ch.id === chapterId ? { ...ch, subsections: numbered, generated: true } : ch));
    }
  }, [project, chapters, renumberSubsections]);

  const handleSubtopicsFallback = useCallback((chapterId) => {
    const chapter = chapters.find(c => c.id === chapterId);
    const fallbackSubtopics = getFallbackSubtopics(chapterId, chapter?.title).filter(sub => !sub.title.toLowerCase().includes('reference'));
    buildSubsectionsFromHeadings(chapterId, fallbackSubtopics.map(s => s.title));
  }, [buildSubsectionsFromHeadings, chapters]);

  const generateSubtopicsForChapter = useCallback(async (chapterId, referenceData = null) => {
    const chapter = chapters.find(c => c.id === chapterId);
    if (!chapter) return;
    const displayTitle = getChapterDisplayTitle(chapter);
    try {
      const { generateSubtopics } = await import('../services/geminiService');
      const subtopics = await generateSubtopics({ chapterId, chapterTitle: displayTitle, topic: project.title, field: project.field, level: project.level, methodology: project.methodology, referenceData });
      if (!subtopics || !Array.isArray(subtopics)) { handleSubtopicsFallback(chapterId); return; }
      const preserveNum = referenceData !== null;
      buildSubsectionsFromHeadings(chapterId, subtopics, preserveNum);
    } catch (error) {
      console.error('Error generating subtopics:', error);
      handleSubtopicsFallback(chapterId);
    }
  }, [chapters, project, handleSubtopicsFallback, buildSubsectionsFromHeadings]);

  const previewSubtopics = useCallback(async (chapterId, referenceData) => {
    const chapter = chapters.find(c => c.id === chapterId);
    if (!chapter) return null;
    const displayTitle = getChapterDisplayTitle(chapter);
    try {
      const { generateSubtopics } = await import('../services/geminiService');
      return await generateSubtopics({ chapterId, chapterTitle: displayTitle, topic: project.title, field: project.field, level: project.level, methodology: project.methodology, referenceData });
    } catch (error) {
      console.error('Error previewing subtopics:', error);
      return null;
    }
  }, [chapters, project]);

  const getNextChapterNumber = useCallback(() => {
    let max = 5;
    chapters.forEach(ch => {
      const match = ch.id.match(/^chapter_(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > max) max = num;
      }
    });
    return max + 1;
  }, [chapters]);

  const addChapter = useCallback(() => {
    const nextNum = getNextChapterNumber();
    const id = `chapter_${nextNum}`;
    const title = `Chapter ${nextNum}`;
    const presets = getWordCountPresets(project?.level);
    const wordCount = presets.default || { min: 1000, max: 2000 };
    const newChapter = {
      id, title, unlocked: true, completed: false, generated: false,
      wordCount, wordCountSet: false,
      subsections: [], deletedSubsections: [],
      isDefault: false, customTitle: null
    };
    setChapters(prev => [...prev, newChapter]);
    setChapterWordCounts(prev => ({ ...prev, [id]: wordCount }));
    setChapterWordCountSet(prev => ({ ...prev, [id]: false }));
  }, [project, getNextChapterNumber]);

  const removeChapter = useCallback((chapterId) => {
    setChapters(prev => prev.filter(ch => ch.id !== chapterId));
    setChapterWordCounts(prev => {
      const { [chapterId]: _, ...rest } = prev;
      return rest;
    });
    setChapterWordCountSet(prev => {
      const { [chapterId]: _, ...rest } = prev;
      return rest;
    });
    setActiveChapter(prev => prev === chapterId ? null : prev);
  }, []);

  const renameChapter = useCallback((chapterId, newTitle) => {
    if (!newTitle?.trim()) return;
    setChapters(prev => prev.map(ch =>
      ch.id === chapterId ? { ...ch, customTitle: newTitle.trim() } : ch
    ));
  }, []);

  const handleChapterDrop = useCallback((dragIndex, dropIndex) => {
    if (dragIndex === dropIndex || dragIndex === 0 || dropIndex === 0) return;
    setChapters(prev => {
      const updated = [...prev];
      const [moved] = updated.splice(dragIndex, 1);
      updated.splice(dropIndex, 0, moved);
      const renumbered = updated.map((ch, idx) => {
        if (idx === 0) return ch;
        const prefix = String(idx);
        return {
          ...ch,
          subsections: renumberSubsections(ch.subsections, ch.id, prefix),
        };
      });
      return renumbered;
    });
  }, []);

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
    buildSubsectionsFromHeadings,
    previewSubtopics,
    setChapterWordCount,
    addChapter,
    removeChapter,
    renameChapter,
    handleChapterDrop
  };
};

export default useWriteChapter;
