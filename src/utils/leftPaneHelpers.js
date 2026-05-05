export const getChapterProgress = (chapter) => {
  const active = chapter.subsections?.filter(s => s.title !== 'References' && !s.deleted) || [];
  if (active.length === 0) return 0;
  return Math.round((active.filter(s => s.generated).length / active.length) * 100);
};

export const getActiveSubsections = (subsections) =>
  subsections.filter(s => !s.deleted);

export const isReferencesClickable = (subsections) => {
  const others = subsections.filter(s => s.title !== 'References' && !s.deleted);
  return others.length > 0 && others.every(s => s.generated);
};

export const validateReferencesClick = (subsection, allSubsections) => {
  if (subsection.title !== 'References') return true;
  const others = allSubsections.filter(s => s.title !== 'References' && !s.deleted);
  return others.length > 0 && others.every(s => s.generated);
};
