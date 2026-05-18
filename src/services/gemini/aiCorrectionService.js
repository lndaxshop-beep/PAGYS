import { genAI, MODEL } from './config';

const cleanJson = (text) => {
  const json = text.replace(/```json\s*/gi, '').replace(/```\s*$/g, '').trim();
  const start = json.indexOf('{');
  const end = json.lastIndexOf('}');
  if (start !== -1 && end !== -1) return json.slice(start, end + 1);
  return json;
};

const callModel = async (prompt) => {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL });
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    console.error('[aiCorrectionService] Model call failed:', err);
    return null;
  }
};

const safeParse = (raw) => {
  if (!raw) return null;
  try { return JSON.parse(cleanJson(raw)); }
  catch { console.warn('[aiCorrectionService] Failed to parse AI response'); return null; }
};

export const fixBannedPhrase = async (content, phrase, contextSentence) => {
  const prompt = `You are an academic writing assistant. Your task is to replace a specific banned AI phrase in the given text with a more natural, human-sounding alternative.

BANNED PHRASE: "${phrase}"
CONTEXT (the sentence/paragraph containing it): "${contextSentence}"

Rules:
1. Replace ONLY the banned phrase "${phrase}" with a natural alternative that fits the context.
2. Do NOT change any other words or sentences.
3. The replacement must sound like a human academic writer, not AI-generated.
4. Return ONLY a JSON object: { "replacement": "the natural alternative text" }

Example:
Banned phrase: "it is important to note that"
Input context: "It is important to note that the results indicate a significant trend."
Output: { "replacement": "The results indicate a significant trend." }

Now process the above banned phrase and context.`;

  const raw = await callModel(prompt);
  const parsed = safeParse(raw);
  const replacement = parsed?.replacement || '';
  if (!replacement) return { correctedContent: content, changedText: '' };
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(escaped, 'gi');
      const escapedReplacement = replacement.replace(/\$/g, '$$$$');
      const replacedContent = content.replace(regex, escapedReplacement);
  return { correctedContent: replacedContent, changedText: replacement };
};

export const fixBurstiness = async (content) => {
  const prompt = `You are an academic writing assistant. Improve the following text by varying sentence lengths to make it more natural and human-like. The text currently has low burstiness (sentences are too uniform in length).

Rules:
1. Keep ALL the same information, facts, and meaning.
2. Vary sentence lengths by combining some short sentences and breaking up some long ones.
3. Use a mix of simple, compound, and complex sentences.
4. Do NOT add banned AI phrases like "it is important to note", "in today's world", etc.
5. Return ONLY a JSON object: { "correctedText": "the full corrected text" }

TEXT TO IMPROVE:
${content}`;

  const raw = await callModel(prompt);
  const parsed = safeParse(raw);
  return { correctedContent: parsed?.correctedText || content, changedText: '' };
};

export const fixTransitionOveruse = async (content) => {
  const prompt = `You are an academic writing assistant. Reduce the frequency of transition words (such as "furthermore", "moreover", "additionally", "consequently", "however", "thus", "therefore", "nevertheless", "in addition", "on the other hand", "as a result") in the following text. Keep the meaning and information intact.

Rules:
1. Remove or replace SOME transition words where they are not essential.
2. Keep the text flowing naturally without them where possible.
3. Do NOT add banned AI phrases.
4. Return ONLY a JSON object: { "correctedText": "the full corrected text" }

TEXT TO IMPROVE:
${content}`;

  const raw = await callModel(prompt);
  const parsed = safeParse(raw);
  return { correctedContent: parsed?.correctedText || content, changedText: '' };
};

export const humaniseContent = async (content) => {
  const prompt = `You are an academic writing assistant. Rewrite the following text to make it sound more natural and human-written, while keeping all academic facts, data, and citations intact.

Rules:
1. Keep ALL facts, data, citations, figures, and academic content.
2. Make the language flow more naturally like a human academic writer.
3. Vary sentence structure and length.
4. Avoid common AI-sounding phrases.
5. Return ONLY a JSON object: { "correctedText": "the full corrected text" }

TEXT TO IMPROVE:
${content}`;

  const raw = await callModel(prompt);
  const parsed = safeParse(raw);
  return { correctedContent: parsed?.correctedText || content, changedText: '' };
};
