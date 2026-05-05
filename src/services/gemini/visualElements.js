import { genAI, MODEL } from './config';
import { extractMermaidCode, extractJSON, getDefaultConceptualFramework, getDefaultTheoreticalFramework, getDefaultResearchDesign, getDefaultTable, getDefaultChart } from './utils';
import { MERMAID_RULES, TABLE_RULES } from './writingRules';

export const generateConceptualFramework = async (projectData) => {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL });
    const prompt = `Generate a SIMPLE Mermaid.js flowchart for a conceptual framework.\n\nTopic: ${projectData?.topic || projectData?.title}\nField: ${projectData?.field}\nMethodology: ${projectData?.methodology}\n\n${MERMAID_RULES}\n\nShow independent, dependent, moderating, and mediating variables with their relationships. Keep it simple. Return ONLY the Mermaid code.`;
    const result = await model.generateContent(prompt);
    return extractMermaidCode(result.response.text()) || getDefaultConceptualFramework();
  } catch (error) { console.error('Error:', error); return getDefaultConceptualFramework(); }
};

export const generateTheoreticalFramework = async (projectData) => {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL });
    const prompt = `Generate a SIMPLE Mermaid.js diagram for a theoretical framework.\n\nTopic: ${projectData?.topic || projectData?.title}\nField: ${projectData?.field}\n\n${MERMAID_RULES}\n\nShow key theories and their relationships. Keep it simple. Return ONLY the Mermaid code.`;
    const result = await model.generateContent(prompt);
    return extractMermaidCode(result.response.text()) || getDefaultTheoreticalFramework();
  } catch (error) { console.error('Error:', error); return getDefaultTheoreticalFramework(); }
};

export const generateResearchDesignFlowchart = async (projectData) => {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL });
    const prompt = `Generate a SIMPLE Mermaid.js flowchart for a research design.\n\nTopic: ${projectData?.topic || projectData?.title}\nMethodology: ${projectData?.methodology || 'mixed methods'}\n\n${MERMAID_RULES}\n\nShow research approach, population/sampling, data collection, data analysis, and ethics. Keep it simple. Return ONLY the Mermaid code.`;
    const result = await model.generateContent(prompt);
    return extractMermaidCode(result.response.text()) || getDefaultResearchDesign();
  } catch (error) { console.error('Error:', error); return getDefaultResearchDesign(); }
};

export const generateDataTable = async (subsectionTitle, projectData) => {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL });
    const prompt = `Generate realistic data for a results table.\n\nTopic: ${projectData?.topic || projectData?.title}\nSubsection: ${subsectionTitle}\nMethodology: ${projectData?.methodology || 'quantitative'}\n\n${TABLE_RULES}\n\nReturn JSON: {"title":"Table title","headers":["Col1","Col2","Col3"],"rows":[["A","B","C"]],"caption":"Brief description"}. 4-6 rows of realistic data. Only JSON.`;
    const result = await model.generateContent(prompt);
    return extractJSON(result.response.text()) || getDefaultTable();
  } catch (error) { console.error('Error:', error); return getDefaultTable(); }
};

export const generateChartData = async (chartType, subsectionTitle, projectData) => {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL });
    const prompt = `Generate data for a ${chartType} chart.\n\nTopic: ${projectData?.topic || projectData?.title}\nSubsection: ${subsectionTitle}\n\nReturn JSON: {"title":"Chart title","type":"${chartType}","data":{"labels":["A","B","C"],"values":[45,30,25]},"caption":"Description"}. Realistic values. For pie charts, values must sum to approximately 100. Only JSON.`;
    const result = await model.generateContent(prompt);
    return extractJSON(result.response.text()) || getDefaultChart(chartType);
  } catch (error) { console.error('Error:', error); return getDefaultChart(chartType); }
};
