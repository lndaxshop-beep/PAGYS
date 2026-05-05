export const formatQuestionType = (type) => {
  const types = {
    'multiple-choice': 'Multiple Choice',
    'likert': 'Likert Scale',
    'checkbox': 'Checkbox (Select all that apply)',
    'scale': 'Scale/Rating',
    'open-ended': 'Open-ended'
  };
  return types[type] || type;
};

const generateDemographicQuestions = () => ({
  section: 'Demographics',
  questions: [
    { id: 'q1', text: 'What is your age range?', type: 'multiple-choice', options: ['18-25', '26-35', '36-45', '46-55', '55+'] },
    { id: 'q2', text: 'What is your gender?', type: 'multiple-choice', options: ['Male', 'Female', 'Non-binary', 'Prefer not to say'] },
    { id: 'q3', text: "What is your highest level of education?", type: 'multiple-choice', options: ['High School', "Bachelor's Degree", "Master's Degree", 'PhD', 'Other'] }
  ]
});

export const generateQuantitativeQuestions = (project) => {
  const topic = project.title.toLowerCase();
  const questions = [];
  questions.push({
    id: 'q4',
    text: `How would you rate the importance of ${project.title}?`,
    type: 'likert',
    options: ['Not Important', 'Slightly Important', 'Moderately Important', 'Very Important', 'Extremely Important']
  });
  questions.push({
    id: 'q5',
    text: 'How frequently do you engage with this topic?',
    type: 'likert',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Very Often']
  });
  if (topic.includes('technology')) {
    questions.push({
      id: 'q6',
      text: 'Which technologies do you currently use?',
      type: 'checkbox',
      options: ['Smartphones', 'Laptops', 'Tablets', 'Software Applications', 'Cloud Services', 'AI Tools']
    });
  } else {
    questions.push({
      id: 'q6',
      text: 'What factors are most important to you?',
      type: 'checkbox',
      options: ['Cost', 'Quality', 'Convenience', 'Reliability', 'Accessibility']
    });
  }
  questions.push({
    id: 'q7',
    text: `On a scale of 1-10, how satisfied are you with current ${project.title} practices?`,
    type: 'scale',
    min: 1,
    max: 10
  });
  return questions;
};

export const generateQualitativeQuestions = () => [
  { id: 'q8', text: 'Can you describe your experience with this in detail?', type: 'open-ended', probe: 'What specific aspects stand out to you?' },
  { id: 'q9', text: 'What challenges or barriers have you encountered?', type: 'open-ended', probe: 'How did you address these challenges?' },
  { id: 'q10', text: 'What improvements would you suggest?', type: 'open-ended', probe: 'Why do you think these changes would be beneficial?' },
  { id: 'q11', text: 'How has this impacted your work or daily life?', type: 'open-ended', probe: 'Can you provide specific examples?' }
];

export const generateQuestions = (project) => {
  const sections = [generateDemographicQuestions()];
  if (project.methodology === 'quantitative') {
    sections.push({ section: 'Quantitative Assessment', questions: generateQuantitativeQuestions(project) });
  } else if (project.methodology === 'qualitative') {
    sections.push({ section: 'Qualitative Interview Questions', questions: generateQualitativeQuestions() });
  } else {
    sections.push({ section: 'Quantitative Section', questions: generateQuantitativeQuestions(project).slice(0, 5) });
    sections.push({ section: 'Qualitative Section', questions: generateQualitativeQuestions().slice(0, 3) });
  }
  return sections;
};

export const generateWordContent = (project, sections, customQuestions) => {
  let content = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <title>Research Questionnaire - ${project.title}</title>
  <style>
    body { font-family: 'Times New Roman', Times, serif; margin: 2.5cm; line-height: 1.6; color: #000000; }
    h1 { font-size: 28pt; font-weight: bold; text-align: center; margin-bottom: 30px; }
    h2 { font-size: 22pt; font-weight: bold; margin-top: 40px; margin-bottom: 20px; border-bottom: 1px solid #cccccc; padding-bottom: 10px; }
    .info { text-align: center; margin-bottom: 30px; font-size: 14pt; }
    .section { margin-bottom: 40px; }
    .question { margin-bottom: 30px; page-break-inside: avoid; }
    .question-text { font-size: 12pt; font-weight: bold; margin-bottom: 10px; }
    .question-type { font-size: 11pt; color: #555555; margin-bottom: 8px; font-style: italic; }
    .options { margin-left: 20px; margin-top: 10px; }
    .option { margin: 8px 0; font-size: 12pt; }
    .open-ended-space { margin: 15px 0; }
    .line { border-bottom: 1px solid #999999; width: 100%; height: 25px; margin: 10px 0; }
    hr { margin: 40px 0; border: 1px solid #cccccc; }
    .footer { margin-top: 50px; font-size: 11pt; color: #666666; text-align: center; border-top: 1px solid #eeeeee; padding-top: 20px; }
  </style>
</head>
<body>
  <h1>Research Questionnaire</h1>
  <div class="info">
    <p><strong>Project:</strong> ${project.title}</p>
    <p><strong>Methodology:</strong> ${project.methodology || 'Mixed Methods'}</p>
    <p><strong>Generated:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
  </div>
  <hr />`;

  sections.forEach(section => {
    content += `\n  <div class="section">\n    <h2>${section.section}</h2>`;
    section.questions.forEach((q, qIndex) => {
      content += `\n    <div class="question">\n      <div class="question-text">${qIndex + 1}. ${q.text}</div>\n      <div class="question-type">Type: ${formatQuestionType(q.type)}</div>`;
      if (['multiple-choice', 'likert', 'checkbox'].includes(q.type)) {
        content += '\n      <div class="options">';
        q.options.forEach(opt => { content += `\n        <div class="option">☐ ${opt}</div>`; });
        content += '\n      </div>';
      } else if (q.type === 'scale') {
        content += '\n      <div class="options">';
        for (let i = q.min; i <= q.max; i++) { content += `<span style="margin-right: 20px;">${i} ☐</span>`; }
        content += '\n      </div>';
      } else if (q.type === 'open-ended') {
        content += '\n      <div class="open-ended-space">\n        <div class="line"></div>\n        <div class="line"></div>\n        <div class="line"></div>\n        <div class="line"></div>\n      </div>';
        if (q.probe) { content += `\n      <p style="font-size: 11pt; font-style: italic; color: #666;">Probe: ${q.probe}</p>`; }
      }
      content += '\n    </div>';
    });
    content += '\n  </div>';
  });

  if (customQuestions.length > 0) {
    content += '\n  <div class="section">\n    <h2>Additional Questions</h2>';
    customQuestions.forEach((q, index) => {
      content += `\n    <div class="question">\n      <div class="question-text">C${index + 1}. ${q.text}</div>\n      <div class="question-type">Type: Open-ended</div>\n      <div class="open-ended-space">\n        <div class="line"></div>\n        <div class="line"></div>\n        <div class="line"></div>\n      </div>\n    </div>`;
    });
    content += '\n  </div>';
  }

  content += `\n  <hr />\n  <div class="footer">\n    <p><em>Thank you for participating in this research. Your responses will contribute to understanding ${project.title}.</em></p>\n    <p style="margin-top: 20px;">This questionnaire was generated by PAGYS Thesis Assistant</p>\n  </div>\n</body>\n</html>`;
  return content;
};
