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

const escapeLatex = (text) => {
  if (!text) return '';
  const map = { '\\': '\\textbackslash{}', '&': '\\&', '%': '\\%', '$': '\\$', '#': '\\#', '_': '\\_', '{': '\\{', '}': '\\}', '~': '\\textasciitilde{}', '^': '\\textasciicircum{}' };
  return String(text).replace(/[\\&%$#_{}~^]/g, (c) => map[c] || c);
};

const generateLatexDocument = async (config) => {
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

  lines.push('\\documentclass[12pt,a4paper]{report}');
  lines.push('\\usepackage[utf8]{inputenc}');
  lines.push('\\usepackage{graphicx}');
  lines.push('\\usepackage{booktabs}');
  lines.push('\\usepackage{hyperref}');
  lines.push('\\usepackage{geometry}');
  lines.push(`\\geometry{top=${formatConfig.pageMargins.top}cm, bottom=${formatConfig.pageMargins.bottom}cm, left=${formatConfig.pageMargins.left}cm, right=${formatConfig.pageMargins.right}cm}`);
  lines.push(`\\setlength{\\parskip}{6pt}`);
  lines.push(`\\renewcommand{\\baselinestretch}{${formatConfig.lineSpacing}}`);
  lines.push('\\usepackage{setspace}');
  lines.push('\\usepackage{titlesec}');
  lines.push('\\titleformat{\\chapter}{\\normalfont\\huge\\bfseries\\centering}{\\thechapter}{20pt}{\\huge}');
  lines.push('\\titleformat{\\section}{\\normalfont\\Large\\bfseries}{\\thesection}{16pt}{\\Large}');
  lines.push('\\titleformat{\\subsection}{\\normalfont\\large\\bfseries}{\\thesubsection}{12pt}{\\large}');
  lines.push('');

  lines.push('\\begin{document}');
  lines.push('');

  if (frontMatter.titlePage) {
    lines.push('\\begin{titlepage}');
    lines.push('\\begin{center}');
    lines.push(`\\vspace*{2cm}`);
    lines.push(`{\\LARGE \\textbf{${escapeLatex(placeholders.universityName || '[University Name]')}}\\\\[0.3cm]`);
    lines.push(`${escapeLatex(placeholders.department || '[Department]')}\\\\[0.3cm]`);
    lines.push(`${escapeLatex(placeholders.faculty || '[Faculty]')}}`);
    lines.push('\\vspace{2cm}');
    lines.push(`{\\Huge \\textbf{${escapeLatex(project?.title || '[Thesis Title]')}}}\\\\[1cm]`);
    lines.push('{\\Large \\textbf{BY}}\\\\[0.5cm]');
    lines.push(`{\\Large ${escapeLatex(placeholders.fullName || '[Full Name]')}}\\\\[0.3cm]`);
    lines.push(`${escapeLatex(placeholders.studentId || '[Student ID]')}\\\\`);
    lines.push(`${escapeLatex(placeholders.indexNumber || '[Index Number]')}\\\\`);
    lines.push('\\vspace{1cm}');
    lines.push(`Supervisor: ${escapeLatex(placeholders.supervisorName || '[Supervisor Name]')}\\\\`);
    lines.push('\\vspace{1.5cm}');
    lines.push(`A thesis submitted to the ${escapeLatex(placeholders.department || '[Department]')} in partial fulfillment of the requirements for the degree of\\\\`);
    lines.push(`${escapeLatex(placeholders.courseName || '[Course/Program Name]')}\\\\`);
    lines.push('\\vspace{1.5cm}');
    lines.push(`${escapeLatex(placeholders.monthYear || '[Month, Year]')}`);
    lines.push('\\end{center}');
    lines.push('\\end{titlepage}');
  }

  if (frontMatter.declaration) {
    lines.push('\\chapter*{DECLARATION}');
    lines.push(`I, ${escapeLatex(placeholders.fullName || '[Full Name]')} (Student ID: ${escapeLatex(placeholders.studentId || '[Student ID]')}), hereby declare that this thesis is my own original work and has not been submitted for any other degree or qualification at any other university.`);
    lines.push('');
    lines.push('I further declare that all sources used in this work have been duly acknowledged and referenced in accordance with academic standards.');
    lines.push('');
    lines.push('All ethical guidelines and research protocols have been followed in the conduct of this study.');
    lines.push('\\vspace{1cm}');
    lines.push('Signature: \\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_\\_');
    lines.push(`Date: ${escapeLatex(placeholders.dateOfSubmission || '[Date of Submission]')}`);
  }

  if (frontMatter.dedication) {
    lines.push('\\chapter*{DEDICATION}');
    lines.push('\\vspace{2cm}');
    lines.push('\\begin{center}');
    lines.push(`\\textit{${escapeLatex(placeholders.dedicationText || '[Dedication Text]')}}`);
    lines.push('\\end{center}');
  }

  if (frontMatter.acknowledgements) {
    lines.push('\\chapter*{ACKNOWLEDGEMENTS}');
    lines.push(escapeLatex(placeholders.acknowledgementsText || '[Acknowledgements Text]'));
  }

  if (frontMatter.abstract) {
    lines.push('\\chapter*{ABSTRACT}');
    lines.push(escapeLatex(placeholders.abstractText || 'The abstract will be generated from the thesis content. Please review and update as needed.'));
  }

  if (frontMatter.toc) {
    lines.push('\\tableofcontents');
    lines.push('\\newpage');
  }

  if (frontMatter.listOfFigures && figures.length > 0) {
    lines.push('\\listoffigures');
    lines.push('\\newpage');
  }

  if (frontMatter.listOfTables && tables.length > 0) {
    lines.push('\\listoftables');
    lines.push('\\newpage');
  }

  if (frontMatter.abbreviations && abbreviations.length > 0) {
    lines.push('\\chapter*{LIST OF ABBREVIATIONS}');
    lines.push('\\begin{tabular}{ll}');
    lines.push('\\toprule');
    lines.push('\\textbf{Abbreviation} & \\textbf{Meaning} \\\\');
    lines.push('\\midrule');
    for (const a of abbreviations) {
      lines.push(`${escapeLatex(a.abbr || '')} & ${escapeLatex(a.meaning || '')} \\\\`);
    }
    lines.push('\\bottomrule');
    lines.push('\\end{tabular}');
  }

  onProgress?.('Building chapter content...');
  for (let ci = 0; ci < selectedChapters.length; ci++) {
    const ch = selectedChapters[ci];
    const displayTitle = ch.customTitle || ch.title;
    lines.push('');
    lines.push(`\\chapter{${escapeLatex(displayTitle)}}`);

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
        const depth = headingMatch ? (headingMatch[3] ? 'subsection' : headingMatch[2] === '0' ? 'chapter' : 'section') : 'section';
        lines.push(`\\${depth}{${escapeLatex(subMeta.title)}}`);
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
            lines.push('\\begin{table}[h]');
            lines.push('\\centering');
            lines.push('\\begin{tabular}{' + (parsed.headers || []).map(() => 'l').join('') + '}');
            lines.push('\\toprule');
            if (parsed.headers?.length) {
              lines.push(parsed.headers.map(h => `\\textbf{${escapeLatex(String(h))}}`).join(' & ') + ' \\\\');
              lines.push('\\midrule');
            }
            for (const row of (parsed.rows || [])) {
              lines.push(row.map(c => escapeLatex(String(c))).join(' & ') + ' \\\\');
            }
            lines.push('\\bottomrule');
            lines.push('\\end{tabular}');
            if (parsed.caption) {
              lines.push(`\\caption{${escapeLatex(parsed.caption)}}`);
            }
            lines.push('\\end{table}');
          } catch { /* skip */ }
        } else if (['chart', 'diagram', 'graph', 'mermaid'].includes(visualType)) {
          lines.push('\\begin{figure}[h]');
          lines.push('\\centering');
          lines.push(`\\fbox{\\parbox{10cm}{\\centering [${visualType.toUpperCase()} — rendered as image in DOCX/PDF]}}`);
          const titleMatch = raw.match(/%%\s*title:\s*(.+)/i);
          const parsed = (visualType !== 'mermaid') ? (() => { try { return JSON.parse(raw); } catch { return {}; } })() : {};
          const caption = parsed.caption || parsed.title || (titleMatch ? titleMatch[1].trim() : null);
          if (caption) lines.push(`\\caption{${escapeLatex(caption)}}`);
          lines.push('\\end{figure}');
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
            lines.push('\\begin{figure}[h]');
            lines.push('\\centering');
            lines.push(`\\fbox{\\parbox{10cm}{\\centering [CHART — ${escapeLatex(parsed.title || '')}]}}`);
            if (parsed.caption || parsed.title) lines.push(`\\caption{${escapeLatex(parsed.caption || parsed.title)}}`);
            lines.push('\\end{figure}');
          } catch { /* skip */ }
          continue;
        }

        const headingMatch = trimmed.match(/^(\d+\.\d+(\.\d+)?)\s+(.+)/);
        if (headingMatch) {
          const depth = headingMatch[3] ? 'subsection' : headingMatch[2] === '0' ? 'chapter' : 'section';
          if (depth === 'chapter') {
            lines.push(`\\${depth}{${escapeLatex(trimmed)}}`);
          } else {
            lines.push(`\\${depth}{${escapeLatex(trimmed)}}`);
          }
          continue;
        }

        if (trimmed === 'References' || trimmed === 'REFERENCES') continue;

        if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
          lines.push(`\\begin{itemize}`);
          lines.push(`\\item ${escapeLatex(trimmed.replace(/^[-•]\s*/, ''))}`);
          lines.push(`\\end{itemize}`);
          continue;
        }

        if (trimmed.match(/^\d+\.\s/)) {
          lines.push(`\\begin{enumerate}`);
          lines.push(`\\item ${escapeLatex(trimmed.replace(/^\d+\.\s*/, ''))}`);
          lines.push(`\\end{enumerate}`);
          continue;
        }

        lines.push(escapeLatex(trimmed));
        lines.push('');
      }

      flushVisual();
    }

    onProgress?.(`Processing chapter ${ci + 1}/${selectedChapters.length}...`);
  }

  onProgress?.('Merging references...');
  const refResult = await mergeReferences(selectedChapters, generatedSubsections, style, projectId);

  lines.push('\\begin{thebibliography}{99}');
  refResult.entries.forEach(entry => {
    lines.push(`\\bibitem{} ${escapeLatex(entry)}`);
  });
  lines.push('\\end{thebibliography}');

  onProgress?.('Building appendices...');
  if (selectedInstrumentIds?.length > 0) {
    const instruments = loadInstruments(projectId);
    const selectedInstruments = instruments.filter(inst => selectedInstrumentIds.includes(inst.id));
    let appIndex = 0;
    for (const inst of selectedInstruments) {
      lines.push(`\\appendix`);
      lines.push(`\\chapter{APPENDIX ${String.fromCharCode(65 + appIndex)}}`);
      lines.push(`${escapeLatex(inst.icon || '')} ${escapeLatex(inst.label)}`);
      if (inst.content) {
        lines.push('\\begin{verbatim}');
        lines.push(JSON.stringify(inst.content, null, 2));
        lines.push('\\end{verbatim}');
      }
      appIndex++;
    }
  }

  lines.push('');
  lines.push('\\end{document}');

  onProgress?.('Generating LaTeX file...');
  const safeTitle = (project?.title || 'thesis').replace(/[^a-z0-9]/gi, '_').substring(0, 30);
  const date = new Date().toISOString().split('T')[0];
  const blob = new Blob([lines.join('\n')], { type: 'application/x-latex;charset=utf-8' });
  saveAs(blob, `${safeTitle}_Complete_Thesis_${date}.tex`);
  onProgress?.('Download complete!');
};

export default generateLatexDocument;
