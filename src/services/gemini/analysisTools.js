import { genAI, MODEL } from './config';
import { extractJSONArray } from './utils';

export const generateDefenceQuestions = async (projectData) => {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL });
    const chapters = projectData.chapters || {};
    const chapterEntries = Object.entries(chapters);
    if (chapterEntries.length === 0) return null;

    const chapterBlocks = chapterEntries.map(([id, ch]) => {
      const title = ch.title || id;
      const content = ch.content || '';
      return `--- ${title} ---\n${content || 'No content available.'}`;
    }).join('\n\n');

    const prompt = `You are a thesis defence expert preparing a student for their viva voce.

THESIS: "${projectData.title || ''}"
FIELD: ${projectData.field || ''}
LEVEL: ${projectData.level || ''}

The student has written the following chapters. Below is the actual content of each completed chapter.

${chapterBlocks}

Based on this content, think of every possible question a panel member could ask about this specific thesis. Cover all areas: rationale, methodology, findings, limitations, theoretical choices, literature gaps, and implications.

For each question, provide ONE clear answer. Write the answer in plain, basic English — as if you are explaining to someone who is new to academic work. Use simple words and short sentences. Do not use jargon unless absolutely necessary, and explain it if you do. The answer should be a moderate length — a few sentences that give the most correct and helpful explanation without being too short or too long.

Return ONLY valid JSON with chapter IDs as keys and arrays of {question, answer} objects. Example:
{"proposal":[{"question":"...","answer":"..."}],"chapter1":[{"question":"...","answer":"..."}]}`;

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
