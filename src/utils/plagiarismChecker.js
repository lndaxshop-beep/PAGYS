const NGRAM_SIZE = 5;

const getNGrams = (text, n) => {
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
  const ngrams = [];
  for (let i = 0; i <= words.length - n; i++) {
    ngrams.push(words.slice(i, i + n).join(' '));
  }
  return ngrams;
};

const splitParagraphs = (text) => {
  if (!text) return [];
  return text.split(/\n\n+/).filter(p => p.trim().split(/\s+/).filter(Boolean).length >= 10);
};

export const checkPlagiarism = (content, sources) => {
  if (!content || !sources || sources.length === 0) {
    return { score: 0, matches: [], totalParagraphs: 0 };
  }

  const paragraphs = splitParagraphs(content);
  const sourceTexts = sources
    .filter(s => s.keyFindings && s.keyFindings.length > 0)
    .map(s => ({ title: s.title, text: s.keyFindings.join(' ') }));

  if (sourceTexts.length === 0) return { score: 0, matches: [], totalParagraphs: paragraphs.length };

  const allSourceNGrams = new Map();
  for (const src of sourceTexts) {
    const ngrams = getNGrams(src.text, NGRAM_SIZE);
    for (const ng of ngrams) {
      if (!allSourceNGrams.has(ng)) allSourceNGrams.set(ng, []);
      allSourceNGrams.get(ng).push(src.title);
    }
  }

  const matches = [];
  let totalOverlap = 0;
  let totalWords = 0;

  for (const para of paragraphs) {
    const paraWords = para.split(/\s+/).filter(Boolean).length;
    totalWords += paraWords;
    const paraNGrams = getNGrams(para, NGRAM_SIZE);
    if (paraNGrams.length === 0) continue;

    let matchCount = 0;
    const sourceMap = {};
    for (const ng of paraNGrams) {
      const sources = allSourceNGrams.get(ng);
      if (sources) {
        matchCount++;
        for (const src of sources) {
          sourceMap[src] = (sourceMap[src] || 0) + 1;
        }
      }
    }

    const similarity = Math.round((matchCount / paraNGrams.length) * 100);
    if (similarity >= 15) {
      const topSource = Object.entries(sourceMap).sort((a, b) => b[1] - a[1])[0];
      matches.push({
        paragraph: para.substring(0, 150) + (para.length > 150 ? '...' : ''),
        source: topSource ? topSource[0] : 'Unknown',
        similarity,
        wordCount: paraWords,
      });
      totalOverlap += matchCount;
    }
  }

  const score = totalWords > 0 ? Math.round((totalOverlap / Math.max(1, totalWords / NGRAM_SIZE)) * 100) : 0;

  return { score: Math.min(score, 100), matches: matches.sort((a, b) => b.similarity - a.similarity).slice(0, 10), totalParagraphs: paragraphs.length };
};
