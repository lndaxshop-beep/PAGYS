import { useState, useEffect } from 'react';
import { saveAs } from 'file-saver';
import {
  generateQuestionnaire, generateInterviewGuide, generateFocusGroupProtocol,
  generateObservationChecklist, generateDocumentAnalysisTemplate, generateCaseStudyProtocol
} from '../services/geminiService';
import { INSTRUMENT_TYPES, buildWordExport } from '../utils/instrumentHelpers';
import { saveInstruments, getInstruments } from '../services/firestoreService';

const generators = {
  questionnaire: generateQuestionnaire, interview: generateInterviewGuide,
  focusGroup: generateFocusGroupProtocol, observation: generateObservationChecklist,
  documentAnalysis: generateDocumentAnalysisTemplate, caseStudy: generateCaseStudyProtocol,
};

const useInstrumentGeneration = (project, onClose, onDownload, onNotify) => {
  const [selectedInstruments, setSelectedInstruments] = useState([]);
  const [generatedContent, setGeneratedContent] = useState({});
  const [downloadedInstruments, setDownloadedInstruments] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState(null);
  const [autoSelect, setAutoSelect] = useState(true);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [error, setError] = useState(null);
  const [customQuestions, setCustomQuestions] = useState([]);
  const [newCustomQuestion, setNewCustomQuestion] = useState('');

  useEffect(() => {
    if (!project?.id) return;
    getInstruments(project.id).then(data => {
      if (data.generatedContent && Object.keys(data.generatedContent).length > 0) {
        setGeneratedContent(data.generatedContent || {});
        setActiveTab(Object.keys(data.generatedContent)[0]);
        setSelectedInstruments(data.selectedInstruments || []);
        setDownloadedInstruments(data.downloadedInstruments || []);
        setCustomQuestions(data.customQuestions || []);
      } else if (autoSelect && project?.methodology) {
        const recommended = Object.values(INSTRUMENT_TYPES)
          .filter(t => t.recommendedFor.includes(project.methodology))
          .map(t => t.id);
        setSelectedInstruments(recommended);
      }
    }).catch(() => {
      if (autoSelect && project?.methodology) {
        const recommended = Object.values(INSTRUMENT_TYPES)
          .filter(t => t.recommendedFor.includes(project.methodology))
          .map(t => t.id);
        setSelectedInstruments(recommended);
      }
    });
  }, [project, autoSelect]);

  const toggleInstrument = (id) => {
    setSelectedInstruments(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const selectAllRecommended = () => {
    const recommended = Object.values(INSTRUMENT_TYPES)
      .filter(t => t.recommendedFor.includes(project?.methodology || 'mixed'))
      .map(t => t.id);
    setSelectedInstruments(recommended);
  };

  const handleGenerate = async () => {
    if (selectedInstruments.length === 0) { if (onNotify) onNotify('Please select at least one data collection instrument.', 'error'); return; }
    setGenerating(true);
    setError(null);
    setGenerationProgress(0);
    const results = {};
    let lastError = null;
    let completed = 0;
    for (const instrumentId of selectedInstruments) {
      try {
        const generator = generators[instrumentId];
        if (generator) {
          const data = await generator(project);
          if (data) { results[instrumentId] = data; }
          else { lastError = 'Response could not be parsed. Try again.'; }
        }
      } catch (err) { console.error(`Error generating ${instrumentId}:`, err); lastError = err.message || 'Unknown error'; }
      completed++;
      setGenerationProgress(Math.round((completed / selectedInstruments.length) * 100));
    }
    setGeneratedContent(results);
    setGenerating(false);
    if (Object.keys(results).length > 0) { setActiveTab(Object.keys(results)[0]); }
    else { setError(lastError || 'Failed to generate any instruments. Please try again.'); }
    persistToFirestore(results);
  };

  const handleDownloadInstrument = (instrumentId) => {
    const content = generatedContent[instrumentId];
    if (!content) return;
    const type = INSTRUMENT_TYPES[instrumentId];
    const wordContent = buildWordExport(instrumentId, content, project);
    const blob = new Blob([wordContent], { type: 'application/msword' });
    const filename = `${type.label.replace(/[^a-zA-Z]/g, '-')}-${project.title.replace(/\s+/g, '_')}.doc`;
    saveAs(blob, filename);
    const updated = [...downloadedInstruments];
    if (!updated.includes(instrumentId)) { updated.push(instrumentId); }
    setDownloadedInstruments(updated);
    persistToFirestore();
    if (onDownload) { onDownload(updated); }
  };

  const persistToFirestore = (content) => {
    if (!project?.id) return;
    saveInstruments(project.id, {
      generatedContent: content || generatedContent,
      selectedInstruments,
      downloadedInstruments,
      customQuestions,
    });
  };

  const handleDownloadAll = () => {
    const available = selectedInstruments.filter(id => generatedContent[id]);
    available.forEach((id, i) => { setTimeout(() => handleDownloadInstrument(id), i * 500); });
  };

  const handleStartOver = () => {
    setGeneratedContent({});
    setDownloadedInstruments([]);
    setActiveTab(null);
    setSelectedInstruments([]);
    persistToFirestore({});
  };

  const canClose = downloadedInstruments.length > 0;
  const hasGeneratedContent = Object.keys(generatedContent).length > 0;

  const handleAddCustomQuestion = () => {
    if (newCustomQuestion.trim()) {
      setCustomQuestions(prev => {
        const next = [...prev, {
          id: `custom_${Date.now()}`,
          text: newCustomQuestion.trim(),
          type: 'open-ended',
          isCustom: true
        }];
        setTimeout(() => persistToFirestore(), 0);
        return next;
      });
      setNewCustomQuestion('');
    }
  };

  const handleRemoveCustomQuestion = (id) => {
    setCustomQuestions(prev => prev.filter(q => q.id !== id));
    setTimeout(() => persistToFirestore(), 0);
  };

  return {
    selectedInstruments, generatedContent, downloadedInstruments, generating,
    activeTab, autoSelect, generationProgress, error, canClose, hasGeneratedContent,
    setSelectedInstruments, setAutoSelect, setActiveTab, setError, setGenerating,
    toggleInstrument, selectAllRecommended, handleGenerate, handleDownloadInstrument,
    handleDownloadAll, handleStartOver, onClose, onNotify,
    customQuestions, newCustomQuestion, setNewCustomQuestion,
    handleAddCustomQuestion, handleRemoveCustomQuestion
  };
};

export default useInstrumentGeneration;
