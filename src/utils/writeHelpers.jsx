import React from 'react';
import DOMPurify from 'dompurify';
import ChartRenderer from '../components/ChartRenderer';
import TableRenderer from '../components/TableRenderer';
import DiagramRenderer from '../components/DiagramRenderer';
import { CHART_MARKER_RE, parseChartMarker, FRAMEWORK_MARKER_RE, parseFrameworkBlock, markdownTableRe, parseMarkdownTable, detectPlainTextHierarchy } from './visualDataModel.js';

const sanitizeHtml = (str) => {
  if (typeof str !== 'string') return '';
  return DOMPurify.sanitize(str, { ALLOWED_TAGS: [] });
};

export const calculateOverallProgress = (chapters, generatedSubsections) => {
  let total = 0, generated = 0;
  chapters.forEach(ch => {
    const active = ch.subsections?.filter(s => s.type !== 'references' && !s.deleted) || [];
    active.forEach(s => {
      total += 1;
      if (s.generated) generated += 1;
      (s.children || []).forEach(c => {
        total += 1;
        if (c.generated) generated += 1;
      });
    });
  });
  return { percentage: total > 0 ? Math.round((generated / total) * 100) : 0, generated, total };
};

const ContentRenderer = ({ content, colors, onEditVisual }) => {
  const blocks = parseContentBlocks(content || '');
  return (
    <div>
      {blocks.map((block, i) => {
        if (block.type === 'diagram') return <DiagramRenderer key={`d_${i}_${block.title}`} diagramData={block.data} title={block.title} onEdit={onEditVisual ? (d) => onEditVisual(i, d) : undefined} />;
        if (block.type === 'chart') return <ChartRenderer key={`c_${i}_${block.title}`} chartType={block.chartType} data={{ labels: block.labels, values: block.values }} title={block.title} caption={block.caption} onEdit={onEditVisual ? (d) => onEditVisual(i, d) : undefined} />;
        if (block.type === 'table') return <TableRenderer key={`t_${i}_${block.title}`} headers={block.headers} rows={block.rows} title={block.title} caption={block.caption} onEdit={onEditVisual ? (d) => onEditVisual(i, d) : undefined} />;
        return <div key={i} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(block.html, { ALLOWED_TAGS: ['p', 'h1', 'h2', 'h3', 'li', 'strong', 'em', 'br', 'ul', 'ol'], ALLOWED_ATTR: [] }) }} style={{ fontFamily: "'Times New Roman', serif", fontSize: '12pt', lineHeight: '1.6', textAlign: 'justify', marginBottom: '16px', color: colors?.text || 'inherit' }} />;
      })}
    </div>
  );
};

