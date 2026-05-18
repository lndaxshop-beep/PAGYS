export const VISUAL_TYPES = { TABLE: 'table', CHART: 'chart', DIAGRAM: 'diagram' };

export const CHART_TYPES = { BAR: 'bar', LINE: 'line', PIE: 'pie', HORIZONTAL_BAR: 'horizontalBar' };

export const DIAGRAM_TYPES = { FRAMEWORK: 'framework', FLOWCHART: 'flowchart', HIERARCHY: 'hierarchy' };

export const makeTable = (headers, rows, caption) => ({ type: VISUAL_TYPES.TABLE, headers, rows, caption: caption || '' });

export const makeChart = (chartType, title, labels, values, caption) => ({
  type: VISUAL_TYPES.CHART, chartType: chartType || CHART_TYPES.BAR, title: title || '',
  labels: labels || [], values: values || [], caption: caption || ''
});

export const makeDiagram = (diagramType, title, independent, dependent, mediating, moderating, relationships, hierarchy) => ({
  type: VISUAL_TYPES.DIAGRAM, diagramType: diagramType || DIAGRAM_TYPES.FRAMEWORK, title: title || '',
  independent: independent || [], dependent: dependent || [],
  mediating: mediating || [], moderating: moderating || [],
  relationships: relationships || [], hierarchy: hierarchy || []
});

export const CHART_MARKER_RE = /\[CHART:\s*(bar|line|pie|horizontalBar)\s*\|\s*([^|]*)\s*\|\s*(.+?)\s*\]/i;

export const parseChartMarker = (marker) => {
  const m = marker.match(CHART_MARKER_RE);
  if (!m) return null;
  const chartType = m[1].toLowerCase();
  const title = m[2].trim();
  const dataStr = m[3];
  const labels = [];
  const values = [];
  const parts = dataStr.split(',').map(s => s.trim()).filter(Boolean);
  for (const part of parts) {
    const kv = part.split(':');
    if (kv.length >= 2) {
      const label = kv[0].trim();
      const rawVal = kv.slice(1).join(':').trim().replace(/%/g, '');
      const val = parseFloat(rawVal);
      if (!isNaN(val)) { labels.push(label); values.push(val); }
    }
  }
  if (labels.length < 2 && chartType !== 'pie') return null;
  if (labels.length < 1 && chartType === 'pie') return null;
  return makeChart(chartType, title, labels, values, title);
};

export const FRAMEWORK_MARKER_RE = /\[FRAMEWORK:\s*(.*?)\]/i;

export const parseFrameworkBlock = (text) => {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  let title = '', independent = [], dependent = [], mediating = [], moderating = [], relationships = [], hierarchy = [];
  for (const line of lines) {
    const headerMatch = line.match(/^\[FRAMEWORK:\s*(.+?)\]$/i);
    if (headerMatch) { title = headerMatch[1].trim(); continue; }
    if (line.startsWith('Title:')) { title = line.replace('Title:', '').trim(); continue; }
    if (line.startsWith('Hierarchy:')) {
      const parts = line.replace('Hierarchy:', '').split('→').map(s => s.trim()).filter(Boolean);
      for (let i = 0; i < parts.length - 1; i++) {
        hierarchy.push({ from: parts[i], to: parts[i + 1] });
      }
      continue;
    }
    if (line.startsWith('Independent:')) { independent = line.replace('Independent:', '').split(',').map(s => s.trim()).filter(Boolean); continue; }
    if (line.startsWith('Dependent:')) { dependent = line.replace('Dependent:', '').split(',').map(s => s.trim()).filter(Boolean); continue; }
    if (line.startsWith('Mediating:')) { mediating = line.replace('Mediating:', '').split(',').map(s => s.trim()).filter(Boolean); continue; }
    if (line.startsWith('Moderating:')) { moderating = line.replace('Moderating:', '').split(',').map(s => s.trim()).filter(Boolean); continue; }
    if (line.startsWith('Hypothesis:') || (line.startsWith('H') && line.includes(':'))) {
      const hl = line.replace(/^H\d+[:\s]*/i, '').trim();
      const arrowParts = hl.split('→').map(s => s.trim()).filter(Boolean);
      if (arrowParts.length >= 2) relationships.push({ from: arrowParts[0], to: arrowParts[arrowParts.length - 1], label: '' });
      continue;
    }
  }
  if (hierarchy.length > 0) return makeDiagram(DIAGRAM_TYPES.HIERARCHY, title, [], [], [], [], [], hierarchy);
  if (relationships.length === 0) {
    for (const iv of independent) {
      for (const dv of dependent) relationships.push({ from: iv, to: dv, label: '' });
    }
    for (const mv of mediating) {
      for (const dv of dependent) relationships.push({ from: mv, to: dv, label: '' });
    }
  }
  return makeDiagram(DIAGRAM_TYPES.FRAMEWORK, title, independent, dependent, mediating, moderating, relationships);
};

