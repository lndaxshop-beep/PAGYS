import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const WordCountModal = ({ chapter, level, currentWordCount, onSubmit, onClose }) => {
  const { colors, isDarkMode } = useTheme();
  const [useCustom, setUseCustom] = useState(false);
  const [customMin, setCustomMin] = useState(currentWordCount?.min || '');
  const [customMax, setCustomMax] = useState(currentWordCount?.max || '');
  const [error, setError] = useState('');

  // Reset error when inputs change
  useEffect(() => {
    setError('');
  }, [customMin, customMax, useCustom]);

  // Word count presets based on level
  const getPresetRange = () => {
    if (!chapter) return { min: 1000, max: 2000 };
    
    const presets = {
      undergraduate: {
        proposal: { min: 1000, max: 1500 },
        chapter1: { min: 1000, max: 1800 },
        chapter2: { min: 2500, max: 4000 },
        chapter3: { min: 1500, max: 2500 },
        chapter4: { min: 1500, max: 3000 },
        chapter5: { min: 1000, max: 2000 }
      },
      masters: {
        proposal: { min: 1500, max: 2000 },
        chapter1: { min: 1500, max: 2500 },
        chapter2: { min: 4000, max: 7000 },
        chapter3: { min: 2500, max: 4000 },
        chapter4: { min: 3000, max: 5000 },
        chapter5: { min: 2500, max: 4000 }
      },
      phd: {
        proposal: { min: 2000, max: 3000 },
        chapter1: { min: 4000, max: 6000 },
        chapter2: { min: 15000, max: 25000 },
        chapter3: { min: 8000, max: 12000 },
        chapter4: { min: 10000, max: 20000 },
        chapter5: { min: 10000, max: 15000 }
      }
    };

    return presets[level]?.[chapter.id] || { min: 1000, max: 2000 };
  };

  const presetRange = getPresetRange();

  const handleSubmit = () => {
    if (useCustom) {
      // Validation
      if (!customMin || !customMax) {
        setError('Please enter both minimum and maximum word count');
        return;
      }
      
      const min = parseInt(customMin);
      const max = parseInt(customMax);
      
      if (isNaN(min) || isNaN(max)) {
        setError('Please enter valid numbers');
        return;
      }
      
      if (min >= max) {
        setError('Maximum must be greater than minimum');
        return;
      }
      
      if (min < 100) {
        setError('Minimum word count should be at least 100 words');
        return;
      }
      
      onSubmit({ min, max }, true);
    } else {
      onSubmit(presetRange, false);
    }
  };

  // Calculate approximate words per subsection
  const getWordsPerSubsection = () => {
    if (!chapter?.subsections) return null;
    const subsectionCount = chapter.subsections.filter(s => s.type === 'subsection').length;
    if (subsectionCount === 0) return null;
    
    const range = useCustom ? { min: customMin, max: customMax } : presetRange;
    const minPerSub = Math.floor(range.min / subsectionCount);
    const maxPerSub = Math.floor(range.max / subsectionCount);
    
    return { min: minPerSub, max: maxPerSub };
  };

  const wordsPerSub = getWordsPerSubsection();

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: colors.surface,
        borderRadius: '16px',
        padding: '32px',
        maxWidth: '500px',
        width: '90%',
        boxShadow: isDarkMode ? '0 20px 40px rgba(0,0,0,0.5)' : '0 20px 40px rgba(0,0,0,0.3)',
        border: `1px solid ${colors.border}`
      }}>
        {/* Header with chapter icon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            backgroundColor: colors.primary + '20',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span style={{ fontSize: '24px' }}>📝</span>
          </div>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: colors.text, marginBottom: '4px' }}>
              Word Count for {chapter?.title}
            </h2>
            <p style={{ color: colors.textSecondary, fontSize: '14px' }}>
              {level?.charAt(0).toUpperCase() + level?.slice(1)} Level Thesis
            </p>
          </div>
        </div>

        {/* Info box about word count distribution */}
        {chapter?.subsections && chapter.subsections.filter(s => s.type === 'subsection').length > 0 && (
          <div style={{
            backgroundColor: isDarkMode ? '#2d2d2d' : '#f0f9ff',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: `1px solid ${colors.primary}40`
          }}>
            <p style={{ color: colors.text, fontSize: '13px', marginBottom: '4px' }}>
              <strong>📊 This chapter has {chapter.subsections.filter(s => s.type === 'subsection').length} subsections</strong>
            </p>
            <p style={{ color: colors.textSecondary, fontSize: '12px' }}>
              The total word count will be distributed evenly across all subsections.
            </p>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div style={{
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '18px' }}>⚠️</span>
            {error}
          </div>
        )}

        {/* Options */}
        <div style={{ marginBottom: '24px' }}>
          {/* Standard range option */}
          <div
            onClick={() => setUseCustom(false)}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '16px',
              backgroundColor: !useCustom ? (isDarkMode ? '#3d3d3d' : '#f5f3ff') : 'transparent',
              border: `2px solid ${!useCustom ? colors.primary : colors.border}`,
              borderRadius: '12px',
              marginBottom: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <input
              type="radio"
              checked={!useCustom}
              onChange={() => setUseCustom(false)}
              style={{ width: '20px', height: '20px', marginTop: '2px' }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontWeight: '600', color: colors.text }}>
                  Standard Range
                </span>
                <span style={{ fontWeight: '700', color: colors.primary, fontSize: '18px' }}>
                  {presetRange.min} - {presetRange.max}
                </span>
              </div>
              <p style={{ fontSize: '13px', color: colors.textSecondary }}>
                Recommended for {level} level {chapter?.title}
              </p>
              {wordsPerSub && !useCustom && (
                <p style={{ fontSize: '12px', color: colors.primary, marginTop: '8px' }}>
                  ≈ {wordsPerSub.min}-{wordsPerSub.max} words per subsection
                </p>
              )}
            </div>
          </div>

          {/* Custom range option */}
          <div
            onClick={() => setUseCustom(true)}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '16px',
              backgroundColor: useCustom ? (isDarkMode ? '#3d3d3d' : '#f5f3ff') : 'transparent',
              border: `2px solid ${useCustom ? colors.primary : colors.border}`,
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <input
              type="radio"
              checked={useCustom}
              onChange={() => setUseCustom(true)}
              style={{ width: '20px', height: '20px', marginTop: '2px' }}
            />
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: '600', color: colors.text }}>
                Supervisor's Required Range
              </span>
            </div>
          </div>
        </div>

        {/* Custom input fields */}
        {useCustom && (
          <div style={{
            backgroundColor: isDarkMode ? '#2d2d2d' : '#f9fafb',
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '24px',
            border: `1px solid ${colors.border}`
          }}>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '13px', 
                  fontWeight: '500',
                  color: colors.text, 
                  marginBottom: '6px' 
                }}>
                  Minimum Words
                </label>
                <input
                  type="number"
                  value={customMin}
                  onChange={(e) => setCustomMin(e.target.value)}
                  placeholder="e.g., 1500"
                  min="100"
                  step="100"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `2px solid ${error ? '#dc2626' : colors.inputBorder}`,
                    borderRadius: '8px',
                    fontSize: '15px',
                    backgroundColor: colors.input,
                    color: colors.text,
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = colors.primary}
                  onBlur={(e) => e.target.style.borderColor = error ? '#dc2626' : colors.inputBorder}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '13px', 
                  fontWeight: '500',
                  color: colors.text, 
                  marginBottom: '6px' 
                }}>
                  Maximum Words
                </label>
                <input
                  type="number"
                  value={customMax}
                  onChange={(e) => setCustomMax(e.target.value)}
                  placeholder="e.g., 2500"
                  min="100"
                  step="100"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `2px solid ${error ? '#dc2626' : colors.inputBorder}`,
                    borderRadius: '8px',
                    fontSize: '15px',
                    backgroundColor: colors.input,
                    color: colors.text,
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = colors.primary}
                  onBlur={(e) => e.target.style.borderColor = error ? '#dc2626' : colors.inputBorder}
                />
              </div>
            </div>
            
            {wordsPerSub && useCustom && customMin && customMax && !error && (
              <div style={{
                backgroundColor: isDarkMode ? '#3d3d3d' : '#e6f7e6',
                padding: '12px',
                borderRadius: '8px',
                marginTop: '12px'
              }}>
                <p style={{ fontSize: '13px', color: colors.text }}>
                  <strong>Distribution:</strong> ≈ {Math.floor(parseInt(customMin) / (chapter?.subsections?.filter(s => s.type === 'subsection').length || 1))} - {Math.floor(parseInt(customMax) / (chapter?.subsections?.filter(s => s.type === 'subsection').length || 1))} words per subsection
                </p>
              </div>
            )}

            <p style={{ fontSize: '13px', color: colors.textSecondary, marginTop: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>💡</span> Enter the exact word count range provided by your supervisor
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleSubmit}
            style={{
              flex: 1,
              backgroundColor: colors.primary,
              color: 'white',
              padding: '14px',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '15px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = colors.primaryDark;
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = colors.primary;
              e.target.style.transform = 'translateY(0)';
            }}
          >
            Continue
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              color: colors.text,
              padding: '14px',
              border: `1px solid ${colors.border}`,
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '15px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = colors.hover;
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            Cancel
          </button>
        </div>

        {/* Info about word count distribution */}
        <p style={{
          textAlign: 'center',
          marginTop: '16px',
          fontSize: '12px',
          color: colors.textSecondary,
          borderTop: `1px solid ${colors.border}`,
          paddingTop: '16px'
        }}>
          The word count will be distributed evenly across all selected subsections.
          Each subsection will receive approximately equal word count.
        </p>
      </div>
    </div>
  );
};

export default WordCountModal;