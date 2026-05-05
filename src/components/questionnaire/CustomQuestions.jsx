import React from 'react';

const CustomQuestions = ({ customQuestions, newCustomQuestion, onChangeInput, onAdd, onRemove, colors, isDarkMode }) => (
  <div style={{ marginBottom: '24px' }}>
    <h3 style={{ fontSize: '18px', fontWeight: '600', color: colors.text, marginBottom: '16px' }}>
      Add Custom Questions
    </h3>
    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
      <input
        type="text"
        value={newCustomQuestion}
        onChange={onChangeInput}
        placeholder="Enter your custom question..."
        style={{
          flex: 1,
          padding: '12px',
          border: `1px solid ${colors.inputBorder}`,
          borderRadius: '6px',
          backgroundColor: colors.input,
          color: colors.text,
          fontSize: '14px'
        }}
        onKeyPress={(e) => { if (e.key === 'Enter') { onAdd(); } }}
      />
      <button
        onClick={onAdd}
        disabled={!newCustomQuestion.trim()}
        style={{
          backgroundColor: newCustomQuestion.trim() ? colors.primary : colors.border,
          color: newCustomQuestion.trim() ? 'white' : colors.textSecondary,
          padding: '12px 24px',
          border: 'none',
          borderRadius: '6px',
          cursor: newCustomQuestion.trim() ? 'pointer' : 'not-allowed',
          fontWeight: '500',
          transition: 'all 0.2s'
        }}
      >
        Add
      </button>
    </div>
    {customQuestions.length > 0 && (
      <div style={{ marginTop: '16px' }}>
        {customQuestions.map((q) => (
          <div key={q.id} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px',
            backgroundColor: isDarkMode ? '#2d2d2d' : '#f3f4f6',
            borderRadius: '6px',
            marginBottom: '8px',
            border: `1px solid ${colors.border}`
          }}>
            <span style={{ color: colors.text }}>{q.text}</span>
            <button
              onClick={() => onRemove(q.id)}
              style={{
                color: '#ef4444',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '16px',
                padding: '4px 8px',
                borderRadius: '4px'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fee2e2'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    )}
  </div>
);

export default CustomQuestions;
