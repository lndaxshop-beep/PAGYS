import {
  Paragraph, TextRun, AlignmentType, HeadingLevel,
  Table, TableRow, TableCell, WidthType, PageBreak
} from 'docx';
import { renderChartToPng, renderMermaidToPng, buildDocxTable, buildImageParagraph } from '../exportVisualHelpers.js';

const getHeadingLevel = (title, prevHeading) => {
  const match = title.trim().match(/^(\d+)\.(\d+)(\.(\d+))?\s+/);
  if (!match) {
    if (title === 'References' || title === 'REFERENCES') return HeadingLevel.HEADING_1;
    return prevHeading || HeadingLevel.HEADING_2;
  }
  const depth = match[4] ? 3 : match[2] === '0' ? 1 : 2;
  if (depth === 1) return HeadingLevel.HEADING_1;
  if (depth === 2) return HeadingLevel.HEADING_2;
  return HeadingLevel.HEADING_3;
};

const CHART_INLINE_RE = /\[CHART:\{(.*?)\}\]/;

const makeFallbackCodeBlock = (raw, fontFamily) => new Paragraph({
  spacing: { before: 120, after: 120 },
  children: [new TextRun({ text: raw, font: 'Courier New', size: 18 })]
});

const makeCaption = (text, fontFamily) => new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 240 },
  children: [new TextRun({ text, italics: true, size: 22, font: fontFamily })]
});

export const parseChapterContent = async (content, chapterId, format) => {
  const children = [];
  if (!content) return children;

  const fontFamily = format.fontFamily || 'Times New Roman';
  let prevHeading = HeadingLevel.HEADING_2;

  const subsectionEntries = Object.entries(content)
    .filter(([key]) => !['references', 'References', 'complete', 'fullChapter'].includes(key));

  const flushVisual = async (type, lines) => {
    if (!type || lines.length === 0) return;

    const raw = lines.join('\n').trim();
    if (!raw) return;

    try {
      if (type === 'table') {
        const parsed = JSON.parse(raw);
        const docxTable = buildDocxTable(parsed, format);
        children.push(docxTable);
        if (parsed.caption) children.push(makeCaption(parsed.caption, fontFamily));
      } else if (type === 'chart' || type === 'diagram' || type === 'graph') {
        const parsed = JSON.parse(raw);
        const pngBuffer = renderChartToPng(parsed);
        if (pngBuffer) {
          const caption = parsed.caption || parsed.title || null;
          children.push(...buildImageParagraph(pngBuffer, caption, format));
        }
      } else if (type === 'mermaid') {
        const pngBuffer = await renderMermaidToPng(raw);
        if (pngBuffer) {
          const titleMatch = raw.match(/%%\s*title:\s*(.+)/i);
          const caption = titleMatch ? titleMatch[1].trim() : null;
          children.push(...buildImageParagraph(pngBuffer, caption, format));
        }
      }
    } catch (e) {
      console.warn('Visual block render failed, inserting as code:', e);
      children.push(makeFallbackCodeBlock(raw, fontFamily));
    }
  };

  for (const [, text] of subsectionEntries) {
    if (!text || typeof text !== 'string') continue;

    const lines = text.split('\n');
    let i = 0;
    let visualType = null;
    let visualLines = [];

    const flushCurrent = () => flushVisual(visualType, visualLines).then(() => {
      visualType = null;
      visualLines = [];
    });

    while (i < lines.length) {
      const rawLine = lines[i];
      i++;

      const fenceOpen = rawLine.match(/^```(chart|mermaid|table|diagram|graph)\s*$/i);
      if (fenceOpen) {
        await flushCurrent();
        visualType = fenceOpen[1].toLowerCase();
        continue;
      }

      if (visualType && rawLine.trim() === '```') {
        await flushCurrent();
        continue;
      }

      if (visualType) {
        visualLines.push(rawLine);
        continue;
      }

      const trimmed = rawLine.trim();
      if (!trimmed) continue;

      const chartInline = trimmed.match(CHART_INLINE_RE);
      if (chartInline) {
        try {
          const parsed = JSON.parse(`{${chartInline[1]}}`);
          const pngBuffer = renderChartToPng(parsed);
          if (pngBuffer) {
            const caption = parsed.caption || parsed.title || null;
            children.push(...buildImageParagraph(pngBuffer, caption, format));
          }
        } catch (e) {
          console.warn('Inline chart render failed:', e);
        }
        continue;
      }

      const headingMatch = trimmed.match(/^(\d+\.\d+(\.\d+)?)\s+(.+)/);
      if (headingMatch) {
        const level = getHeadingLevel(trimmed, prevHeading);
        prevHeading = level;
        children.push(new Paragraph({
          heading: level,
          spacing: { before: 240, after: 120 },
          children: [new TextRun({ text: trimmed, bold: true, size: level === HeadingLevel.HEADING_1 ? 28 : level === HeadingLevel.HEADING_2 ? 26 : 24, font: fontFamily })]
        }));
        continue;
      }

      if (trimmed === 'References' || trimmed === 'REFERENCES') {
        prevHeading = HeadingLevel.HEADING_1;
        continue;
      }

      if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
        children.push(new Paragraph({
          spacing: { after: 60 },
          indent: { left: 400 },
          children: [new TextRun({ text: trimmed.replace(/^[-•]\s*/, '• '), size: 24, font: fontFamily })]
        }));
        continue;
      }

      if (trimmed.match(/^\d+\.\s/)) {
        children.push(new Paragraph({
          spacing: { after: 60 },
          indent: { left: 400, hanging: 200 },
          children: [new TextRun({ text: trimmed, size: 24, font: fontFamily })]
        }));
        continue;
      }

      children.push(new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { line: Math.round(240 * (format.lineSpacing || 2)), after: 120 },
        indent: { firstLine: 360 },
        children: [new TextRun({ text: trimmed, size: Math.round((format.bodyFontSize || 12) * 2), font: fontFamily })]
      }));
    }

    await flushCurrent();
  }

  return children;
};

