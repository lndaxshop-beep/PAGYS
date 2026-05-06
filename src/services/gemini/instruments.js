import { genAI, MODEL } from './config';
import { extractJSON } from './utils';

export const generateQuestionnaire = async (project) => {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL });
    const prompt = `You are an expert research methodology advisor. Generate a complete, research-specific questionnaire.

PROJECT TITLE: "${project.title}"
FIELD: ${project.field}
METHODOLOGY: ${project.methodology || 'mixed methods'}
ACADEMIC LEVEL: ${project.level}
${project.topic ? `RESEARCH QUESTION(S): ${project.topic}` : ''}
${project.organizationName ? `ORGANIZATION/CASE STUDY: ${project.organizationName}` : ''}

Your task is to design every questionnaire item so that it directly investigates the research topic and addresses the research question(s). No generic or filler questions. Each substantive question should measure a specific variable, concept, or relationship from the study. Use your expertise to determine the optimal number and mix of questions — do not limit yourself to a fixed count. Include enough items to produce valid, publishable results at the ${project.level} level.

Return ONLY valid JSON in this structure:
{
  "title": "Research Questionnaire: [Project Title]",
  "sections": [
    {
      "sectionName": "Section A: Demographics",
      "questions": [
        { "text": "What is your age range?", "type": "multiple-choice", "options": ["18-25", "26-35", "36-45", "46-55", "55+"] }
      ]
    },
    {
      "sectionName": "Section B: [Theme directly tied to the research]",
      "questions": [
        { "text": "Question that measures a specific research variable", "type": "likert", "options": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] }
      ]
    }
  ]
}

Available question types: multiple-choice, likert, checkbox, scale, open-ended, ranking.

Rules:
- Demographic section should include standard fields (age, gender, education, experience, etc.) relevant to the study population.
- Every substantive question after demographics must map directly to the research question(s) or a key variable in the study.
- Use a mix of question types appropriate for the methodology and level of research.
- Organize questions into thematic sections, each targeting a different dimension of the research.
- For Likert-scale questions, tailor the scale wording to the construct being measured.
- Include open-ended questions where qualitative depth is needed.
- Do NOT include generic questions unrelated to the specific research topic.

Return ONLY valid JSON.`;
    const result = await model.generateContent(prompt);
    return extractJSON(result.response.text());
  } catch (error) { console.error('Error generating questionnaire:', error); return null; }
};

export const generateInterviewGuide = async (project) => {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL });
    const prompt = `You are an expert qualitative researcher. Generate a semi-structured interview guide tailored to the specific research study.

PROJECT TITLE: "${project.title}"
FIELD: ${project.field}
METHODOLOGY: ${project.methodology || 'qualitative'}
ACADEMIC LEVEL: ${project.level}
${project.topic ? `RESEARCH QUESTION(S): ${project.topic}` : ''}
${project.organizationName ? `ORGANIZATION/CASE STUDY: ${project.organizationName}` : ''}

Your task is to design interview questions and probes that directly explore the research question(s). Every core question should investigate a specific aspect of the study. Do not limit yourself to a fixed number of questions — generate as many as needed to comprehensively cover all dimensions of the research at the ${project.level} level.

Return ONLY valid JSON in this structure:
{
  "title": "Interview Guide: [Project Title]",
  "estimatedDuration": "45-60 minutes",
  "sections": [
    {
      "sectionName": "Introduction & Consent",
      "items": [
        { "type": "script", "content": "Welcome and introduction script specific to this study..." },
        { "type": "note", "content": "Researcher note about ethical considerations..." }
      ]
    },
    {
      "sectionName": "Background & Context",
      "items": [
        { "type": "question", "text": "Question that establishes participant background relevant to the study", "probes": ["Probe that digs deeper into a specific aspect", "Another probe"] }
      ]
    },
    {
      "sectionName": "Core Research Themes",
      "items": [
        { "type": "question", "text": "Question exploring a specific research question", "probes": ["Follow-up probe", "Clarifying probe"] }
      ]
    }
  ]
}

Item types: script, question, note, probe.

Rules:
- The introduction script should reference the actual research topic and study purpose.
- Warm-up questions should naturally lead into the research domain — avoid generic icebreakers.
- Every core question must map to at least one research question or study objective.
- Include detailed probes for each core question to help the interviewer dig deeper.
- Organize questions into logical sections that build from broad context to specific research themes.
- Include a closing section that allows participants to add anything not covered.
- The depth and number of questions should be appropriate for the academic level and methodology.

Return ONLY valid JSON.`;
    const result = await model.generateContent(prompt);
    return extractJSON(result.response.text());
  } catch (error) { console.error('Error generating interview guide:', error); return null; }
};

