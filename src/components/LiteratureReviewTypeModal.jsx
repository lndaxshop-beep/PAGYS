import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const LiteratureReviewTypeModal = ({ topic, field, onSubmit, onClose, project }) => {
  const { colors, isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [recommendation, setRecommendation] = useState(null);
  const [selectedType, setSelectedType] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  const setFallbackRecommendation = useCallback(() => {
    setRecommendation({
      recommendedType: 'analytical',
      reason: 'Based on your research topic, an analytical literature review would be most appropriate as it allows you to compare and contrast different theoretical perspectives and identify key themes.',
      approach: 'Structure your review thematically, comparing different authors\' views on each theme.',
      keyElements: [
        'Compare different theoretical perspectives',
        'Identify gaps in existing research',
        'Synthesize findings from multiple studies',
        'Critically evaluate methodologies used'
      ]
    });
    setSelectedType('analytical');
  }, []);

  const getRecommendation = useCallback(async (useFallback) => {
    setLoading(true);
    try {
      if (useFallback) { setFallbackRecommendation(); setLoading(false); return; }
      const { recommendLiteratureReviewType } = await import('../services/geminiService');
      const result = project ? await recommendLiteratureReviewType(project) : null;
      if (result && result.recommendedType) {
        setRecommendation(result);
        setSelectedType(result.recommendedType);
      } else {
        setFallbackRecommendation();
      }
    } catch {
      setFallbackRecommendation();
    }
    setLoading(false);
  }, [project, setFallbackRecommendation]);

  useEffect(() => { getRecommendation(false); }, [getRecommendation]);

  const handleRetry = () => { getRecommendation(false); };

  const literatureTypes = [
    {
      id: 'descriptive',
      title: 'Descriptive Review',
      icon: '📋',
      description: 'Summarizes and describes existing literature without critical evaluation',
      bestFor: 'Introductory research, mapping a field, undergraduate theses',
      details: 'A descriptive review provides a broad overview of the existing literature, summarizing key findings and trends without deep critical analysis. It is useful for establishing what is known about a topic and identifying basic patterns.'
    },
    {
      id: 'analytical',
      title: 'Analytical Review',
      icon: '🔍',
      description: 'Compares and contrasts different studies, identifies patterns and themes',
      bestFor: 'Most masters theses, identifying research gaps',
      details: 'An analytical review goes beyond description to examine relationships between studies, compare methodologies, and identify themes and patterns. It helps in understanding how different pieces of research relate to each other and where gaps exist.'
    },
    {
      id: 'critical',
      title: 'Critical Review',
      icon: '⚖️',
      description: 'Evaluates strengths and weaknesses of existing research, challenges assumptions',
      bestFor: 'PhD theses, developing new theoretical frameworks',
      details: 'A critical review evaluates the quality and contribution of existing research, questioning assumptions, methodologies, and conclusions. It positions your work within ongoing scholarly debates and helps develop new theoretical perspectives.'
    },
    {
      id: 'systematic',
      title: 'Systematic Review',
      icon: '📊',
      description: 'Comprehensive, methodical review following strict protocols',
      bestFor: 'Sciences, medical research, evidence-based practice',
      details: 'A systematic review follows a rigorous, predefined methodology to identify, evaluate, and synthesize all available evidence on a specific question. It minimizes bias and provides reliable evidence for decision-making.'
    }
  ];

  const getTypeIcon = (typeId) => {
    const type = literatureTypes.find(t => t.id === typeId);
    return type?.icon || '📚';
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="lit-review-type-title" style={{
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
        maxWidth: '700px',
        width: '90%',
        maxHeight: '85vh',
        overflowY: 'auto',
        boxShadow: isDarkMode ? '0 20px 40px rgba(0,0,0,0.5)' : '0 20px 40px rgba(0,0,0,0.3)',
        border: `1px solid ${colors.border}`
      }}>
        {/* Header with icon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            backgroundColor: colors.primary + '20',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span style={{ fontSize: '32px' }}>📚</span>
          </div>
          <div>
            <h2 style={{ fontSize: '26px', fontWeight: 'bold', color: colors.text, marginBottom: '4px' }}>
              Literature Review Type
            </h2>
            <p style={{ color: colors.textSecondary, fontSize: '15px' }}>
              Select the most appropriate approach for your research
            </p>
          </div>
        </div>

        {/* Topic info */}
        <div style={{
          backgroundColor: isDarkMode ? '#2d2d2d' : '#f9fafb',
          padding: '16px',
          borderRadius: '12px',
          marginBottom: '24px',
          border: `1px solid ${colors.border}`
        }}>
          <p style={{ color: colors.text, fontSize: '14px', marginBottom: '4px' }}>
            <strong>Topic:</strong> {topic}
          </p>
          <p style={{ color: colors.textSecondary, fontSize: '14px' }}>
            <strong>Field:</strong> {field}
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <div style={{
              width: '50px',
              height: '50px',
              border: `3px solid ${colors.primary}`,
              borderTopColor: 'transparent',
              borderRadius: '50%',
              margin: '0 auto 20px',
              animation: 'spin 1s linear infinite'
            }} />
            <p style={{ color: colors.primary, fontSize: '16px' }}>Analyzing your research topic...</p>
            <p style={{ color: colors.textSecondary, fontSize: '14px', marginTop: '10px' }}>
              Determining the most suitable literature review approach
            </p>
          </div>
        ) : (
          <>
            {/* AI Recommendation */}
            {recommendation && (
              <div style={{
                backgroundColor: isDarkMode ? '#2d2d2d' : '#f0f9ff',
                padding: '20px',
                borderRadius: '12px',
                marginBottom: '24px',
                border: `2px solid ${colors.primary}`,
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '20px',
                  backgroundColor: colors.primary,
                  color: 'white',
                  padding: '4px 16px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span>✨</span> Recommendation
                </div>
                
                <div style={{ marginTop: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '28px' }}>{getTypeIcon(recommendation.recommendedType)}</span>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: '700', color: colors.primary }}>
                        {recommendation.recommendedType.charAt(0).toUpperCase() + recommendation.recommendedType.slice(1)} Review
                      </h3>
                      <p style={{ color: colors.textSecondary, fontSize: '13px' }}>
                        Recommended for your topic
                      </p>
                    </div>
                  </div>
                  
                  <p style={{ color: colors.text, fontSize: '14px', marginBottom: '12px', lineHeight: '1.6' }}>
                    {recommendation.reason}
                  </p>
                  
                  <div style={{
                    backgroundColor: isDarkMode ? '#3d3d3d' : '#ffffff',
                    padding: '16px',
                    borderRadius: '8px',
                    marginTop: '12px'
                  }}>
                    <p style={{ fontWeight: '600', color: colors.text, marginBottom: '8px', fontSize: '14px' }}>
                      Recommended approach:
                    </p>
                    <p style={{ color: colors.textSecondary, fontSize: '13px', marginBottom: '12px' }}>
                      {recommendation.approach}
                    </p>
                    
                    <p style={{ fontWeight: '600', color: colors.text, marginBottom: '8px', fontSize: '14px' }}>
                      Key elements to include:
                    </p>
                    <ul style={{ paddingLeft: '20px', margin: 0 }}>
                      {recommendation.keyElements.map((element, index) => (
                        <li key={index} style={{ color: colors.textSecondary, fontSize: '13px', marginBottom: '4px' }}>
                          {element}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {!loading && (
              <div style={{ textAlign: 'right', marginBottom: '16px' }}>
                <button onClick={handleRetry} style={{ backgroundColor: 'transparent', color: colors.textSecondary, border: `1px solid ${colors.border}`, borderRadius: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = colors.primary; e.currentTarget.style.borderColor = colors.primary; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = colors.textSecondary; e.currentTarget.style.borderColor = colors.border; }}>
                  ⟳ Get Another Recommendation
                </button>
              </div>
            )}

            {/* Literature Types */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: colors.text, marginBottom: '16px' }}>
                Choose a Literature Review Type:
              </h3>
              
              {literatureTypes.map(type => (
                <div
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  style={{
                    display: 'block',
                    padding: '20px',
                    marginBottom: '12px',
                    backgroundColor: selectedType === type.id ? (isDarkMode ? '#3d3d3d' : '#f5f3ff') : colors.background,
                    border: `2px solid ${selectedType === type.id ? colors.primary : colors.border}`,
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedType !== type.id) {
                      e.currentTarget.style.backgroundColor = colors.hover;
                      e.currentTarget.style.borderColor = colors.primary + '80';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedType !== type.id) {
                      e.currentTarget.style.backgroundColor = colors.background;
                      e.currentTarget.style.borderColor = colors.border;
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      backgroundColor: selectedType === type.id ? colors.primary + '20' : (isDarkMode ? '#3d3d3d' : '#f3f4f6'),
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px'
                    }}>
                      {type.icon}
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <h4 style={{ fontSize: '16px', fontWeight: '700', color: colors.text }}>
                          {type.title}
                        </h4>
                        {selectedType === type.id && (
                          <span style={{
                            backgroundColor: colors.primary,
                            color: 'white',
                            padding: '2px 10px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: '600'
                          }}>
                            Selected
                          </span>
                        )}
                      </div>
                      
                      <p style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '6px', lineHeight: '1.5' }}>
                        {type.description}
                      </p>
                      
                      <p style={{ fontSize: '12px', color: colors.primary, fontWeight: '500' }}>
                        Best for: {type.bestFor}
                      </p>

                      {showDetails && selectedType === type.id && (
                        <div style={{
                          marginTop: '16px',
                          padding: '16px',
                          backgroundColor: isDarkMode ? '#2d2d2d' : '#f9fafb',
                          borderRadius: '8px',
                          border: `1px solid ${colors.border}`
                        }}>
                          <p style={{ fontSize: '13px', color: colors.text, lineHeight: '1.6' }}>
                            {type.details}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Options */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={showDetails}
                  onChange={(e) => setShowDetails(e.target.checked)}
                  style={{ width: '16px', height: '16px' }}
                />
                <span style={{ fontSize: '13px', color: colors.textSecondary }}>
                  Show detailed descriptions
                </span>
              </label>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => onSubmit(selectedType)}
                disabled={!selectedType}
                style={{
                  flex: 2,
                  backgroundColor: colors.primary,
                  color: 'white',
                  padding: '14px',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '15px',
                  cursor: selectedType ? 'pointer' : 'not-allowed',
                  opacity: selectedType ? 1 : 0.5,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (selectedType) {
                    e.target.style.backgroundColor = colors.primaryDark;
                    e.target.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedType) {
                    e.target.style.backgroundColor = colors.primary;
                    e.target.style.transform = 'translateY(0)';
                  }
                }}
              >
                {selectedType 
                  ? `Continue with ${literatureTypes.find(t => t.id === selectedType)?.title}`
                  : 'Select a review type to continue'}
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

            {/* Help text */}
            <p style={{
              textAlign: 'center',
              marginTop: '16px',
              fontSize: '12px',
              color: colors.textSecondary,
              borderTop: `1px solid ${colors.border}`,
              paddingTop: '16px'
            }}>
              The chosen literature review type will guide how we structure and write your Chapter 2.
              You can change this later if needed.
            </p>
          </>
        )}
      </div>

      {/* Add animation keyframes */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default LiteratureReviewTypeModal;