import { BANNED_PHRASES, splitSentences, calculateBurstiness, scanBannedPhrases, scanTransitions, calculatePerplexityEstimate, calculateRepetitionScore, analyzeSentenceOpenings, computeFormalityIndex } from './antiDetection';

const OPENING_TRIGGERS = {
  TRANSITION: ['however', 'therefore', 'thus', 'hence', 'nevertheless', 'nonetheless', 'meanwhile', 'subsequently', 'accordingly', 'conversely', 'specifically', 'notably', 'importantly', 'significantly'],
  CONTRAST: ['but', 'yet', 'although', 'though', 'while', 'whereas', 'despite'],
  CONCLUSION: ['thus', 'hence', 'consequently', 'therefore', 'accordingly'],
  NUMERIC: ['first', 'second', 'third', 'finally', 'next', 'lastly'],
  REFERENCE: ['this', 'these', 'that', 'the'],
};

const getOpeningCategory = (sentence) => {
  const words = sentence.toLowerCase().split(/\s+/).filter(Boolean);
  const firstWord = words[0] || '';
  const firstTwo = words.slice(0, 2).join(' ');
  for (const [type, triggers] of Object.entries(OPENING_TRIGGERS)) {
    if (triggers.includes(firstWord) || triggers.includes(firstTwo)) return type;
  }
  return 'OTHER';
};

const getSentenceBannedPhrases = (sentence) => {
  const lower = sentence.toLowerCase();
  const found = [];
  for (const phrase of BANNED_PHRASES) {
    if (lower.includes(phrase)) found.push(phrase);
  }
  return found;
};

const getSentenceFlags = (aiProb, sentence, bannedPhrases, openingCat, perplexity, avgLength, repWithNeighbours) => {
  const flags = [];
  const suggestions = [];
  if (bannedPhrases.length > 0) {
    flags.push('banned_phrase');
    suggestions.push(`Replace "${bannedPhrases[0]}" with natural language`);
  }
  if (perplexity < 15) {
    flags.push('low_perplexity');
    suggestions.push('Make sentence less predictable');
  }
  if (openingCat === 'REFERENCE' || openingCat === 'TRANSITION') {
    flags.push('formal_opening');
    suggestions.push('Vary sentence opening');
  }
  if (repWithNeighbours > 0.3) {
    flags.push('repetitive_structure');
    suggestions.push('Change structure to avoid repetition');
  }
  return { flags, suggestions };
};

export const computeSentenceScores = (text, sources = []) => {
  if (!text || text.trim().length < 50) {
    return { perSentence: [], documentLevel: {}, topIssues: [], flaggedCount: 0, totalSentences: 0 };
  }
  const sentences = splitSentences(text);
  if (sentences.length < 3) {
    return { perSentence: [], documentLevel: {}, topIssues: [], flaggedCount: 0, totalSentences: 0 };
  }
  const totalWords = text.split(/\s+/).filter(Boolean).length;
  const avgSentenceLength = totalWords / sentences.length;
  const perplexityOverall = calculatePerplexityEstimate(text);
  const burstinessOverall = calculateBurstiness(text);
  const bannedOverall = scanBannedPhrases(text);
  const transitionsOverall = scanTransitions(text);
  const repetitionOverall = calculateRepetitionScore(text);
  const openingsOverall = analyzeSentenceOpenings(text);
  const formalityOverall = computeFormalityIndex(text);
  const perSentence = sentences.map((sentence, idx) => {
    const words = sentence.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const sentencePerplexity = calculatePerplexityEstimate(sentence);
    const perplexityVal = sentencePerplexity.score;
    const bannedPhrases = getSentenceBannedPhrases(sentence);
    const openingCat = getOpeningCategory(sentence);
    let repWithNeighbours = 0;
    if (idx > 0) {
      const prevWords = sentences[idx - 1].toLowerCase().split(/\s+/).filter(Boolean);
      const currWords = sentence.toLowerCase().split(/\s+/).filter(Boolean);
      const prevBigrams = new Set();
      for (let i = 0; i < prevWords.length - 1; i++) {
        prevBigrams.add(prevWords[i] + ' ' + prevWords[i + 1]);
      }
      let shared = 0;
      for (let i = 0; i < currWords.length - 1; i++) {
        if (prevBigrams.has(currWords[i] + ' ' + currWords[i + 1])) shared++;
      }
      repWithNeighbours = currWords.length > 1 ? shared / (currWords.length - 1) : 0;
    }
    const perplexityFactor = Math.max(0, Math.min(1, (30 - perplexityVal) / 30));
    const bannedFactor = bannedPhrases.length > 0 ? 0.3 : 0;
    const openingFactor = (openingCat === 'REFERENCE' || openingCat === 'TRANSITION') ? 0.15 : 0;
    const repetitionFactor = repWithNeighbours * 0.2;
    const lengthDevFactor = Math.min(0.2, Math.abs(wordCount - avgSentenceLength) / avgSentenceLength * 0.2);
    let aiProbability = Math.min(1, Math.max(0,
      perplexityFactor * 0.4 + bannedFactor + openingFactor + repetitionFactor + (1 - lengthDevFactor) * 0.15
    ));
    if (perplexityVal < 10 && bannedPhrases.length > 0) {
      aiProbability = Math.min(1, aiProbability + 0.15);
    }
    const { flags, suggestions } = getSentenceFlags(
      aiProbability, sentence, bannedPhrases, openingCat,
      perplexityVal, avgSentenceLength, repWithNeighbours
    );
    return {
      text: sentence,
      words: wordCount,
      aiProbability: Math.round(aiProbability * 100) / 100,
      flags,
      suggestions,
      bannedPhrases,
      perplexity: perplexityVal,
      openingCategory: openingCat
    };
  });
  const flaggedSentences = perSentence.filter(s => s.aiProbability > 0.5);
  const flagCounts = {};
  for (const s of flaggedSentences) {
    for (const flag of s.flags) {
      flagCounts[flag] = (flagCounts[flag] || 0) + 1;
    }
  }
  const topIssues = [];
  if (flagCounts.low_perplexity) topIssues.push(`${flagCounts.low_perplexity} sentences with low perplexity`);
  if (flagCounts.formal_opening) topIssues.push(`${flagCounts.formal_opening} sentences with formal openings`);
  if (flagCounts.banned_phrase) topIssues.push(`${flagCounts.banned_phrase} sentences with banned phrases`);
  if (flagCounts.repetitive_structure) topIssues.push(`${flagCounts.repetitive_structure} sentences with repetitive structure`);
  const formalityScore = Math.round((1 - formalityOverall.score) * 100);
  const stylometricScore = Math.round(Math.max(0, Math.min(100,
    (1 - Math.min(1, bannedOverall.length / Math.max(1, sentences.length) * 5)) * 50 +
    (1 - Math.min(1, transitionsOverall.frequency / 10)) * 50
  )));
  return {
    perSentence,
    flaggedCount: flaggedSentences.length,
    totalSentences: sentences.length,
    topIssues,
    documentLevel: {
      perplexityScore: perplexityOverall.score,
      burstinessScore: Math.round(Math.min(100, Math.max(0, (burstinessOverall.cv / 1.0) * 100))),
      stylometricScore,
      formalityScore,
      repetitionScore: repetitionOverall.score,
      confidence: Math.round(
        (perplexityOverall.score + stylometricScore + formalityScore + repetitionOverall.score +
          Math.round(Math.min(100, Math.max(0, (burstinessOverall.cv / 1.0) * 100)))) / 5
      )
    }
  };
};
