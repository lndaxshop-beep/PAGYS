import React from 'react';

const FileUploader = ({ responseType, selectedOption, uploadedFiles, onFileUpload, onRemoveFile, colors, isDarkMode }) => {
  const isUploadType = responseType === 'google-forms' || responseType === 'survey-monkey' || responseType === 'excel';

  if (!isUploadType) return null;

  return (
    <>
      <div
        style={{
          border: `2px dashed ${selectedOption === 'upload' ? colors.primary : colors.border}`,
          borderRadius: '12px',
          padding: '32px',
          textAlign: 'center',
          marginBottom: '24px',
          backgroundColor: selectedOption === 'upload' ? (isDarkMode ? '#2d2d2d' : '#f5f3ff') : colors.background,
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
        onClick={() => document.getElementById('file-upload').click()}
        onMouseEnter={(e) => {
          if (selectedOption !== 'upload') {
            e.currentTarget.style.backgroundColor = isDarkMode ? '#3d3d3d' : '#f9fafb';
            e.currentTarget.style.borderColor = colors.primary;
          }
        }}
        onMouseLeave={(e) => {
          if (selectedOption !== 'upload') {
            e.currentTarget.style.backgroundColor = colors.background;
            e.currentTarget.style.borderColor = colors.border;
          }
        }}
      >
        <input
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.pdf,.csv,.xlsx,.txt"
          onChange={onFileUpload}
          style={{ display: 'none' }}
          id="file-upload"
        />
        <div style={{ fontSize: '40px', marginBottom: '16px' }}>📎</div>
        <label
          htmlFor="file-upload"
          style={{
            backgroundColor: colors.primary,
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'inline-block',
            fontWeight: '600',
            fontSize: '14px',
            border: 'none'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          Choose Files
        </label>
        <p style={{ marginTop: '16px', color: colors.textSecondary, fontSize: '14px' }}>
          Upload screenshots, CSV files, or PDFs of your questionnaire responses
        </p>
        {selectedOption === 'upload' && (
          <div style={{ marginTop: '12px', color: colors.primary, fontSize: '13px', fontWeight: '500' }}>
            ✓ Upload option selected
          </div>
        )}
      </div>

      {uploadedFiles.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: colors.text, marginBottom: '12px' }}>
            Uploaded Files ({uploadedFiles.length})
          </h3>
          <div style={{
            maxHeight: '150px',
            overflowY: 'auto',
            border: `1px solid ${colors.border}`,
            borderRadius: '8px',
            backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff'
          }}>
            {uploadedFiles.map((file, index) => (
              <div key={index} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 16px',
                borderBottom: index < uploadedFiles.length - 1 ? `1px solid ${colors.border}` : 'none'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '20px' }}>📄</span>
                  <div>
                    <div style={{ fontSize: '14px', color: colors.text, fontWeight: '500' }}>{file.name}</div>
                    <div style={{ fontSize: '11px', color: colors.textSecondary }}>{(file.size / 1024).toFixed(1)} KB</div>
                  </div>
                </div>
                <button
                  onClick={() => onRemoveFile(index)}
                  style={{
                    color: '#ef4444',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '18px',
                    padding: '4px 8px',
                    borderRadius: '4px'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fee2e2'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default FileUploader;