export const parseContentBlocks = (content) => {
  if (!content) return [];
  let processedContent = content.replace(/<p[^>]*>/gi, '\n').replace(/<\/p>/gi, '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/?span[^>]*>/gi, '').replace(/<\/?strong[^>]*>/gi, '').replace(/<\/?em[^>]*>/gi, '');
  const plainHierarchy = detectPlainTextHierarchy(processedContent);
  if (plainHierarchy) processedContent = processedContent + '\n\n' + plainHierarchy;
  const lines = processedContent.split('\n');
  const blocks = [];
  let currentHtml = '';
  let inTable = false;
  let tableLines = [];
  let inFramework = false;
  let frameworkText = '';
  let lastVisualTitle = '';

  const flushHtml = () => {
    if (currentHtml) {
      const cleaned = currentHtml.trim();
      if (cleaned) {
        const strippedHtml = cleaned.replace(/<[^>]+>/g, '').trim();
        if (!lastVisualTitle || strippedHtml.length < 5 || similarity(strippedHtml, lastVisualTitle) < 0.85) {
          blocks.push({ type: 'text', html: cleaned });
        }
      }
      currentHtml = '';
    }
  };

  const pushVisual = (visualBlock) => {
    if (visualBlock.title && blocks.length > 0) {
      const prev = blocks[blocks.length - 1];
      if (prev.type === 'text') {
        const stripped = (prev.html || '').replace(/<[^>]+>/g, '').trim();
        if (stripped.length >= 5 && similarity(stripped, visualBlock.title) >= 0.85) {
          blocks.pop();
        }
      }
    }
    lastVisualTitle = visualBlock.title || '';
    blocks.push(visualBlock);
  };

  const similarity = (a, b) => {
    if (!a || !b) return 0;
    const wordsA = a.toLowerCase().split(/\s+/).filter(Boolean);
    const wordsB = b.toLowerCase().split(/\s+/).filter(Boolean);
    if (wordsA.length < 2 || wordsB.length < 2) return 0;
    const common = wordsA.filter(w => wordsB.includes(w)).length;
    return common / Math.max(wordsA.length, wordsB.length);
  };

  const flushTable = () => {
    if (tableLines.length >= 2) {
      const parsed = parseMarkdownTable(tableLines);
      if (parsed) {
        pushVisual({ type: 'table', headers: parsed.headers, rows: parsed.rows, caption: parsed.caption, title: parsed.caption || 'Table', originalText: tableLines.join('\n') });
      }
    }
    tableLines = [];
    inTable = false;
  };

  const flushFramework = () => {
    if (frameworkText) {
      const parsed = parseFrameworkBlock(frameworkText);
      if (parsed && (parsed.independent.length > 0 || parsed.dependent.length > 0 || parsed.hierarchy?.length > 0)) {
        pushVisual({ type: 'diagram', data: parsed, title: parsed.title || 'Conceptual Framework', originalText: frameworkText });
      }
      frameworkText = '';
      inFramework = false;
    }
  };

  for (const line of lines) {
    if (/^\[FRAMEWORK:/i.test(line)) {
      flushHtml();
      flushTable();
      if (inFramework) flushFramework();
      inFramework = true;
      frameworkText = line;
      if (/\]\s*$/.test(line)) flushFramework();
      continue;
    }
    if (inFramework) {
      frameworkText += '\n' + line;
      if (/\]\s*$/.test(line)) flushFramework();
      continue;
    }

    const chartMatch = line.match(CHART_MARKER_RE);
    if (chartMatch) {
      flushHtml();
      flushTable();
      const parsed = parseChartMarker(line);
      if (parsed) {
        pushVisual({ type: 'chart', chartType: parsed.chartType, labels: parsed.labels, values: parsed.values, title: parsed.title, caption: parsed.caption, originalText: line });
      } else {
        currentHtml += `<p>${line}</p>`;
      }
      continue;
    }

    if (markdownTableRe.test(line)) {
      flushHtml();
      if (!inTable) { inTable = true; tableLines = []; }
      tableLines.push(line);
      continue;
    } else if (inTable) {
      flushTable();
    }

    if (line.trim() === '') {
      if (inTable) flushTable();
      flushHtml();
      continue;
    }

    if (line.startsWith('# ')) currentHtml += `<h1>${sanitizeHtml(line.slice(2))}</h1>`;
    else if (line.startsWith('## ')) currentHtml += `<h2>${sanitizeHtml(line.slice(3))}</h2>`;
    else if (line.startsWith('### ')) currentHtml += `<h3>${sanitizeHtml(line.slice(4))}</h3>`;
    else if (line.startsWith('- ')) currentHtml += `<li>${sanitizeHtml(line.slice(2))}</li>`;
    else if (line.match(/^\d+\.\s/)) currentHtml += `<li>${sanitizeHtml(line.replace(/^\d+\.\s/, ''))}</li>`;
    else if (line.startsWith('**') && line.endsWith('**')) currentHtml += `<strong>${sanitizeHtml(line.slice(2, -2))}</strong><br/>`;
    else currentHtml += `<p>${sanitizeHtml(line)}</p>`;
  }

  flushTable();
  if (inFramework) flushFramework();
  flushHtml();
  return blocks;
};

export default ContentRenderer;

export const getChapterDisplayTitle = (chapter) => chapter?.customTitle || chapter?.title || '';

export const getChapterOrdinal = (chapter, chapters) => {
  const index = chapters.findIndex(ch => ch.id === chapter.id);
  return chapter?.id === 'proposal' ? 1 : index;
};

export const getChapterGuidelines = (chapter) => chapter?.guidelines || '';

export const getWordCountPresets = (level) => {
  const presets = {
    undergraduate: { proposal: { min: 1000, max: 1500 }, chapter1: { min: 1000, max: 1800 }, chapter2: { min: 2500, max: 4000 }, chapter3: { min: 1500, max: 2500 }, chapter4: { min: 1500, max: 3000 }, chapter5: { min: 1000, max: 2000 }, default: { min: 1000, max: 2000 } },
    masters: { proposal: { min: 1500, max: 2000 }, chapter1: { min: 1500, max: 2500 }, chapter2: { min: 4000, max: 7000 }, chapter3: { min: 2500, max: 4000 }, chapter4: { min: 3000, max: 5000 }, chapter5: { min: 2500, max: 4000 }, default: { min: 1500, max: 2500 } },
    phd: { proposal: { min: 2000, max: 3000 }, chapter1: { min: 4000, max: 6000 }, chapter2: { min: 15000, max: 25000 }, chapter3: { min: 8000, max: 12000 }, chapter4: { min: 10000, max: 20000 }, chapter5: { min: 10000, max: 15000 }, default: { min: 4000, max: 6000 } },
  };
  return presets[level] || presets.undergraduate;
};

