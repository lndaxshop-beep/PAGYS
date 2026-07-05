export const calculateProjectProgress = (project, chapters, content) => {
  if (!chapters?.length) return 0;
  let totalChapters = 0;
  let completedChapters = 0;

  chapters.forEach(ch => {
    if (ch.deleted) return;
    totalChapters++;
    const chapterContent = content[ch.id];
    if (!chapterContent) return;

    const hasFullChapter = chapterContent.fullChapter &&
      typeof chapterContent.fullChapter === 'string' &&
      chapterContent.fullChapter.trim().length > 0;

    if (hasFullChapter) {
      completedChapters++;
      return;
    }

    const activeSubs = ch.subsections?.filter(s => s.type !== 'references' && !s.deleted) || [];
    if (activeSubs.length === 0) return;
    const generatedCount = activeSubs.filter(sub => {
      const subContent = chapterContent[sub.id];
      return subContent && typeof subContent === 'string' && subContent.trim().length > 0;
    }).length;
    if (generatedCount === activeSubs.length) {
      completedChapters++;
    }
  });

  return totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;
};

export const getDisplayName = (user) => {
  if (!user) return 'Guest';
  if (user.username) return user.username;
  if (user.fullName) return user.fullName.split(' ')[0];
  return user.email?.split('@')[0] || 'Guest';
};

export const getWelcomeMessage = (user) => {
  const name = getDisplayName(user);
  if (!user?.uid) return `Welcome, ${name}! 👋`;
  const visited = localStorage.getItem(`hasVisitedBefore_${user.uid}`);
  if (!visited) { localStorage.setItem(`hasVisitedBefore_${user.uid}`, 'true'); return { text: `Welcome, ${name}!`, isFirstVisit: true }; }
  return { text: `Welcome back, ${name}!`, isFirstVisit: false };
};
