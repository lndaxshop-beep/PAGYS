import { useState, useCallback, useRef } from 'react';
import { extractCitations, formatCitationEntry, formatGroundedReference, formatSimpleReference, getChapterDisplayTitle, getChapterOrdinal } from '../utils/writeHelpers.jsx';

const buildThesisContext = (currentChapterId, chapters, generatedSubsections) => {
  const chapterOrder = ['chapter1', 'chapter2', 'chapter3', 'chapter4', 'chapter5'];
  const currentIndex = chapterOrder.indexOf(currentChapterId);
  if (currentIndex <= 0) return null;

  const context = { previousChapters: [] };
  for (let i = 0; i < currentIndex; i++) {
    const chId = chapterOrder[i];
    const ch = chapters.find(c => c.id === chId);
    if (!ch) continue;
    const content = generatedSubsections[chId] || {};
    const subsectionTexts = Object.values(content).filter(v => typeof v === 'string' && v.length > 100);
    if (subsectionTexts.length > 0) {
      const summary = subsectionTexts.map(t => t.substring(0, 300)).join(' ');
      context.previousChapters.push({
        chapterId: chId,
        title: ch.title || chId,
        summary: summary.substring(0, 1000),
      });
    }
  }
  return context.previousChapters.length > 0 ? context : null;
};

