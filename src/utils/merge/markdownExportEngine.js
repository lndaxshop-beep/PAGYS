import parseTemplate from './templateParser.js';
import mergeReferences from './referenceMerger.js';
import { collectFiguresAndTables } from './chapterContentParser.js';
import { loadInstruments } from './instrumentExporter.js';
import { saveAs } from 'file-saver';

const CHART_INLINE_RE = /\[CHART:\{(.*?)\}\]/;

const loadAbbreviations = (projectId) => {
  try {
    const stored = localStorage.getItem(`abbreviations_${projectId}`);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
};

const generateMarkdownDocument = async (config) => {
  const {
    project, chapters, generatedSubsections, selectedChapterIds,
    frontMatter, placeholders, templateFile, selectedInstrumentIds,
    projectId, style, onProgress
  } = config;

  onProgress?.('Parsing template...');
  const formatConfig = await parseTemplate(templateFile);

  onProgress?.('Processing...');
  const selectedChapters = chapters.filter(ch => selectedChapterIds.includes(ch.id));
  const { figures, tables } = collectFiguresAndTables(generatedSubsections, selectedChapters);
  const abbreviations = loadAbbreviations(projectId);

  const lines = [];

  const addH1 = (t) => { lines.push(''); lines.push(`# ${t}`); lines.push(''); };
  const addH2 = (t) => { lines.push(''); lines.push(`## ${t}`); lines.push(''); };
  const addPara = (t) => { if (t) lines.push(t); };

  if (frontMatter.titlePage) {
    lines.push('<div style="text-align:center;">');
    lines.push('');
    lines.push(`# ${placeholders.universityName || '[University Name]'}`);
    lines.push('');
    lines.push(`**${placeholders.department || '[Department]'}**`);
    lines.push('');
    lines.push(`**${placeholders.faculty || '[Faculty]'}**`);
    lines.push('');
    lines.push('<br/><br/>');
    lines.push(`# **${project?.title || '[Thesis Title]'}**`);
    lines.push('');
    lines.push('<br/>');
    lines.push('**BY**');
    lines.push('');
    lines.push(`**${placeholders.fullName || '[Full Name]'}**`);
    lines.push('');
    lines.push(`${placeholders.studentId || '[Student ID]'}`);
    lines.push('');
    lines.push(`${placeholders.indexNumber || '[Index Number]'}`);
    lines.push('');
    lines.push('<br/>');
    lines.push(`**Supervisor: ${placeholders.supervisorName || '[Supervisor Name]'}**`);
    lines.push('');
    lines.push('<br/><br/>');
    lines.push(`A thesis submitted to the ${placeholders.department || '[Department]'} in partial fulfillment of the requirements for the degree of`);
    lines.push('');
    lines.push(`**${placeholders.courseName || '[Course/Program Name]'}**`);
    lines.push('');
    lines.push('<br/>');
    lines.push(`**${placeholders.monthYear || '[Month, Year]'}**`);
    lines.push('');
    lines.push('</div>');
    lines.push('');
    lines.push('---');
  }

  if (frontMatter.declaration) {
    addH1('DECLARATION');
    addPara(`I, ${placeholders.fullName || '[Full Name]'} (Student ID: ${placeholders.studentId || '[Student ID]'}), hereby declare that this thesis is my own original work and has not been submitted for any other degree or qualification at any other university.`);
    addPara('I further declare that all sources used in this work have been duly acknowledged and referenced in accordance with academic standards.');
    addPara('All ethical guidelines and research protocols have been followed in the conduct of this study.');
    lines.push('');
    lines.push('Signature: ___________________________________');
    lines.push('');
    lines.push(`Date: ${placeholders.dateOfSubmission || '[Date of Submission]'}`);
    lines.push('');
    lines.push('---');
  }

  if (frontMatter.dedication) {
    addH1('DEDICATION');
    lines.push('');
    lines.push(`*${placeholders.dedicationText || '[Dedication Text]'}*`);
    lines.push('');
    lines.push('---');
  }

  if (frontMatter.acknowledgements) {
    addH1('ACKNOWLEDGEMENTS');
    addPara(placeholders.acknowledgementsText || '[Acknowledgements Text]');
    lines.push('---');
  }

  if (frontMatter.abstract) {
    addH1('ABSTRACT');
    addPara(placeholders.abstractText || 'The abstract will be generated from the thesis content. Please review and update as needed.');
    lines.push('---');
  }

  if (frontMatter.toc) {
    addH1('TABLE OF CONTENTS');
    addPara('*Table of Contents — generate with your Markdown processor.*');
    lines.push('---');
  }

  if (frontMatter.listOfFigures && figures.length > 0) {
    addH1('LIST OF FIGURES');
    for (const fig of figures) {
      const num = fig.chapterNum && fig.seq ? `${fig.chapterNum}.${fig.seq}` : `${fig.seq || 0}`;
      lines.push(`- **Figure ${num}:** ${fig.caption || fig.title || ''}`);
    }
    lines.push('---');
  }

  if (frontMatter.listOfTables && tables.length > 0) {
    addH1('LIST OF TABLES');
    for (const tbl of tables) {
      const num = tbl.chapterNum && tbl.seq ? `${tbl.chapterNum}.${tbl.seq}` : `${tbl.seq || 0}`;
      lines.push(`- **Table ${num}:** ${tbl.caption || tbl.title || ''}`);
    }
    lines.push('---');
  }

  if (frontMatter.abbreviations && abbreviations.length > 0) {
    addH1('LIST OF ABBREVIATIONS');
    lines.push('| Abbreviation | Meaning |');
    lines.push('|--------------|---------|');
    for (const a of abbreviations) {
      lines.push(`| ${a.abbr || ''} | ${a.meaning || ''} |`);
    }
    lines.push('---');
  }

  onProgress?.('Building chapter content...');
  for (let ci = 0; ci < selectedChapters.length; ci++) {
    const ch = selectedChapters[ci];
    const displayTitle = ch.customTitle || ch.title;
    addH1(displayTitle);

    const chapterContent = generatedSubsections[ch.id] || {};
    const subsectionMap = {};
    if (ch.subsections && Array.isArray(ch.subsections)) {
      for (const sub of ch.subsections) {
        if (sub && sub.id) subsectionMap[sub.id] = sub;
      }
    }
    const subsectionEntries = Object.entries(chapterContent)
      .filter(([key]) => !['references', 'References', 'complete', 'fullChapter'].includes(key));

    for (const [key, text] of subsectionEntries) {
      if (!text || typeof text !== 'string') continue;

      const subMeta = subsectionMap[key];
      if (subMeta && subMeta.title) {
        const headingMatch = subMeta.title.match(/^(\d+\.\d+(\.\d+)?)\s+(.+)/);
        const depth = headingMatch ? (headingMatch[3] ? 3 : headingMatch[2] === '0' ? 1 : 2) : 2;
        const prefix = '#'.repeat(depth);
        lines.push('');
        lines.push(`${prefix} ${subMeta.title}`);
        lines.push('');
      }

      let cleanText = text.replace(/^\s*\d+\.\d+(\.\d+)?\s+.+[\r\n]*/, '');
      const rawLines = cleanText.split('\n');
      let i = 0;
      let visualType = null;
      let visualLines = [];

      const flushVisual = () => {
        if (!visualType || visualLines.length === 0) return;
        const raw = visualLines.join('\n').trim();
        if (!raw) return;

        if (visualType === 'table') {
          try {
            const parsed = JSON.parse(raw);
            if (parsed.headers?.length) {
              lines.push('| ' + parsed.headers.join(' | ') + ' |');
              lines.push('|' + parsed.headers.map(() => '---').join('|') + '|');
            }
            for (const row of (parsed.rows || [])) {
              lines.push('| ' + row.join(' | ') + ' |');
            }
            if (parsed.caption) lines.push(`*${parsed.caption}*`);
          } catch { /* skip */ }
        } else if (['chart', 'diagram', 'graph', 'mermaid'].includes(visualType)) {
          lines.push('');
          lines.push('```');
          if (visualType !== 'mermaid') {
            try {
              const parsed = JSON.parse(raw);
              lines.push(JSON.stringify(parsed, null, 2));
            } catch {
              lines.push(`[${visualType.toUpperCase()} DATA]`);
              lines.push(raw);
            }
          } else {
            lines.push(raw);
          }
          lines.push('```');
          const titleMatch = raw.match(/%%\s*title:\s*(.+)/i);
          const parsed = (visualType !== 'mermaid') ? (() => { try { return JSON.parse(raw); } catch { return {}; } })() : {};
          const caption = parsed.caption || parsed.title || (titleMatch ? titleMatch[1].trim() : null);
          if (caption) lines.push(`*${caption}*`);
        }
      };

      while (i < rawLines.length) {
        const rawLine = rawLines[i];
        i++;

        const fenceOpen = rawLine.match(/^```(chart|mermaid|table|diagram|graph)\s*$/i);
        if (fenceOpen) {
          flushVisual();
          visualType = fenceOpen[1].toLowerCase();
          visualLines = [];
          continue;
        }

        if (visualType && rawLine.trim() === '```') {
          flushVisual();
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
            lines.push('');
            lines.push('```json');
            lines.push(JSON.stringify(parsed, null, 2));
            lines.push('```');
            if (parsed.caption || parsed.title) lines.push(`*${parsed.caption || parsed.title}*`);
          } catch { /* skip */ }
          continue;
        }

        const headingMatch = trimmed.match(/^(\d+\.\d+(\.\d+)?)\s+(.+)/);
        if (headingMatch) {
          const depth = headingMatch[3] ? 3 : headingMatch[2] === '0' ? 1 : 2;
          const prefix = '#'.repeat(depth);
          lines.push('');
          lines.push(`${prefix} ${trimmed}`);
          lines.push('');
          continue;
        }

        if (trimmed === 'References' || trimmed === 'REFERENCES') continue;

        if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
          lines.push(trimmed.replace(/^[-•]\s*/, '- '));
          continue;
        }

        if (trimmed.match(/^\d+\.\s/)) {
          lines.push(trimmed);
          continue;
        }

        if (trimmed.length > 0) {
          lines.push(trimmed);
          lines.push('');
        }
      }

      flushVisual();
    }

    onProgress?.(`Processing chapter ${ci + 1}/${selectedChapters.length}...`);
  }

  onProgress?.('Merging references...');
  const refResult = await mergeReferences(selectedChapters, generatedSubsections, style, projectId);

  addH1('REFERENCES');
  refResult.entries.forEach(entry => {
    lines.push(`- ${entry}`);
  });

  onProgress?.('Building appendices...');
  if (selectedInstrumentIds?.length > 0) {
    const instruments = loadInstruments(projectId);
    const selectedInstruments = instruments.filter(inst => selectedInstrumentIds.includes(inst.id));
    let appIndex = 0;
    for (const inst of selectedInstruments) {
      addH1(`APPENDIX ${String.fromCharCode(65 + appIndex)}`);
      lines.push(`**${inst.icon || ''} ${inst.label}**`);
      if (inst.content) {
        lines.push('');
        lines.push('```json');
        lines.push(JSON.stringify(inst.content, null, 2));
        lines.push('```');
      }
      appIndex++;
    }
  }

  onProgress?.('Generating Markdown file...');
  const safeTitle = (project?.title || 'thesis').replace(/[^a-z0-9]/gi, '_').substring(0, 30);
  const date = new Date().toISOString().split('T')[0];
  const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
  saveAs(blob, `${safeTitle}_Complete_Thesis_${date}.md`);
  onProgress?.('Download complete!');
};

export default generateMarkdownDocument;
