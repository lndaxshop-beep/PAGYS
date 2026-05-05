import React from 'react';
import { saveAs } from 'file-saver';
import { useTheme } from '../contexts/ThemeContext';
import useFindingsData from '../hooks/useFindingsData';
import FileUploader from './findings/FileUploader';
import ManualEntry from './findings/ManualEntry';
import DataPreview from './findings/DataPreview';
import { exportToCSV } from '../utils/findingsHelpers';

const UploadFindings = ({ project, onClose, onUpload, onGenerateWithAI }) => {
  const { colors, isDarkMode } = useTheme();

  const {
    uploadedFiles,
    extractedData,
    analyzing,
    responseType,
    manualData,
    useAIGenerated,
    selectedOption,
    setResponseType,
    handleFileUpload,
    handleRemoveFile,
    handleUseAIData,
    handleExtractData,
    handleManualDataChange,
    processManualData,
    handleGenerateChapter4,
    isOptionSelected
  } = useFindingsData(project, onUpload, onGenerateWithAI);

  const handleExportCSV = () => {
    if (!extractedData) return;
    const csvContent = exportToCSV(extractedData, project.title);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    saveAs(blob, `findings-${project.title.replace(/\s+/g, '_')}.csv`);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: colors.surface,
        borderRadius: '16px',
        padding: '32px',
        maxWidth: '900px',
        width: '95%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: isDarkMode ? '0 20px 40px rgba(0,0,0,0.5)' : '0 20px 40px rgba(0,0,0,0.3)',
        border: `1px solid ${colors.border}`
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: colors.text }}>
              Chapter 4: Results & Analysis
            </h2>
            <p style={{ color: colors.textSecondary, marginTop: '4px' }}>
              Upload your findings or let AI generate sample data
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '28px',
              cursor: 'pointer',
              color: colors.textSecondary,
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.hover;
              e.currentTarget.style.color = colors.text;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = colors.textSecondary;
            }}
          >
            ×
          </button>
        </div>

        <div style={{
          backgroundColor: isDarkMode ? '#2d2d2d' : '#f5f3ff',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '24px',
          border: `1px solid ${colors.primary}`
        }}>
          <p style={{ color: colors.primary, fontWeight: '500' }}>
            <strong>Project:</strong> {project?.title} • <strong>Methodology:</strong> {project?.methodology || 'Mixed Methods'}
          </p>
        </div>

        <div
          style={{
            backgroundColor: isDarkMode ? '#2d2d2d' : '#f0f9ff',
            padding: '24px',
            borderRadius: '12px',
            marginBottom: '24px',
            border: selectedOption === 'ai' ? `2px solid ${colors.primary}` : `1px solid ${colors.border}`,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onClick={handleUseAIData}
          onMouseEnter={(e) => {
            if (selectedOption !== 'ai') {
              e.currentTarget.style.backgroundColor = isDarkMode ? '#3d3d3d' : '#e6f0ff';
            }
          }}
          onMouseLeave={(e) => {
            if (selectedOption !== 'ai') {
              e.currentTarget.style.backgroundColor = isDarkMode ? '#2d2d2d' : '#f0f9ff';
            }
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: selectedOption === 'ai' ? colors.primary : colors.primary + '20',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ fontSize: '20px' }}>🤖</span>
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: colors.text, marginBottom: '4px' }}>
                Let AI Generate Sample Data
              </h3>
              <p style={{ color: colors.textSecondary, fontSize: '14px' }}>
                Don't have real data yet? AI can generate realistic sample findings based on your research topic and methodology.
              </p>
            </div>
            {selectedOption === 'ai' && (
              <div style={{
                backgroundColor: colors.primary,
                color: 'white',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '500'
              }}>
                Selected
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: colors.border }} />
          <span style={{ color: colors.textSecondary, fontWeight: '500' }}>OR</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: colors.border }} />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: colors.text }}>
            Upload Your Own Data:
          </label>
          <select
            value={responseType}
            onChange={(e) => setResponseType(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              border: `1px solid ${colors.inputBorder}`,
              borderRadius: '8px',
              backgroundColor: colors.input,
              color: colors.text,
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            <option value="google-forms">📊 Google Forms (Screenshots/CSV)</option>
            <option value="survey-monkey">📈 SurveyMonkey Export</option>
            <option value="manual">✍️ Manual Entry</option>
            <option value="excel">📑 Excel/CSV File</option>
          </select>
        </div>

        <FileUploader
          responseType={responseType}
          selectedOption={selectedOption}
          uploadedFiles={uploadedFiles}
          onFileUpload={handleFileUpload}
          onRemoveFile={handleRemoveFile}
          colors={colors}
          isDarkMode={isDarkMode}
        />

        <ManualEntry
          selectedOption={selectedOption}
          manualData={manualData}
          onDataChange={handleManualDataChange}
          colors={colors}
        />

        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {(uploadedFiles.length > 0 || responseType === 'manual') && !useAIGenerated && (
            <button
              onClick={responseType === 'manual' ? processManualData : handleExtractData}
              disabled={analyzing}
              style={{
                backgroundColor: colors.primary,
                color: 'white',
                padding: '12px 24px',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '14px',
                cursor: analyzing ? 'not-allowed' : 'pointer',
                opacity: analyzing ? 0.5 : 1,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!analyzing) {
                  e.target.style.backgroundColor = colors.primaryDark;
                  e.target.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!analyzing) {
                  e.target.style.backgroundColor = colors.primary;
                  e.target.style.transform = 'translateY(0)';
                }
              }}
            >
              {analyzing ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid white',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Processing...
                </span>
              ) : '🔍 Extract & Analyze Data'}
            </button>
          )}
          {extractedData && (
            <button
              onClick={handleExportCSV}
              style={{
                backgroundColor: '#059669',
                color: 'white',
                padding: '12px 24px',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#047857';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#059669';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              📊 Export as CSV
            </button>
          )}
        </div>

        <DataPreview
          extractedData={extractedData}
          useAIGenerated={useAIGenerated}
          colors={colors}
          isDarkMode={isDarkMode}
        />

        {(extractedData || useAIGenerated) && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handleGenerateChapter4}
              style={{
                backgroundColor: '#059669',
                color: 'white',
                padding: '14px 32px',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#047857';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 8px rgba(5, 150, 105, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#059669';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              {useAIGenerated ? 'Generate Chapter 4 with AI Data →' : 'Generate Chapter 4 with Uploaded Data →'}
            </button>
          </div>
        )}
      </div>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default UploadFindings;
