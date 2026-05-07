import { useState, useCallback, useRef } from 'react';

export const useToast = () => {
  const [toasts, setToasts] = useState([]);
  const counterRef = useRef(0);

  const addToast = useCallback((message, type = 'info', duration = 3000, action = null) => {
    const id = ++counterRef.current;
    const effectiveDuration = action ? Math.max(duration, 5000) : duration;
    setToasts(prev => [...prev, { id, message, type, action }]);

    if (effectiveDuration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, effectiveDuration);
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
            onClick={() => !toast.action && removeToast(toast.id)}
            style={{
              backgroundColor: style.bg,
              color: 'white',
              padding: '12px 20px',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: toast.action ? 'default' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              minWidth: '280px',
              animation: 'slideIn 0.3s ease-out'
            }}
          >
            <span style={{ fontWeight: 'bold' }}>{style.icon}</span>
            <span style={{ flex: 1 }}>{toast.message}</span>
            {toast.action && (
              <button
                onClick={(e) => { e.stopPropagation(); toast.action.onClick(); removeToast(toast.id); }}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.4)',
                  borderRadius: '4px',
                  padding: '4px 10px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.35)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'}
              >
                {toast.action.label}
              </button>
            )}
          </div>
        );
      })}
      <style>{`@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
    </div>
  );
};
