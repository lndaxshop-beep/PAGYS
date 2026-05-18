import {
  Paragraph, TextRun, AlignmentType, HeadingLevel,
  Table, TableRow, TableCell, WidthType, PageBreak, SimpleField
} from 'docx';
import { renderChartToPng, renderDiagramToPng, buildDocxTable, buildImageParagraph } from '../exportVisualHelpers.js';
import { sanitizeXmlText } from '../sanitizeText.js';
import { CHART_MARKER_RE, parseChartMarker, FRAMEWORK_MARKER_RE, parseFrameworkBlock, markdownTableRe, parseMarkdownTable, detectPlainTextHierarchy } from '../visualDataModel.js';

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

export const parseChapterContent = async (content, chapterId, format, chapterIndex = 1) => {
  const children = [];
  if (!content) return children;

  const fontFamily = format.fontFamily || 'Times New Roman';
  let prevHeading = HeadingLevel.HEADING_2;
  let tableCounter = 0;
  let figureCounter = 0;

  const makeTableLabel = (title) => {
    tableCounter++;
    return new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 240, after: 60 },
      children: [
        new TextRun({ text: `Table `, bold: true, size: 24, font: fontFamily }),
        new SimpleField(` SEQ Table \\* ARABIC \\s 1 `, `${chapterIndex}.${tableCounter}`),
        new TextRun({ text: `: ${sanitizeXmlText(title)}`, bold: true, size: 24, font: fontFamily })
      ]
    });
  };

  const makeFigureLabel = (title) => {
    figureCounter++;
    return new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 240, after: 60 },
      children: [
        new TextRun({ text: `Figure `, bold: false, italics: true, size: 24, font: fontFamily }),
        new SimpleField(` SEQ Figure \\* ARABIC \\s 1 `, `${chapterIndex}.${figureCounter}`),
        new TextRun({ text: `: ${sanitizeXmlText(title)}`, bold: false, italics: true, size: 24, font: fontFamily })
      ]
    });
  };

  const subsectionEntries = Object.entries(content)
    .filter(([key]) => !['references', 'References', 'complete', 'fullChapter'].includes(key));

  const flushMarkdownTable = (lines) => {
    if (lines.length < 2) return false;
    const parsed = parseMarkdownTable(lines);
    if (!parsed) return false;
    const title = parsed.caption || 'Table';
    children.push(makeTableLabel(title));
    children.push(buildDocxTable(parsed, format));
    if (parsed.caption) {
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
        children: [new TextRun({ text: sanitizeXmlText(parsed.caption), italics: true, size: 22, font: fontFamily })]
      }));
    }
    return true;
  };

  const processChartMarker = async (marker) => {
    const parsed = parseChartMarker(marker);
    if (!parsed) return false;
    const pngBuffer = await renderChartToPng(parsed);
    if (!pngBuffer) return false;
    const title = parsed.title || 'Chart';
    children.push(makeFigureLabel(title));
    children.push(...buildImageParagraph(pngBuffer, parsed.caption || null, format));
    return true;
  };

  const processFrameworkText = async (text) => {
    const parsed = parseFrameworkBlock(text);
    if (!parsed || (parsed.independent.length === 0 && parsed.dependent.length === 0)) return false;
    const pngBuffer = renderDiagramToPng(parsed);
    if (!pngBuffer) return false;
    const title = parsed.title || 'Conceptual Framework';
    children.push(makeFigureLabel(title));
    children.push(...buildImageParagraph(pngBuffer, title, format));
    return true;
  };

  const processInlineChart = async (line) => {
    const match = line.match(CHART_MARKER_RE);
    if (!match) return false;
    return processChartMarker(line);
  };

  for (const [, text] of subsectionEntries) {
    if (!text || typeof text !== 'string') continue;

    let processedText = text;
    const plainHierarchy = detectPlainTextHierarchy(text);
    if (plainHierarchy) processedText = text + '\n\n' + plainHierarchy;

    const lines = processedText.split('\n');
    let i = 0;
    let tableBuffer = [];
    let inTable = false;
    let frameworkBuffer = null;
    let inFramework = false;

    const flushTable = () => {
      if (tableBuffer.length >= 2) flushMarkdownTable(tableBuffer);
      tableBuffer = [];
      inTable = false;
    };

    while (i < lines.length) {
      const rawLine = lines[i];
      i++;

      const trimmed = rawLine.trimEnd();

      if (!trimmed) {
        if (inTable) {
          flushTable();
        }
        if (inFramework) {
          await processFrameworkText(frameworkBuffer);
          frameworkBuffer = null;
          inFramework = false;
        }
        continue;
      }

      if (inFramework) {
        if (trimmed.match(/^\[FRAMEWORK:/i) && frameworkBuffer) {
          await processFrameworkText(frameworkBuffer);
          frameworkBuffer = trimmed;
        } else {
          if (!frameworkBuffer) frameworkBuffer = '';
          frameworkBuffer += '\n' + trimmed;
          if (trimmed.match(/\]\s*$/)) {
            await processFrameworkText(frameworkBuffer);
            frameworkBuffer = null;
            inFramework = false;
          }
        }
        continue;
      }

      const frameworkStart = trimmed.match(/^\[FRAMEWORK:\s*(.*?)$/i);
      if (frameworkStart) {
        flushTable();
        frameworkBuffer = trimmed;
        inFramework = true;
        if (trimmed.match(/\]\s*$/)) {
          await processFrameworkText(frameworkBuffer);
          frameworkBuffer = null;
          inFramework = false;
        }
        continue;
      }

      const chartMatch = trimmed.match(CHART_MARKER_RE);
      if (chartMatch) {
        flushTable();
        await processInlineChart(trimmed);
        continue;
      }

      if (markdownTableRe.test(trimmed)) {
        if (!inTable) {
          inTable = true;
          tableBuffer = [];
        }
        tableBuffer.push(trimmed);
        continue;
      } else if (inTable) {
        flushTable();
      }

      const headingMatch = trimmed.match(/^(\d+\.\d+(\.\d+)?)\s+(.+)/);
      if (headingMatch) {
        const level = getHeadingLevel(trimmed, prevHeading);
        prevHeading = level;
        children.push(new Paragraph({
          heading: level,
          spacing: { before: 240, after: 120 },
          children: [new TextRun({ text: sanitizeXmlText(trimmed), bold: true, size: level === HeadingLevel.HEADING_1 ? 28 : level === HeadingLevel.HEADING_2 ? 26 : 24, font: fontFamily })]
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
          children: [new TextRun({ text: sanitizeXmlText(trimmed.replace(/^[-•]\s*/, '• ')), size: 24, font: fontFamily })]
        }));
        continue;
      }

      if (trimmed.match(/^\d+\.\s/)) {
        children.push(new Paragraph({
          spacing: { after: 60 },
          indent: { left: 400, hanging: 200 },
          children: [new TextRun({ text: sanitizeXmlText(trimmed), size: 24, font: fontFamily })]
        }));
        continue;
      }

      children.push(new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { line: Math.round(240 * (format.lineSpacing || 2)), after: 120 },
        indent: { firstLine: 360 },
        children: [new TextRun({ text: sanitizeXmlText(trimmed), size: Math.round((format.bodyFontSize || 12) * 2), font: fontFamily })]
      }));
    }

    flushTable();
    if (inFramework && frameworkBuffer) {
      await processFrameworkText(frameworkBuffer);
    }
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

      const chartRe = /\[CHART:\s*(bar|line|pie|horizontalBar)\s*\|\s*([^|]*)\s*\|/gi;
      let m;
      while ((m = chartRe.exec(text)) !== null) {
        figSeq++;
        figures.push({ chapterNum, seq: figSeq, title: m[2].trim(), caption: m[2].trim() });
      }

      const frameworkRe = /\[FRAMEWORK:\s*(.*?)\]/gi;
      while ((m = frameworkRe.exec(text)) !== null) {
        figSeq++;
        const title = m[1].split('\n')[0].trim();
        figures.push({ chapterNum, seq: figSeq, title: title || 'Conceptual Framework', caption: title || 'Conceptual Framework' });
      }

      const markdownTableHeader = text.match(/^\|.+\|$/m);
      if (markdownTableHeader) {
        const lines = text.split('\n');
        let inMdTable = false;
        let mdTableHeaders = '';
        for (const line of lines) {
          if (/^\|.+\|$/.test(line.trim())) {
            if (!inMdTable) {
              inMdTable = true;
              mdTableHeaders = line.trim();
            }
          } else if (inMdTable) {
            if (mdTableHeaders) {
              tblSeq++;
              const firstCell = mdTableHeaders.split('|').map(s => s.trim()).filter(Boolean)[0] || 'Table';
              tables.push({ chapterNum, seq: tblSeq, title: firstCell, caption: firstCell });
            }
            mdTableHeaders = '';
            inMdTable = false;
          }
        }
        if (inMdTable && mdTableHeaders) {
          tblSeq++;
          const firstCell = mdTableHeaders.split('|').map(s => s.trim()).filter(Boolean)[0] || 'Table';
          tables.push({ chapterNum, seq: tblSeq, title: firstCell, caption: firstCell });
        }
      }
    });
  });

  return { figures, tables };
};

export default parseChapterContent;
