export const BANNED_PHRASES = [
  'in this contemporary world',
  "in today's rapidly evolving society",
  "in today's modern world",
  "in today's rapidly evolving world",
  "in today's digital age",
  'in the current digital era',
  'in the modern era',
  'in this day and age',
  'it is important to note that',
  'it is worth noting that',
  'it should be noted that',
  'this study aims to',
  'this research aims to',
  'the aim of this research',
  'the purpose of this study',
  'furthermore',
  'moreover',
  'additionally',
  'in addition',
  'consequently',
  'in conclusion',
  'this highlights the significance of',
  'this highlights',
  'this underscores',
  'this emphasizes',
  'the realm of',
  'a myriad of',
  'a plethora of',
  'delves into',
  'navigates the complexities of',
  'paves the way for',
  'sets the stage for',
  'over the years',
  'in recent years',
  'there has been a growing interest in',
  'plays a crucial role in',
  'plays a significant role in',
  'plays a vital role in',
  'has become increasingly important',
  'is becoming increasingly',
  'has gained significant attention',
  'has attracted considerable attention',
  'a wide range of',
  'a large body of research',
  'a growing body of evidence',
  'a growing body of literature',
  'there is a need for',
  'it is widely accepted that',
  'it is generally agreed that',
  'the following section',
  'as mentioned earlier',
  'as previously discussed',
  'as can be seen from',
  'as shown in',
  'in other words',
  'in terms of',
  'with respect to',
  'with regard to',
  'in this context',
  'in this regard',
  'in this sense',
  'in addition',
  'in contrast',
  'as a result',
];

export const TRANSITION_WORDS = [
  'furthermore', 'moreover', 'additionally', 'consequently',
  'thus', 'hence', 'in conclusion', 'therefore',
  'nevertheless', 'nonetheless', 'however', 'meanwhile',
  'subsequently', 'accordingly', 'specifically', 'conversely',
  'in addition', 'on the other hand', 'in contrast', 'as a result',
  'in particular', 'notably', 'importantly', 'significantly',
];

const splitSentences = (text) => {
  if (!text) return [];
  const abbreviations = /\b(Dr|Mr|Mrs|Ms|Prof|Sr|Jr|St|vs|etc|e\.g|i\.e|al|Dept|Univ|Fig|Eq|Vol|No|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.$/i;
  const result = [];
  const parts = text.split(/(?<=[.!?])\s+/);
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    if (result.length > 0 && abbreviations.test(result[result.length - 1])) {
      result[result.length - 1] += ' ' + trimmed;
    } else {
      result.push(trimmed);
    }
  }
  return result;
};

export const calculateBurstiness = (text) => {
  if (!text || text.trim().length === 0) return { cv: 0, mean: 0, stdDev: 0, sentenceLengths: [] };
  const sentences = splitSentences(text);
  if (sentences.length < 3) return { cv: 0, mean: 0, stdDev: 0, sentenceLengths: [] };
  const lengths = sentences.map(s => s.split(/\s+/).length);
  const mean = lengths.reduce((sum, l) => sum + l, 0) / lengths.length;
  if (mean === 0) return { cv: 0, mean: 0, stdDev: 0, sentenceLengths: lengths };
  const variance = lengths.reduce((sum, l) => sum + (l - mean) ** 2, 0) / lengths.length;
  const stdDev = Math.sqrt(variance);
  const cv = stdDev / mean;
  return { cv, mean, stdDev, sentenceLengths: lengths };
};

export const scanBannedPhrases = (text) => {
  if (!text) return [];
  const lower = text.toLowerCase();
  const results = [];
  const sorted = [...BANNED_PHRASES].sort((a, b) => b.length - a.length);
  for (const phrase of sorted) {
    let idx = lower.indexOf(phrase);
    while (idx !== -1) {
      const lineStart = text.lastIndexOf('\n', idx) + 1;
      const lineEnd = text.indexOf('\n', idx);
      const line = text.slice(lineStart, lineEnd === -1 ? text.length : lineEnd).trim();
      results.push({ phrase, index: idx, line: line.slice(0, 120) });
      idx = lower.indexOf(phrase, idx + 1);
    }
  }
  return results;
};

export const scanTransitions = (text) => {
  if (!text) return { frequency: 0, found: [], totalWords: 0 };
  const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) return { frequency: 0, found: [], totalWords: 0 };
  const found = [];
  const textLower = text.toLowerCase();
  for (const transition of TRANSITION_WORDS) {
    const regex = new RegExp(`\\b${transition.replace(/ /g, '\\s+')}\\b`, 'gi');
    let match;
    while ((match = regex.exec(textLower)) !== null) {
      found.push({ transition: match[0], index: match.index });
    }
  }
  const rawFrequency = (found.length / words.length) * 100;
  const frequency = Math.round(rawFrequency * 100) / 100;
  return { frequency, found, totalWords: words.length };
};

export const calculatePerplexityEstimate = (text) => {
  if (!text || text.trim().length < 50) return { score: 50, burstinessScore: 0, vocabScore: 0, wordLengthScore: 0 };
  const sentences = splitSentences(text);
  const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  if (sentences.length < 3 || words.length < 10) return { score: 50, burstinessScore: 0, vocabScore: 0, wordLengthScore: 0 };
  const { cv } = calculateBurstiness(text);
  const burstinessScore = Math.min(40, Math.max(0, (cv - 0.2) / 0.8 * 40));
  const uniqueWords = new Set(words);
  const vocabDiversity = uniqueWords.size / words.length;
  const vocabScore = Math.min(30, Math.max(0, (vocabDiversity - 0.3) / 0.4 * 30));
  const wordLengths = words.map(w => w.length);
  const meanWordLen = wordLengths.reduce((s, l) => s + l, 0) / wordLengths.length;
  const wordLenVariance = wordLengths.reduce((s, l) => s + (l - meanWordLen) ** 2, 0) / wordLengths.length;
  const wordLenStdDev = Math.sqrt(wordLenVariance);
  const wordLengthScore = Math.min(30, Math.max(0, (wordLenStdDev - 0.5) / 1.5 * 30));
  const totalScore = Math.min(100, Math.round(burstinessScore + vocabScore + wordLengthScore));
  return { score: totalScore, burstinessScore: Math.round(burstinessScore), vocabScore: Math.round(vocabScore), wordLengthScore: Math.round(wordLengthScore) };
};
