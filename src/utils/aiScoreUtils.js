import { calculateBurstiness, scanBannedPhrases, scanTransitions, calculatePerplexityEstimate, calculateRepetitionScore, analyzeSentenceOpenings, computeFormalityIndex } from '../services/gemini/antiDetection';
import { computeSentenceScores } from '../services/gemini/sentenceAnalysis';

export const computeAIScores = (text, sources = []) => {
  if (!text || text.trim().length < 50) return null;
  const burstiness = calculateBurstiness(text);
  const banned = scanBannedPhrases(text);
  const transitions = scanTransitions(text);
  const perplexity = calculatePerplexityEstimate(text);
  const repetition = calculateRepetitionScore(text);
  const openings = analyzeSentenceOpenings(text);
  const formality = computeFormalityIndex(text);
  const sentenceData = computeSentenceScores(text, sources);
  const formalityScore = Math.round((1 - formality.score) * 100);
  const stylometricScore = Math.round(Math.max(0, Math.min(100,
    (1 - Math.min(1, banned.length / Math.max(1, sentenceData.totalSentences || 1) * 5)) * 50 +
    (1 - Math.min(1, transitions.frequency / 10)) * 50
  )));
  const burstinessScore = Math.round(Math.min(100, Math.max(0, (burstiness.cv / 1.0) * 100)));
  const score = Math.round(
    perplexity.score * 0.25 +
    burstinessScore * 0.20 +
    stylometricScore * 0.20 +
    formalityScore * 0.20 +
    repetition.score * 0.15
  );
  return {
    score,
    burstiness: { cv: burstiness.cv, mean: burstiness.mean, stdDev: burstiness.stdDev, sentenceLengths: burstiness.sentenceLengths },
    banned: { count: banned.length, items: banned.slice(0, 10) },
    transitions: { frequency: transitions.frequency, count: transitions.found.length },
    perplexity: { score: perplexity.score, vocabScore: perplexity.vocabScore, wordLengthScore: perplexity.wordLengthScore },
    verdict: score >= 60 ? 'pass' : score >= 40 ? 'borderline' : 'fail',
    verdictLabel: score >= 60 ? '✅ Likely Human-Written' : score >= 40 ? '⚠️ Needs Improvement' : '🔴 Likely AI-Generated',
    confidence: sentenceData.documentLevel?.confidence || 0,
    breakdown: {
      perplexityScore: perplexity.score,
      burstinessScore,
      stylometricScore,
      formalityScore,
      repetitionScore: repetition.score,
      plagiarismScore: 0,
    },
    sentences: sentenceData.perSentence || [],
    flaggedSentenceCount: sentenceData.flaggedCount || 0,
    totalSentences: sentenceData.totalSentences || 0,
    topIssues: sentenceData.topIssues || [],
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
