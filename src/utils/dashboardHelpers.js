export const calculateProjectProgress = (project, chapters, content) => {
  if (!chapters?.length) return 0;
  let totalActive = 0, totalGenerated = 0;
  chapters.forEach(ch => {
    if (ch.subsections) {
      const active = ch.subsections.filter(s => s.title !== 'References');
      totalActive += active.length;
      active.forEach(sub => {
        const subContent = content[ch.id]?.[sub.title];
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
  const visited = localStorage.getItem('hasVisitedBefore');
  if (!visited) { localStorage.setItem('hasVisitedBefore', 'true'); return `Welcome, ${name}! 🎉`; }
  return `Welcome back, ${name}! 👋`;
};
