const FILLER_PHRASES = [
  'in this contemporary world', "in today's rapidly evolving society",
  "in today's modern world", "in today's rapidly evolving world",
  "in today's digital age", 'in the current digital era',
  'in the modern era', 'in this day and age',
  'it is important to note that', 'it is worth noting that',
  'it should be noted that', 'this study aims to',
  'this research aims to', 'the aim of this research',
  'the purpose of this study', 'there has been a growing interest in',
  'this highlights the significance of', 'the realm of',
  'a myriad of', 'a plethora of', 'delves into',
  'navigates the complexities of', 'paves the way for',
  'sets the stage for', 'a large body of research',
  'a growing body of evidence', 'a growing body of literature',
  'it is widely accepted that', 'it is generally agreed that',
];

export const cleanOutput = (text) => {
  if (!text) return '';
  let cleaned = text;
  cleaned = cleaned.replace(/^#{1,6}\s+/gm, '');
  cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, '$1');
  cleaned = cleaned.replace(/\*(.*?)\*/g, '$1');
  cleaned = cleaned.replace(/<center>/gi, '');
  cleaned = cleaned.replace(/<\/center>/gi, '');
  cleaned = cleaned.replace(/<br\s*\/?>/gi, '');
  cleaned = cleaned.replace(/<div[^>]*>/gi, '');
  cleaned = cleaned.replace(/<\/div>/gi, '');
  cleaned = cleaned.replace(/\(Word Count:?\s*\d+\s*words?\)/gi, '');
  cleaned = cleaned.replace(/\n*Word Count:?\s*\d+\s*words?\n*/gi, '');
  cleaned = cleaned.replace(/^.*Syntax error in text.*$/gm, '');
  for (const phrase of FILLER_PHRASES) {
    const regex = new RegExp(`\\s*${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*,?\\s*`, 'gi');
    if (regex.test(cleaned)) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[cleanOutput] Stripped filler phrase: "${phrase}"`);
      }
      cleaned = cleaned.replace(regex, ' ');
    }
  }
  cleaned = cleaned.replace(/\s*—\s*/g, ', ');
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  cleaned = stripCodeFenceArt(cleaned);
  cleaned = stripAsciiArt(cleaned);
  cleaned = cleaned.trim();
  return cleaned;
};

const stripCodeFenceArt = (text) => {
  return text.replace(/```(mermaid|chart|table|diagram|graph)\s*[\s\S]*?```\s*/gi, '');
};

const ASCII_ART_CHARS = new Set(['/', '\\', '|', '^', '_', '-', '=', '*']);
const DIAGRAM_LABEL_RE = /^[A-Z][a-zA-Z\s]{2,60}$/;

const stripAsciiArt = (text) => {
  const lines = text.split('\n');
  const result = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const nonSpace = line.replace(/\s/g, '');
    if (nonSpace.length > 0) {
      const diagramChars = [...nonSpace].filter(c => ASCII_ART_CHARS.has(c)).length;
      const ratio = diagramChars / nonSpace.length;
      if (ratio >= 0.25) {
        i++;
        while (i < lines.length) {
          const next = lines[i];
          const ns = next.replace(/\s/g, '');
          const dc = [...ns].filter(c => ASCII_ART_CHARS.has(c)).length;
          const r = ns.length > 0 ? dc / ns.length : 0;
          if (r < 0.25 && !DIAGRAM_LABEL_RE.test(next.trim())) break;
          i++;
        }
        continue;
      }
    }
    result.push(line);
    i++;
  }
  return result.join('\n');
};

export const extractJSON = (response) => {
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (jsonMatch) { try { return JSON.parse(jsonMatch[0]); } catch (e) {} }
  return null;
};

export const extractJSONArray = (response) => {
  const jsonMatch = response.match(/\[[\s\S]*\]/);
  if (jsonMatch) { try { return JSON.parse(jsonMatch[0]); } catch (e) {} }
  return null;
};
