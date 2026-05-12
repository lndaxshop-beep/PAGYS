const parseRis = (text) => {
  const entries = [];
  const blocks = text.split(/\n\s*\n/);
  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length < 2) continue;
    const entry = { type: 'JOURNAL', authors: [], title: '', journal: '', year: '', volume: '', issue: '', pages: '', doi: '', url: '', abstract: '', keywords: [] };
    for (const line of lines) {
      const match = line.match(/^([A-Z0-9]{2})\s*[-]{2}\s*(.+)/);
      if (!match) continue;
      const tag = match[1];
      const value = match[2].trim();
      switch (tag) {
        case 'TY': entry.type = value; break;
        case 'AU': case 'A1': entry.authors.push(value); break;
        case 'TI': case 'T1': entry.title = (entry.title || '') + value; break;
        case 'JO': case 'JF': case 'JA': entry.journal = value; break;
        case 'PY': case 'Y1': entry.year = value.replace(/[\/\s].*$/, ''); break;
        case 'VL': entry.volume = value; break;
        case 'IS': entry.issue = value; break;
        case 'SP': entry.pages = value; break;
        case 'EP': entry.pages = entry.pages ? entry.pages + '-' + value : value; break;
        case 'DO': entry.doi = value; break;
        case 'UR': case 'L1': case 'L2': case 'L3': case 'L4': entry.url = value; break;
        case 'AB': case 'N2': entry.abstract = (entry.abstract || '') + value; break;
        case 'KW': entry.keywords.push(value); break;
      }
    }
    if (entry.title) entries.push(entry);
  }
  return entries;
};

const parseBibtex = (text) => {
  const entries = [];
  const entryRe = /@(\w+)\s*\{([^,]+),([\s\S]*?)\n\}/g;
  let match;
  while ((match = entryRe.exec(text)) !== null) {
    const type = match[1].toUpperCase();
    const citeKey = match[2].trim();
    const fieldsText = match[3];
    const entry = { type: type === 'ARTICLE' ? 'JOUR' : type, citeKey, authors: [], title: '', journal: '', year: '', volume: '', issue: '', pages: '', doi: '', url: '', abstract: '', keywords: [] };

    const fieldRe = /\s*(\w+)\s*=\s*\{([^}]*)\}/g;
    let fMatch;
    while ((fMatch = fieldRe.exec(fieldsText)) !== null) {
      const key = fMatch[1].toLowerCase();
      const val = fMatch[2].trim();
      switch (key) {
        case 'author': entry.authors = val.split(' and ').map(a => a.trim()).filter(Boolean); break;
        case 'title': entry.title = val; break;
        case 'journal': case 'booktitle': entry.journal = val; break;
        case 'year': entry.year = val.replace(/[^\d]/g, ''); break;
        case 'volume': entry.volume = val; break;
        case 'number': entry.issue = val; break;
        case 'pages': entry.pages = val.replace(/--/g, '-'); break;
        case 'doi': entry.doi = val; break;
        case 'url': entry.url = val; break;
        case 'abstract': entry.abstract = val; break;
        case 'keywords': entry.keywords = val.split(/[,;]/).map(k => k.trim()).filter(Boolean); break;
      }
    }
    if (entry.title) entries.push(entry);
  }
  return entries;
};

export const parseRefFile = (fileContent, fileName) => {
  if (!fileContent || !fileName) return [];
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'ris') return parseRis(fileContent);
  if (ext === 'bib') return parseBibtex(fileContent);
  const firstLine = fileContent.trim().split('\n')[0];
  if (firstLine?.startsWith('TY  - ')) return parseRis(fileContent);
  if (firstLine?.startsWith('@')) return parseBibtex(fileContent);
  return [];
};

export const refEntryToText = (entry, style = 'apa') => {
  if (!entry) return '';
  const authors = entry.authors?.length ? entry.authors.join(', ') : 'Unknown';
  const year = entry.year || 'n.d.';
  const title = entry.title || '';
  const journal = entry.journal || '';
  const volume = entry.volume || '';
  const issue = entry.issue ? `(${entry.issue})` : '';
  const pages = entry.pages || '';
  const doi = entry.doi || '';

  if (style === 'apa') {
    let ref = `${authors} (${year}). ${title}.`;
    if (journal) ref += ` *${journal}*,`;
    if (volume) ref += ` *${volume}*`;
    ref += `${issue}${pages ? `, ${pages}` : ''}.`;
    if (doi) ref += ` https://doi.org/${doi}`;
    return ref;
  }

  return `${authors} (${year}). ${title}. ${journal} ${volume}${issue}: ${pages}.`;
};