export const getFallbackSubtopics = (chapterId, chapterTitle) => {
  const subtopics = {
    proposal: ['Introduction', 'Background of the Study', 'Problem Statement', 'Research Objectives', 'Research Questions', 'Significance of the Study', 'Methodology Overview', 'Definition of Terms', 'Limitations', 'Structure of the Proposal'],
    chapter1: ['Introduction', 'Background of the Study', 'Problem Statement', 'Research Objectives', 'Research Questions', 'Significance of the Study', 'Scope and Limitations', 'Definition of Terms'],
    chapter2: ['Introduction', 'Theoretical Framework', 'Conceptual Framework', 'Empirical Review', 'Research Gaps', 'Summary'],
    chapter3: ['Introduction', 'Research Design', 'Population and Sampling', 'Data Collection Methods', 'Data Analysis Procedures', 'Reliability and Validity', 'Ethical Considerations'],
    chapter4: ['Introduction', 'Descriptive Statistics', 'Data Analysis', 'Findings', 'Summary'],
    chapter5: ['Introduction', 'Summary of Findings', 'Discussion of Findings', 'Implications', 'Recommendations', 'Conclusions', 'Suggestions for Future Research'],
  };
  if (subtopics[chapterId]) return subtopics[chapterId].map((title, i) => ({ id: `${chapterId}_sub_${i + 1}`, title, generated: false }));
  const displayTitle = chapterTitle || chapterId;
  return ['Introduction', `Overview of ${displayTitle}`, `Key Concepts in ${displayTitle}`, `Analysis and Discussion`, `Summary`].map((title, i) => ({ id: `${chapterId}_sub_${i + 1}`, title, generated: false }));
};

export const renumberSubsections = (subsections, chapterId, chapterNumber) => {
  const chapterNum = chapterNumber || chapterId.replace('chapter', '');
  return subsections.map((sub, i) => {
    const newNumber = `${chapterNum}.${i + 1}`;
    const newTitle = sub.type === 'references' ? sub.title
      : sub.title.match(/^[pP\d]+(\.\d+)*\s+/)
        ? sub.title.replace(/^[pP\d]+(\.\d+)*\s+/, `${newNumber} `)
        : `${newNumber} ${sub.title}`;
    const newChildren = (sub.children || []).map((child, ci) => {
      const childNum = `${newNumber}.${ci + 1}`;
      return { ...child, number: childNum, title: child.title.match(/^[\d.]+\.\d+\s+/) ? child.title.replace(/^[\d.]+\.\d+\s+/, `${childNum} `) : `${childNum} ${child.title}` };
    });
    return { ...sub, number: newNumber, title: newTitle, children: newChildren };
  });
};

export const distributeWordCount = (min, max, subsections, currentTitle) => {
  const count = subsections.length;
  if (count === 0) return { min: 0, max: 0 };
  const analyticalKeywords = ['framework', 'review', 'analysis', 'findings', 'discussion', 'design', 'methodology', 'conceptual', 'theoretical', 'empirical', 'data', 'results'];
  const structuralKeywords = ['objectives', 'scope', 'significance', 'definitions', 'limitations', 'ethics', 'background', 'introduction', 'summary', 'conclusion', 'recommendations', 'problem statement'];
  const weights = subsections.map((sub, index) => {
    if (count === 1) return 1.0;
    const title = sub.title.toLowerCase();
    if (index === 0 || index === count - 1) { return analyticalKeywords.some(kw => title.includes(kw)) ? 1.0 : 0.6; }
    return analyticalKeywords.some(kw => title.includes(kw)) ? 1.3 : structuralKeywords.some(kw => title.includes(kw)) ? 0.7 : 1.0;
  });
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  const currentIndex = subsections.findIndex(s => s.title === currentTitle);
  const weight = weights[currentIndex >= 0 ? currentIndex : 0] || 1.0;
  return { min: Math.floor((min / totalWeight) * weight), max: Math.floor((max / totalWeight) * weight) };
};

