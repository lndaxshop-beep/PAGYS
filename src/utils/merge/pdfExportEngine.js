import parseTemplate from './templateParser.js';
import mergeReferences from './referenceMerger.js';
import {
  buildTitlePage, buildDeclaration, buildDedication,
  buildAcknowledgements, buildAbstract, buildTableOfContents,
  buildListOfFigures, buildListOfTables, buildAbbreviationsList
} from './frontMatterGenerator.js';
import { collectFiguresAndTables } from './chapterContentParser.js';
import { buildInstrumentAppendix, loadInstruments } from './instrumentExporter.js';
import { renderChartToPng, renderMermaidToPng } from '../exportVisualHelpers.js';

const CHART_INLINE_RE = /\[CHART:\{(.*?)\}\]/;

const loadAbbreviations = (projectId) => {
  try {
    const stored = localStorage.getItem(`abbreviations_${projectId}`);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
};

const bufToDataUrl = (buf) => {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return 'data:image/png;base64,' + btoa(binary);
};

const escapeHtml = (text) => {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};

const htmlDoc = (title, bodyHtml, formatConfig) => {
  const { fontFamily, bodyFontSize, lineSpacing, heading1Size, heading2Size, heading3Size, pageMargins } = formatConfig;
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>
  @page { margin: ${pageMargins.top}cm ${pageMargins.right}cm ${pageMargins.bottom}cm ${pageMargins.left}cm; }
  * { box-sizing: border-box; }
  body { font-family: ${fontFamily}, serif; font-size: ${bodyFontSize}pt; line-height: ${lineSpacing}; color: #000; margin: 0; padding: 0; }
  .page-break { page-break-before: always; }
  .center { text-align: center; }
  .justify { text-align: justify; }
  .bold { font-weight: bold; }
  .italic { font-style: italic; }
  h1 { font-size: ${heading1Size}pt; font-weight: bold; text-align: center; margin: 24pt 0 12pt; }
  h2 { font-size: ${heading2Size}pt; font-weight: bold; margin: 18pt 0 9pt; }
  h3 { font-size: ${heading3Size}pt; font-weight: bold; margin: 12pt 0 6pt; }
  p { margin: 0 0 6pt; }
  .indent { text-indent: 1.27cm; }
  .bullet { margin-left: 1.27cm; }
  .num-list { margin-left: 1.27cm; text-indent: -0.63cm; }
  .ref-entry { margin-left: 1.27cm; text-indent: -1.27cm; margin-bottom: 6pt; }
  img.chart-img { display: block; margin: 12pt auto; max-width: 15cm; height: auto; }
  .caption { text-align: center; font-style: italic; font-size: 10pt; margin-bottom: 12pt; }
  table.data-table { width: 100%; border-collapse: collapse; margin: 12pt 0; font-size: 10pt; }
  table.data-table th { background: #f3f4f6; border: 1px solid #ccc; padding: 4pt 6pt; font-weight: bold; text-align: center; }
  table.data-table td { border: 1px solid #ccc; padding: 4pt 6pt; }
  table.data-table tr:nth-child(even) td { background: #fafafa; }
  .appendix-hr { border: none; border-top: 1px solid #000; margin: 24pt 0; }
  .toc-placeholder { border: 1px dashed #999; padding: 12pt; text-align: center; color: #666; margin: 12pt 0; }
  .pre-wrap { white-space: pre-wrap; font-family: 'Courier New', monospace; font-size: 9pt; margin: 6pt 0; }
</style>
</head>
<body>${bodyHtml}</body>
</html>`;
};

const fmDocxToHtml = (docxFns, project, placeholders, format) => {
  const htmlParts = [];

  if (docxFns.titlePage) {
    const tp = buildTitlePage(project, placeholders, format);
    htmlParts.push(`<div class="center" style="padding-top: 20%;">
      <p style="font-size: ${format.heading1Size}pt; font-weight: bold;">${escapeHtml(placeholders.universityName || '[University Name]')}</p>
      <p style="font-weight: bold;">${escapeHtml(placeholders.department || '[Department]')}</p>
      <p style="font-weight: bold;">${escapeHtml(placeholders.faculty || '[Faculty]')}</p>
      <br><br>
      <p style="font-size: 18pt; font-weight: bold;">${escapeHtml(project?.title || '[Thesis Title]')}</p>
      <br>
      <p>BY</p>
      <p style="font-weight: bold;">${escapeHtml(placeholders.fullName || '[Full Name]')}</p>
      <p>${escapeHtml(placeholders.studentId || '[Student ID]')}</p>
      <p>${escapeHtml(placeholders.indexNumber || '[Index Number]')}</p>
      <br>
      <p>Supervisor: ${escapeHtml(placeholders.supervisorName || '[Supervisor Name]')}</p>
      <br><br>
      <p>A thesis submitted to the ${escapeHtml(placeholders.department || '[Department]')} in partial fulfillment of the requirements for the degree of</p>
      <p style="font-weight: bold;">${escapeHtml(placeholders.courseName || '[Course/Program Name]')}</p>
      <br>
      <p style="font-weight: bold;">${escapeHtml(placeholders.monthYear || '[Month, Year]')}</p>
    </div>
    <div class="page-break"></div>`);
  }

  if (docxFns.declaration) {
    htmlParts.push(`<h1>DECLARATION</h1>
    <p class="justify indent">I, ${escapeHtml(placeholders.fullName || '[Full Name]')} (Student ID: ${escapeHtml(placeholders.studentId || '[Student ID]')}), hereby declare that this thesis is my own original work and has not been submitted for any other degree or qualification at any other university.</p>
    <p class="justify indent">I further declare that all sources used in this work have been duly acknowledged and referenced in accordance with academic standards.</p>
    <p class="justify indent">All ethical guidelines and research protocols have been followed in the conduct of this study.</p>
    <br><br>
    <p>Signature: ___________________________________</p>
    <p>Date: ${escapeHtml(placeholders.dateOfSubmission || '[Date of Submission]')}</p>
    <div class="page-break"></div>`);
  }

  if (docxFns.dedication) {
    htmlParts.push(`<h1>DEDICATION</h1>
    <p class="center italic" style="margin-top: 36pt;">${escapeHtml(placeholders.dedicationText || '[Dedication Text]')}</p>
    <div class="page-break"></div>`);
  }

  if (docxFns.acknowledgements) {
    htmlParts.push(`<h1>ACKNOWLEDGEMENTS</h1>
    <p class="justify indent">${escapeHtml(placeholders.acknowledgementsText || '[Acknowledgements Text]')}</p>
    <div class="page-break"></div>`);
  }

  if (docxFns.abstract) {
    const abstractText = placeholders.abstractText || 'The abstract will be generated from the thesis content. Please review and update as needed after downloading.';
    htmlParts.push(`<h1>ABSTRACT</h1>
    <p class="justify indent">${escapeHtml(abstractText)}</p>
    <div class="page-break"></div>`);
  }

  if (docxFns.toc) {
    htmlParts.push(`<h1>TABLE OF CONTENTS</h1>
    <div class="toc-placeholder">Table of Contents — update fields in Word after opening the .docx file</div>
    <div class="page-break"></div>`);
  }

  if (docxFns.listOfFigures && docxFns._figures?.length > 0) {
    htmlParts.push(`<h1>LIST OF FIGURES</h1>`);
    for (const fig of docxFns._figures) {
      const num = fig.chapterNum && fig.seq ? `${fig.chapterNum}.${fig.seq}` : `${fig.seq || 0}`;
      htmlParts.push(`<p><b>Figure ${num}: </b>${escapeHtml(fig.caption || fig.title || '')}</p>`);
    }
    htmlParts.push(`<div class="page-break"></div>`);
  }

  if (docxFns.listOfTables && docxFns._tables?.length > 0) {
    htmlParts.push(`<h1>LIST OF TABLES</h1>`);
    for (const tbl of docxFns._tables) {
      const num = tbl.chapterNum && tbl.seq ? `${tbl.chapterNum}.${tbl.seq}` : `${tbl.seq || 0}`;
      htmlParts.push(`<p><b>Table ${num}: </b>${escapeHtml(tbl.caption || tbl.title || '')}</p>`);
    }
    htmlParts.push(`<div class="page-break"></div>`);
  }

  if (docxFns.abbreviations && docxFns._abbreviations?.length > 0) {
    htmlParts.push(`<h1>LIST OF ABBREVIATIONS</h1>
    <table class="data-table">
      <tr><th>Abbreviation</th><th>Meaning</th></tr>
      ${docxFns._abbreviations.map(a => `<tr><td>${escapeHtml(a.abbr || '')}</td><td>${escapeHtml(a.meaning || '')}</td></tr>`).join('')}
    </table>
    <div class="page-break"></div>`);
  }

  return htmlParts.join('\n');
};

const parseChapterContentToHtml = async (content, chapterId, format) => {
  const htmlParts = [];
  if (!content) return htmlParts;

  const subsectionEntries = Object.entries(content)
    .filter(([key]) => !['references', 'References', 'complete', 'fullChapter'].includes(key));

  for (const [, text] of subsectionEntries) {
    if (!text || typeof text !== 'string') continue;

    const lines = text.split('\n');
    let i = 0;
    let visualType = null;
    let visualLines = [];

    const flushVisual = async (type, lines) => {
      if (!type || lines.length === 0) return;
      const raw = lines.join('\n').trim();
      if (!raw) return;

      try {
        if (type === 'table') {
          const parsed = JSON.parse(raw);
          htmlParts.push('<table class="data-table">');
          if (parsed.headers?.length) {
            htmlParts.push('<tr>' + parsed.headers.map(h => `<th>${escapeHtml(String(h))}</th>`).join('') + '</tr>');
          }
          for (const row of (parsed.rows || [])) {
            htmlParts.push('<tr>' + row.map(c => `<td>${escapeHtml(String(c))}</td>`).join('') + '</tr>');
          }
          htmlParts.push('</table>');
          if (parsed.caption) {
            htmlParts.push(`<p class="caption">${escapeHtml(parsed.caption)}</p>`);
          }
        } else if (type === 'chart' || type === 'diagram' || type === 'graph') {
          const parsed = JSON.parse(raw);
          const pngBuf = renderChartToPng(parsed);
          if (pngBuf) {
            htmlParts.push(`<img class="chart-img" src="${bufToDataUrl(pngBuf)}" alt="${escapeHtml(parsed.title || 'Chart')}" />`);
            if (parsed.caption || parsed.title) {
              htmlParts.push(`<p class="caption">${escapeHtml(parsed.caption || parsed.title)}</p>`);
            }
          }
        } else if (type === 'mermaid') {
          const pngBuf = await renderMermaidToPng(raw);
          if (pngBuf) {
            const titleMatch = raw.match(/%%\s*title:\s*(.+)/i);
            const caption = titleMatch ? titleMatch[1].trim() : null;
            htmlParts.push(`<img class="chart-img" src="${bufToDataUrl(pngBuf)}" alt="Diagram" />`);
            if (caption) {
              htmlParts.push(`<p class="caption">${escapeHtml(caption)}</p>`);
            }
          }
        }
      } catch {
        htmlParts.push(`<pre class="pre-wrap">${escapeHtml(raw)}</pre>`);
      }
    };

    while (i < lines.length) {
      const rawLine = lines[i];
      i++;

      const fenceOpen = rawLine.match(/^```(chart|mermaid|table|diagram|graph)\s*$/i);
      if (fenceOpen) {
        await flushVisual(visualType, visualLines);
        visualType = fenceOpen[1].toLowerCase();
        visualLines = [];
        continue;
      }

      if (visualType && rawLine.trim() === '```') {
        await flushVisual(visualType, visualLines);
        visualType = null;
        visualLines = [];
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
          const pngBuf = renderChartToPng(parsed);
          if (pngBuf) {
            htmlParts.push(`<img class="chart-img" src="${bufToDataUrl(pngBuf)}" alt="${escapeHtml(parsed.title || 'Chart')}" />`);
            if (parsed.caption || parsed.title) {
              htmlParts.push(`<p class="caption">${escapeHtml(parsed.caption || parsed.title)}</p>`);
            }
          }
        } catch { /* skip */ }
        continue;
      }

      const headingMatch = trimmed.match(/^(\d+\.\d+(\.\d+)?)\s+(.+)/);
      if (headingMatch) {
        const depth = headingMatch[3] ? 3 : headingMatch[2] === '0' ? 1 : 2;
        const tag = depth === 1 ? 'h1' : depth === 2 ? 'h2' : 'h3';
        htmlParts.push(`<${tag}>${escapeHtml(trimmed)}</${tag}>`);
        continue;
      }

      if (trimmed === 'References' || trimmed === 'REFERENCES') {
        continue;
      }

      if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
        htmlParts.push(`<p class="bullet">${escapeHtml(trimmed.replace(/^[-•]\s*/, '• '))}</p>`);
        continue;
      }

      if (trimmed.match(/^\d+\.\s/)) {
        htmlParts.push(`<p class="num-list">${escapeHtml(trimmed)}</p>`);
        continue;
      }

      htmlParts.push(`<p class="justify indent">${escapeHtml(trimmed)}</p>`);
    }

    await flushVisual(visualType, visualLines);
  }

  return htmlParts;
};

const generatePdfDocument = async (config) => {
  const {
    project, chapters, generatedSubsections, selectedChapterIds,
    frontMatter, placeholders, templateFile, selectedInstrumentIds,
    projectId, style, onProgress
  } = config;

  onProgress?.('Parsing template...');
  const formatConfig = await parseTemplate(templateFile);

  onProgress?.('Processing front matter...');
  const selectedChapters = chapters.filter(ch => selectedChapterIds.includes(ch.id));

  const { figures, tables } = collectFiguresAndTables(generatedSubsections, selectedChapters);
  const abbreviations = loadAbbreviations(projectId);

  const fmHtml = fmDocxToHtml({
    titlePage: frontMatter.titlePage,
    declaration: frontMatter.declaration,
    dedication: frontMatter.dedication,
    acknowledgements: frontMatter.acknowledgements,
    abstract: frontMatter.abstract,
    toc: frontMatter.toc,
    listOfFigures: frontMatter.listOfFigures,
    listOfTables: frontMatter.listOfTables,
    abbreviations: frontMatter.abbreviations,
    _figures: figures,
    _tables: tables,
    _abbreviations: abbreviations,
  }, project, placeholders, formatConfig);

  onProgress?.('Building chapter content...');
  const contentHtmlParts = [];
  for (let ci = 0; ci < selectedChapters.length; ci++) {
    const ch = selectedChapters[ci];
    const displayTitle = ch.customTitle || ch.title;
    contentHtmlParts.push(`<h1>${escapeHtml(displayTitle)}</h1>`);
    const chapterContent = generatedSubsections[ch.id] || {};
    const parsed = await parseChapterContentToHtml(chapterContent, ch.id, formatConfig);
    contentHtmlParts.push(parsed.join('\n'));
    contentHtmlParts.push(`<div class="page-break"></div>`);
    onProgress?.(`Processing chapter ${ci + 1}/${selectedChapters.length}...`);
  }

  onProgress?.('Merging references...');
  const refResult = await mergeReferences(selectedChapters, generatedSubsections, style, projectId);

  const refHtmlParts = [`<h1>REFERENCES</h1>`];
  refResult.entries.forEach(entry => {
    refHtmlParts.push(`<p class="ref-entry">${escapeHtml(entry)}</p>`);
  });

  onProgress?.('Building appendices...');
  let appendixHtml = '';
  if (selectedInstrumentIds?.length > 0) {
    const instruments = loadInstruments(projectId);
    const selectedInstruments = instruments.filter(inst => selectedInstrumentIds.includes(inst.id));
    let appIndex = 0;
    for (const inst of selectedInstruments) {
      appendixHtml += `<h1>APPENDIX ${String.fromCharCode(65 + appIndex)}</h1>`;
      appendixHtml += `<div class="appendix-hr"></div>`;
      appendixHtml += `<p><b>${escapeHtml(inst.icon || '')} ${escapeHtml(inst.label)}</b></p>`;
      if (inst.content) {
        appendixHtml += `<pre class="pre-wrap">${escapeHtml(inst.content)}</pre>`;
      }
      appIndex++;
    }
  }

  const bodyHtml = [
    fmHtml,
    contentHtmlParts.join('\n'),
    refHtmlParts.join('\n'),
    appendixHtml ? `<div class="page-break"></div>${appendixHtml}` : '',
  ].join('\n');

  onProgress?.('Generating PDF preview...');
  const fullHtml = htmlDoc(project?.title || 'Thesis', bodyHtml, formatConfig);

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Popup blocked. Please allow popups to generate PDF.');
  }
  printWindow.document.write(fullHtml);
  printWindow.document.close();
  printWindow.document.title = project?.title || 'Thesis';

  onProgress?.('Opening print dialog (Save as PDF)...');
  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 500);
};

export default generatePdfDocument;
