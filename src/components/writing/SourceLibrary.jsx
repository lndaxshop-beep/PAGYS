import React, { useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const SourceLibrary = ({
  sources, extracting, loading, matrix, generatingMatrix,
  onAddFile, onRemoveSource, onGenerateMatrix, onClearSources
}) => {
  const { colors, isDarkMode } = useTheme();
  const fileInputRef = useRef(null);

  const containerStyle = {
    backgroundColor: colors.surface, borderRadius: '12px',
    padding: '24px', border: `1px solid ${colors.border}`
  };

  const sourceCardStyle = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 16px', marginBottom: '8px', borderRadius: '8px',
    backgroundColor: isDarkMode ? '#2d2d2d' : '#f9fafb',
    border: `1px solid ${colors.border}`
  };

  const matrixTableStyle = {
    width: '100%', borderCollapse: 'collapse', fontSize: '13px'
  };

  const matrixCellStyle = {
    border: `1px solid ${colors.border}`, padding: '8px 10px',
    color: colors.text, verticalAlign: 'top', fontSize: '12px'
  };

  const matrixHeaderStyle = {
    ...matrixCellStyle,
    fontWeight: '600', backgroundColor: isDarkMode ? '#3d3d3d' : '#f3f4f6',
    fontSize: '12px'
  };

  return (
    <div style={containerStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: colors.text, margin: 0 }}>
            Source Library
          </h2>
          <p style={{ color: colors.textSecondary, fontSize: '14px', marginTop: '4px' }}>
            Upload and manage research papers for your literature review
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {sources.length > 0 && (
            <button
              onClick={onClearSources}
              style={{
                color: '#ef4444', background: 'none', border: `1px solid #ef4444`,
                padding: '8px 16px', borderRadius: '6px', cursor: 'pointer',
                fontSize: '13px', fontWeight: '500'
              }}
            >Clear All</button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.jpg,.jpeg,.png"
            multiple
            onChange={onAddFile}
            style={{ display: 'none' }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              backgroundColor: colors.primary, color: 'white',
              padding: '8px 16px', border: 'none', borderRadius: '6px',
              fontWeight: '500', cursor: 'pointer', fontSize: '13px'
            }}
          >+ Add Source</button>
        </div>
      </div>

      {extracting && (
        <div style={{ textAlign: 'center', padding: '24px', backgroundColor: isDarkMode ? '#2d2d2d' : '#f5f3ff', borderRadius: '8px', marginBottom: '20px' }}>
          <div style={{
            width: '32px', height: '32px', border: `3px solid ${colors.primary}`,
            borderTopColor: 'transparent', borderRadius: '50%',
            margin: '0 auto 12px', animation: 'spin 0.8s linear infinite'
          }} />
          <p style={{ color: colors.textSecondary }}>Extracting paper metadata from file...</p>
        </div>
      )}

      {sources.length === 0 && !extracting && (
        <div style={{
          textAlign: 'center', padding: '40px', border: `2px dashed ${colors.border}`,
          borderRadius: '8px', marginBottom: '20px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📚</div>
          <p style={{ color: colors.text, fontWeight: '500', marginBottom: '8px' }}>
            No sources uploaded yet
          </p>
          <p style={{ color: colors.textSecondary, fontSize: '13px', marginBottom: '16px' }}>
            Upload PDFs, Word documents, or screenshots of research papers
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              backgroundColor: colors.primary, color: 'white',
              padding: '10px 24px', border: 'none', borderRadius: '8px',
              fontWeight: '500', cursor: 'pointer', fontSize: '14px'
            }}
          >Upload Your First Source</button>
        </div>
      )}

      {sources.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '600', color: colors.text, marginBottom: '12px' }}>
            Uploaded Papers ({sources.length})
          </h3>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {sources.map(source => (
              <div key={source.id} style={sourceCardStyle}>
                <div style={{ flex: 1, overflow: 'hidden', marginRight: '12px' }}>
                  <div style={{
                    fontSize: '14px', color: colors.text, fontWeight: '500',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                  }}>
                    {source.fileType === 'image' ? '🖼️' : source.fileType === 'pdf' ? '📕' : '📝'} {source.title}
                  </div>
                  <div style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '2px' }}>
                    {source.authors} ({source.year})
                    <span style={{ marginLeft: '8px', opacity: 0.6 }}>{source.methodology}</span>
                    <span style={{
                      marginLeft: '8px', fontSize: '11px',
                      color: source.relevanceToTopic === 'high' ? '#059669' : source.relevanceToTopic === 'medium' ? '#d97706' : '#6b7280'
                    }}>
                      {source.relevanceToTopic === 'high' ? '★ High relevance' : source.relevanceToTopic === 'medium' ? '◆ Medium' : '○ Low'}
                    </span>
                  </div>
                  {source.keyFindings && source.keyFindings.length > 0 && (
                    <div style={{ fontSize: '11px', color: colors.textSecondary, marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {source.keyFindings.slice(0, 2).join(' | ')}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => onRemoveSource(source.id)}
                  style={{
                    color: '#ef4444', background: 'none', border: 'none',
                    cursor: 'pointer', fontSize: '18px', padding: '4px 8px',
                    borderRadius: '4px', flexShrink: 0
                  }}
                  title={`Remove ${source.title}`}
                >✕</button>
              </div>
            ))}
          </div>

          {sources.length >= 2 && (
            <button
              onClick={onGenerateMatrix}
              disabled={generatingMatrix}
              style={{
                width: '100%', marginTop: '16px',
                backgroundColor: generatingMatrix ? '#9ca3af' : colors.primary,
                color: 'white', padding: '12px', border: 'none', borderRadius: '8px',
                fontWeight: '600', cursor: generatingMatrix ? 'not-allowed' : 'pointer',
                fontSize: '14px'
              }}
            >
              {generatingMatrix ? '⏳ Generating Literature Matrix...' : '📊 Generate Literature Matrix'}
            </button>
          )}
        </div>
      )}

      {generatingMatrix && (
        <div style={{ textAlign: 'center', padding: '24px' }}>
          <div style={{
            width: '32px', height: '32px', border: `3px solid ${colors.primary}`,
            borderTopColor: 'transparent', borderRadius: '50%',
            margin: '0 auto 12px', animation: 'spin 0.8s linear infinite'
          }} />
          <p style={{ color: colors.textSecondary }}>AI is synthesizing your sources into a literature matrix...</p>
        </div>
      )}

      {matrix && !generatingMatrix && (
        <div style={{ marginTop: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: colors.text, marginBottom: '12px' }}>
            Literature Matrix
          </h3>

          {matrix.summary && (
            <div style={{
              padding: '16px', backgroundColor: isDarkMode ? '#2d2d2d' : '#f5f3ff',
              borderRadius: '8px', marginBottom: '16px', border: `1px solid ${colors.primary}30`
            }}>
              <p style={{ fontSize: '14px', color: colors.text, lineHeight: '1.6', margin: 0 }}>{matrix.summary}</p>
            </div>
          )}

          {matrix.matrixHeaders && matrix.matrixRows && (
            <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
              <table style={matrixTableStyle}>
                <thead>
                  <tr>
                    {matrix.matrixHeaders.map((header, i) => (
                      <th key={i} style={matrixHeaderStyle}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matrix.matrixRows.map((row, ri) => (
                    <tr key={ri} style={{ backgroundColor: ri % 2 === 0 ? 'transparent' : (isDarkMode ? '#2d2d2d' : '#f9fafb') }}>
                      {row.map((cell, ci) => (
                        <td key={ci} style={matrixCellStyle}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {matrix.researchGaps && matrix.researchGaps.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '600', color: colors.text, marginBottom: '8px' }}>
                Research Gaps Identified
              </h4>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {matrix.researchGaps.map((gap, i) => (
                  <li key={i} style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '4px' }}>{gap}</li>
                ))}
              </ul>
            </div>
          )}

          {matrix.recommendedDirection && (
            <div style={{
              padding: '12px 16px', backgroundColor: isDarkMode ? '#064e3b' : '#d1fae5',
              borderRadius: '8px', border: `1px solid #059669`
            }}>
              <p style={{ fontSize: '13px', color: isDarkMode ? '#a7f3d0' : '#047857', margin: 0 }}>
                <strong>Recommended Direction:</strong> {matrix.recommendedDirection}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SourceLibrary;
