import { calculateBurstiness, scanBannedPhrases, scanTransitions, calculatePerplexityEstimate } from '../services/gemini/antiDetection';

export const computeAIScores = (text) => {
  if (!text || text.trim().length < 50) return null;
  const burstiness = calculateBurstiness(text);
  const banned = scanBannedPhrases(text);
  const transitions = scanTransitions(text);
  const perplexity = calculatePerplexityEstimate(text);
  const score = perplexity.score;
  return {
    score,
    burstiness: { cv: burstiness.cv, mean: burstiness.mean, stdDev: burstiness.stdDev, sentenceLengths: burstiness.sentenceLengths },
    banned: { count: banned.length, items: banned.slice(0, 10) },
    transitions: { frequency: transitions.frequency, count: transitions.found.length },
    perplexity: { score: perplexity.score, vocabScore: perplexity.vocabScore, wordLengthScore: perplexity.wordLengthScore },
    verdict: score >= 60 ? 'pass' : score >= 40 ? 'borderline' : 'fail',
    verdictLabel: score >= 60 ? '✅ Likely Human-Written' : score >= 40 ? '⚠️ Needs Improvement' : '🔴 Likely AI-Generated',
  };
};

export const computeThesisScores = (generatedSubsections) => {
  if (!generatedSubsections || Object.keys(generatedSubsections).length === 0) return null;

  const chapters = {};

  for (const [chId, subsections] of Object.entries(generatedSubsections)) {
    if (!subsections || typeof subsections !== 'object') continue;
    let text = '';
    let wordCount = 0;
    for (const [, content] of Object.entries(subsections)) {
      if (typeof content === 'string') {
        text += content + '\n';
        wordCount += content.split(/\s+/).filter(Boolean).length;
      }
    }
    if (text.trim().length >= 50) {
      const scores = computeAIScores(text);
      if (scores) {
        chapters[chId] = { scores, wordCount };
      }
    }
  }

  const allText = Object.values(generatedSubsections)
    .flatMap(ch => Object.entries(ch || {}))
    .filter(([, v]) => typeof v === 'string')
    .map(([, v]) => v)
    .join('\n');

  if (!allText.trim()) return null;

  const overall = computeAIScores(allText);
  if (!overall) return null;

  return { overall, chapters, totalWords: allText.split(/\s+/).filter(Boolean).length };
};
