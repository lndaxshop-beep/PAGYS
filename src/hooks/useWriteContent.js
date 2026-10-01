import { useState, useCallback, useRef } from 'react';
import { extractCitations, formatGroundedReference, distributeWordCount } from '../utils/writeHelpers.jsx';

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
    const subsectionIds = ch.subsections.filter(s => s.type !== 'references').map(s => s.id);
    const subsectionTexts = [];
    for (const sid of subsectionIds) {
      const text = content[sid];
      if (text && text.length > 100) subsectionTexts.push(text);
    }
    if (subsectionTexts.length > 0) {
      const summary = subsectionTexts.map(t => t.substring(0, 800)).join('\n\n');
      context.previousChapters.push({
        chapterId: chId,
        title: ch.title || chId,
        summary: summary,
      });
    }
  }
  return context.previousChapters.length > 0 ? context : null;
};

const MAX_WORDS_PER_SEGMENT = 2800;

const getClosingParagraph = (text) => {
  if (!text || text.length < 80) return '';
  const paragraphs = text.split(/\n\n+/);
  if (paragraphs.length >= 2) return paragraphs[paragraphs.length - 1].trim();
  const sentences = text.split(/\.(?=\s)/);
  if (sentences.length >= 2) return `${sentences[sentences.length - 2].trim()}${sentences[sentences.length - 1] ? '.' + sentences[sentences.length - 1].trim() : ''}`.trim();
  return text.slice(-200).trim();
};

const getOpeningParagraph = (text) => {
  if (!text || text.length < 40) return '';
  const paragraphs = text.split(/\n\n+/);
  return paragraphs[0].trim();
};

const combineChapterContent = (subsections, contentMap) => {
  return subsections
    .filter(s => s.type !== 'references' && !s.deleted)
    .map(s => {
      if (contentMap[s.id]) return contentMap[s.id];
      const partKeys = Object.keys(contentMap)
        .filter(k => k.startsWith(`${s.id}__part`))
        .sort((a, b) => {
          const ai = parseInt(a.split('__part')[1], 10) || 0;
          const bi = parseInt(b.split('__part')[1], 10) || 0;
          return ai - bi;
        });
      return partKeys.map(k => contentMap[k]).filter(Boolean).join('\n\n');
    })
    .filter(Boolean)
    .join('\n\n');
};

