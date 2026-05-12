import { useEffect, useRef } from 'react';

export const useKeyboardShortcuts = (handlers) => {
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const { handlers } = handlersRef.current;
      if (!handlers) return;

      const isCtrl = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      if (isCtrl && handlers.save && key === 's') {
        e.preventDefault();
        handlers.save();
      }

      if (isCtrl && handlers.undo && key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handlers.undo();
      }

      if (isCtrl && handlers.redo && (key === 'y' || (key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handlers.redo();
      }

      if (isCtrl && handlers.toggleEdit && key === 'e') {
        e.preventDefault();
        handlers.toggleEdit();
      }

      if (handlers.generate && isCtrl && key === 'g') {
        e.preventDefault();
        handlers.generate();
      }

      if (handlers.altNavigate && e.altKey && key >= '1' && key <= '6') {
        e.preventDefault();
        handlers.altNavigate(parseInt(key) - 1);
      }

      if (handlers.escape && key === 'escape') {
        handlers.escape();
      }

      if (handlers.toggleShortcuts && e.shiftKey && key === '/') {
        e.preventDefault();
        handlers.toggleShortcuts();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
};
