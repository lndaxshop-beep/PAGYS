import { genAI, MODEL } from './config';
import { extractJSON } from './utils';

export const generateQuestionnaire = async (project) => {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL });
    const prompt = `You are an expert research methodology advisor. Generate a complete research questionnaire.

PROJECT: "${project.title}"
FIELD: ${project.field}
METHODOLOGY: ${project.methodology || 'mixed methods'}
LEVEL: ${project.level}
${project.topic ? `RESEARCH QUESTION: ${project.topic}` : ''}

Return JSON with sections:
{
  "title": "Research Questionnaire: [Project Title]",
  "sections": [
    {
      "sectionName": "Section A: Demographics",
      "questions": [
        { "text": "What is your age range?", "type": "multiple-choice", "options": ["18-25", "26-35", "36-45", "46-55", "55+"] },
        { "text": "Rate your agreement...", "type": "likert", "options": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] }
      ]
    }
  ]
}

Question types: multiple-choice, likert, checkbox, scale, open-ended, ranking.
Include 3-5 demographic questions and 8-12 substantive questions related to the project topic.
Return ONLY valid JSON.`;
    const result = await model.generateContent(prompt);
    return extractJSON(result.response.text());
  } catch (error) { console.error('Error generating questionnaire:', error); return null; }
};

export const generateInterviewGuide = async (project) => {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL });
    const prompt = `Generate a semi-structured interview guide.

PROJECT: "${project.title}"
FIELD: ${project.field}
METHODOLOGY: ${project.methodology || 'qualitative'}
LEVEL: ${project.level}
${project.topic ? `RESEARCH QUESTION: ${project.topic}` : ''}

Return JSON:
{
  "title": "Interview Guide: [Project Title]",
  "estimatedDuration": "45-60 minutes",
  "sections": [
    {
      "sectionName": "Introduction & Consent",
      "items": [
        { "type": "script", "content": "Thank you for participating in this research study..." },
        { "type": "question", "text": "Can you tell me about your background?", "probes": ["What led you to this?", "How long have you been involved?"] }
      ]
    }
  ]
}

Item types: script, question, note, probe.
Include: introduction script (2-3 items), 2-3 warm-up questions, 8-10 core questions with probes, closing section.
Return ONLY valid JSON.`;
    const result = await model.generateContent(prompt);
    return extractJSON(result.response.text());
  } catch (error) { console.error('Error generating interview guide:', error); return null; }
};

export const generateFocusGroupProtocol = async (project) => {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL });
    const prompt = `Generate a focus group discussion protocol.

PROJECT: "${project.title}"
FIELD: ${project.field}
PARTICIPANTS: 6-10 people
DURATION: 90 minutes
${project.topic ? `RESEARCH QUESTION: ${project.topic}` : ''}

Return JSON:
{
  "title": "Focus Group Protocol: [Project Title]",
  "totalDuration": "90 minutes",
  "sections": [
    {
      "sectionName": "Welcome & Ground Rules",
      "duration": "10 min",
      "facilitatorNotes": "Welcome participants, explain purpose, set ground rules",
      "items": [
        { "type": "script", "content": "Welcome everyone. Thank you for joining..." },
        { "type": "activity", "name": "Icebreaker", "instructions": "Each participant shares their name and one word that describes..." }
      ]
    }
  ]
}

Include: welcome (10 min), icebreaker (10 min), 4-5 main discussion topics (15 min each), wrap-up (10 min).
Return ONLY valid JSON.`;
    const result = await model.generateContent(prompt);
    return extractJSON(result.response.text());
  } catch (error) { console.error('Error generating focus group protocol:', error); return null; }
};

export const generateObservationChecklist = async (project) => {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL });
    const prompt = `Generate a structured observation checklist.

PROJECT: "${project.title}"
FIELD: ${project.field}
SETTING: Field observation
${project.topic ? `RESEARCH QUESTION: ${project.topic}` : ''}

Return JSON:
{
  "title": "Observation Checklist: [Project Title]",
  "sections": [
    {
      "sectionName": "Context Information",
      "fields": [
        { "label": "Date", "type": "text" },
        { "label": "Location", "type": "text" },
        { "label": "Time of Day", "type": "select", "options": ["Morning", "Afternoon", "Evening"] }
      ]
    },
    {
      "sectionName": "Behavioral Indicators",
      "indicators": [
        { "label": "Frequency of target behavior", "type": "count" },
        { "label": "Quality of interaction", "type": "rating", "scale": [1, 2, 3, 4, 5] }
      ]
    }
  ]
}

Field types: text, select, count, rating, yes-no, duration, checkbox.
Include 5-8 context fields, 10-15 behavioral indicators, 3-5 environmental factors.
Return ONLY valid JSON.`;
    const result = await model.generateContent(prompt);
    return extractJSON(result.response.text());
  } catch (error) { console.error('Error generating observation checklist:', error); return null; }
};

export const generateDocumentAnalysisTemplate = async (project) => {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL });
    const prompt = `Generate a document analysis template for systematic review.

PROJECT: "${project.title}"
FIELD: ${project.field}
${project.topic ? `RESEARCH QUESTION: ${project.topic}` : ''}

Return JSON:
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
        { "code": "C1", "label": "Theme Category 1", "description": "Description of what to look for" },
        { "code": "C2", "label": "Theme Category 2", "description": "Description of what to look for" }
      ]
    }
  ]
}

Include: document classification (5-8 fields), coding framework (5-7 codes), extraction fields, analysis criteria.
Return ONLY valid JSON.`;
    const result = await model.generateContent(prompt);
    return extractJSON(result.response.text());
  } catch (error) { console.error('Error generating document analysis template:', error); return null; }
};

export const generateCaseStudyProtocol = async (project) => {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL });
    const prompt = `Generate a comprehensive case study research protocol.

PROJECT: "${project.title}"
FIELD: ${project.field}
CASE TYPE: Single or multiple case study
${project.topic ? `RESEARCH QUESTION: ${project.topic}` : ''}

Return JSON:
{
  "title": "Case Study Protocol: [Project Title]",
  "sections": [
    {
      "sectionName": "Case Selection Criteria",
      "criteria": [
        { "criterion": "Relevance to research question", "description": "The case must directly address the core research question" },
        { "criterion": "Access to data sources", "description": "Sufficient data must be accessible" }
      ]
    },
    {
      "sectionName": "Data Collection Plan",
      "sources": [
        { "source": "Interviews", "type": "primary", "participants": "5-10", "duration": "45-60 min each" },
        { "source": "Documents", "type": "secondary", "description": "Policy documents, reports, records" },
        { "source": "Observations", "type": "primary", "sessions": "3-5" }
      ]
    },
    {
      "sectionName": "Triangulation Strategy",
      "description": "Use multiple data sources to validate findings",
      "methods": ["Data triangulation", "Investigator triangulation", "Method triangulation"]
    }
  ]
}

Include: case selection criteria (4-5), data collection plan (3-5 sources), triangulation strategy, validity/reliability measures, timeline.
Return ONLY valid JSON.`;
    const result = await model.generateContent(prompt);
    return extractJSON(result.response.text());
  } catch (error) { console.error('Error generating case study protocol:', error); return null; }
};
