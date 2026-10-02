import React, { useMemo, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { searchLiterature, toLibrarySources, buildTopicTerms } from '../services/literatureSearch';

const YEAR_OPTIONS = [
  { value: '', label: 'Any year' },
  { value: 5, label: 'Last 5 years' },
  { value: 8, label: 'Last 8 years' },
  { value: 12, label: 'Last 12 years' },
];

const RELEVANCE_STYLES = {
  high: { background: '#d1fae5', color: '#059669', label: 'High match' },
  medium: { background: '#fef3c7', color: '#b45309', label: 'Medium match' },
  low: { background: '#e5e7eb', color: '#4b5563', label: 'Weak match' },
};

const LiteratureSearchModal = ({ isOpen, onClose, onSaveSources, project }) => {
  const { colors, isDarkMode } = useTheme();
  const [query, setQuery] = useState('');
  const [yearWindow, setYearWindow] = useState('');
  const [sortByCitations, setSortByCitations] = useState(false);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [meta, setMeta] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [error, setError] = useState('');

  // Shown as the placeholder so users search within their project's scope
  // instead of inventing a fresh, unrelated topic.
  const suggestedQuery = useMemo(() => {
    const terms = buildTopicTerms(project, '');
    return terms.slice(0, 6).join(' ');
  }, [project]);

  if (!isOpen) return null;

  const currentYear = new Date().getFullYear();

  const resetResults = () => {
    setResults([]);
    setSelectedIds(new Set());
    setMeta(null);
    setError('');
  };

  // Closing must clear results, otherwise reopening the modal shows the previous
  // search for a topic the user has since moved on from.
  const handleClose = () => {
    resetResults();
    setQuery('');
    onClose?.();
  };

  const handleSearch = async () => {
    if (!query.trim() && !project?.topic) return;
    setSearching(true);
    setError('');
resetResults();
    try {
      const response = await searchLiterature({
        query: query.trim(),
        project,
        yearFrom: yearWindow ? currentYear - Number(yearWindow) : null,
        sortByCitations,
      });
      setResults(response.results);
      setMeta(response);
      if (response.results.length) {
        // Pre-select only the papers that genuinely match, so the common case
        // is a single click to save and off-topic stragglers are opt-in only.
        const strong = response.results.filter((r) => r.relevance !== 'low');
        setSelectedIds(new Set(strong.map((r) => r.id)));
      }
    } catch (e) {
      console.error('Literature search failed:', e);
      setError(e.message || 'Could not reach the academic database. Check your connection.');
    }
    setSearching(false);
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const updated = new Set(prev);
      if (updated.has(id)) updated.delete(id);
      else updated.add(id);
      return updated;
    });
  };

  const handleSave = () => {
    const selected = results.filter((r) => selectedIds.has(r.id));
    if (selected.length === 0) return;
    onSaveSources?.(toLibrarySources(selected));
    resetResults();
    setQuery('');
  };

  const resultStyle = (selected) => ({
    padding: '12px', borderRadius: '8px', cursor: 'pointer',
    backgroundColor: selected ? (isDarkMode ? '#2d6a4f30' : '#d1fae5') : (isDarkMode ? '#2d2d2d' : '#f9fafb'),
    border: `1px solid ${selected ? '#059669' : colors.border}`,
    transition: 'all 0.2s',
    marginBottom: '8px',
  });

  const selectStyle = {
    padding: '9px 10px', fontSize: '12px', borderRadius: '8px',
    border: `1px solid ${colors.border}`, backgroundColor: colors.input, color: colors.text,
    outline: 'none', cursor: 'pointer',
  };

  const allSelected = results.length > 0 && results.every((r) => selectedIds.has(r.id));

  return (
    <div
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="lit-search-title"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="modal-card"
        style={{ backgroundColor: colors.surface, borderRadius: '16px', padding: '24px', width: '90%', maxWidth: '700px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexShrink: 0 }}>
          <h2 id="lit-search-title" style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: colors.text }}>📚 Literature Search</h2>
          <button onClick={handleClose} aria-label="Close literature search" style={{ background: 'none', border: 'none', color: colors.textSecondary, cursor: 'pointer', fontSize: '18px', padding: '4px 8px' }}>✕</button>
        </div>

        <p style={{ fontSize: '12px', color: colors.textSecondary, margin: '0 0 12px', flexShrink: 0 }}>
          Searches open-access academic papers via OpenAlex and filters out anything that does not match your project topic.
        </p>

        {project?.topic && (
          <div style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '10px', flexShrink: 0 }}>
            <span style={{ fontWeight: '600' }}>Your topic:</span> {project.topic}
            {project.field ? ` (${project.field})` : ''}
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexShrink: 0 }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={suggestedQuery ? `Search within your topic (e.g. ${suggestedQuery})` : 'Enter a research topic'}
            style={{
              flex: 1, padding: '10px 14px', fontSize: '14px', borderRadius: '8px',
              border: `1px solid ${colors.border}`, backgroundColor: colors.input, color: colors.text,
              outline: 'none',
            }}
          />
          <button
            onClick={handleSearch}
            disabled={searching || (!query.trim() && !project?.topic)}
            style={{
              padding: '10px 20px', fontSize: '13px', fontWeight: '600', borderRadius: '8px',
              backgroundColor: searching ? colors.textSecondary : colors.primary,
              color: 'white', border: 'none', cursor: searching ? 'not-allowed' : 'pointer',
              opacity: searching ? 0.6 : 1, whiteSpace: 'nowrap',
            }}
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '14px', flexShrink: 0, flexWrap: 'wrap' }}>
          <select value={yearWindow} onChange={(e) => setYearWindow(e.target.value)} style={selectStyle} aria-label="Publication year range">
            {YEAR_OPTIONS.map((opt) => (
              <option key={opt.label} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: colors.textSecondary, cursor: 'pointer' }}>
            <input type="checkbox" checked={sortByCitations} onChange={(e) => setSortByCitations(e.target.checked)} />
            Most cited first
          </label>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '8px', fontSize: '13px', marginBottom: '12px', flexShrink: 0 }}>
            {error}
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', minHeight: '100px' }}>
          {searching ? (
            <div style={{ textAlign: 'center', padding: '40px', color: colors.textSecondary }}>
              <div style={{ width: '32px', height: '32px', border: `3px solid ${colors.primary}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
              Searching academic sources and filtering for topic relevance...
            </div>
          ) : results.length > 0 ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', color: colors.textSecondary }}>
                  {results.length} on-topic paper{meta?.consideredCount > results.length ? `s (from ${meta.consideredCount} checked)` : ''}
                </span>
                <button
                  onClick={() => setSelectedIds(allSelected ? new Set() : new Set(results.map((r) => r.id)))}
                  style={{
                    fontSize: '12px', padding: '4px 10px', borderRadius: '4px',
                    backgroundColor: allSelected ? 'transparent' : colors.primary,
                    color: allSelected ? colors.textSecondary : 'white',
                    border: `1px solid ${allSelected ? colors.border : colors.primary}`,
                    cursor: 'pointer', fontWeight: '500',
                  }}
                >
                  {allSelected ? '☐ Deselect All' : '☑ Select All'}
                </button>
              </div>

              {results.map((r) => {
                const selected = selectedIds.has(r.id);
                const badge = RELEVANCE_STYLES[r.relevance] || RELEVANCE_STYLES.low;
                return (
                  <div key={r.id} onClick={() => toggleSelect(r.id)} style={resultStyle(selected)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', fontSize: '14px', color: colors.text, marginBottom: '4px' }}>{r.title}</div>
                        <div style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '2px' }}>{r.authors} ({r.year})</div>
                        {r.journal && <div style={{ fontSize: '11px', color: colors.textSecondary, fontStyle: 'italic' }}>{r.journal}</div>}
                        <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', backgroundColor: badge.background, color: badge.color, fontWeight: '600' }}>
                            {badge.label} {Math.round(r.score * 100)}%
                          </span>
                          {r.isOpenAccess && <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', backgroundColor: '#d1fae5', color: '#059669', fontWeight: '600' }}>Open Access</span>}
                          {r.doi && <span style={{ fontSize: '10px', color: colors.primary }}>DOI: {r.doi}</span>}
                          {r.citedBy > 0 && <span style={{ fontSize: '10px', color: colors.textSecondary }}>Cited by {r.citedBy}</span>}
                        </div>
                        {r.abstract && <div style={{ fontSize: '12px', color: colors.text, marginTop: '4px', lineHeight: '1.4' }}>{r.abstract}</div>}
                        {r.uri && <div style={{ fontSize: '11px', color: colors.primary, marginTop: '2px', wordBreak: 'break-all' }}>{r.uri}</div>}
                      </div>
                      <div style={{
                        width: '22px', height: '22px', borderRadius: '4px', flexShrink: 0, marginTop: '2px',
                        backgroundColor: selected ? '#059669' : 'transparent',
                        border: `2px solid ${selected ? '#059669' : colors.border}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontSize: '14px', fontWeight: '700',
                      }}>
                        {selected ? '✓' : ''}
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: colors.textSecondary, fontSize: '14px' }}>
              {project?.topic
                ? 'Search above to find open-access papers matching your topic.'
                : 'Enter a research topic above to find open-access academic papers.'}
            </div>
          )}
        </div>

        {results.length > 0 && (
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexShrink: 0, justifyContent: 'flex-end', borderTop: `1px solid ${colors.border}`, paddingTop: '16px' }}>
            <span style={{ fontSize: '13px', color: colors.textSecondary, alignSelf: 'center' }}>
              {selectedIds.size} of {results.length} selected
            </span>
            <button
              onClick={handleSave}
              disabled={selectedIds.size === 0}
              style={{
                padding: '10px 20px', fontSize: '13px', fontWeight: '600', borderRadius: '8px',
                backgroundColor: selectedIds.size === 0 ? colors.textSecondary : '#059669',
                color: 'white', border: 'none', cursor: selectedIds.size === 0 ? 'not-allowed' : 'pointer',
                opacity: selectedIds.size === 0 ? 0.6 : 1,
              }}
            >
              Save Selected ({selectedIds.size}) to Sources
            </button>
          </div>
        )}

        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
};

export default LiteratureSearchModal;