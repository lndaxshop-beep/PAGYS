import { useState, useCallback } from 'react';

export const useWriteVisuals = (handleGenerateConceptualFramework, handleGenerateTheoreticalFramework, handleGenerateResearchDesign, handleGenerateTable, handleGenerateChart, toastSuccess, toastError) => {
  const [generatingVisual, setGeneratingVisual] = useState(false);

  const generateConceptualFramework = useCallback(async (setDiagramData) => {
    setGeneratingVisual(true);
    try {
      const mermaidCode = await handleGenerateConceptualFramework();
      setDiagramData(prev => ({ ...prev, conceptualFramework: { code: mermaidCode, title: 'Conceptual Framework', caption: 'Figure 2.1: Conceptual Framework of the Study' } }));
      toastSuccess?.('Conceptual framework generated!');
    } catch (error) { toastError?.('Error generating conceptual framework'); }
    finally { setGeneratingVisual(false); }
  }, [handleGenerateConceptualFramework, toastSuccess, toastError]);

  const generateTheoreticalFramework = useCallback(async (setDiagramData) => {
    setGeneratingVisual(true);
    try {
      const mermaidCode = await handleGenerateTheoreticalFramework();
      setDiagramData(prev => ({ ...prev, theoreticalFramework: { code: mermaidCode, title: 'Theoretical Framework', caption: 'Figure 2.2: Theoretical Framework of the Study' } }));
      toastSuccess?.('Theoretical framework generated!');
    } catch (error) { toastError?.('Error generating theoretical framework'); }
    finally { setGeneratingVisual(false); }
  }, [handleGenerateTheoreticalFramework, toastSuccess, toastError]);

  const generateResearchDesign = useCallback(async (setDiagramData) => {
    setGeneratingVisual(true);
    try {
      const mermaidCode = await handleGenerateResearchDesign();
      setDiagramData(prev => ({ ...prev, researchDesign: { code: mermaidCode, title: 'Research Design', caption: 'Figure 3.1: Research Design Flowchart' } }));
      toastSuccess?.('Research design generated!');
    } catch (error) { toastError?.('Error generating research design'); }
    finally { setGeneratingVisual(false); }
  }, [handleGenerateResearchDesign, toastSuccess, toastError]);

  const generateTable = useCallback(async (currentSubsection, activeChapter, setTableData) => {
    if (!currentSubsection) return;
    setGeneratingVisual(true);
    try {
      const result = await handleGenerateTable(currentSubsection, activeChapter);
      setTableData(prev => ({ ...prev, [result.key]: result.data }));
      toastSuccess?.('Table generated!');
    } catch (error) { toastError?.('Error generating table'); }
    finally { setGeneratingVisual(false); }
  }, [handleGenerateTable, toastSuccess, toastError]);

  const generateChart = useCallback(async (chartType, currentSubsection, activeChapter, setChartData) => {
    if (!currentSubsection) return;
    setGeneratingVisual(true);
    try {
      const result = await handleGenerateChart(chartType, currentSubsection, activeChapter);
      setChartData(prev => ({ ...prev, [result.key]: result.data }));
      toastSuccess?.(`${chartType.charAt(0).toUpperCase() + chartType.slice(1)} chart generated!`);
    } catch (error) { toastError?.('Error generating chart'); }
    finally { setGeneratingVisual(false); }
  }, [handleGenerateChart, toastSuccess, toastError]);

  return { generatingVisual, generateConceptualFramework, generateTheoreticalFramework, generateResearchDesign, generateTable, generateChart };
};
