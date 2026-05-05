import { useState, useEffect, useRef, useCallback } from 'react';

export const useAutoSave = ({ saveFn, data, delay = 30000 }) => {
  const [saveStatus, setSaveStatus] = useState('saved');
  const [lastSaved, setLastSaved] = useState(null);
  const timerRef = useRef(null);
  const dataRef = useRef(data);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const save = useCallback(async () => {
    if (!dataRef.current || !saveFn) return;
    setSaveStatus('saving');
    try {
      await saveFn(dataRef.current);
      setSaveStatus('saved');
      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
      setSaveStatus('error');
    }
  }, [saveFn]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (data) {
      setSaveStatus('unsaved');
      timerRef.current = setTimeout(() => {
        save();
      }, delay);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [data, delay, save]);

  const saveNow = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    return save();
  }, [save]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { saveStatus, lastSaved, saveNow };
};

export const useUndoRedo = (initialState) => {
  const [history, setHistory] = useState({
    past: [],
    present: initialState,
    future: []
  });

  const MAX_HISTORY = 50;

  const set = useCallback((newState) => {
    setHistory(prev => ({
      past: [...prev.past.slice(-MAX_HISTORY + 1), prev.present],
      present: typeof newState === 'function' ? newState(prev.present) : newState,
      future: []
    }));
  }, []);

  const undo = useCallback(() => {
    setHistory(prev => {
      if (prev.past.length === 0) return prev;
      const previous = prev.past[prev.past.length - 1];
      const newPast = prev.past.slice(0, -1);
      return {
        past: newPast,
        present: previous,
        future: [prev.present, ...prev.future]
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory(prev => {
      if (prev.future.length === 0) return prev;
      const next = prev.future[0];
      const newFuture = prev.future.slice(1);
      return {
        past: [...prev.past, prev.present],
        present: next,
        future: newFuture
      };
    });
  }, []);

  const reset = useCallback((newState) => {
    setHistory({
      past: [],
      present: newState,
      future: []
    });
  }, []);

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  return { state: history.present, set, undo, redo, reset, canUndo, canRedo, historyLength: history.past.length };
};
