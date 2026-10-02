// Literature search against the OpenAlex API.
//
// Why this is not a straight fetch in the modal:
//
// 1. OpenAlex `search=` is a FULL-TEXT search ("works where full text has (...)").
//    A paper that mentions the phrase once in its references outranks papers that
//    are actually about it, so relevance has to be computed locally.
// 2. `relevance_score` is unusable as a signal: it is null unless `search=` is
//    used, and when present it runs into the thousands (e.g. 10172). Any naive
//    "> 0.8" threshold labels every result identical.
// 3. Repeated `filter=` params overwrite each other. All filters must be joined
//    with commas into a single `filter=` value.

const OPENALEX_BASE = 'https://api.openalex.org/works';
const CONTACT_EMAIL = 'support@pagyss.com';

const REQUEST_HEADERS = {
  Accept: 'application/json',
  'User-Agent': `PAGYS/1.0 (mailto:${CONTACT_EMAIL})`,
};

// Words that carry no topic signal. Academic filler shows up in every abstract
// and would otherwise inflate the overlap score for every paper.
const STOP_WORDS = new Set([
  'about', 'above', 'after', 'again', 'against', 'also', 'among', 'amongst',
  'and', 'analysis', 'are', 'based', 'because', 'been', 'before', 'being',
  'between', 'both', 'but', 'can', 'could', 'does', 'doing', 'during', 'each',
  'for', 'from', 'further', 'had', 'has', 'have', 'having', 'here', 'how',
  'however', 'into', 'its', 'itself', 'just', 'like', 'made', 'make', 'many',
  'may', 'more', 'most', 'much', 'must', 'not', 'only', 'other', 'over',
  'paper', 'papers', 'people', 'research', 'result', 'results', 'role',
  'should', 'show', 'shows', 'since', 'some', 'such', 'than', 'that', 'the',
  'their', 'them', 'then', 'there', 'these', 'they', 'this', 'those',
  'through', 'under', 'using', 'very', 'was', 'were', 'what', 'when', 'where',
  'which', 'while', 'who', 'why', 'will', 'with', 'within', 'would', 'your',
]);

const isNumeric = (word) => /^\d+$/.test(word);

const tokenize = (text) =>
  String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/[\s-]+/)
    // Bare years such as "2023" are not topic signal; they belong in the year
    // filter, not in the terms a paper is scored against.
    .filter((w) => w.length > 2 && w.length < 32 && !isNumeric(w));

// Terms that actually define the topic. The user query is often one or two words
// ("social media"), so it is combined with the project topic and field to give
// the search something specific to match against.
//
// The project title is a last-resort fallback only. Titles are often
// abbreviations or acronyms ("SMU and Grades") that would pollute the terms and
// drag every score down.
export const buildTopicTerms = (project, query) => {
  const primary = [query, project?.topic, project?.field].filter(Boolean);
  const parts = primary.length ? primary : [project?.title].filter(Boolean);

  const counts = new Map();
  for (const word of tokenize(parts.join(' '))) {
    if (STOP_WORDS.has(word)) continue;
    counts.set(word, (counts.get(word) || 0) + 1);
  }

  // Rank by frequency across the combined context, then keep the strongest terms.
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 14)
    .map(([word]) => word);
};

// A query string for OpenAlex.
//
// A short user query ("social media") is far too broad on its own: it pulls a
// candidate pool of marketing and computer-science papers, and no amount of
// local re-ranking can rescue that pool. So when the query is thin, the project
// topic and field are folded in to narrow retrieval at the source.
//
// Deliberately not the full topic string. OpenAlex `search=` is full-text, and
// over-long queries match almost nothing.
export const buildSearchString = (project, query) => {
  const userQuery = String(query || '').trim();
  const topic = String(project?.topic || '').trim();
  const field = String(project?.field || '').trim();

  if (!userQuery) return [topic, field].filter(Boolean).join(' ');

  const queryTerms = tokenize(userQuery).filter((w) => !STOP_WORDS.has(w));
  if (queryTerms.length >= 4) return userQuery;

  // User terms come first so they lead the query, then topic terms fill in the
  // words the user did not type. Overlap between the two is dropped, otherwise a
  // topic already containing the query ("social media use..." vs "social media")
  // repeats itself and the duplicate words crowd out real signal.
  const seen = new Set(queryTerms);
  const extra = tokenize([topic, field].join(' '))
    .filter((w) => !STOP_WORDS.has(w) && !seen.has(w))
    .slice(0, 8 - queryTerms.length);

  return [...queryTerms, ...extra].join(' ');
};

// Credit assigned to a term found in each part of a paper. A match in the title
// is a deliberate claim of scope; a match in the abstract may just be a passing
// reference in the literature review, so it earns far less.
const TITLE_CREDIT = 1;
const ABSTRACT_CREDIT = 0.15;

