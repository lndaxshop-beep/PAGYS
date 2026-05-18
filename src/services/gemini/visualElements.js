import { genAI, MODEL } from './config';
import { extractJSON } from './utils';
import { TABLE_RULES } from './writingRules';

export const generateConceptualFramework = async (projectData) => {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL });
    const prompt = `Generate a conceptual framework description for a thesis.\n\nTopic: ${projectData?.topic || projectData?.title}\nField: ${projectData?.field}\nMethodology: ${projectData?.methodology}\n\nReturn a structured framework description in this exact format:\n\nIndependent: variable1, variable2, variable3\nDependent: outcome variable\nMediating: mediating variable (if any)\nModerating: moderating variable (if any)\nH1: IndependentVariable → DependentVariable\nH2: IndependentVariable → MediatingVariable → DependentVariable\n\nList ALL variables with their full academic names. Use only the format above, no JSON.`;
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    return text || null;
  } catch (error) { console.error('Error:', error); return null; }
};

export const generateTheoreticalFramework = async (projectData) => {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL });
    const prompt = `Generate a theoretical framework description for a thesis.\n\nTopic: ${projectData?.topic || projectData?.title}\nField: ${projectData?.field}\n\nReturn a structured description:\n\nTheory 1: name and key concepts\nTheory 2: name and key concepts\nRelationship: how they connect\nApplication: how they apply to this study`;
    const result = await model.generateContent(prompt);
    return result.response.text().trim() || null;
  } catch (error) { console.error('Error:', error); return null; }
};

export const generateResearchDesignFlowchart = async (projectData) => {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL });
    const prompt = `Generate a research design description for a thesis.\n\nTopic: ${projectData?.topic || projectData?.title}\nMethodology: ${projectData?.methodology || 'mixed methods'}\n\nReturn a structured description:\n\nStep 1: ...\nStep 2: ...\nStep 3: ...\nStep 4: ...\nStep 5: ...\n\nList the key methodological steps in order. Use plain text, no diagrams.`;
    const result = await model.generateContent(prompt);
    return result.response.text().trim() || null;
  } catch (error) { console.error('Error:', error); return null; }
};

export const generateDataTable = async (subsectionTitle, projectData, findings) => {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL });
    const findingsContext = findings ? `\n\nREAL RESEARCH FINDINGS:\n${JSON.stringify(findings).substring(0, 20000)}` : '';
    const prompt = `Generate realistic data for a results table.\n\nTopic: ${projectData?.topic || projectData?.title}\nSubsection: ${subsectionTitle}\nMethodology: ${projectData?.methodology || 'quantitative'}${findingsContext}\n\n${TABLE_RULES}\n\nReturn a markdown table with 4-6 rows of realistic data based on the research findings provided. Use proper column headers and realistic values.`;
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) { console.error('Error:', error); return null; }
};

export const generateChartData = async (chartType, subsectionTitle, projectData, findings) => {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL });
    const findingsContext = findings ? `\n\nREAL RESEARCH FINDINGS:\n${JSON.stringify(findings).substring(0, 20000)}` : '';
    const prompt = `Generate data for a ${chartType} chart.\n\nTopic: ${projectData?.topic || projectData?.title}\nSubsection: ${subsectionTitle}${findingsContext}\n\nReturn in this exact format:\n[CHART: ${chartType} | Chart Title | Label1: value, Label2: value, Label3: value, ...]\n\nUse REAL data values from the research findings. For pie charts, values should sum to 100.`;
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) { console.error('Error:', error); return null; }
};
