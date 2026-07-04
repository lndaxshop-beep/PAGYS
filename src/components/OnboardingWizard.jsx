import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const STEPS = [
  {
    title: 'Welcome to PAGYSS',
    subtitle: 'Your Personal Academic Writing Assistant',
    content: 'PAGYSS helps you write your thesis from start to finish. Write academic content chapter by chapter, verify citations, manage references, and export your completed document in multiple formats.',
    icon: '🎓',
    action: null,
  },
  {
    title: 'Create Your First Project',
    subtitle: 'Start with a clear research direction',
    content: 'Click "New Project" to begin. Enter your thesis title, academic level, field of study, and research methodology. PAGYSS creates a structured outline with all chapters and subsections tailored to your topic.',
    icon: '📂',
    action: null,
  },
  {
    title: 'Write, Review & Export',
    subtitle: 'We handle the heavy lifting',
    content: 'Navigate through each subsection in the sidebar. Click "Write" to create content grounded in real sources. Humanise the text, apply feedback, and verify citations. When ready, merge everything into a .docx, .pdf, .tex, or .md file.',
    icon: '🚀',
    action: 'Get Started',
  },
];

const OnboardingWizard = ({ onDismiss }) => {
  const { colors, isDarkMode } = useTheme();
  const [step, setStep] = useState(0);
  const current = STEPS[step];

  const isLast = step === STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      onDismiss();
    } else {
      setStep(s => s + 1);
    }
  };

  const handleSkip = () => {
    onDismiss();
  };

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', zIndex: 5000,
      }}
    >
      <div
        style={{
          backgroundColor: colors.surface, borderRadius: '20px',
          padding: '40px', maxWidth: '520px', width: '90%',
          boxShadow: '0 25px 80px rgba(0,0,0,0.4)',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
          {STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === step ? '28px' : '8px', height: '8px',
                borderRadius: '4px',
                backgroundColor: i === step ? colors.primary : colors.border,
                transition: 'all 0.3s',
              }}
            />
          ))}
        </div>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>{current.icon}</div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: colors.text, margin: '0 0 4px' }}>{current.title}</h2>
          <p style={{ fontSize: '14px', color: colors.textSecondary, margin: '0 0 16px', fontWeight: '500' }}>{current.subtitle}</p>
          <p style={{ fontSize: '15px', color: colors.text, lineHeight: '1.6', margin: 0 }}>{current.content}</p>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '32px' }}>
          <button
            onClick={handleSkip}
            style={{
              padding: '10px 20px', fontSize: '13px', borderRadius: '8px',
              backgroundColor: 'transparent', color: colors.textSecondary,
              border: `1px solid ${colors.border}`, cursor: 'pointer', fontWeight: '500',
            }}
          >
            Skip Tour
          </button>
          {!isLast ? (
            <button
              onClick={handleNext}
              style={{
                padding: '10px 24px', fontSize: '13px', borderRadius: '8px',
                backgroundColor: colors.primary, color: 'white',
                border: 'none', cursor: 'pointer', fontWeight: '600',
              }}
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleNext}
              style={{
                padding: '10px 24px', fontSize: '13px', borderRadius: '8px',
                backgroundColor: colors.primary, color: 'white',
                border: 'none', cursor: 'pointer', fontWeight: '600',
              }}
            >
              Get Started!
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;