const useWriteContent = (project, activeChapter, currentSubsection, currentSubsectionIndex, chapters, generatedSubsections, chapterCitations, uploadedFindings, literatureReviewType, feedbackUsed, isViewingReferences, userSources = null, sourceMode = 'ai-only', feedbackLimit = 6) => {
  const [generating, setGenerating] = useState(false);
  const [generatingVisual, setGeneratingVisual] = useState(false);
  const [applyingSubFeedback, setApplyingSubFeedback] = useState(false);

  const contentCache = useRef(new Map());

  const handleGenerateConceptualFramework = useCallback(async () => {
    setGeneratingVisual(true);
    try {
      const { generateConceptualFramework } = await import('../services/geminiService');
      const mermaidCode = await generateConceptualFramework(project);
      setGeneratingVisual(false);
      return mermaidCode;
    } catch (error) { setGeneratingVisual(false); throw error; }
  }, [project]);

  const handleGenerateTheoreticalFramework = useCallback(async () => {
    setGeneratingVisual(true);
    try {
      const { generateTheoreticalFramework } = await import('../services/geminiService');
      const mermaidCode = await generateTheoreticalFramework(project);
      setGeneratingVisual(false);
      return mermaidCode;
    } catch (error) { setGeneratingVisual(false); throw error; }
  }, [project]);

  const handleGenerateResearchDesign = useCallback(async () => {
    setGeneratingVisual(true);
    try {
      const { generateResearchDesignFlowchart } = await import('../services/geminiService');
      const mermaidCode = await generateResearchDesignFlowchart(project);
      setGeneratingVisual(false);
      return mermaidCode;
    } catch (error) { setGeneratingVisual(false); throw error; }
  }, [project]);

  const handleGenerateTable = useCallback(async (currentSubsection, activeChapter) => {
    if (!currentSubsection) return;
    setGeneratingVisual(true);
    try {
      const { generateDataTable } = await import('../services/geminiService');
      const tableDataResult = await generateDataTable(currentSubsection.title, project, uploadedFindings);
      setGeneratingVisual(false);
      return { key: `${activeChapter}_${currentSubsection.id}`, data: tableDataResult };
    } catch (error) { setGeneratingVisual(false); throw error; }
  }, [project, uploadedFindings]);

  const handleGenerateChart = useCallback(async (chartType, currentSubsection, activeChapter) => {
    if (!currentSubsection) return;
    setGeneratingVisual(true);
    try {
      const { generateChartData } = await import('../services/geminiService');
      const chartDataResult = await generateChartData(chartType, currentSubsection.title, project, uploadedFindings);
      setGeneratingVisual(false);
      return { key: `${activeChapter}_${currentSubsection.id}_${chartType}`, data: chartDataResult };
    } catch (error) { setGeneratingVisual(false); throw error; }
  }, [project, uploadedFindings]);

  const generateSubsectionContent = useCallback(async (chapterId, subTitle, subId, subIndex, activeSubsList, force = false) => {
    const ch = chapters.find(c => c.id === chapterId);
    if (!ch) return { error: true, message: 'Chapter not found.' };
    const sub = ch.subsections.find(s => s.id === subId);
    if (!sub) return { error: true, message: 'Subsection not found.' };
    if (sub.generated && !force) return { skipped: true, reason: 'already generated' };
    if (sub.type === 'references') return { skipped: true, reason: 'references' };

    const cacheKey = `${chapterId}:${subId}:${ch.guidelines || ''}`;
    const cached = contentCache.current.get(cacheKey);
    if (cached) return cached;

    const chapterTitle = getChapterDisplayTitle(ch);
    const ordinal = getChapterOrdinal(ch, chapters);
    const numberWords = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN'];
    const chapterNumber = ordinal > 0 && ordinal < numberWords.length ? numberWords[ordinal] : '';
    const childrenTopics = (sub.children || []).map(c => c.title).filter(Boolean);

    const thesisContext = buildThesisContext(chapterId, chapters, generatedSubsections);

    const { generateAcademicContent, selfReviewContent } = await import('../services/geminiService');
    const result = await generateAcademicContent({
      chapter: chapterTitle, chapterId, chapterNumber, subsection: subTitle,
      topic: project.title, researchTopic: project.topic, field: project.field, level: project.level, methodology: project.methodology,
      organization: sub.customValue || project?.organizationName || null,
      hideOrganization: project?.hideOrganization || false, findings: chapterId === 'chapter4' ? uploadedFindings : null,
      literatureType: literatureReviewType, isFirstSubsection: subIndex === 0,
      userSources, sourceMode,
      guidelines: ch.guidelines || '',
      childrenTopics,
      thesisContext,
    });
    let generatedContent = typeof result === 'object' ? result.text : result;
    try {
      const reviewed = await selfReviewContent(generatedContent, {
        topic: project.title, researchTopic: project.topic, field: project.field, chapter: chapterTitle, subsection: subTitle
      });
      if (reviewed && reviewed.trim().length > 50) {
        generatedContent = reviewed;
      }
    } catch (e) {
      console.warn('[useWriteContent] Self-review failed, using original output:', e.message);
    }
    const sources = typeof result === 'object' ? (result.sources || []) : [];
    if (sources.length > 0) {
      const existingSources = JSON.parse(localStorage.getItem(`groundingSources_${chapterId}`) || '[]');
      const combined = [...existingSources, ...sources];
      const unique = combined.filter((s, i, arr) => arr.findIndex(t => t.uri === s.uri) === i);
      localStorage.setItem(`groundingSources_${chapterId}`, JSON.stringify(unique));
    }
    const { verifyCitations } = await import('../services/gemini/citationVerifier');
    const storedSources = JSON.parse(localStorage.getItem(`groundingSources_${chapterId}`) || '[]');

    // Auto-repair: detect paragraphs missing citations, re-run self-review with targeted fix
    let citationResult = verifyCitations(generatedContent, storedSources);
    let repairAttempts = 0;
    while (citationResult.paragraphsMissingCitations.length > 0 && repairAttempts < 2) {
      const missingIndices = citationResult.paragraphsMissingCitations.map(p => p.index + 1);
      const repairPrompt = `CRITICAL FIX REQUIRED: Paragraphs ${missingIndices.join(', ')} (${citationResult.paragraphsMissingCitations.length} total) are MISSING in-text citations. Add exactly one (Author, Year) citation to EACH of those paragraphs using Google Search Grounding. Do NOT change any other paragraphs. Do NOT remove existing citations.`;
      try {
        const repaired = await selfReviewContent(generatedContent, {
          topic: project.title, researchTopic: project.topic, field: project.field, chapter: chapterTitle, subsection: subTitle,
          extraInstruction: repairPrompt
        });
        if (repaired && repaired.trim().length > 50) {
          generatedContent = repaired;
        }
      } catch (e) {
        console.warn('[useWriteContent] Citation repair attempt failed:', e.message);
        break;
      }
      citationResult = verifyCitations(generatedContent, storedSources);
      repairAttempts++;
    }

    const citations = extractCitations(generatedContent);
    const { calculateBurstiness } = await import('../services/gemini/antiDetection');
    const burstiness = calculateBurstiness(generatedContent);
    const cacheEntry = { content: generatedContent, citations, subsectionId: subId, subsectionTitle: subTitle, burstiness: burstiness.cv };
    contentCache.current.set(cacheKey, cacheEntry);
    if (contentCache.current.size > 200) {
      const firstKey = contentCache.current.keys().next().value;
      contentCache.current.delete(firstKey);
    }
    return cacheEntry;
  }, [project, chapters, uploadedFindings, literatureReviewType, userSources, sourceMode]);

  const handleGenerateCurrent = useCallback(async (activeSubsections) => {
    const currentChapter = chapters.find(c => c.id === activeChapter);
    if (currentSubsectionIndex >= activeSubsections.length) return { error: true, message: 'All subsections generated!' };
    const currentSub = activeSubsections[currentSubsectionIndex];
    if (currentSub.type === 'references') return { skipped: true, reason: 'references' };
    if (currentSub.generated) return { error: true, message: 'This subsection has already been generated.' };
    setGenerating(true);
    try {
      const result = await generateSubsectionContent(activeChapter, currentSub.title, currentSub.id, currentSubsectionIndex, activeSubsections);
      return result;
    } catch (error) { throw error; }
    finally { setGenerating(false); }
  }, [activeChapter, currentSubsectionIndex, generateSubsectionContent]);

  const handleGenerateReferences = useCallback(async (currentChapter, currentContent = '') => {
    const allGeneratedSubsections = currentChapter.subsections.filter(s => s.generated && s.type !== 'references' && !s.deleted);
    if (allGeneratedSubsections.length === 0) return { error: true, message: 'Please generate some content first.' };
    let allCitations = [];
    allGeneratedSubsections.forEach(sub => {
      const content = generatedSubsections[activeChapter]?.[sub.id] || '';
      const citations = extractCitations(content);
      allCitations = [...allCitations, ...citations];
    });
    if (currentContent) {
      const currentCitations = extractCitations(currentContent);
      allCitations = [...allCitations, ...currentCitations];
    }
    const uniqueCitations = [...new Set(allCitations)];
    if (uniqueCitations.length === 0) return { error: true, message: 'No in-text citations found. Try regenerating the chapter content.' };
    const style = project?.referenceStyle || 'apa';
    let referenceEntries = [];
    let usedGrounding = false;

    try {
      const { generateReferences } = await import('../services/geminiService');
      const aiResult = await generateReferences(uniqueCitations, style, userSources, sourceMode);
      if (aiResult) {
        referenceEntries = aiResult.split('\n').filter(line => line.trim());
        usedGrounding = true;
      }
    } catch (error) {
      console.error('AI reference generation failed:', error);
    }

    if (referenceEntries.length === 0) {
      const storedSources = localStorage.getItem(`groundingSources_${activeChapter}`);
      const groundingSources = storedSources ? JSON.parse(storedSources) : [];
      const seenUrls = new Set();
      groundingSources.forEach(source => {
        if (source.uri && !seenUrls.has(source.uri)) {
          seenUrls.add(source.uri);
          const formatted = formatGroundedReference(source, style);
          if (formatted) referenceEntries.push(formatted);
        }
      });
    }

    if (referenceEntries.length === 0 && userSources?.length > 0) {
      userSources.forEach(source => {
        if (source.title && source.title !== 'Unknown') {
          const author = source.authors || 'Unknown Author';
          const year = source.year || 'n.d.';
          referenceEntries.push(`${formatSimpleReference(author, year, style).replace(' ⚠️ Verify this reference', '')} — ${source.title}`);
        }
      });
    }

    if (referenceEntries.length === 0) {
      uniqueCitations.forEach(citation => {
        const parts = citation.split(/[, ]+/);
        const author = parts[0] || 'Unknown Author';
        const year = parts[1]?.replace(/[a-z]?\)$/, '') || 'n.d.';
        referenceEntries.push(`${formatSimpleReference(author, year, style)} ⚠️ Verify this reference`);
      });
    }

    referenceEntries.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    return { content: `References\n\n${referenceEntries.join('\n')}`, subsectionsUpdated: allGeneratedSubsections, usedGrounding };
  }, [project, activeChapter, generatedSubsections, userSources, sourceMode]);

  const autoGenerateReferences = useCallback(async (chapterId, skipCheck = false) => {
    const ch = chapters.find(c => c.id === chapterId);
    if (!ch) return null;
    const allSubsections = ch.subsections.filter(s => s.type !== 'references' && !s.deleted);
    const allGenerated = skipCheck || (allSubsections.every(s => s.generated));
    if (!allGenerated || !allSubsections.length) return null;
    try {
      const existingRefs = generatedSubsections[chapterId]?.references;
      if (existingRefs && existingRefs.length > 100) return null;
      const result = await handleGenerateReferences(ch);
      if (result && !result.error && result.content) {
        return { chapterId, content: result.content };
      }
    } catch (e) {
      console.warn('[useWriteContent] Auto-reference generation failed:', e.message);
    }
    return null;
  }, [chapters, generatedSubsections, handleGenerateReferences]);

  const handleApplyFeedback = useCallback(async (currentContentText, feedbackText, feedbackFiles, currentFeedbackSubsection) => {
    if (!feedbackText && feedbackFiles.length === 0) return { error: true, message: 'Please enter feedback or upload files' };
    const wc = feedbackText.trim() ? feedbackText.trim().split(/\s+/).length : 0;
    if (wc > 100) return { error: true, message: 'Feedback exceeds 100 words. Please shorten it.' };
    const feedbackKey = activeChapter;
    if ((feedbackUsed[feedbackKey] || 0) >= feedbackLimit) return { error: true, message: `Feedback limit reached (${feedbackLimit}/${feedbackLimit}) for this chapter.` };
    setApplyingSubFeedback(true);
    try {
      const { applyFeedbackToContent } = await import('../services/geminiService');
      const { fileToBase64, extractTextFromFile } = await import('../utils/fileExtractors');
      const processedFiles = [];
      for (const file of feedbackFiles) {
        const isImage = file.type.startsWith('image/');
        if (isImage) {
          const base64 = await fileToBase64(file);
          processedFiles.push({ name: file.name, type: 'image', content: base64 });
        } else {
          const extracted = await extractTextFromFile(file);
          processedFiles.push({ name: file.name, type: 'document', extractedText: extracted?.text || '' });
        }
      }
      const modifiedContent = await applyFeedbackToContent(currentContentText, { text: feedbackText, files: processedFiles }, currentFeedbackSubsection.title, project);
      return { modifiedContent, feedbackKey };
    } catch (error) { throw error; }
    finally { setApplyingSubFeedback(false); }
  }, [project, activeChapter, feedbackUsed, feedbackLimit]);

  const preRenderDiagrams = useCallback(async (content, isDarkMode) => {
    const mermaidRegex = /```mermaid\s*([\s\S]*?)```/g;
    const diagrams = [];
    let match;
    while ((match = mermaidRegex.exec(content)) !== null) diagrams.push({ code: match[1].trim(), fullMatch: match[0] });
    if (diagrams.length === 0) return;
    try {
      const mermaid = (await import('mermaid')).default;
      mermaid.initialize({ startOnLoad: false, theme: isDarkMode ? 'dark' : 'base', securityLevel: 'strict' });
      const renderedDiagrams = {};
      for (let i = 0; i < diagrams.length; i++) {
        try {
          const id = `diagram-${activeChapter}-${Date.now()}-${i}`;
          const { svg } = await mermaid.render(id, diagrams[i].code);
          renderedDiagrams[`diagram_${i}`] = svg;
        } catch (e) { console.error('Mermaid render error:', e); }
      }
      return renderedDiagrams;
    } catch (e) { console.error('Mermaid import error:', e); return null; }
  }, [activeChapter]);

  return {
    generating, generatingVisual, applyingSubFeedback,
    handleGenerateConceptualFramework,
    handleGenerateTheoreticalFramework,
    handleGenerateResearchDesign,
    handleGenerateTable,
    handleGenerateChart,
    handleGenerateCurrent,
    generateSubsectionContent,
    handleGenerateReferences,
    autoGenerateReferences,
    handleApplyFeedback,
    preRenderDiagrams
  };
};

export default useWriteContent;
