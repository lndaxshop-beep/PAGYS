import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const AddSubsection = ({ onAdd }) => {
  const { colors } = useTheme();
  const [title, setTitle] = useState('');
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (title.trim()) {
      onAdd(title.trim());
      setTitle('');
      setShowForm(false);
    }
  };

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        style={{
          marginTop: '24px',
          color: colors.primary,
          background: 'none',
          border: 'none',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '8px',
          borderRadius: '6px',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = colors.hover;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <span style={{ fontSize: '20px' }}>+</span>
        Add Custom Subsection
      </button>
    );
  }

  return (
    <div style={{
      marginTop: '24px',
      padding: '20px',
      backgroundColor: colors.surface,
      border: `1px solid ${colors.border}`,
      borderRadius: '8px'
    }}>
      <h4 style={{ 
        fontSize: '16px', 
        fontWeight: '600', 
        marginBottom: '12px',
        color: colors.text 
      }}>
        Add New Subsection
      </h4>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter subsection title..."
          style={{
            width: '100%',
            padding: '10px',
            marginBottom: '12px',
            border: `1px solid ${colors.inputBorder}`,
            borderRadius: '6px',
            fontSize: '14px',
            backgroundColor: colors.input,
            color: colors.text
          }}
          autoFocus
        />
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="submit"
            style={{
              padding: '8px 16px',
              backgroundColor: colors.primary,
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => setShowForm(false)}
            style={{
              padding: '8px 16px',
              backgroundColor: 'transparent',
              color: colors.text,
              border: `1px solid ${colors.border}`,
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddSubsection;