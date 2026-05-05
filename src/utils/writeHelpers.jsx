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
    undergraduate: { chapter1: 1500, chapter2: 2500, chapter3: 1500, chapter4: 2000, chapter5: 1500 },
    masters: { chapter1: 2500, chapter2: 4000, chapter3: 2500, chapter4: 3500, chapter5: 2500 },
    phd: { chapter1: 4000, chapter2: 6000, chapter3: 4000, chapter4: 5000, chapter5: 4000 },
  };
  return presets[level] || presets.undergraduate;
};

export const getFallbackSubtopics = (chapterId) => {
  const subtopics = {
    chapter1: ['Introduction', 'Background of the Study', 'Problem Statement', 'Research Objectives', 'Research Questions', 'Significance of the Study', 'Scope and Limitations', 'Definition of Terms'],
    chapter2: ['Theoretical Framework', 'Conceptual Framework', 'Empirical Review', 'Research Gaps', 'Summary'],
    chapter3: ['Research Design', 'Population and Sampling', 'Data Collection Methods', 'Data Analysis Procedures', 'Ethical Considerations'],
    chapter4: ['Data Presentation', 'Data Analysis', 'Findings', 'Discussion of Findings'],
    chapter5: ['Summary of Findings', 'Conclusions', 'Recommendations', 'References'],
  };
  return (subtopics[chapterId] || []).map((title, i) => ({ id: `${chapterId}_sub_${i + 1}`, title, generated: false }));
};

export const renumberSubsections = (subsections, chapterId) => {
  const chapterNum = chapterId.replace('chapter', '');
  return subsections.map((sub, i) => ({
    ...sub,
    id: `${chapterId}_sub_${i + 1}`,
    number: `${chapterNum}.${i + 1}`
  }));
};

export const distributeWordCount = (min, max, subsections, currentTitle) => {
  const total = Math.round((min + max) / 2);
  const count = subsections.length || 1;
  return Math.round(total / count);
};

export const extractCitations = (content) => {
  if (!content) return [];
  const regex = /\(([A-Z][a-zA-Z\s&,\.\-\']+,\s*\d{4})\)/g;
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
