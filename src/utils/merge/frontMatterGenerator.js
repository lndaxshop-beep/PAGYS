import {
  Paragraph, TextRun, AlignmentType, HeadingLevel,
  PageBreak, TableOfContents, Table, TableRow, TableCell,
  WidthType, BorderStyle, convertInchesToTwip
} from 'docx';
import { sanitizeXmlText } from '../sanitizeText.js';

export const buildTitlePage = (project, placeholders, format) => {
  const twipMargin = (cm) => Math.round(cm * 567);
  const singleLine = Math.round(240);
  const emptyLine = () => new Paragraph({ spacing: { after: twipMargin(1.5), line: singleLine }, children: [] });
  const centered = (text, size = 14, bold = true, spacing = 0) =>
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: twipMargin(spacing), line: singleLine },
      children: [
        new TextRun({
          text: sanitizeXmlText(text), bold, size: Math.round(size * 2), font: format.fontFamily
        })
      ]
    });

  const bigSpace = () => new Paragraph({ spacing: { after: twipMargin(2.5), line: singleLine }, children: [] });
  const mediumSpace = () => new Paragraph({ spacing: { after: twipMargin(1.5), line: singleLine }, children: [] });

  return [
    emptyLine(), emptyLine(), emptyLine(),
    centered(placeholders.universityName || '[University Name]', 16),
    centered(placeholders.department || '[Department]'),
    centered(placeholders.faculty || '[Faculty]'),
    bigSpace(), bigSpace(),
    centered(project?.title || '[Thesis Title]', 18),
    mediumSpace(),
    centered('BY', 12, false),
    centered(placeholders.fullName || '[Full Name]', 14),
    centered(placeholders.studentId || '[Student ID]', 12, false),
    centered(placeholders.indexNumber || '[Index Number]', 12, false),
    bigSpace(),
    centered('Supervisor: ' + (placeholders.supervisorName || '[Supervisor Name]'), 12, false),
    bigSpace(), bigSpace(),
    centered('A thesis submitted to the ' + (placeholders.department || '[Department]') + ' in partial fulfillment of the requirements for the degree of', 11, false, 0.3),
    centered(placeholders.courseName || '[Course/Program Name]', 12, false),
    bigSpace(),
    centered(placeholders.monthYear || '[Month, Year]', 12, false),
  ];
};

export const buildDeclaration = (placeholders, format) => {
  const body = (text, indent = true) =>
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { line: Math.round(240 * 2), after: 200 },
      indent: indent ? { firstLine: convertInchesToTwip(0.5) } : undefined,
      children: [new TextRun({ text: sanitizeXmlText(text), size: 24, font: format.fontFamily })]
    });
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [new TextRun({ text: 'DECLARATION', bold: true, size: 28, font: format.fontFamily })]
    }),
    body(`I, ${placeholders.fullName || '[Full Name]'} (Student ID: ${placeholders.studentId || '[Student ID]'}), hereby declare that this thesis is my own original work and has not been submitted for any other degree or qualification at any other university.`),
    body('I further declare that all sources used in this work have been duly acknowledged and referenced in accordance with academic standards.'),
    body('All ethical guidelines and research protocols have been followed in the conduct of this study.'),
    new Paragraph({ spacing: { before: 600 } }),
    body('Signature: ___________________________________', false),
    body(`Date: ${placeholders.dateOfSubmission || '[Date of Submission]'}`, false),
    new Paragraph({ children: [new PageBreak()] }),
  ];
};

export const buildDedication = (placeholders, format) => {
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [new TextRun({ text: 'DEDICATION', bold: true, size: 28, font: format.fontFamily })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { line: Math.round(240 * 2), before: 600 },
      children: [
        new TextRun({
          text: sanitizeXmlText(placeholders.dedicationText || '[Dedication Text]'),
          italics: true, size: 24, font: format.fontFamily
        })
      ]
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ];
};

export const buildAcknowledgements = (placeholders, format) => {
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [new TextRun({ text: 'ACKNOWLEDGEMENTS', bold: true, size: 28, font: format.fontFamily })]
    }),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { line: Math.round(240 * 2), after: 200 },
      indent: { firstLine: convertInchesToTwip(0.5) },
      children: [
        new TextRun({
          text: sanitizeXmlText(placeholders.acknowledgementsText || '[Acknowledgements Text]'),
          size: 24, font: format.fontFamily
        })
      ]
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ];
};

export const buildAbstract = (abstractText, format) => {
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [new TextRun({ text: 'ABSTRACT', bold: true, size: 28, font: format.fontFamily })]
    }),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { line: Math.round(240 * 2), after: 200 },
      indent: { firstLine: convertInchesToTwip(0.5) },
      children: [
        new TextRun({
          text: sanitizeXmlText(abstractText || 'Abstract will be generated from chapter content.'),
          size: 24, font: format.fontFamily
        })
      ]
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ];
};

export const buildTableOfContents = () => {
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [new TextRun({ text: 'TABLE OF CONTENTS', bold: true, size: 28, font: 'Times New Roman' })]
    }),
    new TableOfContents('Table of Contents', {
      hyperlink: true,
      headingStyleRange: '1-3',
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ];
};

export const buildListOfFigures = (figures, format) => {
  if (!figures || figures.length === 0) return [];
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [new TextRun({ text: 'LIST OF FIGURES', bold: true, size: 28, font: format.fontFamily })]
    }),
    new TableOfContents('List of Figures', {
      captionLabel: 'Figure',
      hyperlink: true,
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ];
};

export const buildListOfTables = (tables, format) => {
  if (!tables || tables.length === 0) return [];
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [new TextRun({ text: 'LIST OF TABLES', bold: true, size: 28, font: format.fontFamily })]
    }),
    new TableOfContents('List of Tables', {
      captionLabel: 'Table',
      hyperlink: true,
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ];
};

export const buildAbbreviationsList = (abbreviations, format) => {
  if (!abbreviations || abbreviations.length === 0) return [];
  const children = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [new TextRun({ text: 'LIST OF ABBREVIATIONS', bold: true, size: 28, font: format.fontFamily })]
    }),
  ];

  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: 'Abbreviation', bold: true, size: 24, font: format.fontFamily })] })],
        width: { size: 3000, type: WidthType.DXA },
      }),
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: 'Meaning', bold: true, size: 24, font: format.fontFamily })] })],
        width: { size: 9000, type: WidthType.DXA },
      }),
    ]
  });

  const dataRows = abbreviations.map(abbr =>
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: sanitizeXmlText(abbr.abbr || ''), size: 24, font: format.fontFamily })] })],
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: sanitizeXmlText(abbr.meaning || ''), size: 24, font: format.fontFamily })] })],
        }),
      ]
    })
  );

  children.push(
    new Table({
      rows: [headerRow, ...dataRows],
      width: { size: 100, type: WidthType.PERCENTAGE },
    })
  );
  children.push(new Paragraph({ children: [new PageBreak()] }));
  return children;
};