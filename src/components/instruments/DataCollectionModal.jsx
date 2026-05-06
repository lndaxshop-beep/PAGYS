import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import useInstrumentGeneration from '../../hooks/useInstrumentGeneration';
import InstrumentSelection from './InstrumentSelection';
import InstrumentTabs from './InstrumentTabs';
import InstrumentPreview from './InstrumentPreview';
import GenerationState from './GenerationState';
import ErrorState from './ErrorState';

const DataCollectionModal = ({ project, onClose, onDownload, onNotify }) => {
  const { colors, isDarkMode } = useTheme();

  const {
    selectedInstruments, generatedContent, downloadedInstruments, generating,
    activeTab, autoSelect, generationProgress, error, canClose, hasGeneratedContent,
    setSelectedInstruments, setAutoSelect, setActiveTab, setError, setGenerating,
    toggleInstrument, selectAllRecommended, handleGenerate, handleDownloadInstrument,
    handleDownloadAll, handleStartOver, onClose: handleClose
  } = useInstrumentGeneration(project, onClose, onDownload, onNotify);

  if (error) {
    return (
      <ErrorState
        error={error}
        onTryAgain={() => { setError(null); setGenerating(false); }}
        onClose={handleClose}
        colors={colors}
      />
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
      <div style={{ backgroundColor: colors.surface, borderRadius: '16px', padding: '32px', maxWidth: '1000px', width: '95%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', border: `1px solid ${colors.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: colors.text, marginBottom: '4px' }}>Data Collection Instruments</h2>
            <p style={{ color: colors.textSecondary, fontSize: '14px' }}>Select and generate research instruments for your study</p>
          </div>
        </div>

        <div style={{ backgroundColor: isDarkMode ? '#2d2d2d' : '#f5f3ff', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', border: `1px solid ${colors.primary}` }}>
          <p style={{ color: colors.primary, fontWeight: '500', fontSize: '14px' }}>
            <strong>Project:</strong> {project?.title} &nbsp;|&nbsp; <strong>Methodology:</strong> {(project?.methodology || 'mixed methods').charAt(0).toUpperCase() + (project?.methodology || 'mixed methods').slice(1)}
          </p>
        </div>

        {!hasGeneratedContent && !generating && (
          <InstrumentSelection
            selectedInstruments={selectedInstruments}
            project={project}
            autoSelect={autoSelect}
            onToggle={(id) => { if (id) { toggleInstrument(id); } else { setAutoSelect(false); setSelectedInstruments([]); }}}
            onSelectAll={selectAllRecommended}
            onAutoSelectChange={setAutoSelect}
            onGenerate={handleGenerate}
            colors={colors}
            isDarkMode={isDarkMode}
          />
        )}

        {generating && (
          <GenerationState generationProgress={generationProgress} colors={colors} isDarkMode={isDarkMode} />
        )}

        {hasGeneratedContent && !generating && (
          <>
            <InstrumentTabs
              selectedInstruments={selectedInstruments}
              generatedContent={generatedContent}
              downloadedInstruments={downloadedInstruments}
              activeTab={activeTab}
              onTabClick={setActiveTab}
              colors={colors}
            />

            {activeTab && generatedContent[activeTab] && (
              <div style={{ backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff', borderRadius: '12px', padding: '24px', border: `1px solid ${colors.border}`, marginBottom: '20px', maxHeight: '400px', overflowY: 'auto' }}>
                <InstrumentPreview instrumentId={activeTab} content={generatedContent[activeTab]} colors={colors} />
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => handleDownloadInstrument(activeTab)} style={{ flex: 1, backgroundColor: '#059669', color: 'white', padding: '14px', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s' }}>📄 Download Selected Instrument</button>
              {selectedInstruments.filter(id => generatedContent[id]).length > 1 && (
                <button onClick={handleDownloadAll} style={{ flex: 1, backgroundColor: colors.primary, color: 'white', padding: '14px', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s' }}>📦 Download All Instruments</button>
              )}
              <button onClick={handleStartOver} style={{ backgroundColor: 'transparent', color: colors.text, padding: '14px 24px', border: `1px solid ${colors.border}`, borderRadius: '8px', fontWeight: '600', fontSize: '15px', cursor: 'pointer' }}>Start Over</button>
            </div>

            <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '14px', color: colors.textSecondary, fontStyle: 'italic' }}>
              You must download at least one instrument before continuing to Chapter 4
            </p>
          </>
        )}
      </div>

      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default DataCollectionModal;
