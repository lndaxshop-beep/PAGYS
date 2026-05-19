import React, { useState, useEffect, useRef } from 'react';
import splashLogo from '../assets/splash-logo.png';

const SplashScreen = ({ show }) => {
  const [mounted, setMounted] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [typedText, setTypedText] = useState('');
  const fullText = 'Pagys, freedom writing...';
  const timerRef = useRef(null);

  useEffect(() => {
    if (show) {
      setMounted(true);
      setExiting(false);
      setTypedText('');
      let i = 0;
      const delay = 80;
      timerRef.current = setInterval(() => {
        if (i < fullText.length) {
          setTypedText(fullText.slice(0, i + 1));
          i++;
        } else {
          clearInterval(timerRef.current);
        }
      }, delay);
    } else if (mounted) {
      setExiting(true);
      const exitTimer = setTimeout(() => {
        setMounted(false);
        setExiting(false);
      }, 500);
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
      transition: 'opacity 0.5s ease-out',
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'splashFadeIn 0.8s ease-out',
      }}>
        <img
          src={splashLogo}
          alt=""
          style={{
            width: 'min(85vw, 600px)',
            height: 'auto',
            display: 'block',
          }}
        />
        <div style={{ marginTop: '20px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{
            fontFamily: "'Playfair Display', 'Georgia', serif",
            fontSize: '28px',
            color: '#444',
            fontStyle: 'italic',
            fontWeight: 500,
          }}>
            {typedText}
          </span>
          <span style={{
            display: typedText.length < fullText.length ? 'inline-block' : 'none',
            width: '2px',
            height: '30px',
            backgroundColor: '#444',
            marginLeft: '4px',
            animation: 'splashBlink 0.8s step-end infinite',
            verticalAlign: 'middle',
          }} />
        </div>
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400;1,500&display=swap');
        @keyframes splashFadeIn {
          from { opacity: 0; transform: scale(0.9) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes splashBlink {
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
