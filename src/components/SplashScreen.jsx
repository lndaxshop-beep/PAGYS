import React, { useState, useEffect, useRef } from 'react';
import splashLogo from '../assets/splash-logo.png';

const SplashScreen = ({ show }) => {
  const [mounted, setMounted] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [typedText, setTypedText] = useState('');
  const fullText = 'Your Academic Writing Assistant';
  const timerRef = useRef(null);

  useEffect(() => {
    if (show) {
      setMounted(true);
      setExiting(false);
      setTypedText('');
      let i = 0;
      timerRef.current = setInterval(() => {
        if (i < fullText.length) {
          setTypedText(fullText.slice(0, i + 1));
          i++;
        } else {
          clearInterval(timerRef.current);
        }
      }, 50);
    } else if (mounted) {
      setExiting(true);
      const exitTimer = setTimeout(() => {
        setMounted(false);
        setExiting(false);
      }, 400);
      return () => clearTimeout(exitTimer);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [show]);

  if (!mounted) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      opacity: exiting ? 0 : 1,
      transition: 'opacity 0.4s ease-out',
    }}>
      <img
        src={splashLogo}
        alt=""
        style={{
          maxWidth: '320px',
          width: '80%',
          height: 'auto',
          animation: 'splashLogoIn 0.8s ease-out',
        }}
      />
      <div style={{ marginTop: '28px', height: '30px', display: 'flex', alignItems: 'center' }}>
        <span style={{
          fontFamily: "'Courier New', Courier, monospace",
          fontSize: '20px',
          color: '#555',
          letterSpacing: '1px',
        }}>
          {typedText}
        </span>
        <span style={{
          display: typedText.length < fullText.length ? 'inline-block' : 'none',
          width: '2px',
          height: '24px',
          backgroundColor: '#555',
          marginLeft: '3px',
          animation: 'splashBlink 0.8s step-end infinite',
        }} />
      </div>
      <style>{`
        @keyframes splashLogoIn {
          from { opacity: 0; transform: scale(0.85); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes splashBlink {
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
