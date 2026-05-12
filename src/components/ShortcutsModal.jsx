import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const SHORTCUTS = [
  { keys: 'Ctrl + S', action: 'Save current content' },
  { keys: 'Ctrl + Z', action: 'Undo last change' },
  { keys: 'Ctrl + Y / Ctrl + Shift + Z', action: 'Redo last change' },
  { keys: 'Ctrl + E', action: 'Toggle Edit / Preview mode' },
  { keys: 'Ctrl + G', action: 'Generate AI content for current subsection' },
  { keys: 'Alt + 1–6', action: 'Jump to subsection by index' },
  { keys: 'Escape', action: 'Close any open modal' },
];

const ShortcutsModal = ({ isOpen, onClose }) => {
  const { colors, isDarkMode } = useTheme();

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ backgroundColor: colors.surface, borderRadius: '16px', padding: '32px', minWidth: '400px', maxWidth: '500px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: colors.text }}>⌨ Keyboard Shortcuts</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: colors.textSecondary, cursor: 'pointer', fontSize: '20px', padding: '4px 8px' }}>✕</button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
              <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: '13px', fontWeight: '600', color: colors.textSecondary }}>Shortcut</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: '13px', fontWeight: '600', color: colors.textSecondary }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {SHORTCUTS.map((s, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${colors.border}40` }}>
                <td style={{ padding: '10px 12px' }}>
                  <kbd style={{ backgroundColor: isDarkMode ? '#374151' : '#f3f4f6', borderRadius: '4px', padding: '3px 8px', fontSize: '12px', fontFamily: 'monospace', color: colors.text, border: `1px solid ${colors.border}`, whiteSpace: 'nowrap' }}>{s.keys}</kbd>
                </td>
                <td style={{ padding: '10px 12px', fontSize: '14px', color: colors.text }}>{s.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ marginTop: '16px', fontSize: '12px', color: colors.textSecondary, textAlign: 'center' }}>
          Press <kbd style={{ backgroundColor: isDarkMode ? '#374151' : '#f3f4f6', borderRadius: '3px', padding: '1px 5px', fontSize: '11px', fontFamily: 'monospace', border: `1px solid ${colors.border}`, color: colors.text }}>Escape</kbd> to close this modal
        </p>
      </div>
    </div>
  );
};

export default ShortcutsModal;
