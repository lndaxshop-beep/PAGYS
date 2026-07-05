import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const SourceModePrompt = ({ isOpen, onConfirm, onDismiss }) => {
  const { colors } = useTheme();
  const [selected, setSelected] = useState('user');
  const [remember, setRemember] = useState(true);

  if (!isOpen) return null;

  return (
    <div
      onClick={onDismiss}
      role="dialog"
      aria-modal="true"
      aria-labelledby="source-mode-title"
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, backdropFilter: 'blur(4px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '90%', maxWidth: '540px',
          backgroundColor: colors.surface,
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{
          padding: '28px 32px 16px',
        }}>
          <h2 id="source-mode-title" style={{
            fontSize: '20px', fontWeight: '700', color: colors.text,
            margin: '0 0 6px',
          }}>
            How should citations be sourced?
          </h2>
          <p style={{
            fontSize: '13px', lineHeight: '1.6', color: colors.textSecondary,
            margin: '0 0 20px',
          }}>
            Choose how the AI finds and cites sources in your thesis. This can be changed later in project settings.
          </p>

          {/* Option: User Sources */}
          <div
            onClick={() => setSelected('user')}
            style={{
              padding: '18px 20px',
              borderRadius: '14px',
              border: `2px solid ${selected === 'user' ? '#7c3aed' : colors.border}`,
              backgroundColor: selected === 'user' ? 'rgba(124,58,237,0.08)' : colors.background,
              cursor: 'pointer', marginBottom: '12px',
              transition: 'border-color 0.15s, background-color 0.15s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div style={{
                width: '22px', height: '22px', marginTop: '2px', flexShrink: 0,
                borderRadius: '50%',
                border: `2px solid ${selected === 'user' ? '#7c3aed' : colors.textSecondary}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: selected === 'user' ? '#7c3aed' : 'transparent',
                transition: 'all 0.15s',
              }}>
                {selected === 'user' && (
                  <span style={{ color: 'white', fontSize: '13px', lineHeight: '1' }}>✓</span>
                )}
              </div>
              <div>
                <div style={{
                  fontSize: '15px', fontWeight: '700', color: colors.text,
                  marginBottom: '4px',
                }}>
                  Use my literature sources <span style={{
                    fontSize: '10px', fontWeight: '700',
                    backgroundColor: 'rgba(16,185,129,0.2)', color: '#10b981',
                    padding: '2px 8px', borderRadius: '6px', marginLeft: '8px',
                  }}>Recommended</span>
                </div>
                <p style={{
                  fontSize: '12px', lineHeight: '1.6', color: colors.textSecondary,
                  margin: 0,
                }}>
                  We cite ONLY from the papers you have uploaded in MyFiles. 
                  References are accurate and traceable to real sources you provided.
                  Add as many sources as possible for more accurate and genuine results.
                </p>
              </div>
            </div>
          </div>

          {/* Option: Random Sources */}
          <div
            onClick={() => setSelected('random')}
            style={{
              padding: '18px 20px',
              borderRadius: '14px',
              border: `2px solid ${selected === 'random' ? '#7c3aed' : colors.border}`,
              backgroundColor: selected === 'random' ? 'rgba(124,58,237,0.08)' : colors.background,
              cursor: 'pointer', marginBottom: '20px',
              transition: 'border-color 0.15s, background-color 0.15s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div style={{
                width: '22px', height: '22px', marginTop: '2px', flexShrink: 0,
                borderRadius: '50%',
                border: `2px solid ${selected === 'random' ? '#7c3aed' : colors.textSecondary}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: selected === 'random' ? '#7c3aed' : 'transparent',
                transition: 'all 0.15s',
              }}>
                {selected === 'random' && (
                  <span style={{ color: 'white', fontSize: '13px', lineHeight: '1' }}>✓</span>
                )}
              </div>
              <div>
                <div style={{
                  fontSize: '15px', fontWeight: '700', color: colors.text,
                  marginBottom: '4px',
                }}>
                  Use random sources
                </div>
                <p style={{
                  fontSize: '12px', lineHeight: '1.6', color: colors.textSecondary,
                  margin: 0,
                }}>
                  We use AI-powered search to find and cite sources. 
                  Some references may not be traceable to real publications. 
                  Review the reference list carefully before submission.
                </p>
              </div>
            </div>
          </div>

          <div style={{
            backgroundColor: 'rgba(245,158,11,0.1)',
            border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: '12px', padding: '14px 18px', marginBottom: '20px',
          }}>
            <p style={{
              fontSize: '12px', lineHeight: '1.6', color: '#d97706', margin: 0,
            }}>
              💡 You can always add more literature sources using the{' '}
              <strong>Search Literature</strong> feature in MyFiles. 
              Adding more sources gives the AI better material to work with and 
              produces more accurate, trustworthy references.
            </p>
          </div>

          {/* Remember my choice */}
          <label
            onClick={(e) => e.stopPropagation()}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              cursor: 'pointer', marginBottom: '20px',
              userSelect: 'none',
            }}
          >
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => { e.stopPropagation(); setRemember(e.target.checked); }}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '13px', color: colors.textSecondary }}>
              Remember my choice — don't ask again
            </span>
          </label>
        </div>

        <div style={{
          padding: '16px 32px 24px',
          display: 'flex', justifyContent: 'flex-end', gap: '12px',
        }}>
          <button
            onClick={onDismiss}
            style={{
              padding: '10px 24px', fontSize: '14px', fontWeight: '600',
              backgroundColor: 'transparent', color: colors.textSecondary,
              border: `1px solid ${colors.border}`, borderRadius: '10px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(selected, remember)}
            style={{
              padding: '10px 28px', fontSize: '14px', fontWeight: '600',
              backgroundColor: '#7c3aed', color: 'white',
              border: 'none', borderRadius: '10px', cursor: 'pointer',
            }}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default SourceModePrompt;