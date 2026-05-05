import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const RecycleBin = ({ deletedProjects, onRestore, onPermanentDelete, onEmpty }) => {
  const { colors, isDarkMode } = useTheme();
  return (
    <div style={{ backgroundColor: colors.surface, borderRadius: '12px', padding: '24px', marginBottom: '32px', border: `1px solid ${colors.border}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: colors.text }}>
          🗑️ Recycle Bin <span style={{ backgroundColor: isDarkMode ? '#3d3d3d' : '#f3f4f6', color: colors.textSecondary, padding: '2px 10px', borderRadius: '999px', fontSize: '14px', fontWeight: 'normal' }}>
            {deletedProjects.length} items
          </span>
        </h2>
        {deletedProjects.length > 0 && (
          <button onClick={onEmpty} style={{
            backgroundColor: '#ef4444', color: 'white', padding: '8px 16px',
            border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '500', cursor: 'pointer'
          }}>Empty Recycle Bin</button>
        )}
      </div>
      {deletedProjects.length > 0 ? (
        <div style={{ display: 'grid', gap: '12px' }}>
          {deletedProjects.map(project => (
            <div key={project.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '16px', backgroundColor: isDarkMode ? '#3d3d3d' : '#f9fafb',
              borderRadius: '8px', border: `1px solid ${colors.border}`
            }}>
              <div>
                <h3 style={{ fontWeight: '600', color: colors.text, marginBottom: '4px' }}>{project.title}</h3>
                <p style={{ fontSize: '13px', color: colors.textSecondary }}>Deleted: {new Date(project.deletedAt).toLocaleString()}</p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => onRestore(project.id)} style={{
                  backgroundColor: '#059669', color: 'white', padding: '8px 16px',
                  border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer'
                }}>Restore</button>
                <button onClick={() => onPermanentDelete(project.id)} style={{
                  backgroundColor: '#ef4444', color: 'white', padding: '8px 16px',
                  border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer'
                }}>Delete Permanently</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ textAlign: 'center', color: colors.textSecondary, padding: '32px' }}>Recycle bin is empty.</p>
      )}
    </div>
  );
};

export default RecycleBin;
