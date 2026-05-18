export const orderContentBySubsections = (content, subsections) => {
  if (!content || typeof content !== 'object') return [];
  if (!subsections || !Array.isArray(subsections)) return Object.entries(content).filter(([k]) => !['references', 'References', 'complete', 'fullChapter'].includes(k));

  const subsectionIds = new Set(subsections.filter(s => s.type !== 'references' && !s.deleted).map(s => s.id));
  const ordered = [];
  const unordered = [];

  for (const [key, val] of Object.entries(content)) {
    if (['references', 'References', 'complete', 'fullChapter'].includes(key)) continue;
    if (subsectionIds.has(key)) {
      const idx = subsections.findIndex(s => s.id === key);
      ordered[idx] = [key, val];
    } else {
      unordered.push([key, val]);
    }
  }

  return [...ordered.filter(Boolean), ...unordered];
};
