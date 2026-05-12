import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const LiteratureSearchModal = ({ isOpen, onClose, onSaveSources, project }) => {
  const { colors, isDarkMode } = useTheme();
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setError('');
    setResults([]);
    try {
      const { genAI, MODEL } = await import('../services/gemini/config');
      const model = genAI.getGenerativeModel({
        model: MODEL,
        tools: [{ googleSearch: {} }],
        generationConfig: { temperature: 0.2 },
      });

      const prompt = `Search for academic sources related to: "${query.trim()}"

For the thesis topic: "${project?.title || ''}" in the field of "${project?.field || ''}".

Return a JSON array of exactly 5-8 academic sources. Each source MUST be a REAL publication found via Google Search. Format:

[
  {
    "title": "Full paper title",
    "authors": "Author1, Author2",
    "year": "2023",
    "journal": "Journal Name",
    "doi": "10.xxxx/xxxxx",
    "abstract": "Brief summary of the paper (1-2 sentences)",
    "relevance": "high/medium/low",
    "uri": "URL to the paper"
  }
]

CRITICAL:
- Every source MUST be real and verifiable via the URI.
- Include a mix of recent (last 5 years) and seminal works.
- Focus on peer-reviewed journal articles and academic books.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setResults(parsed);
      } else {
        setError('Could not parse search results. Please try a different query.');
      }
    } catch (e) {
      console.error('Literature search failed:', e);
      setError('Search failed: ' + (e.message || 'Unknown error'));
    }
    setSearching(false);
  };

  const toggleSelect = (idx) => {
    const updated = new Set(selectedIds);
    if (updated.has(idx)) updated.delete(idx);
    else updated.add(idx);
    setSelectedIds(updated);
  };

  const handleSave = () => {
    const selected = results.filter((_, i) => selectedIds.has(i));
    if (selected.length === 0) return;
    const sources = selected.map(r => ({
      id: `litsearch_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      title: r.title,
      authors: r.authors,
      year: parseInt(r.year) || new Date().getFullYear(),
      journal: r.journal || '',
      doi: r.doi || '',
      uri: r.uri || '',
      keyFindings: r.abstract ? [r.abstract] : [],
      relevanceToTopic: r.relevance || 'medium',
      methodology: 'Not specified',
      sampleSize: 'N/A',
      theoreticalFramework: '',
    }));
    onSaveSources?.(sources);
    setResults([]);
    setQuery('');
    setSelectedIds(new Set());
  };

  const resultStyle = (idx) => ({
    padding: '12px', borderRadius: '8px', cursor: 'pointer',
    backgroundColor: selectedIds.has(idx) ? (isDarkMode ? '#2d6a4f30' : '#d1fae5') : (isDarkMode ? '#2d2d2d' : '#f9fafb'),
    border: `1px solid ${selectedIds.has(idx) ? '#059669' : colors.border}`,
    transition: 'all 0.2s',
    marginBottom: '8px',
  });

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ backgroundColor: colors.surface, borderRadius: '16px', padding: '24px', width: '90%', maxWidth: '700px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexShrink: 0 }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: colors.text }}>📚 Literature Search</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: colors.textSecondary, cursor: 'pointer', fontSize: '18px', padding: '4px 8px' }}>✕</button>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexShrink: 0 }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search for literature (e.g., 'AI in education 2023')"
            style={{
              flex: 1, padding: '10px 14px', fontSize: '14px', borderRadius: '8px',
              border: `1px solid ${colors.border}`, backgroundColor: colors.input, color: colors.text,
              outline: 'none',
            }}
          />
          <button
            onClick={handleSearch}
            disabled={searching || !query.trim()}
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

        {error && (
          <div style={{ padding: '10px 14px', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '8px', fontSize: '13px', marginBottom: '12px', flexShrink: 0 }}>
            {error}
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', minHeight: '100px' }}>
          {searching ? (
            <div style={{ textAlign: 'center', padding: '40px', color: colors.textSecondary }}>
              <div style={{ width: '32px', height: '32px', border: `3px solid ${colors.primary}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
              Searching academic sources...
            </div>
          ) : results.length > 0 ? (
            results.map((r, i) => (
              <div key={i} onClick={() => toggleSelect(i)} style={resultStyle(i)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', fontSize: '14px', color: colors.text, marginBottom: '4px' }}>{r.title}</div>
                    <div style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '2px' }}>{r.authors} ({r.year})</div>
                    {r.journal && <div style={{ fontSize: '11px', color: colors.textSecondary, fontStyle: 'italic' }}>{r.journal}</div>}
                    {r.abstract && <div style={{ fontSize: '12px', color: colors.text, marginTop: '4px' }}>{r.abstract}</div>}
                    {r.uri && <div style={{ fontSize: '11px', color: colors.primary, marginTop: '2px', wordBreak: 'break-all' }}>{r.uri}</div>}
                  </div>
                  <div style={{
                    width: '22px', height: '22px', borderRadius: '4px', flexShrink: 0, marginTop: '2px',
                    backgroundColor: selectedIds.has(i) ? '#059669' : 'transparent',
                    border: `2px solid ${selectedIds.has(i) ? '#059669' : colors.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: '14px', fontWeight: '700',
                  }}>
                    {selectedIds.has(i) ? '✓' : ''}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: colors.textSecondary, fontSize: '14px' }}>
              Enter a search query above to find academic sources. Results will appear here.
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