// Score how well a paper actually matches the topic, on a 0..1 scale.
//
// This is deliberately title-dominant. Full-text ranking from OpenAlex lets a
// paper that mentions the topic once in its body outrank one that is entirely
// about it, which is the complaint this replaces. Abstract-only matches still
// score above zero so genuinely on-topic papers with unusual wording are not
// discarded, but they rank far below papers that lead with the topic.
export const scoreRelevance = (paper, terms) => {
  if (!terms.length) return 0;

  const titleTokens = [...tokenize(paper.title)];
  const abstractTokens = [...tokenize(paper.abstract)];

  const matches = (tokens, term) =>
    tokens.some((t) => t.startsWith(term) || term.startsWith(t));

  let credit = 0;

  for (const term of terms) {
    // Prefix match so "educat" matches "education"/"educational".
    if (matches(titleTokens, term)) credit += TITLE_CREDIT;
    else if (matches(abstractTokens, term)) credit += ABSTRACT_CREDIT;
  }

  return Math.min(1, credit / terms.length);
};

// Cut points for the visible relevance badge. Tuned so "high" means the paper
// leads with the topic, not merely that it mentions it.
export const relevanceLabel = (score) => {
  if (score >= 0.7) return 'high';
  if (score >= 0.35) return 'medium';
  return 'low';
};

export const reconstructAbstract = (invertedIndex) => {
  if (!invertedIndex) return '';
  const words = [];
  // Keys are case-sensitive in JS, so 'The' and 'the' coexist and positions
  // are unique, which keeps the reconstruction lossless.
  for (const [word, positions] of Object.entries(invertedIndex)) {
    for (const position of positions) words[position] = word;
  }
  return words.filter(Boolean).join(' ');
};

const buildUrl = ({ query, yearFrom, sortByCitations }) => {
  const filters = ['open_access.is_oa:true', 'type:article'];
  if (yearFrom) filters.push(`from_publication_date:${yearFrom}-01-01`);

  const params = new URLSearchParams({
    search: query,
    per_page: '50',
    filter: filters.join(','),
  });
  if (sortByCitations) params.set('sort', 'cited_by_count:desc');

  return `${OPENALEX_BASE}?${params.toString()}&mailto=${encodeURIComponent(CONTACT_EMAIL)}`;
};

const mapWork = (work) => ({
  id: work.id,
  isRetracted: work.is_retracted === true,
  title: work.title || work.display_name || 'Untitled',
  authors: (work.authorships || [])
    .map((a) => a.author?.display_name)
    .filter(Boolean)
    .join(', '),
  year: work.publication_year || null,
  journal: work.primary_location?.source?.display_name || '',
  doi: work.doi ? work.doi.replace('https://doi.org/', '') : '',
  abstract: reconstructAbstract(work.abstract_inverted_index),
  uri: work.open_access?.oa_url || work.doi || '',
  citedBy: work.cited_by_count || 0,
  isOpenAccess: work.open_access?.is_oa || false,
});

/**
 * Search and rank papers against the project topic.
 *
 * OpenAlex gives us a high-recall candidate pool; the local score is what
 * decides what the user actually sees, because OpenAlex's own ordering is
 * full-text based and drifts off topic.
 */
export const searchLiterature = async ({
  query,
  project,
  yearFrom = null,
  sortByCitations = false,
  minRelevance = 0.18,
  limit = 20,
} = {}) => {
  const searchString = buildSearchString(project, query);
  if (!searchString) {
    throw new Error('Add a search topic, or set one on your project first.');
  }

  const terms = buildTopicTerms(project, query);

  const response = await fetch(buildUrl({ query: searchString, yearFrom, sortByCitations }), {
    headers: REQUEST_HEADERS,
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('The academic database is rate limiting us. Wait a moment and search again.');
    }
    throw new Error(`Academic database error (${response.status})`);
  }

  const data = await response.json();
  const candidates = (data.results || []).map(mapWork);

  if (!candidates.length) {
    throw new Error('No open-access articles matched. Try broader keywords or widen the year range.');
  }

  const scored = candidates
    // Retracted papers must never reach a user's source library.
    .filter((paper) => !paper.isRetracted)
    .map((paper) => {
      const score = scoreRelevance(paper, terms);
      return { ...paper, score, relevance: relevanceLabel(score) };
    })
    .filter((paper) => paper.score >= minRelevance);

  if (!scored.length) {
    throw new Error(
      `Found ${candidates.length} articles but none were on-topic for "${searchString}". Try different keywords.`
    );
  }

  scored.sort((a, b) => {
    if (sortByCitations) return b.citedBy - a.citedBy;
    if (b.score !== a.score) return b.score - a.score;
    return b.citedBy - a.citedBy;
  });

  return {
    results: scored.slice(0, limit),
    consideredCount: candidates.length,
    query: searchString,
    terms,
  };
};

// Maps a ranked result onto the source-library shape the rest of the app reads.
export const toLibrarySources = (results) =>
  results.map((r) => ({
    id: `litsearch_${r.id || Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    fileType: 'literature',
    title: r.title,
    authors: r.authors,
    year: parseInt(r.year, 10) || new Date().getFullYear(),
    journal: r.journal || '',
    doi: r.doi || '',
    uri: r.uri || '',
    keyFindings: r.abstract ? [r.abstract] : [],
    relevanceToTopic: r.relevance || 'medium',
    methodology: 'Not specified',
    sampleSize: 'N/A',
    theoreticalFramework: '',
  }));