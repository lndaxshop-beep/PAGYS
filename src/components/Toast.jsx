import React, { useEffect, useState } from 'react';

const Toast = ({ message, type, onClose, duration }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, duration || 3000);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const bgMap = { success: '#059669', error: '#ef4444', info: '#3b82f6' };
  const iconMap = { success: '✅', error: '❌', info: 'ℹ️' };

  return (
    <div style={{
      position: 'fixed', bottom: '24px', right: '24px',
      backgroundColor: bgMap[type] || bgMap.info, color: 'white',
      padding: '14px 24px', borderRadius: '10px', fontWeight: '500', fontSize: '14px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.2)', zIndex: 10001,
      display: 'flex', alignItems: 'center', gap: '10px',
      opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)',
      transition: 'all 0.3s ease'
    }}>
      <span>{iconMap[type] || iconMap.info}</span>
      {message}
    </div>
  );
};

export default Toast;
