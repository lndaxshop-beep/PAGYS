export const parseBibTeX = (text) => {
  const entries = [];
  const entryRegex = /@(\w+)\s*\{\s*([^,]+),\s*([\s\S]*?)\s*\}[\n\r]/g;
  let match;

  while ((match = entryRegex.exec(text)) !== null) {
    const type = match[1].toLowerCase();
    const key = match[2].trim();
    const fieldsStr = match[3];

    const fields = {};
    const fieldRegex = /(\w+)\s*=\s*\{([^}]*)\}/g;
    let fm;
    while ((fm = fieldRegex.exec(fieldsStr)) !== null) {
      fields[fm[1].toLowerCase()] = fm[2].trim();
    }

    const title = fields.title || '';
    let authors = fields.author || fields.authors || 'Unknown';
    authors = authors.replace(/\s+/g, ' ').trim();
    const year = fields.year || '';
    const journal = fields.journal || fields.publisher || fields.booktitle || '';

    const source = {
      id: `bib_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      title,
      authors,
      year: parseInt(year) || new Date().getFullYear(),
      journal,
      methodology: 'literature review',
      keyFindings: ['Imported from BibTeX'],
      type,
      bibKey: key,
    };
    entries.push(source);
  }
  return entries;
};
