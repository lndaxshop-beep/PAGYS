export const INSTRUMENT_TYPES = {
  questionnaire: { id: 'questionnaire', label: 'Questionnaire / Survey', icon: '📋', description: 'Structured survey with Likert scales, multiple choice, and rating questions', recommendedFor: ['quantitative', 'mixed'] },
  interview: { id: 'interview', label: 'Interview Guide', icon: '🎤', description: 'Semi-structured interview questions with probes and follow-ups', recommendedFor: ['qualitative', 'mixed'] },
  focusGroup: { id: 'focusGroup', label: 'Focus Group Protocol', icon: '👥', description: 'Group discussion guide with icebreakers, prompts, and time allocations', recommendedFor: ['qualitative'] },
  observation: { id: 'observation', label: 'Observation Checklist', icon: '👁️', description: 'Structured observation form with behavioral indicators and rating scales', recommendedFor: ['qualitative', 'mixed'] },
  documentAnalysis: { id: 'documentAnalysis', label: 'Document Analysis Template', icon: '📄', description: 'Framework for systematically analyzing existing documents and records', recommendedFor: ['qualitative'] },
  caseStudy: { id: 'caseStudy', label: 'Case Study Protocol', icon: '🔬', description: 'Comprehensive protocol with multiple instruments and data triangulation', recommendedFor: ['qualitative', 'mixed'] }
};

export const questionTypeLabels = {
  'multiple-choice': 'Multiple Choice', 'likert': 'Likert Scale', 'checkbox': 'Checkbox',
  'scale': 'Scale/Rating', 'open-ended': 'Open-ended', 'ranking': 'Ranking'
};

export const fieldTypeLabels = {
  'text': 'Text', 'select': 'Dropdown', 'count': 'Count', 'rating': 'Rating Scale',
  'yes-no': 'Yes/No', 'duration': 'Duration', 'checkbox': 'Checkbox', 'number': 'Number'
};

export const formatQuestionType = (type) => questionTypeLabels[type] || type;
export const formatFieldType = (type) => fieldTypeLabels[type] || type;