export const generateFocusGroupProtocol = async (project) => {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL });
    const prompt = `You are an expert in qualitative focus group methodology. Generate a discussion protocol tailored to the specific research study.

PROJECT TITLE: "${project.title}"
FIELD: ${project.field}
METHODOLOGY: ${project.methodology || 'qualitative'}
ACADEMIC LEVEL: ${project.level}
${project.topic ? `RESEARCH QUESTION(S): ${project.topic}` : ''}
${project.organizationName ? `ORGANIZATION/CASE STUDY: ${project.organizationName}` : ''}

Your task is to design discussion topics and activities that directly investigate the research question(s) through group interaction. Every discussion topic must explore a specific dimension of the study. Generate as many topics and activities as needed to comprehensively cover the research at the ${project.level} level — do not limit yourself to a fixed count.

Return ONLY valid JSON in this structure:
{
  "title": "Focus Group Protocol: [Project Title]",
  "totalDuration": "90 minutes",
  "sections": [
    {
      "sectionName": "Welcome & Ground Rules",
      "duration": "10 min",
      "facilitatorNotes": "Notes specific to this study's context and ethical considerations",
      "items": [
        { "type": "script", "content": "Welcome script that introduces the actual research topic..." },
        { "type": "activity", "name": "Brief introduction round", "instructions": "Each participant shares their name and their connection to the research topic..." }
      ]
    },
    {
      "sectionName": "Discussion Topic 1: [Theme from the research]",
      "duration": "15 min",
      "facilitatorNotes": "What the facilitator should listen for in responses",
      "items": [
        { "type": "question", "text": "Discussion question exploring a specific research dimension", "instructions": "Allow open discussion, encourage all participants to share" }
      ]
    }
  ]
}

Item types: script, question, activity, note.

Rules:
- The welcome script must reference the actual research topic and study purpose.
- The icebreaker should transition participants into thinking about the research domain.
- Every discussion topic must explore a specific research question or theme from the study.
- Include facilitator notes for each section describing what to listen for and how to manage discussion.
- Organize topics so they build from general perceptions to deeper analysis of the research problem.
- Include a wrap-up section that summarizes key themes and invites final reflections.
- The number and depth of topics should be appropriate for the academic level and research scope.

Return ONLY valid JSON.`;
    const result = await model.generateContent(prompt);
    return extractJSON(result.response.text());
  } catch (error) { console.error('Error generating focus group protocol:', error); return null; }
};

export const generateObservationChecklist = async (project) => {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL });
    const prompt = `You are an expert in observational research methodology. Generate a structured observation checklist tailored to the specific research study.

PROJECT TITLE: "${project.title}"
FIELD: ${project.field}
METHODOLOGY: ${project.methodology || 'qualitative'}
ACADEMIC LEVEL: ${project.level}
${project.topic ? `RESEARCH QUESTION(S): ${project.topic}` : ''}
${project.organizationName ? `ORGANIZATION/CASE STUDY: ${project.organizationName}` : ''}

Your task is to design every field, indicator, and observation item so that it directly measures evidence related to the research question(s). No generic or boilerplate items. Generate as many indicators as needed to comprehensively observe all dimensions of the research at the ${project.level} level.

Return ONLY valid JSON in this structure:
{
  "title": "Observation Checklist: [Project Title]",
  "sections": [
    {
      "sectionName": "Context Information",
      "fields": [
        { "label": "Date", "type": "text" },
        { "label": "Location", "type": "text" },
        { "label": "Observer Name", "type": "text" }
      ]
    },
    {
      "sectionName": "Behavioral Indicators",
      "indicators": [
        { "label": "Specific observable behavior tied to the research topic", "type": "count" },
        { "label": "Quality of interaction related to a study variable", "type": "rating", "scale": [1, 2, 3, 4, 5] }
      ]
    }
  ]
}

Field types: text, select, count, rating, yes-no, duration, checkbox.

Rules:
- Context fields should include information relevant to the specific observation setting for this study.
- Every behavioral indicator must be an observable measure of a specific research variable or concept.
- Use a mix of field types appropriate for what is being observed (counts, ratings, checkboxes, etc.).
- Organize indicators into logical sections (e.g., behavioral indicators, environmental factors, interaction patterns).
- Each indicator label should describe exactly what the observer should look for, specific to the research context.
- For rating scales, tailor the scale anchors to the construct being measured.
- The number and specificity of indicators should be appropriate for the academic level and research scope.

Return ONLY valid JSON.`;
    const result = await model.generateContent(prompt);
    return extractJSON(result.response.text());
  } catch (error) { console.error('Error generating observation checklist:', error); return null; }
};

