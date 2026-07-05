import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { saveAs } from 'file-saver';
import useInstrumentGeneration from '../../hooks/useInstrumentGeneration';
import InstrumentSelection from './InstrumentSelection';
import InstrumentTabs from './InstrumentTabs';
import InstrumentPreview from './InstrumentPreview';
import GenerationState from './GenerationState';
import ErrorState from './ErrorState';
import CustomQuestions from '../questionnaire/CustomQuestions';

const DataCollectionModal = ({ project, onClose, onDownload, onNotify }) => {
  const { colors, isDarkMode } = useTheme();

  const {
    selectedInstruments, generatedContent, downloadedInstruments, generating,
    activeTab, autoSelect, generationProgress, error, canClose, hasGeneratedContent,
    setSelectedInstruments, setAutoSelect, setActiveTab, setError, setGenerating,
    toggleInstrument, selectAllRecommended, handleGenerate, handleDownloadInstrument,
    handleDownloadAll, handleStartOver, onClose: handleClose,
    customQuestions, newCustomQuestion, setNewCustomQuestion,
    handleAddCustomQuestion, handleRemoveCustomQuestion
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
      <div className="modal-card-wide" style={{ backgroundColor: colors.surface, borderRadius: '16px', padding: '32px', maxWidth: '1000px', width: '95%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', border: `1px solid ${colors.border}` }}>
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
              customQuestions={customQuestions}
            />

            {activeTab && activeTab !== 'customQuestions' && generatedContent[activeTab] && (
              <div style={{ backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff', borderRadius: '12px', padding: '24px', border: `1px solid ${colors.border}`, marginBottom: '20px', maxHeight: '400px', overflowY: 'auto' }}>
                <InstrumentPreview instrumentId={activeTab} content={generatedContent[activeTab]} colors={colors} customQuestions={customQuestions} />
              </div>
            )}

            {activeTab === 'customQuestions' && customQuestions.length > 0 && (
              <div style={{ backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff', borderRadius: '12px', padding: '24px', border: `1px solid ${colors.border}`, marginBottom: '20px', maxHeight: '400px', overflowY: 'auto' }}>
                <InstrumentPreview instrumentId="customQuestions" customQuestions={customQuestions} colors={colors} />
              </div>
            )}

            <div style={{
              marginTop: '24px', paddingTop: '24px', borderTop: `2px dashed ${colors.border}`,
              marginBottom: '20px'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: colors.text, marginBottom: '4px' }}>✏️ Add Custom Questions</h3>
              <p style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '16px' }}>
                Add your own questions to supplement the AI-generated instruments
              </p>
              <CustomQuestions
                customQuestions={customQuestions}
                newCustomQuestion={newCustomQuestion}
                onChangeInput={(e) => setNewCustomQuestion(e.target.value)}
                onAdd={handleAddCustomQuestion}
                onRemove={handleRemoveCustomQuestion}
                colors={colors}
                isDarkMode={isDarkMode}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {activeTab !== 'customQuestions' && (
                <button onClick={() => handleDownloadInstrument(activeTab)} style={{ flex: 1, minWidth: '180px', backgroundColor: '#059669', color: 'white', padding: '14px', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s' }}>📄 Download Selected Instrument</button>
              )}
              {selectedInstruments.filter(id => generatedContent[id]).length > 1 && (
                <button onClick={handleDownloadAll} style={{ flex: 1, minWidth: '180px', backgroundColor: colors.primary, color: 'white', padding: '14px', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s' }}>📦 Download All Instruments</button>
              )}
              <button onClick={handleStartOver} style={{ backgroundColor: 'transparent', color: colors.text, padding: '14px 24px', border: `1px solid ${colors.border}`, borderRadius: '8px', fontWeight: '600', fontSize: '15px', cursor: 'pointer' }}>Start Over</button>
            </div>

            {customQuestions.length > 0 && (
              <div style={{ marginTop: '12px' }}>
                <button onClick={() => {
                  const content = `<html><head><meta charset="UTF-8"><title>Custom Questions - ${project.title}</title><style>body{font-family:'Times New Roman',serif;margin:2.5cm;line-height:1.6}h1{font-size:24pt;text-align:center}h2{font-size:18pt;border-bottom:1px solid #ccc}li{margin:8px 0;font-size:12pt}</style></head><body><h1>✏️ Custom Questions</h1><p style="text-align:center;margin-bottom:30px"><strong>Project:</strong> ${project.title}</p><hr/><ol>${customQuestions.map(q => `<li style="margin:16px 0"><strong>${q.text}</strong><div style="margin-top:8px"><em>Open-ended question</em></div><div style="margin:20px 0;border-bottom:1px solid #999;height:30px"></div></li>`).join('')}</ol><hr/><p style="text-align:center;font-size:11pt;color:#666"><em>Generated by PAGYSS Thesis Assistant</em></p></body></html>`;
                  const blob = new Blob([content], { type: 'application/msword' });
                  saveAs(blob, `Custom-Questions-${project.title.replace(/\s+/g, '_')}.doc`);
                }} style={{ width: '100%', backgroundColor: colors.primary, color: 'white', padding: '12px', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s' }}>
                  ✏️ Download Custom Questions ({customQuestions.length})
                </button>
              </div>
            )}

            <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '14px', color: colors.textSecondary, fontStyle: 'italic' }}>
              You must download at least one instrument before continuing to Chapter 4
            </p>
          </>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px', paddingTop: '16px', borderTop: `1px solid ${colors.border}` }}>
          <button onClick={handleClose} style={{ backgroundColor: 'transparent', color: colors.text, padding: '12px 24px', border: `1px solid ${colors.border}`, borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s' }}>
            Cancel
          </button>
          <button
            onClick={hasGeneratedContent ? handleClose : handleGenerate}
            disabled={!hasGeneratedContent && selectedInstruments.length === 0}
            style={{
              backgroundColor: hasGeneratedContent || selectedInstruments.length > 0 ? colors.primary : colors.border,
              color: hasGeneratedContent || selectedInstruments.length > 0 ? 'white' : colors.textSecondary,
              padding: '12px 24px',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '14px',
              cursor: hasGeneratedContent || selectedInstruments.length > 0 ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s'
            }}
          >
            {hasGeneratedContent ? 'Apply' : `Generate ${selectedInstruments.length} Instrument${selectedInstruments.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default DataCollectionModal;
