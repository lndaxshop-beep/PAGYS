import { useState, useCallback } from 'react';
import { extractCitations, formatCitationEntry, distributeWordCount } from '../utils/writeHelpers.jsx';

const useWriteContent = (project, activeChapter, currentSubsection, currentSubsectionIndex, chapters, generatedSubsections, chapterCitations, uploadedFindings, literatureReviewType, humaniseUsed, feedbackUsed, isViewingReferences) => {
  const [generating, setGenerating] = useState(false);
  const [generatingVisual, setGeneratingVisual] = useState(false);
  const [humanising, setHumanising] = useState(false);
  const [applyingSubFeedback, setApplyingSubFeedback] = useState(false);

  const isPremium = project?.isPremium || false;
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

  const handleGenerateCurrent = useCallback(async (activeSubsections) => {
    const currentChapter = chapters.find(c => c.id === activeChapter);
    if (currentSubsectionIndex >= activeSubsections.length) { alert('All subsections generated!'); return; }
    const currentSub = activeSubsections[currentSubsectionIndex];
    if (currentSub.title === 'References') return;
    if (currentSub.generated) { alert('This subsection has already been generated.'); return; }
    setGenerating(true);
    try {
      let chapterTitle = activeChapter === 'proposal' ? 'Proposal' : activeChapter === 'chapter1' ? 'Chapter 1: Introduction' : activeChapter === 'chapter2' ? 'Chapter 2: Literature Review' : activeChapter === 'chapter3' ? 'Chapter 3: Methodology' : activeChapter === 'chapter4' ? 'Chapter 4: Results/Analysis' : 'Chapter 5: Discussion & Conclusion';
      let chapterNumber = activeChapter === 'chapter1' ? 'ONE' : activeChapter === 'chapter2' ? 'TWO' : activeChapter === 'chapter3' ? 'THREE' : activeChapter === 'chapter4' ? 'FOUR' : activeChapter === 'chapter5' ? 'FIVE' : '';
      const totalWordCount = currentChapter.wordCount || { min: 1000, max: 2000 };
      const subsectionWordCount = distributeWordCount(totalWordCount.min, totalWordCount.max, activeSubsections, currentSub.title);
      const { generateAcademicContent } = await import('../services/geminiService');
      const result = await generateAcademicContent({
        chapter: chapterTitle, chapterId: activeChapter, chapterNumber, subsection: currentSub.title,
        topic: project.title, field: project.field, level: project.level, methodology: project.methodology,
        organization: currentSub.customValue || project?.organizationName || null,
        hideOrganization: project?.hideOrganization || false, findings: activeChapter === 'chapter4' ? uploadedFindings : null,
        wordCount: subsectionWordCount, literatureType: literatureReviewType, isFirstSubsection: currentSubsectionIndex === 0,
      });
      let generatedContent = typeof result === 'object' ? result.text : result;
      const sources = typeof result === 'object' ? (result.sources || []) : [];
      if (sources.length > 0) {
        const existingSources = JSON.parse(localStorage.getItem(`groundingSources_${activeChapter}`) || '[]');
        const combined = [...existingSources, ...sources];
        const unique = combined.filter((s, i, arr) => arr.findIndex(t => t.uri === s.uri) === i);
        localStorage.setItem(`groundingSources_${activeChapter}`, JSON.stringify(unique));
      }
      const citations = extractCitations(generatedContent);
      return {
        content: generatedContent,
        citations,
        subsectionId: currentSub.id,
        subsectionTitle: currentSub.title
      };
    } catch (error) { throw error; }
    finally { setGenerating(false); }
  }, [project, chapters, activeChapter, currentSubsectionIndex, currentSubsection, uploadedFindings, literatureReviewType]);

  const handleGenerateReferences = useCallback(async (currentChapter, currentContent = '') => {
    const allGeneratedSubsections = currentChapter.subsections.filter(s => s.generated && s.title !== 'References' && !s.deleted);
    if (allGeneratedSubsections.length === 0) { alert('Please generate some content first.'); return; }
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
    if (uniqueCitations.length === 0) {
      alert('No in-text citations found. Try regenerating the content.');
      return;
    }
    const style = project?.referenceStyle || 'apa';
    try {
      const { generateReferences } = await import('../services/geminiService');
      const referencesContent = await generateReferences(uniqueCitations, style);
      return { content: referencesContent, subsectionsUpdated: allGeneratedSubsections };
    } catch (error) {
      console.error('Error generating references via AI:', error);
      const referenceEntries = uniqueCitations.map(citation => formatCitationEntry(citation, style)).filter(Boolean).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
      return { content: `References\n\n${referenceEntries.join('\n')}`, subsectionsUpdated: allGeneratedSubsections };
    }
  }, [project, activeChapter, generatedSubsections]);

  const handleHumanise = useCallback(async (content) => {
    if (!content) { alert('No content to humanise.'); return; }
    const humaniseKey = `${activeChapter}_${currentSubsection?.id}`;
    if (humaniseUsed[humaniseKey]) { alert('Humanise has already been used for this subsection.'); return; }
    setHumanising(true);
    try {
      const { humaniseContent } = await import('../services/geminiService');
      const humanisedText = await humaniseContent(content);
      return { humanisedText, humaniseKey };
    } catch (error) { throw error; }
    finally { setHumanising(false); }
  }, [project, activeChapter, currentSubsection, humaniseUsed]);

  const handleApplyFeedback = useCallback(async (currentContentText, feedbackText, feedbackFiles, currentFeedbackSubsection) => {
    if (!feedbackText && feedbackFiles.length === 0) { alert('Please enter feedback or upload files'); return; }
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
    handleGenerateReferences,
    handleHumanise,
    handleApplyFeedback,
    preRenderDiagrams
  };
};

export default useWriteContent;