export const buildWordExport = (instrumentId, content, project) => {
  const type = INSTRUMENT_TYPES[instrumentId];
  let bodyContent = `
    <h1>${type.icon} ${type.label}</h1>
    <div class="info">
      <p><strong>Project:</strong> ${project.title}</p>
      <p><strong>Field:</strong> ${project.field || 'Not specified'}</p>
      <p><strong>Methodology:</strong> ${(project.methodology || 'mixed methods').charAt(0).toUpperCase() + (project.methodology || 'mixed methods').slice(1)}</p>
      <p><strong>Generated:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>
    <hr />`;

  const buildSectionContent = (section) => {
    let html = `<div class="section"><h2>${section.sectionName || section.title}</h2>`;
    if (section.questions) {
      section.questions.forEach((q, qi) => {
        html += `<div class="question"><div class="question-text">${qi + 1}. ${q.text}</div><div class="question-type">Type: ${formatQuestionType(q.type)}</div>`;
        if (q.options) { html += `<div class="options">`; q.options.forEach(opt => { html += `<div class="option">☐ ${opt}</div>`; }); html += `</div>`; }
        if (q.type === 'open-ended') { html += `<div class="open-ended-space"><div class="line"></div><div class="line"></div><div class="line"></div></div>`; }
        html += `</div>`;
      });
    }
    if (section.items) {
      section.items.forEach((item, ii) => {
        if (item.type === 'script') { html += `<p class="script">"${item.content}"</p>`; }
        else if (item.type === 'question') {
          html += `<div class="question"><div class="question-text">${ii + 1}. ${item.text}</div>`;
          if (item.probes) { item.probes.forEach(probe => { html += `<p class="probe">→ ${probe}</p>`; }); }
          html += `<div class="open-ended-space"><div class="line"></div><div class="line"></div><div class="line"></div></div></div>`;
        }
        else if (item.type === 'note') { html += `<p class="note">📝 ${item.content}</p>`; }
      });
    }
    if (section.duration) { html += `<p class="duration">⏱ ${section.duration}</p>`; }
    if (section.facilitatorNotes) { html += `<p class="note">📝 ${section.facilitatorNotes}</p>`; }
    if (section.fields) {
      html += `<table class="obs-table"><tr><th>#</th><th>Indicator / Field</th><th>Type</th><th>Response</th></tr>`;
      section.fields.forEach((field, fi) => { html += `<tr><td>${fi + 1}</td><td>${field.label}</td><td>${formatFieldType(field.type)}</td><td></td></tr>`; });
      html += `</table>`;
    }
    if (section.indicators) {
      html += `<table class="obs-table"><tr><th>#</th><th>Indicator / Field</th><th>Type</th><th>Response</th></tr>`;
      section.indicators.forEach((ind, ii) => { html += `<tr><td>${ii + 1}</td><td>${ind.label}</td><td>${formatFieldType(ind.type)}</td><td></td></tr>`; });
      html += `</table>`;
    }
    if (section.codes) {
      html += `<table class="obs-table"><tr><th>Code</th><th>Label</th><th>Description</th></tr>`;
      section.codes.forEach(code => { html += `<tr><td>${code.code}</td><td>${code.label}</td><td>${code.description || ''}</td></tr>`; });
      html += `</table>`;
    }
    if (section.criteria) {
      section.criteria.forEach((c, ci) => { html += `<div class="question"><div class="question-text">${ci + 1}. ${c.criterion}</div><p>${c.description || ''}</p></div>`; });
    }
    if (section.sources) {
      html += `<table class="obs-table"><tr><th>Data Source</th><th>Type</th><th>Details</th></tr>`;
      section.sources.forEach(s => { html += `<tr><td>${s.source}</td><td>${s.type}</td><td>${s.participants || s.duration || s.sessions || ''}</td></tr>`; });
      html += `</table>`;
    }
    if (section.description) { html += `<p>${section.description}</p>`; }
    if (section.methods) { html += `<p><strong>Triangulation Methods:</strong> ${section.methods.join(', ')}</p>`; }
    html += `</div>`;
    return html;
  };

  if (content.sections) {
    content.sections.forEach(section => { bodyContent += buildSectionContent(section); });
  }

  bodyContent += `
    <hr />
    <div class="footer">
      <p><em>This data collection instrument was generated by PAGYS Thesis Assistant for the project: "${project.title}".</em></p>
      <p style="margin-top: 12px;">Adapt and customize as needed for your research context.</p>
    </div>`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <title>${type.label} - ${project.title}</title>
  <style>
    body { font-family: 'Times New Roman', Times, serif; margin: 2.5cm; line-height: 1.6; color: #000000; }
    h1 { font-size: 28pt; font-weight: bold; text-align: center; margin-bottom: 30px; }
    h2 { font-size: 18pt; font-weight: bold; margin-top: 30px; margin-bottom: 15px; border-bottom: 1px solid #cccccc; padding-bottom: 8px; }
    .info { text-align: center; margin-bottom: 30px; font-size: 12pt; }
    .section { margin-bottom: 30px; page-break-inside: avoid; }
    .question { margin-bottom: 20px; padding-left: 12px; }
    .question-text { font-size: 12pt; font-weight: bold; margin-bottom: 8px; }
    .question-type { font-size: 11pt; color: #555; font-style: italic; margin-bottom: 6px; }
    .options { margin-left: 20px; }
    .option { margin: 6px 0; font-size: 12pt; }
    .script { font-style: italic; color: #555; font-size: 12pt; margin: 8px 0; padding: 8px 12px; background: #f9f9f9; border-left: 3px solid #059669; }
    .note { font-size: 11pt; color: #f59e0b; font-style: italic; margin: 8px 0; padding: 8px 12px; background: #fffbeb; border-left: 3px solid #f59e0b; }
    .probe { font-size: 11pt; color: #6b7280; font-style: italic; margin-left: 20px; }
    .duration { font-size: 13pt; color: #f59e0b; font-weight: 600; }
    .open-ended-space { margin: 10px 0; }
    .line { border-bottom: 1px solid #999; width: 100%; height: 25px; margin: 8px 0; }
    hr { margin: 30px 0; border: 1px solid #cccccc; }
    .footer { margin-top: 40px; font-size: 11pt; color: #666; text-align: center; border-top: 1px solid #eee; padding-top: 16px; }
    table.obs-table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    table.obs-table th, table.obs-table td { border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 11pt; }
    table.obs-table th { background: #f3f4f6; font-weight: 600; }
  </style>
</head>
<body>${bodyContent}
</body>
</html>`;
};
