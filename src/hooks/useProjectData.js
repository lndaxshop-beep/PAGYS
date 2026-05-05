import { useState, useEffect, useCallback } from 'react';
import { getDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const useProjectData = (projectId) => {
  const [project, setProject] = useState(null);
  const [chapters, setChapters] = useState({});
  const [generatedContent, setGeneratedContent] = useState({});
  const [citations, setCitations] = useState({});
  const [visualData, setVisualData] = useState({});
  const [instruments, setInstruments] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadFromLocalStorage = useCallback((pid) => {
    try {
      const stored = {
        chapters: JSON.parse(localStorage.getItem(`chapters_${pid}`) || '{}'),
        generatedContent: JSON.parse(localStorage.getItem(`generated_${pid}`) || '{}'),
        citations: JSON.parse(localStorage.getItem(`citations_${pid}`) || '{}'),
        visualData: JSON.parse(localStorage.getItem(`visual_${pid}`) || '{}'),
        instruments: JSON.parse(localStorage.getItem(`instruments_${pid}`) || '{}')
      };
      return stored;
    } catch (e) {
      console.error('LocalStorage read error:', e);
      return { chapters: {}, generatedContent: {}, citations: {}, visualData: {}, instruments: {} };
    }
  }, []);

  const saveToLocalStorage = useCallback((key, pid, data) => {
    try {
      localStorage.setItem(`${key}_${pid}`, JSON.stringify(data));
    } catch (e) {
      console.error('LocalStorage write error:', e);
    }
  }, []);

  const loadProject = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);

    try {
      const localData = loadFromLocalStorage(projectId);

      try {
        const projectRef = doc(db, 'projects', projectId);
        const projectSnap = await getDoc(projectRef);
        if (projectSnap.exists()) {
          setProject(projectSnap.data());
        }
      } catch (firestoreError) {
        console.warn('Firestore unavailable, using local data:', firestoreError);
        const storedProject = localStorage.getItem(`project_${projectId}`);
        if (storedProject) setProject(JSON.parse(storedProject));
      }

      setChapters(localData.chapters);
      setGeneratedContent(localData.generatedContent);
      setCitations(localData.citations);
      setVisualData(localData.visualData);
      setInstruments(localData.instruments);
    } catch (err) {
      console.error('Error loading project data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId, loadFromLocalStorage]);

  const updateChapters = useCallback(async (newChapters) => {
    setChapters(newChapters);
    saveToLocalStorage('chapters', projectId, newChapters);

    try {
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        chapters: newChapters,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Firestore chapters update failed, saved locally:', e);
    }
  }, [projectId, saveToLocalStorage]);

  const updateGeneratedContent = useCallback(async (chapterId, content) => {
    const newContent = { ...generatedContent, [chapterId]: content };
    setGeneratedContent(newContent);
    saveToLocalStorage('generated', projectId, newContent);
  }, [generatedContent, projectId, saveToLocalStorage]);

  const updateCitations = useCallback(async (chapterId, citationsData) => {
    const newCitations = { ...citations, [chapterId]: citationsData };
    setCitations(newCitations);
    saveToLocalStorage('citations', projectId, newCitations);
  }, [citations, projectId, saveToLocalStorage]);

  const updateVisualData = useCallback(async (chapterId, visual) => {
    const newVisual = { ...visualData, [chapterId]: visual };
    setVisualData(newVisual);
    saveToLocalStorage('visual', projectId, newVisual);
  }, [visualData, projectId, saveToLocalStorage]);

  const addInstrument = useCallback(async (instrument) => {
    const existing = JSON.parse(localStorage.getItem(`instruments_${projectId}`) || '{}');
    const newInstruments = {
      ...existing,
      [instrument.type]: {
        content: instrument.content,
        generatedAt: new Date().toISOString(),
        title: instrument.title
      }
    };
    setInstruments(newInstruments);
    saveToLocalStorage('instruments', projectId, newInstruments);

    const downloads = JSON.parse(localStorage.getItem(`instrument_downloads_${projectId}`) || '{}');
    downloads[instrument.type] = true;
    localStorage.setItem(`instrument_downloads_${projectId}`, JSON.stringify(downloads));
  }, [projectId, saveToLocalStorage]);

  const getInstrumentDownloads = useCallback(() => {
    const downloads = JSON.parse(localStorage.getItem(`instrument_downloads_${projectId}`) || '{}');
    return Object.keys(downloads);
  }, [projectId]);

  const hasDownloadedInstrument = useCallback(() => {
    return getInstrumentDownloads().length > 0;
  }, [getInstrumentDownloads]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  return {
    project,
    chapters,
    generatedContent,
    citations,
    visualData,
    instruments,
    loading,
    error,
    updateChapters,
    updateGeneratedContent,
    updateCitations,
    updateVisualData,
    addInstrument,
    getInstrumentDownloads,
    hasDownloadedInstrument,
    reload: loadProject
  };
};
