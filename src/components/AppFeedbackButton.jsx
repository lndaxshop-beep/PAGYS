import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import AppFeedbackModal from './AppFeedbackModal';

const AppFeedbackButton = () => {
  const { colors } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        title="Send feedback"
        style={{
          position: 'fixed',
          bottom: '24px',
          left: '24px',
          zIndex: 9999,
          backgroundColor: colors.primary,
          color: 'white',
          border: 'none',
          borderRadius: '30px',
          padding: '10px 20px',
          fontSize: '13px',
          fontWeight: '600',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.3)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
        }}
      >
        <span style={{ fontSize: '16px' }}>💬</span>
        Feedback
      </button>
      <AppFeedbackModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export default AppFeedbackButton;
