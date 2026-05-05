import { genAI, MODEL } from './config';
import { extractJSONArray } from './utils';

export const generateDefenceQuestions = async (projectData) => {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL });
    const completedChapters = Object.keys(projectData.completedChapters || {});
    const chapterSummary = completedChapters.map(ch => `- ${ch}: Completed`).join('\n');
    const prompt = `You are a thesis defence expert. Generate likely defence questions and simple answers.\n\nTHESIS: "${projectData.title}"\nFIELD: ${projectData.field}\nLEVEL: ${projectData.level}\nCOMPLETED: ${chapterSummary || 'None'}\n\nFor each completed chapter, provide 2-3 Q&A. For final defence, provide 3-4 Q&A. Return JSON: {"proposal":[{"question":"...","answer":"..."}],"chapter1":[...],"final":[...]}`;
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) { try { return JSON.parse(jsonMatch[0]); } catch (e) {} }
    return null;
  } catch (error) { console.error('Error generating defence questions:', error); return null; }
};

export const formatReferences = (citations, referenceStyle) => {
  if (!citations || citations.length === 0) return '';
  const uniqueCitations = [...new Set(citations)].sort();
  return uniqueCitations.map((citation) => {
    const parts = citation.split(/[, ]+/);
    const author = parts[0] || 'Author';
    const year = parts[1] || 'n.d.';
    switch (referenceStyle) {
      case 'apa': return `${author}. (${year}). Title of the work. Publisher.`;
      case 'mla': return `${author}. Title of the Work. Publisher, ${year}.`;
      case 'chicago': return `${author}. ${year}. Title of the Work. Publisher.`;
      case 'harvard': return `${author} (${year}). Title of the work. Publisher.`;
      default: return `${author} (${year})`;
    }
  }).join('\n');
};

export const extractAbbreviations = async (content, projectTitle) => {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL });
    const truncated = content.substring(0, 15000);
    const prompt = `Extract all important abbreviations from this thesis content.\n\nPROJECT: "${projectTitle}"\n\nCONTENT:\n${truncated}\n\nReturn JSON array: [{"abbr":"AI","meaning":"Artificial Intelligence"}]. Only meaningful abbreviations. Skip e.g., i.e., etc. Return [] if none found.`;
    const result = await model.generateContent(prompt);
    return extractJSONArray(result.response.text()) || [];
  } catch (error) { console.error('Error extracting abbreviations:', error); return []; }
};
