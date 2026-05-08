import { extractCitations, formatGroundedReference, formatSimpleReference } from '../writeHelpers.jsx';

export const mergeReferences = async (selectedChapters, generatedSubsections, style, projectId) => {
  const allEntries = [];
  const seen = new Set();

  for (const chapter of selectedChapters) {
    const chapterContent = generatedSubsections[chapter.id] || {};
    const chapterCitations = [];

    Object.entries(chapterContent).forEach(([title, content]) => {
      if (title === 'references' || title === 'References' || title === 'complete' || title === 'fullChapter') return;
      if (!content || typeof content !== 'string') return;
      const citations = extractCitations(content);
      chapterCitations.push(...citations);
    });

    const uniqueChapterCitations = [...new Set(chapterCitations)];
    if (uniqueChapterCitations.length === 0) continue;

    const storedSources = (() => {
      try {
        return JSON.parse(localStorage.getItem(`groundingSources_${chapter.id}`) || '[]');
      } catch { return []; }
    })();

    for (const citation of uniqueChapterCitations) {
      const dedupKey = citation.replace(/\s+/g, ' ').toLowerCase().trim();
      if (seen.has(dedupKey)) continue;
      seen.add(dedupKey);

      const parts = citation.split(/[, ]+/);
      const author = parts[0]?.toLowerCase();
      const year = parts[1]?.replace(/[a-z]?\)$/, '');

      let matchedSource = null;
      for (const source of storedSources) {
        const formatted = formatGroundedReference(source, style);
        if (author && year && formatted?.toLowerCase().includes(author) && formatted.includes(year)) {
          matchedSource = source;
          break;
        }
      }

      if (matchedSource) {
        allEntries.push({
          citation,
          formatted: formatGroundedReference(matchedSource, style),
          source: 'grounded',
          orderKey: citation.toLowerCase()
        });
      } else {
        allEntries.push({
          citation,
          formatted: null,
          source: 'unmatched',
          orderKey: citation.toLowerCase()
        });
      }
    }
  }

  const unmatchedCitations = allEntries.filter(e => e.source === 'unmatched').map(e => e.citation);
  if (unmatchedCitations.length > 0) {
    try {
      const { generateReferences } = await import('../../services/geminiService');
      const aiRefs = await generateReferences(unmatchedCitations, style);
      if (aiRefs) {
        const refLines = aiRefs.split('\n').filter(l => l.trim());
        refLines.forEach(line => {
          const match = allEntries.find(e => e.source === 'unmatched' && e.formatted === null);
          if (match) {
            match.formatted = line.trim();
            match.source = 'ai-generated';
          }
        });
      }
    } catch {}
  }

  allEntries.forEach(e => {
    if (!e.formatted) {
      const parts = e.citation.split(/[, ]+/);
      const author = parts[0] || 'Unknown Author';
      const year = parts[1]?.replace(/[a-z]?\)$/, '') || 'n.d.';
      e.formatted = formatSimpleReference(author, year);
    }
  });

  allEntries.sort((a, b) => a.orderKey.localeCompare(b.orderKey));

  return {
    entries: allEntries.map(e => e.formatted),
    totalCount: allEntries.length,
    matchedCount: allEntries.filter(e => e.source === 'grounded').length,
    aiGeneratedCount: allEntries.filter(e => e.source === 'ai-generated').length
  };
};

export default mergeReferences;