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
      timerRef.current = setInterval(() => {
        if (i < fullText.length) {
          setTypedText(fullText.slice(0, i + 1));
          i++;
        } else {
          clearInterval(timerRef.current);
        }
      }, 80);
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
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6px',
        }}>
          <div style={{
            position: 'absolute',
            inset: '0',
            borderRadius: '50%',
            border: '3px solid transparent',
            borderTopColor: '#6366f1',
            borderRightColor: '#a5b4fc',
            animation: 'splashSpin 1s cubic-bezier(0.4, 0, 0.2, 1) infinite',
          }} />
          <div style={{
            position: 'absolute',
            inset: '8px',
            borderRadius: '50%',
            border: '2px solid transparent',
            borderBottomColor: '#818cf8',
            borderLeftColor: '#c7d2fe',
            animation: 'splashSpin 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite reverse',
          }} />
          <img
            src={splashLogo}
            alt=""
            style={{
              width: 'min(70vw, 420px)',
              height: 'auto',
              display: 'block',
              position: 'relative',
              zIndex: 1,
              imageRendering: 'auto',
            }}
          />
        </div>
        <div style={{ marginTop: '24px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{
            fontFamily: "'Playfair Display', 'Georgia', serif",
            fontSize: '26px',
            color: '#444',
            fontStyle: 'italic',
            fontWeight: 500,
          }}>
            {typedText}
          </span>
          <span style={{
            display: typedText.length < fullText.length ? 'inline-block' : 'none',
            width: '2px',
            height: '28px',
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
        @keyframes splashSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
