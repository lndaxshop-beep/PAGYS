import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const TOUR_STEPS = [
  {
    target: '[data-tour="left-pane"]',
    title: 'Chapter & Subsection Navigation',
    description: 'Browse all your chapters and their subsections here. Click any subsection to view and edit its content. Sub-subtopics appear nested under their parent.',
    placement: 'right',
  },
  {
    target: '[data-tour="content-area"]',
    title: 'Writing Area',
    description: 'Your content appears here in preview mode. Click the Edit button to make manual changes, then Save & Preview to lock them in.',
    placement: 'top',
  },
  {
    target: '[data-tour="write-btn"]',
    title: 'AI Content Generation',
    description: 'Click Write to generate academic content for the selected subsection. The AI uses your topic, field, and any custom guidelines you have set.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="humanise-btn"]',
    title: 'Humanise',
    description: 'Rewrites AI-generated content to sound more natural and human-like. Each subsection has a limited number of uses (resets available for a small fee).',
    placement: 'bottom',
  },
  {
    target: '[data-tour="feedback-btn"]',
    title: 'Supervisor Feedback',
    description: 'Apply your supervisor\'s corrections. Type up to 50 words of feedback or upload screenshots. The AI incorporates the feedback into the content.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="versions-btn"]',
    title: 'Written Versions',
    description: 'View all saved versions of the current subsection. Compare side-by-side with the active content and restore any previous version with one click.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="guidelines-btn"]',
    title: 'Custom Guidelines (Premium)',
    description: 'Set per-chapter writing instructions (up to 500 words). The AI follows these guidelines when generating content for that chapter.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="literature-btn"]',
    title: 'Search Literature (Premium)',
    description: 'Search for academic sources via OpenAlex. Find papers by topic, author, or keyword and add them as references to your project.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="source-btn"]',
    title: 'Add Source (Premium)',
    description: 'Manually enter a source with title, author, year, and URL. Sources are used when generating grounded references in your merge.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="complete-btn"]',
    title: 'Complete & Continue',
    description: 'Marks the current chapter as complete. You can still return to edit later. The final chapter shows "Complete & View Files" to access downloads.',
    placement: 'bottom',
  },
];

const PLACEMENT_DIRS = {
  right: { cross: 'top', main: 'left', crossOffset: 0, gap: 16 },
  bottom: { cross: 'left', main: 'top', crossOffset: 0, gap: 12 },
  top: { cross: 'left', main: 'bottom', crossOffset: 0, gap: 12 },
  left: { cross: 'top', main: 'right', crossOffset: 0, gap: 16 },
};

const FeatureTour = ({ isOpen, onClose, page = 'write' }) => {
  const { colors } = useTheme();
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({});

  const steps = useMemo(() => {
    if (page === 'write') return TOUR_STEPS;
    return TOUR_STEPS;
  }, [page]);

  const current = steps[step];

  useEffect(() => {
    if (!isOpen || !current) return;
    const el = document.querySelector(current.target);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setTargetRect(rect);

    const placement = current.placement || 'bottom';
    const dir = PLACEMENT_DIRS[placement] || PLACEMENT_DIRS.bottom;
    const tooltipWidth = 320;
    const tooltipHeight = 220;

    let left, top;
    if (placement === 'bottom') {
      left = rect.left + rect.width / 2 - tooltipWidth / 2;
      top = rect.bottom + dir.gap;
    } else if (placement === 'top') {
      left = rect.left + rect.width / 2 - tooltipWidth / 2;
      top = rect.top - tooltipHeight - dir.gap;
    } else if (placement === 'right') {
      left = rect.right + dir.gap;
      top = rect.top + rect.height / 2 - tooltipHeight / 2;
    } else if (placement === 'left') {
      left = rect.left - tooltipWidth - dir.gap;
      top = rect.top + rect.height / 2 - tooltipHeight / 2;
    }

    const maxLeft = window.innerWidth - tooltipWidth - 16;
    const maxTop = window.innerHeight - tooltipHeight - 16;
    left = Math.max(16, Math.min(left, maxLeft));
    top = Math.max(16, Math.min(top, maxTop));

    setTooltipPos({ left, top });
  }, [isOpen, step, current]);

  useEffect(() => {
    if (!isOpen) { setStep(0); setTargetRect(null); }
  }, [isOpen]);

  if (!isOpen || !current) return null;

  const isLast = step === steps.length - 1;
  const skipInvisible = () => {
    const next = step + 1;
    if (next >= steps.length) { onClose(); return; }
    const el = document.querySelector(steps[next].target);
    if (!el) { setStep(next); setTimeout(() => skipInvisible(), 100); return; }
    setStep(next);
  };

  return (
    <>
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 9998, pointerEvents: 'none',
      }}>
        {targetRect && (
          <div style={{
            position: 'absolute',
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
            borderRadius: '8px',
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.55), 0 0 20px rgba(0,0,0,0.3)',
            pointerEvents: 'none',
            transition: 'all 0.25s ease',
          }} />
        )}
      </div>

      <div style={{
        position: 'fixed',
        ...tooltipPos,
        width: '320px',
        zIndex: 9999,
        pointerEvents: 'auto',
        backgroundColor: '#1e1e2e',
        borderRadius: '14px',
        padding: '20px',
        boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
        color: '#e0e0e0',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <span style={{
            fontSize: '10px', fontWeight: '700', textTransform: 'uppercase',
            letterSpacing: '1px', color: '#a78bfa',
          }}>
            Step {step + 1} of {steps.length}
          </span>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer',
            fontSize: '16px', padding: '0', lineHeight: '1',
          }}>✕</button>
        </div>

        <h3 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 8px', color: '#ffffff' }}>
          {current.title}
        </h3>

        <p style={{ fontSize: '13px', lineHeight: '1.5', margin: '0 0 20px', color: '#c0c0c0' }}>
          {current.description}
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer',
            fontSize: '12px', padding: '6px 10px', borderRadius: '6px',
          }}>
            Skip all
          </button>
          <div style={{ display: 'flex', gap: '8px' }}>
            {step > 0 && (
              <button onClick={() => setStep(step - 1)} style={{
                padding: '8px 16px', fontSize: '12px', borderRadius: '8px', cursor: 'pointer',
                backgroundColor: 'transparent', color: '#e0e0e0',
                border: '1px solid #4b5563', fontWeight: '500',
              }}>
                Back
              </button>
            )}
            <button onClick={isLast ? onClose : skipInvisible} style={{
              padding: '8px 18px', fontSize: '12px', borderRadius: '8px', cursor: 'pointer',
              backgroundColor: '#7c3aed', color: 'white',
              border: 'none', fontWeight: '600',
            }}>
              {isLast ? 'Done' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default FeatureTour;
