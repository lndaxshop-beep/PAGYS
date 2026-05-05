import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const ResearchQuestionModal = ({ title, questions, onSelect, onCancel }) => {
  const { colors, isDarkMode } = useTheme();
  const [customQuestion, setCustomQuestion] = useState('');
  const [hoveredIndex, setHoveredIndex] = useState(null);

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }} onClick={onCancel}>
      <div style={{ backgroundColor: colors.surface, borderRadius: '16px', padding: '32px', maxWidth: '650px', width: '90%', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: colors.text, marginBottom: '8px' }}>✨ Choose a Research Question</h2>
        <p style={{ color: colors.textSecondary, marginBottom: '20px', fontSize: '14px' }}>Click to select for "{title}"</p>
        <div style={{ marginBottom: '16px' }}>
          {questions.map((q, i) => (
            <div
              key={i}
              onClick={() => onSelect(q)}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{
                padding: '12px 16px',
                margin: '4px 0',
                backgroundColor: hoveredIndex === i ? (isDarkMode ? '#3d2d5c' : '#ede9fe') : (i % 2 === 0 ? (isDarkMode ? '#2d2d2d' : '#f5f3ff') : colors.surface),
                borderRadius: '8px',
                cursor: 'pointer',
                border: `2px solid ${hoveredIndex === i ? colors.primary : 'transparent'}`,
                transition: 'all 0.2s'
              }}
            >
              <span style={{ fontWeight: '600', color: colors.primary, marginRight: '8px' }}>{i + 1}.</span>{q}
            </div>
          ))}
        </div>
        <textarea
          value={customQuestion}
          onChange={(e) => setCustomQuestion(e.target.value)}
          placeholder="Type your own research question..."
          rows="2"
          style={{ width: '100%', padding: '12px', border: `1px solid ${colors.border}`, borderRadius: '8px', fontSize: '14px', backgroundColor: colors.input, color: colors.text, resize: 'vertical', marginBottom: '16px', boxSizing: 'border-box' }}
        />
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => customQuestion.trim() && onSelect(customQuestion.trim())}
            disabled={!customQuestion.trim()}
            style={{ flex: 1, backgroundColor: customQuestion.trim() ? '#059669' : colors.border, color: customQuestion.trim() ? 'white' : colors.textSecondary, padding: '12px', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: customQuestion.trim() ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}
          >
            ✅ Use My Own Question
          </button>
          <button
            onClick={onCancel}
            style={{ flex: 1, backgroundColor: 'transparent', color: colors.text, padding: '12px', border: `1px solid ${colors.border}`, borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResearchQuestionModal;
