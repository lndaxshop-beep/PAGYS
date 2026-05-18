import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const TableRenderer = ({ headers, rows, title, caption, onEdit }) => {
  const { colors, isDarkMode } = useTheme();
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [showEditor, setShowEditor] = useState(false);
  const [editHeaders, setEditHeaders] = useState('');
  const [editRows, setEditRows] = useState('');

  const handleSort = (columnIndex) => {
    if (sortColumn === columnIndex) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnIndex);
      setSortDirection('asc');
    }
  };

  const sortedRows = () => {
    if (sortColumn === null) return rows || [];
    return [...(rows || [])].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      const aNum = parseFloat(aVal);
      const bNum = parseFloat(bVal);
      if (!isNaN(aNum) && !isNaN(bNum)) return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
      return sortDirection === 'asc' ? String(aVal).localeCompare(String(bVal)) : -String(aVal).localeCompare(String(bVal));
    });
  };

  const handleEdit = () => {
    setEditHeaders((headers || []).join(' | '));
    setEditRows((rows || []).map(r => r.join(' | ')).join('\n'));
    setShowEditor(true);
  };

  const handleSaveEdit = () => {
    const newHeaders = editHeaders.split('|').map(s => s.trim()).filter(Boolean);
    const newRows = editRows.split('\n').filter(l => l.trim()).map(l => l.split('|').map(s => s.trim()).filter(Boolean));
    if (onEdit && newHeaders.length > 0) {
      onEdit({ headers: newHeaders, rows: newRows, title, caption });
    }
    setShowEditor(false);
  };

  const displayRows = sortedRows();

  return (
    <div style={{
      backgroundColor: colors.surface, borderRadius: '12px', padding: '24px',
      marginBottom: '24px', border: `1px solid ${colors.border}`, overflow: 'auto'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          {title && <h4 style={{ fontSize: '18px', fontWeight: '600', color: colors.text, marginBottom: '4px' }}>Table: {title}</h4>}
          {caption && <p style={{ fontSize: '14px', color: colors.textSecondary, fontStyle: 'italic' }}>{caption}</p>}
        </div>
        {onEdit && !showEditor && (
          <button onClick={handleEdit} style={{ padding: '6px 12px', backgroundColor: 'transparent', border: `1px solid ${colors.border}`, borderRadius: '6px', color: colors.text, cursor: 'pointer', fontSize: '13px' }}>✏️ Edit</button>
        )}
      </div>

      {showEditor && (
        <div style={{ marginBottom: '16px', padding: '16px', backgroundColor: colors.background, borderRadius: '8px' }}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '13px', fontWeight: '500', color: colors.text, display: 'block', marginBottom: '4px' }}>Headers (pipe-separated)</label>
            <input value={editHeaders} onChange={e => setEditHeaders(e.target.value)} style={{ width: '100%', padding: '8px', border: `1px solid ${colors.inputBorder}`, borderRadius: '6px', backgroundColor: colors.input, color: colors.text }} />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '13px', fontWeight: '500', color: colors.text, display: 'block', marginBottom: '4px' }}>Rows (one per line, pipe-separated)</label>
            <textarea value={editRows} onChange={e => setEditRows(e.target.value)} rows={6} style={{ width: '100%', padding: '8px', border: `1px solid ${colors.inputBorder}`, borderRadius: '6px', backgroundColor: colors.input, color: colors.text, fontFamily: 'monospace', fontSize: '13px' }} />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleSaveEdit} style={{ padding: '8px 16px', backgroundColor: colors.primary, color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>Apply</button>
            <button onClick={() => setShowEditor(false)} style={{ padding: '8px 16px', backgroundColor: 'transparent', border: `1px solid ${colors.border}`, borderRadius: '6px', color: colors.text, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
        <thead>
          <tr style={{ backgroundColor: '#2C3E50', borderBottom: `2px solid ${colors.border}` }}>
            {(headers || []).map((header, index) => (
              <th key={index} onClick={() => handleSort(index)} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: '600', color: '#ffffff', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {header}
                  {sortColumn === index && <span style={{ fontSize: '11px' }}>{sortDirection === 'asc' ? '▲' : '▼'}</span>}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayRows.map((row, rowIndex) => (
            <tr key={rowIndex} style={{ borderBottom: `1px solid ${colors.border}`, backgroundColor: rowIndex % 2 === 0 ? 'transparent' : (isDarkMode ? '#2d2d2d' : '#f8fafc') }}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} style={{ padding: '10px 14px', color: colors.text }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {displayRows.length === 0 && (
        <p style={{ textAlign: 'center', color: colors.textSecondary, padding: '40px' }}>No data available</p>
      )}
    </div>
  );
};

export default TableRenderer;
