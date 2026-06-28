import { useState, useCallback, useEffect, useRef } from 'react';
import { extractTextFromFile, getFileType } from '../utils/fileExtractors';
import { extractPaperMetadata, generateLiteratureMatrix } from '../services/gemini/sourceExtractor';

const STORAGE_KEY = 'userSources';
const SAVE_DEBOUNCE = 2000;

const getCacheKey = (sources, projectId) => {
  const hash = sources.length.toString(36) + sources.reduce((s, src) => s + (src.title?.length || 0) + (src.authors?.length || 0), 0).toString(36);
  return `litmatrix_${projectId}_${hash}`;
};

const persistToLocal = (projectId, sources) => {
  try {
    localStorage.setItem(`${STORAGE_KEY}_${projectId}`, JSON.stringify(sources));
  } catch (e) { console.warn('Failed to persist sources to localStorage:', e); }
};

const persistToFirestore = async (projectId, sources) => {
  try {
    const { saveSources } = await import('../services/firestoreService');
    await saveSources(projectId, sources);
  } catch (e) { console.error('Failed to persist sources to Firestore:', e); }
};

const useSourceLibrary = (projectId, userId) => {
  const [loaded, setLoaded] = useState(false);
  const [sources, setSources] = useState([]);
  const saveTimerRef = useRef(null);

  // Load from Firestore on mount, fall back to localStorage
  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    (async () => {
      try {
        const { getSources } = await import('../services/firestoreService');
        const firestoreSources = await getSources(projectId);
        if (cancelled) return;
        if (firestoreSources.length > 0) {
          setSources(firestoreSources);
          persistToLocal(projectId, firestoreSources);
        } else {
          const local = JSON.parse(localStorage.getItem(`${STORAGE_KEY}_${projectId}`) || '[]');
          if (!cancelled) setSources(local);
        }
      } catch {
        if (!cancelled) {
          const local = JSON.parse(localStorage.getItem(`${STORAGE_KEY}_${projectId}`) || '[]');
          setSources(local);
        }
      }
      if (!cancelled) setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [projectId]);

  // Debounced Firestore save whenever sources change
  useEffect(() => {
    if (!loaded || !projectId) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      persistToFirestore(projectId, sources);
    }, SAVE_DEBOUNCE);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [sources, loaded, projectId]);
  const [sourceMode, setSourceMode] = useState('ai-only');
  const [extracting, setExtracting] = useState(false);
  const [matrix, setMatrix] = useState(null);
  const [generatingMatrix, setGeneratingMatrix] = useState(false);
  const [pendingMatrixRegen, setPendingMatrixRegen] = useState(false);
  const [processingMatrixPayment, setProcessingMatrixPayment] = useState(false);

  useEffect(() => {
    const key = getCacheKey(sources, projectId);
    const cached = localStorage.getItem(key);
    if (cached) {
      try { setMatrix(JSON.parse(cached)); } catch {}
    } else {
      setMatrix(null);
    }
  }, [sources.length, projectId]);

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

      setSources(prev => {
        const updated = [...prev, source];
        try {
          localStorage.setItem(`${STORAGE_KEY}_${projectId}`, JSON.stringify(updated));
        } catch (e) { console.warn('Failed to persist sources:', e); }
        return updated;
      });
      return { success: true, source };
    } catch (error) {
      console.error('Error adding source:', error);
      return { error: true, message: 'Failed to process file. Please try again.' };
    } finally {
      setExtracting(false);
    }
  }, [projectId, userId]);

  const removeSource = useCallback((sourceId) => {
    setSources(prev => {
      const updated = prev.filter(s => s.id !== sourceId);
      try {
        localStorage.setItem(`${STORAGE_KEY}_${projectId}`, JSON.stringify(updated));
      } catch (e) { console.warn('Failed to persist sources:', e); }
      return updated;
    });
  }, [projectId, userId]);

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
    setSources([]);
    setMatrix(null);
    try { localStorage.removeItem(`${STORAGE_KEY}_${projectId}`); } catch {}
  }, [projectId]);

  const getActiveSources = useCallback(() => {
    return sources.filter(s => s.title && s.title !== 'Unknown');
  }, [sources]);

  const addSources = useCallback((newSources) => {
    if (!newSources?.length) return;
    setSources(prev => {
      const updated = [...prev, ...newSources];
      try {
        localStorage.setItem(`${STORAGE_KEY}_${projectId}`, JSON.stringify(updated));
      } catch (e) { console.warn('Failed to persist sources:', e); }
      return updated;
    });
  }, [projectId]);

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
