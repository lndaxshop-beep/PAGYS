import { extractTextFromFile } from '../fileExtractors';

let cachedStyles = null;

export const parseTemplate = async (file) => {
  if (!file) return getDefaultFormatConfig();
  try {
    const ext = file.name?.split('.').pop()?.toLowerCase();
    if (ext === 'docx') return await parseDocxTemplate(file);
    if (ext === 'pdf') return await parsePdfTemplate(file);
    return getDefaultFormatConfig();
  } catch {
    return getDefaultFormatConfig();
  }
};

const parseDocxTemplate = async (file) => {
  try {
    const JSZip = (await import('jszip')).default;
    const zip = await JSZip.loadAsync(file);
    const styleXml = await zip.file('word/styles.xml')?.async('string');
    const documentXml = await zip.file('word/document.xml')?.async('string');
    if (!styleXml && !documentXml) return getDefaultFormatConfig();
    return extractFormatConfig(styleXml, documentXml);
  } catch {
    return getDefaultFormatConfig();
  }
};

const extractFormatConfig = (styleXml, documentXml) => {
  const config = getDefaultFormatConfig();
  if (styleXml) {
    const fontMatch = styleXml.match(/w:rFonts[^>]*w:ascii="([^"]+)"/);
    if (fontMatch) config.fontFamily = fontMatch[1];
    const szMatch = styleXml.match(/w:sz[^>]*w:val="([^"]+)"/);
    if (szMatch) config.bodyFontSize = Math.round(parseInt(szMatch[1]) / 2);
    const spacingMatch = styleXml.match(/w:line[^>]*w:val="([^"]+)"/);
    if (spacingMatch) config.lineSpacing = Math.round(parseInt(spacingMatch[1]) / 240);
    const headingFonts = {};
    const headingPattern = /w:style[^>]*w:type="paragraph"[^>]*>[\s\S]*?w:name[^>]*w:val="(heading\s*\d)"[^>]*>[\s\S]*?w:rFonts[^>]*w:ascii="([^"]+)"/gi;
    let hMatch;
    while ((hMatch = headingPattern.exec(styleXml)) !== null) {
      const num = parseInt(hMatch[1].replace(/\D/g, ''));
      if (num >= 1 && num <= 3) headingFonts[`heading${num}`] = hMatch[2];
    }
    if (Object.keys(headingFonts).length) config.headingFonts = headingFonts;
    const headingSzPattern = /w:style[^>]*w:type="paragraph"[^>]*>[\s\S]*?w:name[^>]*w:val="(heading\s*\d)"[^>]*>[\s\S]*?w:sz[^>]*w:val="([^"]+)"/gi;
    let hSzMatch;
    while ((hSzMatch = headingSzPattern.exec(styleXml)) !== null) {
      const num = parseInt(hSzMatch[1].replace(/\D/g, ''));
      const sz = Math.round(parseInt(hSzMatch[2]) / 2);
      if (num >= 1 && num <= 3) config[`heading${num}Size`] = sz;
    }
  }
  if (documentXml) {
    const marginMatch = documentXml.match(/w:pgMar[^>]*w:top="(\d+)"[^>]*w:right="(\d+)"[^>]*w:bottom="(\d+)"[^>]*w:left="(\d+)"/);
    if (marginMatch) {
      config.margins = {
        top: Math.round(parseInt(marginMatch[1]) / 1440 * 2.54 * 10) / 10,
        right: Math.round(parseInt(marginMatch[2]) / 1440 * 2.54 * 10) / 10,
        bottom: Math.round(parseInt(marginMatch[3]) / 1440 * 2.54 * 10) / 10,
        left: Math.round(parseInt(marginMatch[4]) / 1440 * 2.54 * 10) / 10,
      };
    }
    const sections = [];
    const headingRegex = /<w:p[^>]*>[\s\S]*?<w:pStyle[^>]*w:val="(\d+)"[^>]*\/>[\s\S]*?<w:t[^>]*>([^<]+)<\/w:t>[\s\S]*?<\/w:p>/gi;
    let secMatch;
    while ((secMatch = headingRegex.exec(documentXml)) !== null) {
      sections.push({ level: secMatch[1], text: secMatch[2].trim() });
    }
    if (sections.length > 0) config.sectionOrder = sections;
  }
  return config;
};

const parsePdfTemplate = async (file) => {
  const result = await extractTextFromFile(file);
  const text = result?.text || '';
  if (!text || text.length < 50) return getDefaultFormatConfig();
  try {
    const { generateSubtopics } = await import('../../services/geminiService');
    const analysis = await generateSubtopics({
      chapterId: 'template',
      chapterTitle: 'Thesis Format Analysis',
      topic: 'Extract thesis structure from format guide',
      field: 'academic writing',
      level: 'postgraduate',
      methodology: 'mixed',
      referenceData: {
        type: 'combined',
        text: `Extract the section order, heading structure, and formatting rules from this university thesis format guide:\n\n${text.substring(0, 8000)}`,
        files: []
      }
    });
    if (analysis && Array.isArray(analysis)) {
      const config = getDefaultFormatConfig();
      config.sectionOrder = analysis.map((h, i) => ({ level: '1', text: h }));
      config.source = 'pdf-ai-extracted';
      return config;
    }
  } catch {}
  return getDefaultFormatConfig();
};

export const getDefaultFormatConfig = () => ({
  pageMargins: { top: 2.54, right: 2.54, bottom: 2.54, left: 2.54 },
  fontFamily: 'Times New Roman',
  bodyFontSize: 12,
  headingFonts: { heading1: 'Times New Roman', heading2: 'Times New Roman', heading3: 'Times New Roman' },
  heading1Size: 14,
  heading2Size: 13,
  heading3Size: 12,
  lineSpacing: 2.0,
  sectionOrder: null,
  source: 'default'
});

export default parseTemplate;