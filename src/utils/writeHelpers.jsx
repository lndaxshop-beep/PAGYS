import React from 'react';
import DiagramRenderer from '../components/DiagramRenderer';
import ChartRenderer from '../components/ChartRenderer';
import TableRenderer from '../components/TableRenderer';

export const calculateOverallProgress = (chapters, generatedSubsections) => {
  let total = 0, generated = 0;
  chapters.forEach(ch => {
    const active = ch.subsections?.filter(s => s.title !== 'References' && !s.deleted) || [];
    total += active.length;
    generated += active.filter(s => s.generated).length;
  });
  return { percentage: total > 0 ? Math.round((generated / total) * 100) : 0, generated, total };
};

export const isHumaniseAvailable = (activeSubsections, currentSubsectionIndex, humaniseUsed, humaniseLimit, isViewingReferences) => {
  if (isViewingReferences) return false;
  const sub = activeSubsections[currentSubsectionIndex];
  if (!sub || !sub.generated) return false;
  return (humaniseUsed[`${activeSubsections[currentSubsectionIndex] ? `chapter_${activeSubsections[currentSubsectionIndex].id}` : ''}_${sub.id}`] || 0) < humaniseLimit;
};

export const isFeedbackAvailable = (activeSubsections, currentSubsectionIndex, feedbackUsed, feedbackLimit, isViewingReferences) => {
  if (isViewingReferences) return false;
  const sub = activeSubsections[currentSubsectionIndex];
  if (!sub || !sub.generated) return false;
  return (feedbackUsed[`chapter_${activeSubsections[currentSubsectionIndex]?.id}_${sub.id}`] || 0) < feedbackLimit;
};

const ContentRenderer = ({ content }) => {
  const blocks = parseContentBlocks(content || '');
  return (
    <div>
      {blocks.map((block, i) => {
        if (block.type === 'diagram') return <DiagramRenderer key={i} code={block.code} title={block.title} caption={block.caption} />;
        if (block.type === 'chart') return <ChartRenderer key={i} data={block.data} />;
        if (block.type === 'table') return <TableRenderer key={i} data={block.data} />;
        return <div key={i} dangerouslySetInnerHTML={{ __html: block.html || '' }} style={{ fontFamily: "'Times New Roman', serif", fontSize: '12pt', lineHeight: '1.6', textAlign: 'justify', marginBottom: '16px' }} />;
      })}
    </div>
  );
};

export const parseContentBlocks = (content) => {
  if (!content) return [];
  const lines = content.split('\n');
  const blocks = [];
  let currentHtml = '';
  let inDiagram = false, inChart = false, inTable = false;
  let diagramCode = '', diagramTitle = '', diagramCaption = '';
  let chartDataStr = '', tableDataStr = '';

  for (const line of lines) {
    if (line.startsWith('```mermaid')) { inDiagram = true; diagramCode = ''; diagramTitle = ''; diagramCaption = ''; continue; }
    if (line.startsWith('```chart')) { inChart = true; chartDataStr = ''; continue; }
    if (line.startsWith('```table')) { inTable = true; tableDataStr = ''; continue; }
    if (line === '```') {
      if (inDiagram && diagramCode) { blocks.push({ type: 'diagram', code: diagramCode.trim(), title: diagramTitle, caption: diagramCaption }); inDiagram = false; }
      else if (inChart && chartDataStr) { try { blocks.push({ type: 'chart', data: JSON.parse(chartDataStr.trim()) }); } catch { blocks.push({ type: 'text', html: `<p>Invalid chart data</p>` }); } inChart = false; }
      else if (inTable && tableDataStr) { try { blocks.push({ type: 'table', data: JSON.parse(tableDataStr.trim()) }); } catch { blocks.push({ type: 'text', html: `<p>Invalid table data</p>` }); } inTable = false; }
      continue;
    }
    if (inDiagram) {
      if (line.startsWith('%% title:')) diagramTitle = line.replace('%% title:', '').trim();
      else if (line.startsWith('%% caption:')) diagramCaption = line.replace('%% caption:', '').trim();
      else diagramCode += line + '\n';
      continue;
    }
    if (inChart) { chartDataStr += line + '\n'; continue; }
    if (inTable) { tableDataStr += line + '\n'; continue; }
    if (line.trim() === '') { if (currentHtml) { blocks.push({ type: 'text', html: currentHtml.trim() }); currentHtml = ''; } continue; }
    if (line.startsWith('# ')) currentHtml += `<h1>${line.slice(2)}</h1>`;
    else if (line.startsWith('## ')) currentHtml += `<h2>${line.slice(3)}</h2>`;
    else if (line.startsWith('### ')) currentHtml += `<h3>${line.slice(4)}</h3>`;
    else if (line.startsWith('- ')) currentHtml += `<li>${line.slice(2)}</li>`;
    else if (line.match(/^\d+\.\s/)) currentHtml += `<li>${line.replace(/^\d+\.\s/, '')}</li>`;
    else if (line.startsWith('**') && line.endsWith('**')) currentHtml += `<strong>${line.slice(2, -2)}</strong><br/>`;
    else currentHtml += `<p>${line}</p>`;
  }
  if (currentHtml) blocks.push({ type: 'text', html: currentHtml.trim() });
  return blocks;
};

export default ContentRenderer;

