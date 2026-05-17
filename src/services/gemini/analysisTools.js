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

THESIS TITLE: "${projectData.title || ''}"
${projectData.researchTopic ? `RESEARCH QUESTION: "${projectData.researchTopic}"` : ''}
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
    const prompt = `Extract field-specific abbreviations from this thesis content. Only include abbreviations that are specialized technical terms relevant to the thesis topic or academic field.

PROJECT: "${projectTitle}"

CONTENT:
${truncated}

Return JSON array: [{"abbr":"SEM","meaning":"Structural Equation Modelling"}].

RULES:
- Only include abbreviations that are directly related to the thesis topic or academic field
- EXCLUDE common everyday abbreviations: etc., e.g., i.e., vs., aka, approx, dept, min, max, avg, temp, info, etc.
- EXCLUDE currency codes: GHS, USD, EUR, GBP, etc.
- EXCLUDE standard units: kg, km, cm, mm, mg, ml, etc.
- EXCLUDE common English abbreviations: Mr., Mrs., Dr., St., Ave., etc.
- EXCLUDE very common non-technical terms: number, total, info, etc.
- Focus on abbreviations that a reader of this specific thesis would need defined (e.g., field-specific acronyms, statistical terms, methodology-specific abbreviations)
- Return [] if no abbreviations meeting these criteria are found
- Return ONLY the JSON array, no other text`;
    const result = await model.generateContent(prompt);
    return extractJSONArray(result.response.text()) || [];
  } catch (error) { console.error('Error extracting abbreviations:', error); return []; }
};

export const generateAbstract = async (project, generatedSubsections) => {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL });
    let allContent = '';
    Object.entries(generatedSubsections || {}).forEach(([chId, subsections]) => {
      if (!subsections || typeof subsections !== 'object') return;
      allContent += `\n--- ${chId} ---\n`;
      Object.values(subsections).forEach(v => {
        if (typeof v === 'string') allContent += v.substring(0, 3000) + '\n';
      });
    });
    const truncated = allContent.substring(0, 50000);

    const prompt = `You are writing the abstract for an academic thesis.

THESIS TITLE: "${project?.title || ''}"
${project?.topic ? `RESEARCH QUESTION: "${project.topic}"` : ''}
FIELD: ${project?.field || ''}
LEVEL: ${project?.level || ''}
METHODOLOGY: ${project?.methodology || ''}

Below is the content of the thesis chapters. Read it and write a professional abstract.

THESIS CONTENT:
${truncated}

Write a concise academic abstract (200-350 words) that covers:
- Background and rationale for the study
- Research objectives or questions
- Methodology used
- Key findings and results
- Conclusions and implications

Use formal academic language in a single cohesive paragraph. Do not include headings, labels, or bracketed instructions. Return ONLY the abstract text.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    return text || null;
  } catch (error) { console.error('Error generating abstract:', error); return null; }
};