export const markdownTableRe = /^\|.+\|$/;

const PLAIN_HIERARCHY_LINE_RE = /^(Figure|Table)\s+\d+\.\d+:/i;

export const detectPlainTextHierarchy = (text) => {
  if (!text || typeof text !== 'string') return null;
  const lines = text.split('\n');
  let bestStart = -1, bestTitle = '', bestChildren = [];
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed || PLAIN_HIERARCHY_LINE_RE.test(trimmed)) continue;
    if (/^[-•]\s/.test(trimmed)) continue;
    const children = [];
    let j = i + 1;
    while (j < lines.length) {
      const childLine = lines[j].trim();
      if (!childLine) { j++; continue; }
      if (/^[-•]\s/.test(childLine)) {
        children.push(childLine.replace(/^[-•]\s+/, '').trim());
        j++;
      } else if (PLAIN_HIERARCHY_LINE_RE.test(childLine) || !childLine) {
        j++;
      } else break;
    }
    if (children.length >= 2) {
      const titleLine = i > 0 ? lines[i - 1].trim() : '';
      const title = PLAIN_HIERARCHY_LINE_RE.test(titleLine) ? titleLine.replace(/^(Figure|Table)\s+\d+\.\d+:\s*/i, '').trim() : trimmed;
      if (children.length > bestChildren.length) { bestStart = i; bestTitle = title; bestChildren = children; }
    }
  }
  if (bestChildren.length < 2) return null;
  const frameworkLines = [`[FRAMEWORK: ${bestTitle}`];
  const parent = lines[bestStart].trim();
  if (parent && !PLAIN_HIERARCHY_LINE_RE.test(parent) && parent !== bestTitle && !/^[-•]\s/.test(parent)) {
    const firstChild = bestChildren.shift();
    if (firstChild) frameworkLines.push(`  Hierarchy: ${parent} → ${firstChild}`);
    for (const child of bestChildren) frameworkLines.push(`  Hierarchy: ${parent} → ${child}`);
  } else {
    for (let ci = 0; ci < bestChildren.length - 1; ci++) {
      frameworkLines.push(`  Hierarchy: ${bestChildren[ci]} → ${bestChildren[ci + 1]}`);
    }
  }
  frameworkLines.push(']');
  return frameworkLines.join('\n');
};

export const parseMarkdownTable = (lines) => {
  if (!lines || lines.length < 2) return null;
  const headerLine = lines[0];
  const separatorLine = lines[1];
  if (!/^\|.+\|$/.test(headerLine)) return null;
  const splitPipe = (line) => line.split('|').map(s => s.trim());
  const headers = splitPipe(headerLine).filter(Boolean);
  if (headers.length === 0) return null;
  const hasSeparator = /^\|[-| ]+\|$/.test(separatorLine);
  const rows = [];
  const startIdx = hasSeparator ? 2 : 1;
  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || !line.startsWith('|')) continue;
    const rawCells = splitPipe(line);
    const outer = rawCells.length >= 2 && rawCells[0] === '' && rawCells[rawCells.length - 1] === '';
    const inner = outer ? rawCells.slice(1, -1) : rawCells;
    const cells = [];
    let col = 0;
    for (let c = 0; c < inner.length && col < headers.length; c++) {
      if (inner[c] === '' && c > 0 && inner[c - 1] !== '') {
        cells.push('');
        col++;
      } else {
        cells.push(inner[c]);
        col++;
      }
    }
    while (cells.length < headers.length) cells.push('');
    if (cells.length === headers.length) {
      const allEmpty = cells.every(c => !c);
      if (!allEmpty) rows.push(cells);
    }
  }
  return makeTable(headers, rows, '');
};

export const parseTableBlock = (text) => {
  const lines = text.split('\n').filter(l => l.trim());
  let tableLines = [];
  let tableStart = -1;
  let caption = '';
  for (let i = 0; i < lines.length; i++) {
    if (/^\|.+\|$/.test(lines[i].trim())) {
      if (tableStart === -1) tableStart = i;
      tableLines.push(lines[i]);
    } else if (tableStart >= 0) {
      const trimmed = lines[i].trim();
      if (trimmed.startsWith('Table:') || trimmed.startsWith('Caption:')) {
        caption = trimmed.replace(/^(Table|Caption):\s*/i, '').trim();
      }
    }
  }
  if (tableLines.length < 2) return null;
  const result = parseMarkdownTable(tableLines);
  if (result) result.caption = caption;
  return result;
};
