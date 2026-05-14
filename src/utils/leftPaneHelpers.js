export const getChapterProgress = (chapter) => {
  const active = chapter.subsections?.filter(s => s.type !== 'references' && !s.deleted) || [];
  let total = 0, generated = 0;
  active.forEach(s => {
    total += 1;
    if (s.generated) generated += 1;
    (s.children || []).forEach(c => {
      total += 1;
      if (c.generated) generated += 1;
    });
  });
  if (total === 0) return 0;
  return Math.round((generated / total) * 100);
};

export const getActiveSubsections = (subsections) =>
  subsections.filter(s => !s.deleted);

export const isReferencesClickable = (subsections) => {
  const others = subsections.filter(s => s.type !== 'references' && !s.deleted);
  return others.length > 0 && others.every(s => s.generated);
};

export const validateReferencesClick = (subsection, allSubsections) => {
  if (subsection.type === 'references') {
    const others = allSubsections.filter(s => s.type !== 'references' && !s.deleted);
    return others.length > 0 && others.every(s => s.generated);
  }
  return true;
};
