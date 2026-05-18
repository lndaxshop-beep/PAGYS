import { useState, useCallback, useEffect } from 'react';
import { extractTextFromFile, getFileType } from '../utils/fileExtractors';
import { extractPaperMetadata, generateLiteratureMatrix } from '../services/gemini/sourceExtractor';
import { saveGeneratedContent, getGeneratedContent } from '../services/firestoreService';

const STORAGE_KEY = 'userSources';

const getCacheKey = (sources, projectId) => {
  const hash = sources.length.toString(36) + sources.reduce((s, src) => s + (src.title?.length || 0) + (src.authors?.length || 0), 0).toString(36);
  return `litmatrix_${projectId}_${hash}`;
};

const useSourceLibrary = (projectId, userId) => {
  const [sources, setSources] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(`${STORAGE_KEY}_${projectId}`) || '[]');
    } catch { return []; }
  });
  const [sourceMode, setSourceMode] = useState('ai-only');
  const [extracting, setExtracting] = useState(false);
  const [matrix, setMatrix] = useState(null);
  const [generatingMatrix, setGeneratingMatrix] = useState(false);
  const [pendingMatrixRegen, setPendingMatrixRegen] = useState(false);
  const [processingMatrixPayment, setProcessingMatrixPayment] = useState(false);
  const matrixPaymentTimeoutRef = null;

  useEffect(() => {
    const key = getCacheKey(sources, projectId);
    const cached = localStorage.getItem(key);
    if (cached) {
      try { setMatrix(JSON.parse(cached)); } catch {}
    } else {
      setMatrix(null);
    }
  }, [sources.length, projectId]);

  const persistSources = (updatedSources) => {
    setSources(updatedSources);
    try {
      localStorage.setItem(`${STORAGE_KEY}_${projectId}`, JSON.stringify(updatedSources));
    } catch (e) { console.warn('Failed to persist sources:', e); }
    if (userId) {
      saveGeneratedContent({ userId, projectId, sources: updatedSources }).catch(() => {});
    }
  };

  const addSource = useCallback(async (file) => {
    setExtracting(true);
    try {
      const fileType = getFileType(file);
      const extracted = await extractTextFromFile(file);
      if (!extracted.text) {
        return { error: true, message: fileType === 'pdf'
          ? 'Could not extract text from this PDF. It may be a scanned document. Try uploading screenshots of the pages instead.'
          : 'Could not read this file. Try a different format.' };
      }

      let metadata;
      if (extracted.type === 'image') {
        metadata = await extractPaperMetadata(extracted.text, 'image');
      } else {
        metadata = await extractPaperMetadata(extracted.text, 'text');
      }

      if (!metadata || !metadata.title) {
        metadata = {
          title: file.name.replace(/\.[^/.]+$/, ''),
          authors: 'Unknown',
          year: new Date().getFullYear(),
          methodology: 'Not specified',
          sampleSize: 'N/A',
          keyFindings: ['Metadata extraction failed. Paper will still be used as a reference.'],
          relevanceToTopic: 'medium'
        };
      }

      const source = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        fileName: file.name,
        fileType: extracted.type,
        addedAt: new Date().toISOString(),
        ...metadata
      };

      const updated = [...sources, source];
      persistSources(updated);
      return { success: true, source };
    } catch (error) {
      console.error('Error adding source:', error);
      return { error: true, message: 'Failed to process file. Please try again.' };
    } finally {
      setExtracting(false);
    }
  }, [sources, projectId, userId]);

  const removeSource = useCallback((sourceId) => {
    const updated = sources.filter(s => s.id !== sourceId);
    persistSources(updated);
  }, [sources, projectId, userId]);

  const generateMatrix = useCallback(async (project) => {
    if (sources.length === 0) return;
    const key = getCacheKey(sources, projectId);
    const cached = localStorage.getItem(key);
    if (cached) {
      setPendingMatrixRegen(true);
      return;
    }
    setGeneratingMatrix(true);
    try {
      const result = await generateLiteratureMatrix(sources, project);
      if (result) {
        setMatrix(result);
        localStorage.setItem(key, JSON.stringify(result));
      }
    } catch (error) {
      console.error('Error generating matrix:', error);
    } finally {
      setGeneratingMatrix(false);
    }
  }, [sources, projectId]);

  const handleMatrixPaymentConfirm = useCallback(async (project) => {
    setProcessingMatrixPayment(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setProcessingMatrixPayment(false);
    setPendingMatrixRegen(false);
    const key = getCacheKey(sources, projectId);
    localStorage.removeItem(key);
    setGeneratingMatrix(true);
    try {
      const result = await generateLiteratureMatrix(sources, project);
      if (result) {
        setMatrix(result);
        localStorage.setItem(key, JSON.stringify(result));
      }
    } catch (error) {
      console.error('Error regenerating matrix:', error);
    } finally {
      setGeneratingMatrix(false);
    }
  }, [sources, projectId]);

  const handleMatrixPaymentCancel = useCallback(() => {
    setPendingMatrixRegen(false);
    setProcessingMatrixPayment(false);
  }, []);

  const clearSources = useCallback(() => {
    persistSources([]);
    setMatrix(null);
  }, [projectId, userId]);

  const getActiveSources = useCallback(() => {
    return sources.filter(s => s.title && s.title !== 'Unknown');
  }, [sources]);

  const addSources = useCallback((newSources) => {
    if (!newSources?.length) return;
    const updated = [...sources, ...newSources];
    persistSources(updated);
  }, [sources, projectId, userId]);

  return {
    sources,
    sourceMode, setSourceMode,
    extracting,
    matrix, generatingMatrix,
    pendingMatrixRegen, processingMatrixPayment,
    addSource, addSources, removeSource,
    generateMatrix, handleMatrixPaymentConfirm, handleMatrixPaymentCancel,
    clearSources, getActiveSources
  };
};

export default useSourceLibrary;
