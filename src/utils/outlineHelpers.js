const HEADING_RE = /^(\d+\.\d+(\.\d+)?)\s+(.+)/;

export const extractOutline = (content) => {
  if (!content || typeof content !== 'string') return [];
  const outlines = [];
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    const match = trimmed.match(HEADING_RE);
    if (match) {
      const depth = match[2] ? 3 : match[1].endsWith('.0') ? 1 : 2;
      outlines.push({
        number: match[1],
        title: match[3].trim(),
        depth,
        raw: trimmed,
      });
    }
  }
  return outlines;
};
