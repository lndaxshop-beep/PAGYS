import React, { useState, useEffect, useMemo } from 'react';

const TOOLTIP_WIDTH = 320;
const TOOLTIP_HEIGHT = 220;
const GAP = 16;
const ARROW_SIZE = 8;

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
    title: 'Write Content',
    description: 'Click Write to compose content for the selected subsection. Your topic, field, and custom guidelines are used to tailor the result.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="humanise-btn"]',
    title: 'Humanise',
    description: 'Refines the content to sound more natural and human-like. Each subsection has a limited number of uses (resets available for a small fee).',
    placement: 'bottom',
  },
  {
    target: '[data-tour="feedback-btn"]',
    title: 'Supervisor Feedback',
    description: 'Apply your supervisor\'s corrections. Type up to 50 words of feedback or upload screenshots, and the content will be updated accordingly.',
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
    description: 'Set per-chapter writing instructions (up to 500 words). These guidelines help tailor the content for that chapter.',
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
    description: 'Manually enter a source with title, author, year, and URL. Sources are used when compiling references in your merge.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="complete-btn"]',
    title: 'Complete & Continue',
    description: 'Marks the current chapter as complete. You can still return to edit later. The final chapter shows "Complete & View Files" to access downloads.',
    placement: 'bottom',
  },
];

const ARROW_CSS = {
  bottom: { borderLeft: `${ARROW_SIZE}px solid transparent`, borderRight: `${ARROW_SIZE}px solid transparent`, borderBottom: `${ARROW_SIZE}px solid #1e1e2e` },
  top: { borderLeft: `${ARROW_SIZE}px solid transparent`, borderRight: `${ARROW_SIZE}px solid transparent`, borderTop: `${ARROW_SIZE}px solid #1e1e2e` },
  right: { borderTop: `${ARROW_SIZE}px solid transparent`, borderBottom: `${ARROW_SIZE}px solid transparent`, borderRight: `${ARROW_SIZE}px solid #1e1e2e` },
  left: { borderTop: `${ARROW_SIZE}px solid transparent`, borderBottom: `${ARROW_SIZE}px solid transparent`, borderLeft: `${ARROW_SIZE}px solid #1e1e2e` },
};

const computeArrowPos = (placement, targetRect, tooltipLeft, tooltipTop) => {
  const cx = targetRect.left + targetRect.width / 2;
  const cy = targetRect.top + targetRect.height / 2;
  let left, top;
  if (placement === 'bottom' || placement === 'top') {
    left = cx - tooltipLeft - ARROW_SIZE;
    top = placement === 'bottom' ? -ARROW_SIZE : TOOLTIP_HEIGHT;
    left = Math.max(ARROW_SIZE * 2, Math.min(left, TOOLTIP_WIDTH - ARROW_SIZE * 3));
  } else {
    left = placement === 'right' ? -ARROW_SIZE : TOOLTIP_WIDTH;
    top = cy - tooltipTop - ARROW_SIZE;
    top = Math.max(ARROW_SIZE * 2, Math.min(top, TOOLTIP_HEIGHT - ARROW_SIZE * 3));
  }
  return { left, top };
};

const FeatureTour = ({ isOpen, onClose, page = 'write' }) => {
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({});
  const [arrowPos, setArrowPos] = useState({});

  const steps = useMemo(() => TOUR_STEPS, [page]);

  const current = steps[step];
  const placement = current?.placement || 'bottom';

  useEffect(() => {
    if (!isOpen || !current) return;
    const el = document.querySelector(current.target);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setTargetRect(rect);

    let left, top;
    if (placement === 'bottom') {
      left = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;
      top = rect.bottom + GAP;
    } else if (placement === 'top') {
      left = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;
      top = rect.top - TOOLTIP_HEIGHT - GAP;
    } else if (placement === 'right') {
      left = rect.right + GAP;
      top = rect.top + rect.height / 2 - TOOLTIP_HEIGHT / 2;
    } else {
      left = rect.left - TOOLTIP_WIDTH - GAP;
      top = rect.top + rect.height / 2 - TOOLTIP_HEIGHT / 2;
    }

    left = Math.max(16, Math.min(left, window.innerWidth - TOOLTIP_WIDTH - 16));
    top = Math.max(16, Math.min(top, window.innerHeight - TOOLTIP_HEIGHT - 16));

    setTooltipPos({ left, top });
    setArrowPos(computeArrowPos(placement, rect, left, top));
  }, [isOpen, step, current, placement]);

  useEffect(() => {
    if (!isOpen) { setStep(0); setTargetRect(null); }
  }, [isOpen]);

  if (!isOpen || !current) return null;

  const isLast = step === steps.length - 1;
  const skipInvisible = () => {
    const next = step + 1;
    if (next >= steps.length) { onClose(); return; }
    if (!document.querySelector(steps[next].target)) {
      setStep(next);
      setTimeout(() => skipInvisible(), 100);
      return;
    }
    setStep(next);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 9999, pointerEvents: 'none',
    }}>
      <div style={{
        position: 'fixed',
        left: tooltipPos.left, top: tooltipPos.top,
        width: `${TOOLTIP_WIDTH}px`,
        zIndex: 9999, pointerEvents: 'auto',
        backgroundColor: '#1e1e2e',
        borderRadius: '14px',
        padding: '20px',
        boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
        color: '#e0e0e0',
      }}>
        <div style={{
          position: 'absolute', width: 0, height: 0,
          ...arrowPos,
          ...ARROW_CSS[placement],
        }} />

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
    </div>
  );
};

export default FeatureTour;
