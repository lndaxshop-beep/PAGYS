import {
  Document, Packer, Paragraph, TextRun, AlignmentType,
  HeadingLevel, PageBreak, NumberFormat, Footer, PageNumber
} from 'docx';
import parseTemplate from './templateParser.js';
import mergeReferences from './referenceMerger.js';
import {
  buildTitlePage, buildDeclaration, buildDedication,
  buildAcknowledgements, buildAbstract, buildTableOfContents,
  buildListOfFigures, buildListOfTables, buildAbbreviationsList
} from './frontMatterGenerator.js';
import { parseChapterContent, buildChapterHeading, collectFiguresAndTables } from './chapterContentParser.js';
import { buildInstrumentAppendix, loadInstruments } from './instrumentExporter.js';
import { sanitizeXmlText } from '../sanitizeText.js';

const loadAbbreviations = (projectId) => {
  try {
    const stored = localStorage.getItem(`abbreviations_${projectId}`);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
};

export const generateMergedDocument = async (config) => {
  const {
    project, chapters, generatedSubsections, selectedChapterIds,
    frontMatter, placeholders, templateFile, selectedInstrumentIds,
    projectId, style, onProgress
  } = config;

  onProgress?.('Parsing template...');
  const formatConfig = await parseTemplate(templateFile);

  onProgress?.('Processing front matter...');

  const selectedChapters = chapters.filter(ch => selectedChapterIds.includes(ch.id));

  const titlePageChildren = frontMatter.titlePage ? buildTitlePage(project, placeholders, formatConfig) : [];

  let frontMatterChildren = [];

  if (frontMatter.declaration) frontMatterChildren.push(...buildDeclaration(placeholders, formatConfig));
  if (frontMatter.dedication) frontMatterChildren.push(...buildDedication(placeholders, formatConfig));
  if (frontMatter.acknowledgements) frontMatterChildren.push(...buildAcknowledgements(placeholders, formatConfig));
  if (frontMatter.abstract) {
    const abstractText = placeholders.abstractText || 'The abstract will be generated from the thesis content. Please review and update as needed after downloading.';
    frontMatterChildren.push(...buildAbstract(abstractText, formatConfig));
  }
  if (frontMatter.toc) frontMatterChildren.push(...buildTableOfContents());

  onProgress?.('Collecting figures and tables...');
  const { figures, tables } = collectFiguresAndTables(generatedSubsections, selectedChapters);

  if (frontMatter.listOfFigures) frontMatterChildren.push(...buildListOfFigures(figures, formatConfig));
  if (frontMatter.listOfTables) frontMatterChildren.push(...buildListOfTables(tables, formatConfig));

  const abbreviations = loadAbbreviations(projectId);
  if (frontMatter.abbreviations && abbreviations.length > 0) {
    frontMatterChildren.push(...buildAbbreviationsList(abbreviations, formatConfig));
  }

  onProgress?.('Building chapter content...');
  let contentChildren = [];
  for (let ci = 0; ci < selectedChapters.length; ci++) {
    const ch = selectedChapters[ci];
    contentChildren.push(...buildChapterHeading(ch, formatConfig));
    const chapterContent = generatedSubsections[ch.id] || {};
    contentChildren.push(...await parseChapterContent(chapterContent, ch.id, formatConfig, ci + 1));
    contentChildren.push(new Paragraph({ children: [new PageBreak()] }));
    onProgress?.(`Processing chapter ${ci + 1}/${selectedChapters.length}...`);
  }

  onProgress?.('Merging references...');
  const refResult = await mergeReferences(selectedChapters, generatedSubsections, style, projectId);

  const referencesChildren = [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { before: 480, after: 240 },
      children: [new TextRun({ text: 'REFERENCES', bold: true, size: 28, font: formatConfig.fontFamily })]
    }),
  ];

  refResult.entries.forEach(entry => {
    referencesChildren.push(
      new Paragraph({
        spacing: { after: 120 },
        indent: { left: 360, hanging: 360 },
        children: [new TextRun({ text: sanitizeXmlText(entry), size: 24, font: formatConfig.fontFamily })]
      })
    );
  });

  onProgress?.('Building appendices...');
  let appendixChildren = [];
  if (selectedInstrumentIds && selectedInstrumentIds.length > 0) {
    const instruments = loadInstruments(projectId);
    const selectedInstruments = instruments.filter(inst => selectedInstrumentIds.includes(inst.id));
    let appIndex = 0;
    for (const inst of selectedInstruments) {
      appendixChildren.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { before: 480, after: 240 },
          children: [new TextRun({ text: `APPENDIX ${String.fromCharCode(65 + appIndex)}`, bold: true, size: 28, font: formatConfig.fontFamily })]
        })
      );
      appendixChildren.push(...buildInstrumentAppendix(inst.id, inst.content, project, appIndex, formatConfig));
      appIndex++;
    }
  }

  const pageFooter = (ff) => new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ children: [PageNumber.CURRENT], font: ff, size: 24 }),
        ],
      }),
    ],
  });

  onProgress?.('Building document structure...');

  const sectionMargins = formatConfig.pageMargins || { top: 2.54, right: 2.54, bottom: 2.54, left: 2.54 };
  const marginProps = {
    top: Math.round(sectionMargins.top * 1440 / 2.54),
    right: Math.round(sectionMargins.right * 1440 / 2.54),
    bottom: Math.round(sectionMargins.bottom * 1440 / 2.54),
    left: Math.round(sectionMargins.left * 1440 / 2.54),
  };

  const titleSection = titlePageChildren.length > 0 ? {
    properties: {
      page: { margin: marginProps },
      titlePage: true,
    },
    children: [...titlePageChildren, new Paragraph({ children: [new PageBreak()] })],
  } : null;

  const frontMatterSection = frontMatterChildren.length > 0 ? {
    properties: {
      page: {
        margin: marginProps,
        pageNumbers: { formatType: NumberFormat.UPPER_ROMAN },
      },
    },
    footers: { default: pageFooter(formatConfig.fontFamily) },
    children: frontMatterChildren,
  } : null;

  if (contentChildren.length === 0) {
    contentChildren.push(new Paragraph({ children: [new TextRun({ text: 'No content available.', size: 24, font: formatConfig.fontFamily })] }));
  }

  const contentSection = {
    properties: {
      page: {
        margin: marginProps,
        pageNumbers: { formatType: NumberFormat.DECIMAL, start: 1 },
      },
    },
    footers: { default: pageFooter(formatConfig.fontFamily) },
    children: contentChildren,
  };

  if (referencesChildren.length === 0) {
    referencesChildren.push(new Paragraph({ children: [new TextRun({ text: 'No references.', size: 24, font: formatConfig.fontFamily })] }));
  }

  const referencesSection = {
    properties: {
      page: {
        margin: marginProps,
        pageNumbers: { formatType: NumberFormat.DECIMAL },
      },
    },
    footers: { default: pageFooter(formatConfig.fontFamily) },
    children: referencesChildren,
  };

  const sections = [
    ...(titleSection ? [titleSection] : []),
    ...(frontMatterSection ? [frontMatterSection] : []),
    contentSection,
    referencesSection,
  ];

  if (appendixChildren.length > 0) {
    sections.push({
      properties: {
        page: {
          margin: marginProps,
          pageNumbers: { formatType: NumberFormat.DECIMAL },
        },
      },
      footers: { default: pageFooter(formatConfig.fontFamily) },
      children: appendixChildren,
    });
  }

  onProgress?.('Generating final document...');
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: formatConfig.fontFamily,
            size: Math.round((formatConfig.bodyFontSize || 12) * 2),
          },
          paragraph: {
            spacing: { line: Math.round(240 * (formatConfig.lineSpacing || 2)) },
          }
        },
        heading1: {
          run: { bold: true, font: formatConfig.headingFonts?.heading1 || formatConfig.fontFamily, size: Math.round((formatConfig.heading1Size || 14) * 2) },
          paragraph: { spacing: { before: 480, after: 240 } },
        },
        heading2: {
          run: { bold: true, font: formatConfig.headingFonts?.heading2 || formatConfig.fontFamily, size: Math.round((formatConfig.heading2Size || 13) * 2) },
          paragraph: { spacing: { before: 360, after: 180 } },
        },
        heading3: {
          run: { bold: true, font: formatConfig.headingFonts?.heading3 || formatConfig.fontFamily, size: Math.round((formatConfig.heading3Size || 12) * 2) },
          paragraph: { spacing: { before: 240, after: 120 } },
        },
      },
    },
    sections,
  });

  onProgress?.('Packaging for download...');
  try {
    return await Packer.toBlob(doc);
  } catch (err) {
    console.error('Packer.toBlob failed:', err);
    throw new Error('Failed to generate .docx file: ' + (err.message || 'Unknown error'));
  }
};

export default generateMergedDocument;