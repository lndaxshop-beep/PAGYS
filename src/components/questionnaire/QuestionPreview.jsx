import React from 'react';
import { formatQuestionType } from '../../utils/questionnaireHelpers';

const QuestionPreview = ({ questions, colors, isDarkMode }) => {
  const totalQuestions = questions.reduce((acc, section) => acc + section.questions.length, 0);

  return (
    <div style={{ marginBottom: '24px' }}>
      <h3 style={{ fontSize: '18px', fontWeight: '600', color: colors.text, marginBottom: '16px' }}>
        Generated Questions ({totalQuestions})
      </h3>
      <div style={{
        maxHeight: '300px',
        overflowY: 'auto',
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff'
      }}>
        {questions.map((section, sIndex) => (
          <div key={sIndex}>
            <div style={{
              padding: '12px 16px',
              backgroundColor: isDarkMode ? '#2d2d2d' : '#f3f4f6',
              borderBottom: `1px solid ${colors.border}`,
              fontWeight: '600',
              color: colors.text,
              position: 'sticky',
              top: 0,
              zIndex: 1
            }}>
              {section.section}
            </div>
            {section.questions.map((q, qIndex) => (
              <div key={q.id} style={{
                padding: '12px 16px',
                borderBottom: qIndex < section.questions.length - 1 ? `1px solid ${colors.border}` : 'none',
                backgroundColor: sIndex % 2 === 0 ? 'transparent' : (isDarkMode ? '#2d2d2d' : '#f9fafb')
              }}>
                <p style={{ fontWeight: '500', color: colors.text, marginBottom: '4px' }}>
                  {qIndex + 1}. {q.text}
                </p>
                <p style={{ fontSize: '12px', color: colors.textSecondary }}>
                  Type: {formatQuestionType(q.type)} {q.options ? `• ${q.options.length} options` : ''}
                </p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuestionPreview;