export const buildChapterHeading = (chapter, format) => {
  const displayTitle = chapter.customTitle || chapter.title;
  return [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { before: 480, after: 240 },
      children: [new TextRun({ text: displayTitle, bold: true, size: 28, font: format.fontFamily })]
    })
  ];
};

export const collectFiguresAndTables = (generatedSubsections, selectedChapters) => {
  const figures = [];
  const tables = [];
  let figSeq = 0;
  let tblSeq = 0;

  selectedChapters.forEach((chapter, ci) => {
    const chapterNum = ci + 1;
    const content = generatedSubsections[chapter.id] || {};
    Object.values(content).forEach(text => {
      if (!text || typeof text !== 'string') return;

      // Fenced chart/diagram
      const fencedChartRe = /```(?:chart|diagram|graph)\s*\n?\s*\{[^}]*"title"\s*:\s*"([^"]*)/gi;
      let m;
      while ((m = fencedChartRe.exec(text)) !== null) {
        figSeq++;
        figures.push({ chapterNum, seq: figSeq, title: m[1], caption: m[1] });
      }

      // Inline [CHART:{...}]
      const inlineChartRe = /\[CHART:\{(?:[^}]*"title"\s*:\s*"([^"]*))?/g;
      while ((m = inlineChartRe.exec(text)) !== null) {
        if (m[1]) {
          figSeq++;
          figures.push({ chapterNum, seq: figSeq, title: m[1], caption: m[1] });
        }
      }

      // Fenced table
      const fencedTableRe = /```table\s*\n?\s*\{[^}]*"title"\s*:\s*"([^"]*)/gi;
      while ((m = fencedTableRe.exec(text)) !== null) {
        if (m[1]) {
          tblSeq++;
          tables.push({ chapterNum, seq: tblSeq, title: m[1], caption: m[1] });
        }
      }

      // Figure N: caption patterns
      const figureRe = /Figure\s+(\d+)[:\s]+([^\n]+)/g;
      while ((m = figureRe.exec(text)) !== null) {
        figSeq++;
        figures.push({ chapterNum, seq: figSeq, title: m[2].trim(), caption: m[2].trim() });
      }

      // Mermaid figure detection (title from %% comment)
      const mermaidTitleRe = /```mermaid[\s\S]*?%%\s*title:\s*(.+)/gi;
      while ((m = mermaidTitleRe.exec(text)) !== null) {
        figSeq++;
        figures.push({ chapterNum, seq: figSeq, title: m[1].trim(), caption: m[1].trim() });
      }
    });
  });

  return { figures, tables };
};

export default parseChapterContent;