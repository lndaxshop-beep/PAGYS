const CACHE_VERSION = 1;
const CACHE_PREFIX_META = '__cache_meta__';

const getMetaKey = (key) => `${CACHE_PREFIX_META}_${key}`;

export const setWithTTL = (key, value, ttlMs = 5 * 60 * 1000) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    localStorage.setItem(getMetaKey(key), JSON.stringify({
      version: CACHE_VERSION,
      expiresAt: Date.now() + ttlMs,
    }));
  } catch (e) {
    console.warn('setWithTTL failed:', e);
  }
};

export const getWithTTL = (key) => {
  try {
    const metaRaw = localStorage.getItem(getMetaKey(key));
    if (!metaRaw) return null;

    const meta = JSON.parse(metaRaw);
    if (meta.version !== CACHE_VERSION || Date.now() > meta.expiresAt) {
      localStorage.removeItem(key);
      localStorage.removeItem(getMetaKey(key));
      return null;
    }

    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const invalidateCache = (key) => {
  try {
    localStorage.removeItem(key);
    localStorage.removeItem(getMetaKey(key));
  } catch (e) {
    console.warn('invalidateCache failed:', e);
  }
};

export const CACHE_KEYS = {
  DASHBOARD_PROGRESS: 'dashboard_progress_cache',
  USER_SOURCES: (pid) => `userSources_${pid}`,
  GROUNDING_SOURCES: (cid) => `groundingSources_${cid}`,
  ABBREVIATIONS: (pid) => `abbreviations_${pid}`,
  DEFENCE: (pid) => `defence_${pid}`,
  INSTRUMENTS: (pid) => `instruments_${pid}`,
  INSTRUMENT_CONTENT: (pid, iid) => `instrument_content_${pid}_${iid}`,
  DIAGRAM_SVGS: (pid) => `diagramSVGs_${pid}`,
  CHAPTERS: (pid) => `chapters_${pid}`,
  GENERATED: (pid) => `generated_${pid}`,
  CITATIONS: (pid) => `citations_${pid}`,
  VISUAL: (pid) => `visual_${pid}`,
  PROJECT: (pid) => `project_${pid}`,
  HUMANISE_USED: (pid) => `humaniseUsed_${pid}`,
  FEEDBACK_USED: (pid) => `feedbackUsed_${pid}`,
  INSTRUMENT_DOWNLOADS: (pid) => `instrument_downloads_${pid}`,
  THESIS_PROJECTS: 'thesisProjects',
};

export const ALL_CACHE_PREFIXES = [
  'generatedContent', 'chapters', 'citations', 'diagrams', 'charts', 'tables',
  'diagramSVGs', 'defence', 'abbreviations', 'realReferences', 'instrument_content',
  'groundingSources', 'humaniseUsed', 'feedbackUsed',
  'instruments', 'instrument_downloads', 'userSources', 'visual', 'project',
];

export const clearAllProjectCache = (projectId) => {
  ALL_CACHE_PREFIXES.forEach(prefix => {
    try {
      const key = `${prefix}_${projectId}`;
      localStorage.removeItem(key);
      localStorage.removeItem(getMetaKey(key));
    } catch { /* ignore */ }
  });
};
