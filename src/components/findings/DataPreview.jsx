import React from 'react';
import { formatKey } from '../../utils/findingsHelpers';

const DataPreview = ({ extractedData, useAIGenerated, colors, isDarkMode }) => {
  if (!extractedData) return null;

  return (
    <div style={{
      backgroundColor: isDarkMode ? '#2d2d2d' : '#f9fafb',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '24px',
      border: `1px solid ${colors.border}`
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: colors.text }}>
          Data Preview {useAIGenerated ? '(AI Generated)' : '(Uploaded)'}
        </h3>
        <span style={{
          backgroundColor: useAIGenerated ? colors.primary : '#059669',
          color: 'white',
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: '500'
        }}>
          {useAIGenerated ? 'AI Generated' : 'Uploaded Data'}
        </span>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <p style={{ color: colors.text }}>
          <strong>Total Responses:</strong> {extractedData.totalResponses}
        </p>
      </div>

      {extractedData.keyFindings && (
        <div style={{ marginBottom: '16px' }}>
          <p style={{ fontWeight: '600', color: colors.text, marginBottom: '8px' }}>Key Findings:</p>
          <ul style={{ paddingLeft: '20px' }}>
            {extractedData.keyFindings.map((finding, index) => (
              <li key={index} style={{ color: colors.textSecondary, marginBottom: '4px' }}>{finding}</li>
            ))}
          </ul>
        </div>
      )}

      {extractedData.demographicData && (
        <div style={{ marginBottom: '16px' }}>
          <p style={{ fontWeight: '600', color: colors.text, marginBottom: '8px' }}>Demographics:</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            {Object.entries(extractedData.demographicData).map(([key, value]) => (
              <div key={key} style={{
                backgroundColor: isDarkMode ? '#3d3d3d' : 'white',
                padding: '12px',
                borderRadius: '8px',
                border: `1px solid ${colors.border}`
              }}>
                <div style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '4px', textTransform: 'capitalize' }}>
                  {formatKey(key)}
                </div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: colors.primary }}>
                  {typeof value === 'object' ? Object.keys(value).length + ' categories' : value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {extractedData.statisticalData && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '12px',
          marginBottom: '16px'
        }}>
          {Object.entries(extractedData.statisticalData).map(([key, value]) => (
            <div key={key} style={{
              backgroundColor: isDarkMode ? '#3d3d3d' : 'white',
              padding: '12px',
              borderRadius: '8px',
              textAlign: 'center',
              border: `1px solid ${colors.border}`
            }}>
              <div style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '4px', textTransform: 'capitalize' }}>
                {formatKey(key)}
              </div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: colors.primary }}>{value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DataPreview;
