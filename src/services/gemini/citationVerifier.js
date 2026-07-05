export const CITATION_REGEX = /\(([A-Z][a-zA-Z\s&,\.\-\';]+(?:et\s+al[.,]*)?(?:\s*[;]\s*[A-Z][a-zA-Z\s&,\.\-\';]+(?:et\s+al[.,]*)?)*,\s*\d{4}[a-z]?(?:[,;]\s*[^)]*)?)\)/g;
export const NARRATIVE_CITATION_REGEX = /([A-Z][a-zA-Z\s&,\.\-\';]+(?:et\s+al[.,]*)?)\s*\((\d{4}[a-z]?)\)/g;
export const CITATION_MARKER_REGEX = /\[CITATION:\s*([^\]]+)\]/g;

const splitParagraphs = (text) => {
  if (!text) return [];
  return text.split(/\n\n+/).map(p => p.trim()).filter(p => p.length > 0);
};

const extractCitations = (text) => {
  if (!text) return [];
  const results = [];
  let match;
  const regex = new RegExp(CITATION_REGEX.source, 'g');
  while ((match = regex.exec(text)) !== null) {
    results.push({ raw: match[0], text: match[1], index: match.index });
  }
  const narrativeRe = new RegExp(NARRATIVE_CITATION_REGEX.source, 'g');
  while ((match = narrativeRe.exec(text)) !== null) {
    const charBefore = match.index > 0 ? text[match.index - 1] : '';
    if (charBefore === '(') continue;
    results.push({ raw: match[0], text: `${match[1].trim()}, ${match[2]}`, index: match.index, isNarrative: true });
  }
  const markerRegex = new RegExp(CITATION_MARKER_REGEX.source, 'g');
  while ((match = markerRegex.exec(text)) !== null) {
    results.push({ raw: match[0], text: match[1].trim(), index: match.index, isMarker: true });
  }
  return results;
};

const parseCitationAuthorYear = (citationText) => {
  const clean = citationText.replace(/[\[\]()]/g, '').trim();
  const yearMatch = clean.match(/(\d{4})[a-z]?$/);
  if (!yearMatch) return null;
  const year = yearMatch[1];
  let author = clean.slice(0, yearMatch.index).replace(/,?\s*$/, '').trim();
  if (author.toLowerCase().startsWith('citation:')) {
    author = author.slice(9).trim();
  }
  return { author: author.toLowerCase(), year, original: citationText };
};

const getLastName = (author) => {
  const words = author.split(/\s+/);
  const etAlIndex = words.indexOf('et');
  if (etAlIndex > 0) return words[etAlIndex - 1];
  const andIndex = words.indexOf('and');
  if (andIndex > 0) return words[words.length - 1];
  return words[words.length - 1];
};

const checkAgainstGroundedSources = (author, year, groundedSources) => {
  if (!groundedSources || groundedSources.length === 0) return false;
  const lastName = getLastName(author).toLowerCase();
  for (const source of groundedSources) {
    const title = (source.title || '').toLowerCase();
    const uri = (source.uri || '').toLowerCase();
    const nameRegex = new RegExp(`\\b${lastName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
    const yearStr = String(year);
    if (nameRegex.test(title) && (title.includes(yearStr) || uri.includes(yearStr))) return true;
    if (nameRegex.test(uri) && uri.includes(yearStr)) return true;
  }
  return false;
};

export const verifyCitations = (text, groundedSources) => {
  if (!text) return { verified: [], unverifiable: [], paragraphsMissingCitations: [], citationCount: 0, paragraphsWithCitations: 0, totalParagraphs: 0 };
  const citations = extractCitations(text);
  const paragraphs = splitParagraphs(text);
  const citationSet = new Set();
  const verified = [];
  const unverifiable = [];
  for (const c of citations) {
    const parsed = parseCitationAuthorYear(c.text);
    if (!parsed) {
      unverifiable.push({ raw: c.raw, reason: 'could not parse author/year' });
      continue;
    }
    const key = `${parsed.author}|${parsed.year}`;
    if (citationSet.has(key)) continue;
    citationSet.add(key);
    const found = checkAgainstGroundedSources(parsed.author, parsed.year, groundedSources);
    if (found) {
      verified.push({ raw: c.raw, author: parsed.author, year: parsed.year });
    } else {
      unverifiable.push({ raw: c.raw, author: parsed.author, year: parsed.year, reason: 'not found in grounded sources' });
    }
  }
  const paragraphsMissingCitations = [];
  for (let i = 0; i < paragraphs.length; i++) {
    const hasCitation = CITATION_REGEX.test(paragraphs[i]);
    CITATION_REGEX.lastIndex = 0;
    const hasMarker = CITATION_MARKER_REGEX.test(paragraphs[i]);
    CITATION_MARKER_REGEX.lastIndex = 0;
    if (!hasCitation && !hasMarker) {
      paragraphsMissingCitations.push({ index: i, text: paragraphs[i].slice(0, 100) });
    }
  }
  const paragraphsWithCitations = paragraphs.length - paragraphsMissingCitations.length;
  return {
    verified,
    unverifiable,
    paragraphsMissingCitations,
    citationCount: citations.length,
    paragraphsWithCitations,
    totalParagraphs: paragraphs.length,
  };
};