export const generateDocumentAnalysisTemplate = async (project) => {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL });
    const prompt = `You are an expert in document analysis and content analysis methodology. Generate a document analysis template tailored to the specific research study.

PROJECT TITLE: "${project.title}"
FIELD: ${project.field}
METHODOLOGY: ${project.methodology || 'qualitative'}
ACADEMIC LEVEL: ${project.level}
${project.topic ? `RESEARCH QUESTION(S): ${project.topic}` : ''}
${project.organizationName ? `ORGANIZATION/CASE STUDY: ${project.organizationName}` : ''}

Your task is to design classification fields, coding categories, and analysis criteria that directly map to the research question(s). The coding framework must enable systematic extraction of data relevant to the study. Generate as many codes and fields as needed to thoroughly analyze documents at the ${project.level} level — do not limit yourself to a fixed count.

Return ONLY valid JSON in this structure:
{
  "title": "Document Analysis Template: [Project Title]",
  "sections": [
    {
      "sectionName": "Document Classification",
      "fields": [
        { "label": "Document Type", "type": "select", "options": ["Policy", "Report", "Memo", "Email", "Meeting Minutes", "Other"] },
        { "label": "Date Created", "type": "text" },
        { "label": "Author/Source", "type": "text" }
      ]
    },
    {
      "sectionName": "Content Coding Framework",
      "codes": [
        { "code": "C1", "label": "Theme directly tied to a research question", "description": "Specific description of what to look for in the document" }
      ]
    }
  ]
}

Field types: text, select, count, rating, yes-no, duration, checkbox, textarea.

Rules:
- Classification fields should capture metadata relevant to the document types being analyzed in this study.
- Every coding category must map to a specific research question, variable, or theoretical concept.
- Each code should have a clear description of what evidence to look for in the documents.
- Include extraction fields that capture data points needed to answer the research questions.
- Include analysis criteria for evaluating document credibility, relevance, and bias in the context of this study.
- Organize codes into thematic sections that align with the study's conceptual framework.
- The number and depth of codes should be appropriate for the academic level and research scope.

Return ONLY valid JSON.`;
    const result = await model.generateContent(prompt);
    return extractJSON(result.response.text());
  } catch (error) { console.error('Error generating document analysis template:', error); return null; }
};

export const generateCaseStudyProtocol = async (project) => {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL });
    const prompt = `You are an expert in case study research methodology. Generate a comprehensive research protocol tailored to the specific study.

PROJECT TITLE: "${project.title}"
FIELD: ${project.field}
METHODOLOGY: ${project.methodology || 'qualitative'}
ACADEMIC LEVEL: ${project.level}
${project.topic ? `RESEARCH QUESTION(S): ${project.topic}` : ''}
${project.organizationName ? `ORGANIZATION/CASE STUDY: ${project.organizationName}` : ''}

Your task is to design every element of the case study protocol — case selection, data sources, triangulation, and validity measures — so that each is specifically tailored to the research question(s). No boilerplate or generic criteria. Generate as many items as needed to produce a rigorous protocol at the ${project.level} level.

Return ONLY valid JSON in this structure:
{
  "title": "Case Study Protocol: [Project Title]",
  "sections": [
    {
      "sectionName": "Case Selection Criteria",
      "criteria": [
        { "criterion": "Criterion directly tied to the research question", "description": "Specific explanation of why this criterion matters for this study" }
      ]
    },
    {
      "sectionName": "Data Collection Plan",
      "sources": [
        { "source": "Interviews with stakeholders related to the case", "type": "primary", "participants": "5-10", "duration": "45-60 min each" },
        { "source": "Documents specific to the case context", "type": "secondary", "description": "Specific document types relevant to this study" }
      ]
    },
    {
      "sectionName": "Triangulation Strategy",
      "description": "How multiple data sources will be used to validate findings for this specific study",
      "methods": ["Specific triangulation method 1 tied to the research", "Specific triangulation method 2"]
    }
  ]
}

Rules:
- Every case selection criterion must be directly relevant to the research question(s) and study context.
- Every data source must be justified by what it contributes to answering the research question(s).
- The triangulation strategy must describe how findings will be cross-validated for this specific study.
- Include validity and reliability measures specific to the case study design.
- Include an ethical considerations section relevant to the study context and participants.
- Include a timeline with phases appropriate for the scope and level of the research.
- The depth and rigor should be appropriate for the academic level.

Return ONLY valid JSON.`;
    const result = await model.generateContent(prompt);
    return extractJSON(result.response.text());
  } catch (error) { console.error('Error generating case study protocol:', error); return null; }
};
