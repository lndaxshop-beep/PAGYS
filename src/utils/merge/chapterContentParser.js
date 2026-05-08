import {
  Paragraph, TextRun, AlignmentType, HeadingLevel,
  Table, TableRow, TableCell, WidthType, PageBreak
} from 'docx';

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

export const parseChapterContent = (content, chapterId, format, projectId) => {
  const children = [];
  if (!content) return children;

  let prevHeading = HeadingLevel.HEADING_2;

  const lines = Object.entries(content)
    .filter(([key]) => !['references', 'References', 'complete', 'fullChapter'].includes(key))
    .flatMap(([, text]) => {
      if (!text || typeof text !== 'string') return [];
      return text.split('\n');
    });

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    i++;

    if (!line) continue;

    if (line.startsWith('```')) continue;

    const headingMatch = line.match(/^(\d+\.\d+(\.\d+)?)\s+(.+)/);
    if (headingMatch) {
      const level = getHeadingLevel(line, prevHeading);
      prevHeading = level;
      children.push(
        new Paragraph({
          heading: level,
          spacing: { before: 240, after: 120 },
          children: [new TextRun({ text: line, bold: true, size: level === HeadingLevel.HEADING_1 ? 28 : level === HeadingLevel.HEADING_2 ? 26 : 24, font: format.fontFamily })]
        })
      );
      continue;
    }

    if (line === 'References' || line === 'REFERENCES') {
      prevHeading = HeadingLevel.HEADING_1;
      continue;
    }

    const isBullet = line.startsWith('- ') || line.startsWith('• ');
    if (isBullet) {
      children.push(
        new Paragraph({
          spacing: { after: 60 },
          indent: { left: 400 },
          children: [new TextRun({ text: line.replace(/^[-•]\s*/, '• '), size: 24, font: format.fontFamily })]
        })
      );
      continue;
    }

    const isNumbered = line.match(/^\d+\.\s/);
    if (isNumbered) {
      children.push(
        new Paragraph({
          spacing: { after: 60 },
          indent: { left: 400, hanging: 200 },
          children: [new TextRun({ text: line, size: 24, font: format.fontFamily })]
        })
      );
      continue;
    }

    children.push(
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { line: Math.round(240 * (format.lineSpacing || 2)), after: 120 },
        indent: { firstLine: 360 },
        children: [new TextRun({ text: line, size: Math.round((format.bodyFontSize || 12) * 2), font: format.fontFamily })]
      })
    );
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

export const collectFiguresAndTables = (generatedSubsections, selectedChapters, projectId) => {
  const figures = [];
  const tables = [];

  selectedChapters.forEach(chapter => {
    const content = generatedSubsections[chapter.id] || {};
    Object.values(content).forEach(text => {
      if (!text || typeof text !== 'string') return;
      const chartMatches = text.matchAll(/\[CHART:\{(?:[^}]*"title"\s*:\s*"([^"]*))?/g);
      for (const m of chartMatches) {
        if (m[1]) figures.push({ title: m[1], caption: m[1] });
      }
      const tableMatches = text.matchAll(/```table\s*\{[^}]*"title"\s*:\s*"([^"]*)/g);
      for (const m of tableMatches) {
        if (m[1]) tables.push({ title: m[1], caption: m[1] });
      }
      const figureMatches = text.matchAll(/Figure\s+(\d+)[:\s]+([^\n]+)/g);
      for (const m of figureMatches) {
        figures.push({ title: m[2].trim(), caption: m[2].trim() });
      }
    });
  });

  return { figures, tables };
};

export default parseChapterContent;