import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import useQuestionnaire from '../hooks/useQuestionnaire';
import QuestionPreview from './questionnaire/QuestionPreview';
import CustomQuestions from './questionnaire/CustomQuestions';
import GeneratingState from './questionnaire/GeneratingState';

const QuestionnaireGenerator = ({ project, onClose, onDownload }) => {
  const { colors, isDarkMode } = useTheme();

  const {
    generating,
    questions,
    customQuestions,
    newCustomQuestion,
    downloaded,
    setNewCustomQuestion,
    handleAddCustomQuestion,
    handleRemoveCustomQuestion,
    handleDownload,
    exportAsPDF
  } = useQuestionnaire(project, onClose, onDownload);

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
        maxWidth: '900px',
        width: '90%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: isDarkMode ? '0 20px 40px rgba(0,0,0,0.5)' : '0 20px 40px rgba(0,0,0,0.3)',
        border: `1px solid ${colors.border}`
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: colors.text }}>
              Research Questionnaire
            </h2>
            <p style={{ color: colors.textSecondary, marginTop: '4px' }}>
              Based on your {project.methodology || 'mixed methods'} methodology
            </p>
          </div>
          {downloaded && (
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '28px',
                cursor: 'pointer',
                color: colors.textSecondary,
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.hover;
                e.currentTarget.style.color = colors.text;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = colors.textSecondary;
              }}
            >
              ×
            </button>
          )}
        </div>

        <div style={{
          backgroundColor: isDarkMode ? '#2d2d2d' : '#f5f3ff',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '24px',
          border: `1px solid ${colors.primary}`
        }}>
          <p style={{ color: colors.primary, fontWeight: '500' }}>
            <strong>Project:</strong> {project?.title}
          </p>
        </div>

        {generating ? (
          <GeneratingState colors={colors} />
        ) : (
          <>
            {questions.length > 0 && (
              <QuestionPreview
                questions={questions}
                colors={colors}
                isDarkMode={isDarkMode}
              />
            )}

            <CustomQuestions
              customQuestions={customQuestions}
              newCustomQuestion={newCustomQuestion}
              onChangeInput={(e) => setNewCustomQuestion(e.target.value)}
              onAdd={handleAddCustomQuestion}
              onRemove={handleRemoveCustomQuestion}
              colors={colors}
              isDarkMode={isDarkMode}
            />

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              borderTop: `1px solid ${colors.border}`,
              paddingTop: '24px',
              marginTop: '16px'
            }}>
              <button
                onClick={handleDownload}
                style={{
                  backgroundColor: '#059669',
                  color: 'white',
                  padding: '14px 32px',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '16px',
                  cursor: 'pointer',
                  flex: 1,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#047857';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 8px rgba(5, 150, 105, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#059669';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                📄 Download Questionnaire & Continue
              </button>
              <button
                onClick={exportAsPDF}
                style={{
                  backgroundColor: colors.primary,
                  color: 'white',
                  padding: '14px 32px',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = colors.primaryDark;
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = `0 4px 8px ${colors.primary}40`;
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = colors.primary;
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                📑 Download as PDF
              </button>
            </div>

            <p style={{
              textAlign: 'center',
              marginTop: '20px',
              fontSize: '14px',
              color: colors.textSecondary,
              fontStyle: 'italic'
            }}>
              ⚠️ You must download the questionnaire before continuing
            </p>
          </>
        )}
      </div>

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

export default QuestionnaireGenerator;
