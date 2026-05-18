export const calculateProjectProgress = (project, chapters, content) => {
  if (!chapters?.length) return 0;
  let totalActive = 0, totalGenerated = 0;
  chapters.forEach(ch => {
    if (ch.subsections) {
      const active = ch.subsections.filter(s => s.type !== 'references');
      totalActive += active.length;
      active.forEach(sub => {
        const subContent = content[ch.id]?.[sub.id];
        const hasContent = subContent && typeof subContent === 'string' && subContent.trim().length > 0;
        if (sub.generated || hasContent) totalGenerated++;
      });
    }
  });
  return totalActive > 0 ? Math.round((totalGenerated / totalActive) * 100) : 0;
};

export const getDisplayName = (user) => {
  if (!user) return 'Guest';
  if (user.fullName) return user.fullName.split(' ')[0];
  return user.username || 'Guest';
};

export const getWelcomeMessage = (user) => {
  const name = getDisplayName(user);
  if (!user?.uid) return `Welcome, ${name}! 👋`;
  const visited = localStorage.getItem(`hasVisitedBefore_${user.uid}`);
  if (!visited) { localStorage.setItem(`hasVisitedBefore_${user.uid}`, 'true'); return { text: `Welcome, ${name}!`, isFirstVisit: true }; }
  return { text: `Welcome back, ${name}!`, isFirstVisit: false };
};
