import { useState, useCallback, useRef } from 'react';

export const useToast = () => {
  const [toasts, setToasts] = useState([]);
  const counterRef = useRef(0);

  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = ++counterRef.current;
    setToasts(prev => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const success = useCallback((message, duration) => addToast(message, 'success', duration), [addToast]);
  const error = useCallback((message, duration) => addToast(message, 'error', duration), [addToast]);
  const info = useCallback((message, duration) => addToast(message, 'info', duration), [addToast]);
  const warning = useCallback((message, duration) => addToast(message, 'warning', duration), [addToast]);

  return { toasts, addToast, removeToast, success, error, info, warning };
};

export const ToastContainer = ({ toasts, removeToast }) => {
  if (!toasts || toasts.length === 0) return null;

  const typeStyles = {
    success: { bg: '#059669', icon: '✓' },
    error: { bg: '#ef4444', icon: '✕' },
    warning: { bg: '#f59e0b', icon: '⚠' },
    info: { bg: '#7c3aed', icon: 'ℹ' }
  };

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 10000, display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {toasts.map(toast => {
        const style = typeStyles[toast.type] || typeStyles.info;
        return (
          <div
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            style={{
              backgroundColor: style.bg,
              color: 'white',
              padding: '12px 20px',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              minWidth: '250px',
              animation: 'slideIn 0.3s ease-out'
            }}
          >
            <span style={{ fontWeight: 'bold' }}>{style.icon}</span>
            <span>{toast.message}</span>
          </div>
        );
      })}
      <style>{`@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
    </div>
  );
};
