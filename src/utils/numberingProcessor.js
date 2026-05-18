const TABLE_HEADER_RE = /^\|.+\|$/;
const TABLE_SEPARATOR_RE = /^\|[-| ]+\|$/;
const CHART_MARKER_RE = /^\[CHART:\s*(bar|line|pie|horizontalBar)\s*\|/i;
const FRAMEWORK_MARKER_RE = /^\[FRAMEWORK:/i;

const VISUAL_REF_RE = /\b(the\s+)?(table|figure|chart|diagram|framework|graph)\b/gi;

export const numberVisualReferences = (content, chapterIndex) => {
  if (!content || typeof content !== 'object') return content;

  const CH = chapterIndex;
  const result = {};

  for (const [key, text] of Object.entries(content)) {
    if (!text || typeof text !== 'string') { result[key] = text; continue; }

    const lines = text.split('\n');
    let tableCount = 0;
    let figureCount = 0;

    const markerPositions = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (TABLE_HEADER_RE.test(trimmed) && i + 1 < lines.length && TABLE_SEPARATOR_RE.test(lines[i + 1].trim())) {
        tableCount++;
        markerPositions.push({ line: i, type: 'table', num: tableCount });
        i++;
        while (i + 1 < lines.length && TABLE_HEADER_RE.test(lines[i + 1].trim())) { i++; }
        continue;
      }

      if (CHART_MARKER_RE.test(trimmed)) {
        figureCount++;
        markerPositions.push({ line: i, type: 'figure', num: figureCount });
        continue;
      }

      if (FRAMEWORK_MARKER_RE.test(trimmed)) {
        figureCount++;
        markerPositions.push({ line: i, type: 'figure', num: figureCount });
        let j = i + 1;
        while (j < lines.length && !lines[j].trim().match(/\]\s*$/)) { j++; }
        i = j;
        continue;
      }
    }

    let curTable = 0;
    let curFigure = 0;
    let markerIdx = 0;
    const newLines = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (markerIdx < markerPositions.length && markerPositions[markerIdx].line === i) {
        const m = markerPositions[markerIdx];
        if (m.type === 'table') curTable = m.num;
        else curFigure = m.num;
        markerIdx++;
        newLines.push(line);
        continue;
      }

      const trimmed = line.trim();
      if (TABLE_HEADER_RE.test(trimmed) || TABLE_SEPARATOR_RE.test(trimmed) || CHART_MARKER_RE.test(trimmed) || FRAMEWORK_MARKER_RE.test(trimmed)) {
        newLines.push(line);
        continue;
      }

      const nextMarker = markerIdx < markerPositions.length ? markerPositions[markerIdx] : null;
      const nextTable = nextMarker?.type === 'table' ? nextMarker.num : (markerPositions.filter(m => m.type === 'table').length + 1);
      const nextFigure = nextMarker?.type === 'figure' ? nextMarker.num : (markerPositions.filter(m => m.type === 'figure').length + 1);

      let replaced = line;

      replaced = replaced.replace(/\bthe\s+table\s+below\b/gi, () => `Table ${CH}.${nextTable}`);
      replaced = replaced.replace(/\bthe\s+following\s+table\b/gi, () => `Table ${CH}.${nextTable}`);
      replaced = replaced.replace(/\bthis\s+table\b/gi, () => `Table ${CH}.${curTable > 0 ? curTable : nextTable}`);
      replaced = replaced.replace(/\bAs\s+shown\s+in\s+Table\b/gi, () => `As shown in Table ${CH}.${curTable > 0 ? curTable : nextTable}`);
      replaced = replaced.replace(/\bTable\s+below\b/gi, () => `Table ${CH}.${nextTable} below`);
      replaced = replaced.replace(/\bTable\s+above\b/gi, () => `Table ${CH}.${curTable} above`);

      replaced = replaced.replace(/\bthe\s+(figure|chart|diagram)\s+below\b/gi, (_, word) => {
        const typeLabel = word.charAt(0).toUpperCase() + word.slice(1);
        return `${typeLabel} ${CH}.${nextFigure}`;
      });
      replaced = replaced.replace(/\bthe\s+following\s+(figure|chart|diagram)\b/gi, (_, word) => {
        const typeLabel = word.charAt(0).toUpperCase() + word.slice(1);
        return `${typeLabel} ${CH}.${nextFigure}`;
      });
      replaced = replaced.replace(/\bthis\s+(figure|chart|diagram|framework)\b/gi, (_, word) => {
        const typeLabel = word.charAt(0).toUpperCase() + word.slice(1);
        return `${typeLabel} ${CH}.${curFigure > 0 ? curFigure : nextFigure}`;
      });
      replaced = replaced.replace(/\bAs\s+shown\s+in\s+(Figure|Chart|Diagram)\b/gi, (_, word) => {
        return `As shown in ${word} ${CH}.${curFigure > 0 ? curFigure : nextFigure}`;
      });

      replaced = replaced.replace(/\bthe\s+figure\s+above\b/gi, () => `Figure ${CH}.${curFigure} above`);
      replaced = replaced.replace(/\bthe\s+chart\s+above\b/gi, () => `Figure ${CH}.${curFigure} above`);
      replaced = replaced.replace(/\bthe\s+diagram\s+above\b/gi, () => `Figure ${CH}.${curFigure} above`);

      replaced = replaced.replace(/\bFigure\s+X\b/gi, () => `Figure ${CH}.${nextFigure}`);
      replaced = replaced.replace(/\bTable\s+X\b/gi, () => `Table ${CH}.${nextTable}`);

      newLines.push(replaced);
    }

    result[key] = newLines.join('\n');
  }

  return result;
};

export default numberVisualReferences;