const useWriteContent = (project, activeChapter, chapters, generatedSubsections, chapterCitations, uploadedFindings, literatureReviewType, feedbackUsed, isViewingReferences, userSources = null, sourceMode = 'ai-only', feedbackLimit = 6) => {
  const [generating, setGenerating] = useState(false);
  const [generatingChapter, setGeneratingChapter] = useState(false);
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

  const generateSubsectionContent = useCallback(async (chapterId, subTitle, subId, subIndex, activeSubsList, force = false, options = {}) => {
    const ch = chapters.find(c => c.id === chapterId);
    if (!ch) return { error: true, message: 'Chapter not found.' };
    const segmentInfo = options.segmentInfo || null;
    const baseSubId = segmentInfo
      ? (subId.replace(/__seg\d+$/, '') || subId)
      : subId;
    const sub = ch.subsections.find(s => s.id === baseSubId) || null;
    if (!sub && !segmentInfo) return { error: true, message: 'Subsection not found.' };
    const cacheKey = `${chapterId}:${subId}:${ch.guidelines || ''}:${segmentInfo ? segmentInfo.index : 'x'}`;
    const cached = contentCache.current.get(cacheKey);
    if (cached && !force) return cached;
    const ordinal = ch.ordinal !== undefined ? ch.ordinal : -1;
    const numberWords = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN'];
    const chapterNumber = ordinal > 0 && ordinal < numberWords.length ? numberWords[ordinal] : '';
    const childrenTopics = (sub?.children || []).map(c => c.title).filter(Boolean);
    const thesisContext = buildThesisContext(chapterId, chapters, generatedSubsections);

    let targetWords = options.targetWords || null;
    if (!targetWords && ch.wordCount) {
      const allSubs = ch.subsections.filter(s => s.type !== 'references' && !s.deleted);
      targetWords = distributeWordCount(ch.wordCount.min, ch.wordCount.max, allSubs, subTitle);
    }

    const continuity = {};
    if (options.continuity) {
      if (options.continuity.openingOfChapter) continuity.openingOfChapter = options.continuity.openingOfChapter;
      if (options.continuity.previousSubsection) {
        const prev = options.continuity.previousSubsection;
        continuity.previousSubsection = { id: prev.id, title: prev.title };
        continuity.closingParagraph = prev.closingParagraph || getClosingParagraph(generatedSubsections[chapterId]?.[prev.id] || '');
      }
      if (options.continuity.previousSegment) {
        continuity.previousSegment = options.continuity.previousSegment;
      }
    }

    const { generateAcademicContent } = await import('../services/geminiService');
    const result = await generateAcademicContent({
      chapter: ch.title || ch.id, chapterId, chapterNumber, subsection: subTitle,
      topic: project.title, researchTopic: project.topic, field: project.field,
      level: project.level, methodology: project.methodology,
      organization: sub?.customValue || project?.organizationName || null,
      hideOrganization: project?.hideOrganization || false,
      findings: chapterId === 'chapter4' ? uploadedFindings : null,
      literatureType: literatureReviewType, isFirstSubsection: subIndex === 0,
      userSources, sourceMode,
      guidelines: ch.guidelines || '',
      childrenTopics,
      thesisContext,
      targetWords,
      continuity,
      segmentInfo,
    });
    let generatedContent = typeof result === 'object' ? result.text : result;
    const sources = typeof result === 'object' ? (result.sources || []) : [];
    if (sources.length > 0) {
      const existingSources = JSON.parse(localStorage.getItem(`groundingSources_${chapterId}`) || '[]');
      const combined = [...existingSources, ...sources];
      const unique = combined.filter((s, i, arr) => arr.findIndex(t => t.uri === s.uri) === i);
      localStorage.setItem(`groundingSources_${chapterId}`, JSON.stringify(unique));
    }
    const { verifyCitations } = await import('../services/gemini/citationVerifier');
    const storedSources = localStorage.getItem(`groundingSources_${chapterId}`);
    const groundedSources = storedSources ? JSON.parse(storedSources) : [];
    const finalCitations = verifyCitations(generatedContent, groundedSources);
    if (!force) contentCache.current.set(cacheKey, { content: generatedContent, citations: finalCitations.verified || [], subsectionId: subId });
    return { content: generatedContent, citations: finalCitations.verified || [], subsectionId: subId, sources };
  }, [chapters, project, generatedSubsections, literatureReviewType, userSources, sourceMode, uploadedFindings]);

  const generateChapterContent = useCallback(async (chapterId, options = {}) => {
    const ch = chapters.find(c => c.id === chapterId);
    if (!ch) return { error: true, message: 'Chapter not found.' };
    const allSubs = ch.subsections.filter(s => s.type !== 'references' && !s.deleted);
    if (allSubs.length === 0) return { error: true, message: 'No subsections to generate.' };

    const { force = false, onProgress } = options;
    const existing = generatedSubsections[chapterId] || {};
    const resultEntries = {};
    let generatedCount = 0;
    let skippedCount = 0;
    let lastError = null;
    let cancelled = false;
    let openingOfChapter = '';

    const sources = [];

    // Large budgets are split into several requests so no single call can exceed the
    // upstream timeout. Each segment aims at the subsection's upper word bound because
    // the model naturally lands slightly under the requested length; segments are then
    // joined under the stable subsection id so export ordering is unaffected.
    const planSegments = (budget, sub) => {
      const maxWords = budget?.max;
      if (!maxWords || maxWords <= MAX_WORDS_PER_SEGMENT) return null;
      const segmentCount = Math.ceil(maxWords / MAX_WORDS_PER_SEGMENT);
      const perSegment = Math.ceil(maxWords / segmentCount);
      return Array.from({ length: segmentCount }, (_, si) => ({
        index: si,
        count: segmentCount,
        title: `${sub.title} (Part ${si + 1} of ${segmentCount})`,
        min: Math.max(200, Math.round(perSegment * 0.8)),
        max: perSegment,
      }));
    };

    for (let i = 0; i < allSubs.length; i++) {
      const sub = allSubs[i];
      const alreadyDone = !force && existing[sub.id] && String(existing[sub.id]).trim().length > 0;

      if (alreadyDone) {
        resultEntries[sub.id] = {
          content: String(existing[sub.id]),
          citations: extractCitations(String(existing[sub.id])),
          subsectionId: sub.id,
          subsectionTitle: sub.title,
        };
        skippedCount++;
        if (!openingOfChapter) openingOfChapter = getOpeningParagraph(String(existing[sub.id]));
        onProgress?.({ current: i + 1, total: allSubs.length, subsection: sub.title, status: 'skipped', chapterId });
        continue;
      }

      if (cancelled) break;

      onProgress?.({ current: i + 1, total: allSubs.length, subsection: sub.title, status: 'generating', chapterId });

      const previousEntry = i > 0 ? { id: allSubs[i - 1].id, title: allSubs[i - 1].title } : null;

      const targetBudget = ch.wordCount
        ? distributeWordCount(ch.wordCount.min, ch.wordCount.max, allSubs, sub.title)
        : null;

      const segments = planSegments(targetBudget, sub);

      try {
        const segmentTexts = [];
        let segmentCitations = [];

        if (segments) {
          for (const seg of segments) {
            const segContinuity = {};
            if (i === 0 && seg.index === 0) {
              // first segment opens the chapter
            } else if (seg.index === 0 && previousEntry) {
              segContinuity.previousSubsection = previousEntry;
            } else if (seg.index > 0) {
              segContinuity.previousSegment = {
                title: segments[seg.index - 1].title,
                closingParagraph: getClosingParagraph(segmentTexts[seg.index - 1]),
              };
            }
            if (openingOfChapter && !(i === 0 && seg.index === 0)) segContinuity.openingOfChapter = openingOfChapter;

            onProgress?.({
              current: i + 1,
              total: allSubs.length,
              subsection: seg.title,
              status: 'generating',
              chapterId,
            });

            const segResult = await generateSubsectionContent(
              chapterId,
              seg.title,
              `${sub.id}__seg${seg.index + 1}`,
              i,
              allSubs,
              force,
              { continuity: segContinuity, targetWords: { min: seg.min, max: seg.max }, segmentInfo: seg }
            );

            const segContent = segResult?.content || '';
            if (!segContent || segContent.trim().length === 0) throw new Error(`The model returned an empty section for "${seg.title}".`);
            if (Array.isArray(segResult.sources)) sources.push(...segResult.sources);
            segmentTexts.push(segContent);
            if (seg.index === 0 && !openingOfChapter) openingOfChapter = getOpeningParagraph(segContent);
          }
          const joined = segmentTexts.join('\n\n');
          segmentCitations = extractCitations(joined);
          resultEntries[sub.id] = {
            content: joined,
            citations: segmentCitations,
            subsectionId: sub.id,
            subsectionTitle: sub.title,
            segmented: true,
            segmentCount: segments.length,
          };
        } else {
          const continuity = {};
          if (previousEntry) continuity.previousSubsection = previousEntry;
          if (openingOfChapter && i > 0) continuity.openingOfChapter = openingOfChapter;

          const result = await generateSubsectionContent(chapterId, sub.title, sub.id, i, allSubs, force, { continuity });
          const content = result?.content || '';
          if (!content || content.trim().length === 0) throw new Error('The model returned an empty section.');

          if (Array.isArray(result.sources)) sources.push(...result.sources);
          if (!openingOfChapter) openingOfChapter = getOpeningParagraph(content);

          segmentCitations = result.citations || extractCitations(content);
          resultEntries[sub.id] = {
            content,
            citations: segmentCitations,
            subsectionId: sub.id,
            subsectionTitle: sub.title,
          };
        }

        generatedCount++;
        options.onSubsectionComplete?.(chapterId, { ...resultEntries });
      } catch (err) {
        lastError = err;
        console.error(`Failed to generate subsection "${sub.title}":`, err);
        onProgress?.({ current: i + 1, total: allSubs.length, subsection: sub.title, status: 'failed', chapterId, error: err.message });
        if (!options.continueOnError) { cancelled = true; break; }
      }
    }

    if (sources.length > 0) {
      try {
        const existingSources = JSON.parse(localStorage.getItem(`groundingSources_${chapterId}`) || '[]');
        const combined = [...existingSources, ...sources];
        const unique = combined.filter((s, i, arr) => arr.findIndex(t => t.uri === s.uri) === i);
        localStorage.setItem(`groundingSources_${chapterId}`, JSON.stringify(unique));
      } catch (e) { console.warn('Failed to persist grounding sources:', e); }
    }

    const generatedIds = Object.keys(resultEntries);
    return {
      subsections: resultEntries,
      sources,
      totalSubsections: allSubs.length,
      generatedCount,
      skippedCount,
      failed: lastError ? lastError.message : null,
      partial: generatedIds.length > 0 && generatedIds.length < allSubs.length,
      complete: generatedIds.length >= allSubs.length,
    };
  }, [chapters, generatedSubsections, generateSubsectionContent]);

  const handleGenerateChapter = useCallback(async (options) => {
    setGeneratingChapter(true);
    setGenerating(true);
    try {
      const result = await generateChapterContent(activeChapter, options);
      return result;
    } finally {
      setGeneratingChapter(false);
      setGenerating(false);
    }
  }, [activeChapter, generateChapterContent]);

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
      uniqueCitations.forEach(citation => {
        const authorMatch = citation.match(/^([A-Za-z-]+)/);
        const yearMatch = citation.match(/(\d{4})/);
        const author = authorMatch?.[1] || 'Unknown';
        const year = yearMatch?.[1] || '';
        const matchingSource = groundingSources.find(s =>
          s.title?.toLowerCase().includes(author.toLowerCase()) ||
          s.uri?.toLowerCase().includes(author.toLowerCase())
        );
        if (matchingSource) {
          const formatted = formatGroundedReference(matchingSource, style, author, year);
          if (formatted) referenceEntries.push(formatted);
        } else if (userSources?.length > 0) {
          const matchingUserSource = userSources.find(s =>
            (s.authors || '').toLowerCase().includes(author.toLowerCase()) ||
            (s.title || '').toLowerCase().includes(author.toLowerCase())
          );
          if (matchingUserSource) {
            const yr = matchingUserSource.year || year || 'n.d.';
            if (style === 'apa') referenceEntries.push(`${matchingUserSource.authors || author} (${yr}). ${matchingUserSource.title}.`);
            else if (style === 'mla') referenceEntries.push(`${matchingUserSource.authors || author}. "${matchingUserSource.title}." ${yr}.`);
            else referenceEntries.push(`${matchingUserSource.authors || author} (${yr}). ${matchingUserSource.title}.`);
          } else {
            if (style === 'apa') referenceEntries.push(`${author} (${year || 'n.d.'}).`);
            else if (style === 'mla') referenceEntries.push(`${author}. ${year || 'n.d.'}.`);
            else referenceEntries.push(`${author} (${year || 'n.d.'}).`);
          }
        } else {
          if (style === 'apa') referenceEntries.push(`${author} (${year || 'n.d.'}).`);
          else if (style === 'mla') referenceEntries.push(`${author}. ${year || 'n.d.'}.`);
          else referenceEntries.push(`${author} (${year || 'n.d.'}).`);
        }
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
      const modifiedContent = await applyFeedbackToContent(currentContentText, { text: feedbackText, files: processedFiles }, currentFeedbackSubsection.title, project, userSources, sourceMode);
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
    generating, generatingChapter, generatingVisual, applyingSubFeedback,
    handleGenerateConceptualFramework,
    handleGenerateTheoreticalFramework,
    handleGenerateResearchDesign,
    handleGenerateTable,
    handleGenerateChart,
    handleGenerateChapter,
    generateChapterContent,
    generateSubsectionContent,
    handleGenerateReferences,
    autoGenerateReferences,
    handleApplyFeedback,
    preRenderDiagrams,
    combineChapterContent,
  };
};

export default useWriteContent;
