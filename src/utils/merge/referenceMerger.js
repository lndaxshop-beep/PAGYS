import { extractCitations } from '../writeHelpers.jsx';

const parseRefEntries = (refString) => {
  const lines = refString.split('\n').map(l => l.trim()).filter(Boolean);
  const entries = [];
  let started = false;
  for (const line of lines) {
    if (line.toLowerCase().startsWith('references')) { started = true; continue; }
    if (!started) continue;
    if (line) entries.push(line);
  }
  const merged = [];
  for (const entry of entries) {
    const looksLikeNewEntry = /^[A-Z][a-z]/.test(entry) && !entry.startsWith('(') && !entry.startsWith('[');
    if (looksLikeNewEntry || merged.length === 0) {
      merged.push(entry);
    } else {
      merged[merged.length - 1] += ' ' + entry;
    }
  }
  return merged;
};

const getDedupKey = (entry) => {
  const authorMatch = entry.match(/^([A-Za-z-]+)/);
  const yearMatch = entry.match(/\((\d{4})\)/);
  return `${authorMatch?.[1]?.toLowerCase() || ''}|${yearMatch?.[1] || ''}`;
};

const loadUserSources = (projectId) => {
  try {
    return JSON.parse(localStorage.getItem(`userSources_${projectId}`) || '[]');
  } catch { return []; }
};

export const mergeReferences = async (selectedChapters, generatedSubsections, style, projectId) => {
  const allEntries = [];
  const seen = new Set();

  const allCitations = [];
  const chaptersNeedingGeneration = [];

  for (const chapter of selectedChapters) {
    const chapterContent = generatedSubsections[chapter.id] || {};
    const existingRefs = chapterContent.references || chapterContent.References || '';

    if (existingRefs && existingRefs.length > 10) {
      const parsed = parseRefEntries(existingRefs);
      for (const entry of parsed) {
        const key = getDedupKey(entry);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        allEntries.push({ formatted: entry, orderKey: entry.toLowerCase() });
      }
    } else {
      const chapterCitations = [];
      Object.entries(chapterContent).forEach(([title, content]) => {
        if (title === 'references' || title === 'References' || title === 'complete' || title === 'fullChapter') return;
        if (!content || typeof content !== 'string') return;
        chapterCitations.push(...extractCitations(content));
      });
      const uniqueCitations = [...new Set(chapterCitations)];
      if (uniqueCitations.length > 0) {
        allCitations.push(...uniqueCitations);
      }
      chaptersNeedingGeneration.push(chapter);
    }
  }

  if (chaptersNeedingGeneration.length > 0 && allCitations.length > 0) {
    const uniqueAllCitations = [...new Set(allCitations)];
    const userSources = loadUserSources(projectId);
    let generated = false;

    try {
      const { generateReferences } = await import('../../services/geminiService');
      const aiResult = await generateReferences(uniqueAllCitations, style, userSources, 'combine');
      if (aiResult) {
        const lines = aiResult.split('\n').filter(l => l.trim());
        for (const line of lines) {
          const key = getDedupKey(line);
          if (!key || seen.has(key)) continue;
          seen.add(key);
          allEntries.push({ formatted: line.trim(), orderKey: line.toLowerCase() });
        }
        generated = true;
      }
    } catch (err) {
      console.error('[referenceMerger] AI generation failed:', err.message);
    }

    if (!generated) {
      const chapterTitles = chaptersNeedingGeneration.map(c => c.customTitle || c.title || `Chapter ${c.id}`).join(', ');
      throw new Error(
        `References for ${chapterTitles} could not be generated. Please open these chapters and click "Generate References" first, then try merging again.`
      );
    }
  }

  allEntries.sort((a, b) => a.orderKey.localeCompare(b.orderKey));

  return {
    entries: allEntries.map(e => e.formatted),
    totalCount: allEntries.length,
    matchedCount: allEntries.length,
    aiGeneratedCount: 0
  };
};

export default mergeReferences;
