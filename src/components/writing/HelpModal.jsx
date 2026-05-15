import React from 'react';

const FEATURES = [
  {
    icon: '📑',
    title: 'Chapter Navigation',
    description: 'Browse all chapters and subsections in the left panel. Expand/collapse chapters, reorder by dragging, or rename and delete with inline controls.',
  },
  {
    icon: '📝',
    title: 'Writing Area',
    description: 'View your content in a clean preview with support for diagrams, charts, and tables. Toggle to edit mode for manual changes, then save to lock them in.',
  },
  {
    icon: '✍️',
    title: 'Write Content',
    description: 'Compose academic content for any subsection with one click. Results are tailored to your topic, field, reference style, and any custom guidelines you have set.',
  },
  {
    icon: '🌿',
    title: 'Humanise',
    description: 'Refines content to sound more natural and human-like. Each subsection has a limited number of uses. Additional uses can be purchased per chapter.',
  },
  {
    icon: '💬',
    title: 'Supervisor Feedback',
    description: 'Apply your supervisor\'s corrections by typing up to 50 words of feedback or uploading screenshots. The content updates to reflect the requested changes.',
  },
  {
    icon: '📋',
    title: 'Written Versions',
    description: 'View every saved version of a subsection with timestamps and labels. Compare any two versions side-by-side and restore earlier content with one click.',
  },
  {
    icon: '✨',
    title: 'Custom Guidelines',
    description: 'Set per-chapter writing instructions. Guidelines are applied automatically whenever content is composed for that chapter.',
    premium: true,
  },
  {
    icon: '📚',
    title: 'Search Literature',
    description: 'Search OpenAlex for academic sources by topic, author, or keyword. Add papers directly to your source library as references for your project.',
    premium: true,
  },
  {
    icon: '📎',
    title: 'Add Source',
    description: 'Upload PDFs, Word documents, or images of research papers. Source metadata is extracted automatically and stored in your source library.',
  },
  {
    icon: '✅',
    title: 'Complete & Continue',
    description: 'Mark a chapter as complete and move to the next one. The final chapter shows "Complete & View Files" to access your downloads.',
  },
  {
    icon: '🤖',
    title: 'AI Score',
    description: 'Check your content against AI detection patterns. Get a percentage score and detailed analysis of sections that may need refinement.',
  },
  {
    icon: '⌨️',
    title: 'Keyboard Shortcuts',
    description: 'Use Ctrl+S to save, Ctrl+Z/Y for undo/redo, Ctrl+E to toggle edit mode, Ctrl+/ to view all shortcuts, and Escape to close any modal.',
  },
  {
    icon: '🔗',
    title: 'Reference Merging',
    description: 'Combine references from all chapters into a single bibliography. Sources are deduplicated automatically by author and year.',
  },
  {
    icon: '📊',
    title: 'Progress Tracking',
    description: 'Monitor your writing progress with the overall percentage indicator. See how many subsections are complete versus remaining in each chapter.',
  },
  {
    icon: '💎',
    title: 'Premium Features',
    description: 'Upgrade to unlock Write All Remaining, Search Literature, Custom Guidelines, and higher usage limits for Humanise and Feedback.',
    premium: true,
  },
];

const HelpModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9998, backdropFilter: 'blur(4px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '90%', maxWidth: '960px', maxHeight: '85vh',
          backgroundColor: '#1e1e2e',
          borderRadius: '20px',
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{
          padding: '28px 32px 20px',
          borderBottom: '1px solid #2d2d3d',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        }}>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#ffffff', margin: '0 0 4px' }}>
              📖 Help & Features Guide
            </h2>
            <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>
              Everything you need to know about the writing platform
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer',
            fontSize: '20px', padding: '4px 8px', borderRadius: '6px', lineHeight: '1',
          }}>✕</button>
        </div>

        <div style={{
          padding: '24px 32px 32px', overflowY: 'auto', flex: 1,
        }}>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
            gap: '16px',
          }}>
            {FEATURES.map((feature, i) => (
              <div key={i} style={{
                backgroundColor: '#2a2a3c',
                borderRadius: '14px', padding: '20px',
                border: '1px solid #3a3a4c',
                transition: 'transform 0.15s, box-shadow 0.15s',
                position: 'relative',
              }}>
                {feature.premium && (
                  <span style={{
                    position: 'absolute', top: '12px', right: '12px',
                    fontSize: '9px', fontWeight: '700', textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    backgroundColor: 'rgba(124,58,237,0.2)',
                    color: '#a78bfa', padding: '3px 8px', borderRadius: '6px',
                  }}>
                    Premium
                  </span>
                )}
                <div style={{
                  width: '44px', height: '44px',
                  backgroundColor: '#373750',
                  borderRadius: '12px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '22px', marginBottom: '14px',
                }}>
                  {feature.icon}
                </div>
                <h3 style={{
                  fontSize: '14px', fontWeight: '700', color: '#ffffff',
                  margin: '0 0 6px',
                }}>
                  {feature.title}
                </h3>
                <p style={{
                  fontSize: '12px', lineHeight: '1.6', color: '#b0b0c0',
                  margin: 0,
                }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          padding: '16px 32px',
          borderTop: '1px solid #2d2d3d',
          display: 'flex', justifyContent: 'center',
        }}>
          <button onClick={onClose} style={{
            padding: '10px 32px', fontSize: '14px', fontWeight: '600',
            backgroundColor: '#7c3aed', color: 'white',
            border: 'none', borderRadius: '10px', cursor: 'pointer',
          }}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
