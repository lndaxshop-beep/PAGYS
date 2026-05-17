import { useState, useCallback, useRef } from 'react';
import { extractCitations, formatCitationEntry, formatGroundedReference, formatSimpleReference, distributeWordCount, getChapterDisplayTitle, getChapterOrdinal } from '../utils/writeHelpers.jsx';

const useWriteContent = (project, activeChapter, currentSubsection, currentSubsectionIndex, chapters, generatedSubsections, chapterCitations, uploadedFindings, literatureReviewType, humaniseUsed, feedbackUsed, isViewingReferences, userSources = null, sourceMode = 'ai-only', humaniseLimit = 10, feedbackLimit = 6) => {
  const [generating, setGenerating] = useState(false);
  const [generatingVisual, setGeneratingVisual] = useState(false);
  const [humanising, setHumanising] = useState(false);
  const [applyingSubFeedback, setApplyingSubFeedback] = useState(false);

  const isPremium = project?.isPremium || (() => {
    try {
      const stored = JSON.parse(localStorage.getItem('thesisProjects') || '[]');
      return stored.some(p => p.id.toString() === project?.id?.toString() && p.isPremium);
    } catch { return false; }
  })();
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
      const tableDataResult = await generateDataTable(currentSubsection.title, project);
      setGeneratingVisual(false);
      return { key: `${activeChapter}_${currentSubsection.id}`, data: tableDataResult };
    } catch (error) { setGeneratingVisual(false); throw error; }
  }, [project]);

  const handleGenerateChart = useCallback(async (chartType, currentSubsection, activeChapter) => {
    if (!currentSubsection) return;
    setGeneratingVisual(true);
    try {
      const { generateChartData } = await import('../services/geminiService');
      const chartDataResult = await generateChartData(chartType, currentSubsection.title, project);
      setGeneratingVisual(false);
      return { key: `${activeChapter}_${currentSubsection.id}_${chartType}`, data: chartDataResult };
    } catch (error) { setGeneratingVisual(false); throw error; }
  }, [project]);

  const generateSubsectionContent = useCallback(async (chapterId, subTitle, subId, subIndex, activeSubsList) => {
    const ch = chapters.find(c => c.id === chapterId);
    if (!ch) return { error: true, message: 'Chapter not found.' };
    const sub = ch.subsections.find(s => s.id === subId);
    if (!sub) return { error: true, message: 'Subsection not found.' };
    if (sub.generated) return { skipped: true, reason: 'already generated' };
    if (sub.type === 'references') return { skipped: true, reason: 'references' };

    const cacheKey = `${chapterId}:${subId}:${ch.guidelines || ''}`;
    const cached = contentCache.current.get(cacheKey);
    if (cached) return cached;

    const chapterTitle = getChapterDisplayTitle(ch);
    const ordinal = getChapterOrdinal(ch, chapters);
    const numberWords = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN'];
    const chapterNumber = ordinal > 0 && ordinal < numberWords.length ? numberWords[ordinal] : '';
    const totalWordCount = ch.wordCount || { min: 1000, max: 2000 };
    const subsectionWordCount = distributeWordCount(totalWordCount.min, totalWordCount.max, activeSubsList, subTitle);
    const childrenTopics = (sub.children || []).map(c => c.title).filter(Boolean);
    const { generateAcademicContent, selfReviewContent } = await import('../services/geminiService');
    const result = await generateAcademicContent({
      chapter: chapterTitle, chapterId, chapterNumber, subsection: subTitle,
      topic: project.title, field: project.field, level: project.level, methodology: project.methodology,
      organization: sub.customValue || project?.organizationName || null,
      hideOrganization: project?.hideOrganization || false, findings: chapterId === 'chapter4' ? uploadedFindings : null,
      wordCount: subsectionWordCount, literatureType: literatureReviewType, isFirstSubsection: subIndex === 0,
      userSources, sourceMode,
      guidelines: ch.guidelines || '',
      childrenTopics,
    });
    let generatedContent = typeof result === 'object' ? result.text : result;
    try {
      const reviewed = await selfReviewContent(generatedContent, {
        topic: project.title, chapter: chapterTitle, subsection: subTitle
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
          topic: project.title, chapter: chapterTitle, subsection: subTitle,
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

  const autoGenerateReferences = useCallback(async (chapterId) => {
    const ch = chapters.find(c => c.id === chapterId);
    if (!ch) return null;
    const allSubsections = ch.subsections.filter(s => s.type !== 'references' && !s.deleted);
    const allGenerated = allSubsections.every(s => s.generated);
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

  const handleHumanise = useCallback(async (content) => {
    if (!content) return { error: true, message: 'No content to humanise.' };
    const humaniseKey = activeChapter;
    if ((humaniseUsed[humaniseKey] || 0) >= humaniseLimit) return { error: true, message: `Humanise limit reached (${humaniseLimit}/${humaniseLimit}) for this chapter.` };
    setHumanising(true);
    try {
      const { calculateBurstiness, scanBannedPhrases, calculatePerplexityEstimate } = await import('../services/gemini/antiDetection');
      const preBurstiness = calculateBurstiness(content);
      const preBanned = scanBannedPhrases(content);
      const prePerplexity = calculatePerplexityEstimate(content);
      const diagnosticReport = `## PRE-HUMANISE DIAGNOSTICS
- Burstiness coefficient of variation: ${preBurstiness.cv.toFixed(3)} (target: >0.40 for natural human writing)
- Banned phrases detected: ${preBanned.length} (target: 0)
- Estimated perplexity score: ${prePerplexity.score}/100 (target: >60)
- Mean sentence length: ${preBurstiness.mean.toFixed(1)} words
- Sentence length std dev: ${preBurstiness.stdDev.toFixed(1)}`;

      const currentCh = chapters.find(c => c.id === activeChapter);
      const chapterTitle = currentCh ? getChapterDisplayTitle(currentCh) : activeChapter;

      const { humaniseContent } = await import('../services/geminiService');
      const humanisedText = await humaniseContent(content, {
        topic: project?.title,
        field: project?.field,
        chapter: chapterTitle,
        subsection: currentSubsection?.title,
        diagnosticReport
      });

      const postBurstiness = calculateBurstiness(humanisedText);
      const postBanned = scanBannedPhrases(humanisedText);
      const improvement = ((postBurstiness.cv - preBurstiness.cv) / (preBurstiness.cv || 0.01) * 100).toFixed(0);
      console.log(`[Humanise] cv: ${preBurstiness.cv.toFixed(3)} → ${postBurstiness.cv.toFixed(3)} (${improvement}% change), banned: ${preBanned.length} → ${postBanned.length}`);

      return { humanisedText, humaniseKey };
    } catch (error) { throw error; }
    finally { setHumanising(false); }
  }, [project, activeChapter, currentSubsection, humaniseUsed, humaniseLimit]);

  const handleApplyFeedback = useCallback(async (currentContentText, feedbackText, feedbackFiles, currentFeedbackSubsection) => {
    if (!feedbackText && feedbackFiles.length === 0) return { error: true, message: 'Please enter feedback or upload files' };
    const wc = feedbackText.trim() ? feedbackText.trim().split(/\s+/).length : 0;
    if (wc > 50) return { error: true, message: 'Feedback exceeds 50 words. Please shorten it.' };
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
      mermaid.initialize({ startOnLoad: false, theme: isDarkMode ? 'dark' : 'base', securityLevel: 'loose' });
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
    generating, generatingVisual, humanising, applyingSubFeedback,
    handleGenerateConceptualFramework,
    handleGenerateTheoreticalFramework,
    handleGenerateResearchDesign,
    handleGenerateTable,
    handleGenerateChart,
    handleGenerateCurrent,
    generateSubsectionContent,
    handleGenerateReferences,
    autoGenerateReferences,
    handleHumanise,
    handleApplyFeedback,
    preRenderDiagrams
  };
};

export default useWriteContent;
