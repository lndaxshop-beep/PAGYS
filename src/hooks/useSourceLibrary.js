import { useState, useCallback } from 'react';
import { extractTextFromFile, getFileType } from '../utils/fileExtractors';
import { extractPaperMetadata, generateLiteratureMatrix } from '../services/gemini/sourceExtractor';
import { saveGeneratedContent, getGeneratedContent } from '../services/firestoreService';

const STORAGE_KEY = 'userSources';

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
    setGeneratingMatrix(true);
    try {
      const result = await generateLiteratureMatrix(sources, project);
      if (result) setMatrix(result);
    } catch (error) {
      console.error('Error generating matrix:', error);
    } finally {
      setGeneratingMatrix(false);
    }
  }, [sources]);

  const clearSources = useCallback(() => {
    persistSources([]);
    setMatrix(null);
  }, [projectId, userId]);

  const getActiveSources = useCallback(() => {
    return sources.filter(s => s.title && s.title !== 'Unknown');
  }, [sources]);

  return {
    sources,
    sourceMode,
    setSourceMode,
    extracting,
    matrix,
    generatingMatrix,
    addSource,
    removeSource,
    generateMatrix,
    clearSources,
    getActiveSources
  };
};

export default useSourceLibrary;
