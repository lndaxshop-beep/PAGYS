import {
  Document, Packer, Paragraph, TextRun, AlignmentType,
  HeadingLevel, Header, PageNumber, NumberFormat
} from 'docx';
import { parseChapterContent } from './chapterContentParser.js';
import { sanitizeXmlText } from '../sanitizeText.js';

const DEFAULT_FORMAT = {
  fontFamily: 'Times New Roman',
  bodyFontSize: 12,
  lineSpacing: 2,
  pageMargins: { top: 2.54, right: 2.54, bottom: 2.54, left: 2.54 },
};

const twipsFromCm = (cm) => Math.round(cm * 1440 / 2.54);

export const generateChapterDocument = async ({ chapter, content, formatConfig }) => {
  const fmt = formatConfig || DEFAULT_FORMAT;
  const fontFamily = fmt.fontFamily || DEFAULT_FORMAT.fontFamily;
  const bodyFontSize = Math.round((fmt.bodyFontSize || 12) * 2);
  const lineSpacing = Math.round(240 * (fmt.lineSpacing || 2));
  const margins = fmt.pageMargins || DEFAULT_FORMAT.pageMargins;

  const marginProps = {
    top: twipsFromCm(margins.top),
    right: twipsFromCm(margins.right),
    bottom: twipsFromCm(margins.bottom),
    left: twipsFromCm(margins.left),
  };

  const children = [];

  const displayTitle = chapter.customTitle || chapter.title;
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { before: 480, after: 240 },
      children: [new TextRun({ text: sanitizeXmlText(displayTitle), bold: true, size: 28, font: fontFamily })]
    })
  );

  const parsedChildren = await parseChapterContent(content || {}, chapter.id, fmt);
  children.push(...parsedChildren);

  if (content?.references) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { before: 480, after: 240 },
        children: [new TextRun({ text: 'REFERENCES', bold: true, size: 28, font: fontFamily })]
      })
    );
    const refLines = content.references.split('\n').filter(Boolean);
    refLines.forEach(line => {
      children.push(
        new Paragraph({
          spacing: { after: 120 },
          indent: { left: 360, hanging: 360 },
          children: [new TextRun({ text: sanitizeXmlText(line.trim()), size: 24, font: fontFamily })]
        })
      );
    });
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: fontFamily, size: bodyFontSize },
          paragraph: { spacing: { line: lineSpacing } },
        },
        heading1: {
          run: { bold: true, font: fontFamily, size: 28 },
          paragraph: { spacing: { before: 480, after: 240 } },
        },
        heading2: {
          run: { bold: true, font: fontFamily, size: 26 },
          paragraph: { spacing: { before: 360, after: 180 } },
        },
        heading3: {
          run: { bold: true, font: fontFamily, size: 24 },
          paragraph: { spacing: { before: 240, after: 120 } },
        },
      },
    },
    sections: [{
      properties: {
        page: {
          margin: marginProps,
          pageNumbers: { formatType: NumberFormat.DECIMAL, start: 1 },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({ children: [PageNumber.CURRENT], size: 20, font: fontFamily })],
            }),
          ],
        }),
      },
      children,
    }],
  });

  return await Packer.toBlob(doc);
};

export default generateChapterDocument;
