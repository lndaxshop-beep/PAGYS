import { useState, useCallback } from 'react';
import { extractCitations, formatCitationEntry, formatGroundedReference, formatSimpleReference, distributeWordCount } from '../utils/writeHelpers.jsx';

const useWriteContent = (project, activeChapter, currentSubsection, currentSubsectionIndex, chapters, generatedSubsections, chapterCitations, uploadedFindings, literatureReviewType, humaniseUsed, feedbackUsed, isViewingReferences) => {
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
  const humaniseLimit = isPremium ? 4 : 1;
  const feedbackLimit = isPremium ? 4 : 1;

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
    if (sub.title === 'References') return { skipped: true, reason: 'references' };

    let chapterTitle = chapterId === 'proposal' ? 'Proposal' : chapterId === 'chapter1' ? 'Chapter 1: Introduction' : chapterId === 'chapter2' ? 'Chapter 2: Literature Review' : chapterId === 'chapter3' ? 'Chapter 3: Methodology' : chapterId === 'chapter4' ? 'Chapter 4: Results/Analysis' : 'Chapter 5: Discussion & Conclusion';
    let chapterNumber = chapterId === 'chapter1' ? 'ONE' : chapterId === 'chapter2' ? 'TWO' : chapterId === 'chapter3' ? 'THREE' : chapterId === 'chapter4' ? 'FOUR' : chapterId === 'chapter5' ? 'FIVE' : '';
    const totalWordCount = ch.wordCount || { min: 1000, max: 2000 };
    const subsectionWordCount = distributeWordCount(totalWordCount.min, totalWordCount.max, activeSubsList, subTitle);
    const { generateAcademicContent } = await import('../services/geminiService');
    const result = await generateAcademicContent({
      chapter: chapterTitle, chapterId, chapterNumber, subsection: subTitle,
      topic: project.title, field: project.field, level: project.level, methodology: project.methodology,
      organization: sub.customValue || project?.organizationName || null,
      hideOrganization: project?.hideOrganization || false, findings: chapterId === 'chapter4' ? uploadedFindings : null,
      wordCount: subsectionWordCount, literatureType: literatureReviewType, isFirstSubsection: subIndex === 0,
    });
    let generatedContent = typeof result === 'object' ? result.text : result;
    const sources = typeof result === 'object' ? (result.sources || []) : [];
    if (sources.length > 0) {
      const existingSources = JSON.parse(localStorage.getItem(`groundingSources_${chapterId}`) || '[]');
      const combined = [...existingSources, ...sources];
      const unique = combined.filter((s, i, arr) => arr.findIndex(t => t.uri === s.uri) === i);
      localStorage.setItem(`groundingSources_${chapterId}`, JSON.stringify(unique));
    }
    const citations = extractCitations(generatedContent);
    return { content: generatedContent, citations, subsectionId: subId, subsectionTitle: subTitle };
  }, [project, chapters, uploadedFindings, literatureReviewType]);

  const handleGenerateCurrent = useCallback(async (activeSubsections) => {
    const currentChapter = chapters.find(c => c.id === activeChapter);
    if (currentSubsectionIndex >= activeSubsections.length) return { error: true, message: 'All subsections generated!' };
    const currentSub = activeSubsections[currentSubsectionIndex];
    if (currentSub.title === 'References') return { skipped: true, reason: 'references' };
    if (currentSub.generated) return { error: true, message: 'This subsection has already been generated.' };
    setGenerating(true);
    try {
      const result = await generateSubsectionContent(activeChapter, currentSub.title, currentSub.id, currentSubsectionIndex, activeSubsections);
      return result;
    } catch (error) { throw error; }
    finally { setGenerating(false); }
  }, [activeChapter, currentSubsectionIndex, generateSubsectionContent]);

  const handleGenerateReferences = useCallback(async (currentChapter, currentContent = '') => {
    const allGeneratedSubsections = currentChapter.subsections.filter(s => s.generated && s.title !== 'References' && !s.deleted);
    if (allGeneratedSubsections.length === 0) return { error: true, message: 'Please generate some content first.' };
    let allCitations = [];
    allGeneratedSubsections.forEach(sub => {
      const content = generatedSubsections[activeChapter]?.[sub.title] || '';
      const citations = extractCitations(content);
      allCitations = [...allCitations, ...citations];
    });
    if (currentContent) {
      const currentCitations = extractCitations(currentContent);
      allCitations = [...allCitations, ...currentCitations];
    }
    const uniqueCitations = [...new Set(allCitations)];
    const style = project?.referenceStyle || 'apa';
    const storedSources = localStorage.getItem(`groundingSources_${activeChapter}`);
    const groundingSources = storedSources ? JSON.parse(storedSources) : [];
    const referenceEntries = [];
    const seenUrls = new Set();
    const coveredCitations = new Set();
    groundingSources.forEach(source => {
      if (source.uri && !seenUrls.has(source.uri)) {
        seenUrls.add(source.uri);
        const formatted = formatGroundedReference(source, style);
        if (formatted) {
          referenceEntries.push(formatted);
          uniqueCitations.forEach(citation => {
            const parts = citation.split(/[, ]+/);
            const author = parts[0]?.toLowerCase();
            const year = parts[1]?.replace(/[a-z]?\)$/, '');
            if (author && year && formatted.toLowerCase().includes(author) && formatted.includes(year)) {
              coveredCitations.add(citation);
            }
          });
        }
      }
    });
    const uncoveredCitations = uniqueCitations.filter(c => !coveredCitations.has(c));
    if (uncoveredCitations.length > 0) {
      try {
        const { generateReferences } = await import('../services/geminiService');
        const aiReferences = await generateReferences(uncoveredCitations, style);
        if (aiReferences) {
          aiReferences.split('\n').filter(line => line.trim()).forEach(line => {
            referenceEntries.push(line.trim());
          });
        }
      } catch (error) {
        console.error('AI reference fallback failed:', error);
        uncoveredCitations.forEach(citation => {
          const parts = citation.split(/[, ]+/);
          const author = parts[0] || 'Unknown Author';
          const year = parts[1]?.replace(/[a-z]?\)$/, '') || 'n.d.';
          const formatted = formatSimpleReference(author, year, style);
          referenceEntries.push(`${formatted} ⚠️ Verify this reference`);
        });
      }
    }
    if (referenceEntries.length === 0) return { error: true, message: 'No in-text citations found. Try regenerating the content.' };
    referenceEntries.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    return { content: `References\n\n${referenceEntries.join('\n')}`, subsectionsUpdated: allGeneratedSubsections, usedGrounding: groundingSources.length > 0 };
  }, [project, activeChapter, generatedSubsections]);

  const handleHumanise = useCallback(async (content) => {
    if (!content) return { error: true, message: 'No content to humanise.' };
    const humaniseKey = `${activeChapter}_${currentSubsection?.id}`;
    if ((humaniseUsed[humaniseKey] || 0) >= humaniseLimit) return { error: true, message: `Humanise limit reached (${humaniseLimit}/${humaniseLimit}) for this subsection.` };
    setHumanising(true);
    try {
      const { humaniseContent } = await import('../services/geminiService');
      const humanisedText = await humaniseContent(content);
      return { humanisedText, humaniseKey };
    } catch (error) { throw error; }
    finally { setHumanising(false); }
  }, [project, activeChapter, currentSubsection, humaniseUsed]);

  const handleApplyFeedback = useCallback(async (currentContentText, feedbackText, feedbackFiles, currentFeedbackSubsection) => {
    if (!feedbackText && feedbackFiles.length === 0) return { error: true, message: 'Please enter feedback or upload files' };
    const feedbackKey = `${activeChapter}_${currentFeedbackSubsection.id}`;
    if ((feedbackUsed[feedbackKey] || 0) >= feedbackLimit) return { error: true, message: `Feedback limit reached (${feedbackLimit}/${feedbackLimit}) for this subsection.` };
    setApplyingSubFeedback(true);
    try {
      const { applyFeedbackToContent } = await import('../services/geminiService');
      const modifiedContent = await applyFeedbackToContent(currentContentText, { text: feedbackText, files: feedbackFiles.map(f => f.name) }, currentFeedbackSubsection.title, project);
      return { modifiedContent, feedbackKey: `${activeChapter}_${currentFeedbackSubsection.id}` };
    } catch (error) { throw error; }
    finally { setApplyingSubFeedback(false); }
  }, [project, activeChapter]);

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
    humaniseLimit, feedbackLimit,
    handleGenerateConceptualFramework,
    handleGenerateTheoreticalFramework,
    handleGenerateResearchDesign,
    handleGenerateTable,
    handleGenerateChart,
    handleGenerateCurrent,
    generateSubsectionContent,
    handleGenerateReferences,
    handleHumanise,
    handleApplyFeedback,
    preRenderDiagrams
  };
};

export default useWriteContent;