export const extractCitations = (content) => {
  if (!content) return [];
  const regex = /\(([A-Z][a-zA-Z\s&,\.\-\';]+(?:et\s+al[.,]*)?(?:\s*[;]\s*[A-Z][a-zA-Z\s&,\.\-\';]+(?:et\s+al[.,]*)?)*,\s*\d{4}[a-z]?)\)/g;
  const matches = content.match(regex) || [];
  return matches.map(m => m.slice(1, -1).trim());
};

export const formatCitationEntry = (citation, style) => {
  if (!citation) return null;
  const parts = citation.split(',');
  if (parts.length < 2) return null;
  const author = parts[0].trim();
  const year = parts.slice(1).join(',').trim();
  if (style === 'apa') return `${author} (${year}). [Retrieved from source].`;
  if (style === 'mla') return `${author}. "${year}." [Retrieved from source].`;
  return `${author}. ${year}. [Retrieved from source].`;
};

const academicDomains = ['doi.org', 'scholar.google', 'pubmed', 'jstor', 'springer', 'elsevier', 'sciencedirect', 'wiley', 'tandfonline', 'sage', 'nature', 'ieee', 'scopus', 'arxiv', 'researchgate', 'academia.edu', 'ncbi.nlm.nih', 'link.springer', 'onlinelibrary.wiley', 'journals.sagepub'];
const generalWebDomains = ['wikipedia', 'quora', 'reddit', 'medium', 'blog', 'wordpress'];

const detectSourceType = (domain, uri) => {
  const lower = (domain + ' ' + uri).toLowerCase();
  if (academicDomains.some(d => lower.includes(d))) return 'academic';
  if (generalWebDomains.some(d => lower.includes(d))) return 'web';
  if (/\.edu($|\/)|\.ac\./.test(uri)) return 'academic';
  if (/\/article\/|\/paper\/|\/journal\/|\/publication\//.test(uri)) return 'academic';
  return 'web';
};

export const formatGroundedReference = (source, style) => {
  if (!source || !source.uri) return null;
  const url = source.uri;
  let domain = '';
  try { const hostname = new URL(url).hostname; domain = hostname.replace('www.', '').replace(/^([a-z]{2}\.)*/, ''); } catch { domain = url.slice(0, 40); }
  const title = source.title || domain.charAt(0).toUpperCase() + domain.slice(1);
  const sourceType = detectSourceType(domain, url);
  const hasUrl = sourceType === 'web';
  const cleanDomain = domain.charAt(0).toUpperCase() + domain.slice(1);
  if (style === 'apa') return hasUrl ? `${cleanDomain}. (n.d.). ${title}. ${url}` : `${cleanDomain}. (n.d.). ${title}.`;
  if (style === 'mla') return hasUrl ? `"${title}." ${cleanDomain}, ${url}.` : `"${title}." ${cleanDomain}.`;
  if (style === 'harvard') return hasUrl ? `${cleanDomain} (n.d.). ${title}. Available at: ${url}.` : `${cleanDomain} (n.d.). ${title}.`;
  if (style === 'chicago') return hasUrl ? `"${title}." ${cleanDomain}. ${url}.` : `"${title}." ${cleanDomain}.`;
  if (style === 'ieee') return hasUrl ? `"${title}," ${cleanDomain}. [Online]. Available: ${url}` : `"${title}," ${cleanDomain}.`;
  if (hasUrl) return `${cleanDomain}. ${title}. ${url}`;
  return `${cleanDomain}. ${title}.`;
};

export const normalizeNumbering = (text) => {
  const romanMap = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10 };
  return text.split('\n').map(line => {
    const trimmed = line.trim();
    if (!trimmed) return line;
    if (/^\d+\.\d/.test(trimmed)) return line;
    const match = trimmed.match(/^([IVX]+)(?:\.(\d+(?:\.\d+)*))?[.)\s]+\s*(.+)/);
    if (match && romanMap[match[1]]) {
      const num = romanMap[match[1]];
      const sub = match[2] ? `.${match[2]}` : '.0';
      return `${num}${sub} ${match[3]}`;
    }
    return line;
  }).join('\n');
};

export const formatSimpleReference = (author, year) => {
  const y = year || 'n.d.';
  return `[UNVERIFIED CITATION NEEDS MANUAL REVIEW: ${author}, ${y}]`;
};
