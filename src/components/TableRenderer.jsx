import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const TableRenderer = ({ headers, rows, title, caption }) => {
  const { colors, isDarkMode } = useTheme();
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

  const handleSort = (columnIndex) => {
    if (sortColumn === columnIndex) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnIndex);
      setSortDirection('asc');
    }
  };

  const sortedRows = () => {
    if (sortColumn === null) return rows;
    
    return [...rows].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      
      // Check if numeric
      const aNum = parseFloat(aVal);
      const bNum = parseFloat(bVal);
      
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
      }
      
      // String comparison
      const comparison = String(aVal).localeCompare(String(bVal));
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };

  const displayRows = sortedRows();

  return (
    <div style={{
      backgroundColor: colors.surface,
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '24px',
      border: `1px solid ${colors.border}`,
      overflow: 'auto'
    }}>
      {title && (
        <h4 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: colors.text,
          marginBottom: '4px'
        }}>
          Table: {title}
        </h4>
      )}
      {caption && (
        <p style={{
          fontSize: '14px',
          color: colors.textSecondary,
          fontStyle: 'italic',
          marginBottom: '20px'
        }}>
          {caption}
        </p>
      )}
      
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '14px'
      }}>
        <thead>
          <tr style={{
            backgroundColor: isDarkMode ? '#374151' : '#f3f4f6',
            borderBottom: `2px solid ${colors.border}`
          }}>
            {headers.map((header, index) => (
              <th
                key={index}
                onClick={() => handleSort(index)}
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontWeight: '600',
                  color: colors.text,
                  cursor: 'pointer',
                  userSelect: 'none',
                  whiteSpace: 'nowrap'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {header}
                  {sortColumn === index && (
                    <span style={{ fontSize: '12px' }}>
                      {sortDirection === 'asc' ? '▲' : '▼'}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayRows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              style={{
                borderBottom: `1px solid ${colors.border}`,
                backgroundColor: rowIndex % 2 === 0 
                  ? 'transparent' 
                  : (isDarkMode ? '#2d2d2d' : '#fafafa')
              }}
            >
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  style={{
                    padding: '12px 16px',
                    color: colors.text
                  }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      
      {displayRows.length === 0 && (
        <p style={{
          textAlign: 'center',
          color: colors.textSecondary,
          padding: '40px'
        }}>
          No data available
        </p>
      )}
    </div>
  );
};

export default TableRenderer;