export const getWordCountPresets = (level) => {
  const presets = {
    undergraduate: { proposal: { min: 1000, max: 1500 }, chapter1: { min: 1000, max: 1800 }, chapter2: { min: 2500, max: 4000 }, chapter3: { min: 1500, max: 2500 }, chapter4: { min: 1500, max: 3000 }, chapter5: { min: 1000, max: 2000 } },
    masters: { proposal: { min: 1500, max: 2000 }, chapter1: { min: 1500, max: 2500 }, chapter2: { min: 4000, max: 7000 }, chapter3: { min: 2500, max: 4000 }, chapter4: { min: 3000, max: 5000 }, chapter5: { min: 2500, max: 4000 } },
    phd: { proposal: { min: 2000, max: 3000 }, chapter1: { min: 4000, max: 6000 }, chapter2: { min: 15000, max: 25000 }, chapter3: { min: 8000, max: 12000 }, chapter4: { min: 10000, max: 20000 }, chapter5: { min: 10000, max: 15000 } },
  };
  return presets[level] || presets.undergraduate;
};

export const getFallbackSubtopics = (chapterId) => {
  const subtopics = {
    proposal: ['Introduction', 'Background of the Study', 'Problem Statement', 'Research Objectives', 'Research Questions', 'Significance of the Study', 'Methodology Overview', 'Definition of Terms', 'Limitations', 'Structure of the Proposal'],
    chapter1: ['Introduction', 'Background of the Study', 'Problem Statement', 'Research Objectives', 'Research Questions', 'Significance of the Study', 'Scope and Limitations', 'Definition of Terms'],
    chapter2: ['Introduction', 'Theoretical Framework', 'Conceptual Framework', 'Empirical Review', 'Research Gaps', 'Summary'],
    chapter3: ['Introduction', 'Research Design', 'Population and Sampling', 'Data Collection Methods', 'Data Analysis Procedures', 'Reliability and Validity', 'Ethical Considerations'],
    chapter4: ['Introduction', 'Descriptive Statistics', 'Data Analysis', 'Findings', 'Summary'],
    chapter5: ['Introduction', 'Summary of Findings', 'Discussion of Findings', 'Implications', 'Recommendations', 'Conclusions', 'Suggestions for Future Research'],
  };
  return (subtopics[chapterId] || []).map((title, i) => ({ id: `${chapterId}_sub_${i + 1}`, title, generated: false }));
};

export const renumberSubsections = (subsections, chapterId) => {
  const chapterNum = chapterId === 'proposal' ? 'P' : chapterId.replace('chapter', '');
  return subsections.map((sub, i) => ({
    ...sub,
    id: `${chapterId}_sub_${i + 1}`,
    number: `${chapterNum}.${i + 1}`
  }));
};

export const distributeWordCount = (min, max, subsections, currentTitle) => {
  const count = subsections.length;
  if (count === 0) return { min: 0, max: 0 };

  const analyticalKeywords = ['framework', 'review', 'analysis', 'findings', 'discussion', 'design', 'methodology', 'conceptual', 'theoretical', 'empirical', 'data', 'results'];
  const structuralKeywords = ['objectives', 'scope', 'significance', 'definitions', 'limitations', 'ethics', 'background', 'introduction', 'summary', 'conclusion', 'recommendations', 'problem statement'];

  const weights = subsections.map((sub, index) => {
    if (count === 1) return 1.0;
    const title = sub.title.toLowerCase();
    if (index === 0 || index === count - 1) {
      const isAnalytical = analyticalKeywords.some(kw => title.includes(kw));
      return isAnalytical ? 1.0 : 0.6;
    }
    const isAnalytical = analyticalKeywords.some(kw => title.includes(kw));
    if (isAnalytical) return 1.3;
    const isStructural = structuralKeywords.some(kw => title.includes(kw));
    if (isStructural) return 0.7;
    return 1.0;
  });

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  const currentIndex = subsections.findIndex(s => s.title === currentTitle);
  const weight = weights[currentIndex >= 0 ? currentIndex : 0] || 1.0;

  return {
    min: Math.floor((min / totalWeight) * weight),
    max: Math.floor((max / totalWeight) * weight)
  };
};

export const extractCitations = (content) => {
  if (!content) return [];
  const regex = /\(([A-Z][a-zA-Z\s&,\.\-\';]+(?:et al[.,]*)?(?:\s*[;]\s*[A-Z][a-zA-Z\s&,\.\-\';]+(?:et al[.,]*)?)*,\s*\d{4})\)/g;
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

export const formatGroundedReference = (source, style) => {
  if (!source || !source.uri) return null;
  const url = source.uri;
  let domain = '';
  try {
    const hostname = new URL(url).hostname;
    domain = hostname.replace('www.', '').replace(/^([a-z]{2}\.)*/, '');
  } catch {
    domain = url.slice(0, 40);
  }
  const title = source.title || domain.charAt(0).toUpperCase() + domain.slice(1);
  if (style === 'apa') return `${domain}. (n.d.). ${title}. Retrieved from ${url}`;
  if (style === 'mla') return `"${title}." ${domain}, ${url}.`;
  if (style === 'harvard') return `${domain} (n.d.). ${title}. Available at: ${url}.`;
  return `${domain}. ${title}. ${url}`;
};

export const formatSimpleReference = (author, year, style) => {
  const y = year || 'n.d.';
  if (style === 'apa') return `${author}. (${y}). Title of the work. Source.`;
  if (style === 'mla') return `${author}. "Title of the Work." Source, ${y}.`;
  if (style === 'chicago') return `${author}. ${y}. "Title of the Work." Source.`;
  if (style === 'harvard') return `${author} (${y}). Title of the work. Source.`;
  if (style === 'ieee') return `${author}, "Title of the work." Source, ${y}.`;
  return `${author}. (${y}). Title of the work. Source.`;
};
