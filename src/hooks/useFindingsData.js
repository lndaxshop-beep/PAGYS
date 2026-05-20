import { useState } from 'react';
import { parseCSV, analyzeManualData } from '../utils/findingsHelpers';
import { generateSampleData, analyzeTranscriptText } from '../services/gemini/dataAnalysis';

const useFindingsData = (project, onUpload, onGenerateWithAI, onNotify) => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [responseType, setResponseType] = useState('google-forms');
  const [manualData, setManualData] = useState('');
  const [useAIGenerated, setUseAIGenerated] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    setUploadedFiles(prev => [...prev, ...files]);
    setUseAIGenerated(false);
    setSelectedOption('upload');
  };

  const handleRemoveFile = (index) => {
    const newFiles = [...uploadedFiles];
    newFiles.splice(index, 1);
    setUploadedFiles(newFiles);
    if (newFiles.length === 0 && selectedOption === 'upload') {
      setSelectedOption(null);
    }
  };

  const handleUseAIData = async () => {
    setSelectedOption('ai');
    setUseAIGenerated(true);
    setAnalyzing(true);
    try {
      const data = await generateSampleData(project);
      setExtractedData(data);
    } catch (error) {
      console.error('Error generating sample data:', error);
      if (onNotify) onNotify('Failed to generate sample data.', 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleExtractData = async () => {
    if (uploadedFiles.length === 0) {
      if (onNotify) onNotify('Please upload at least one file', 'error');
      return;
    }
    setAnalyzing(true);
    setUseAIGenerated(false);
    try {
      let combinedData = null;
      for (const file of uploadedFiles) {
        const ext = file.name.split('.').pop()?.toLowerCase();
        const text = await file.text();

        if (ext === 'csv') {
          const parsed = parseCSV(text);
          if (parsed) combinedData = parsed;
        } else if (ext === 'xlsx' || ext === 'xls') {
          if (onNotify) onNotify('Excel files are not yet supported. Please use CSV format.', 'warning');
        } else if (ext === 'txt' || ext === 'pdf') {
          const analyzed = await analyzeTranscriptText(text, project);
          if (analyzed) combinedData = analyzed;
        }
      }

      if (!combinedData) {
        if (onNotify) onNotify('Could not extract data from files. Try a different format.', 'error');
        return;
      }
      setExtractedData(combinedData);
    } catch (error) {
      console.error('Error extracting data:', error);
      if (onNotify) onNotify('Error processing files. Please try again.', 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleManualDataChange = (e) => {
    setManualData(e.target.value);
    setUseAIGenerated(false);
    setSelectedOption('manual');
  };

  const processManualData = async () => {
    if (!manualData.trim()) {
      if (onNotify) onNotify('Please enter your findings data', 'error');
      return;
    }
    setAnalyzing(true);
    setUseAIGenerated(false);
    try {
      const data = await analyzeManualData(manualData, project, (text, proj) =>
        analyzeTranscriptText(text, proj)
      );
      setExtractedData(data);
    } catch (error) {
      console.error('Error processing manual data:', error);
      if (onNotify) onNotify('Error processing data. Please try again.', 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerateChapter4 = () => {
    if (!extractedData && !useAIGenerated) {
      if (onNotify) onNotify('Please provide findings data first', 'error');
      return;
    }
    if (useAIGenerated) {
      onGenerateWithAI(extractedData);
    } else {
      onUpload(extractedData);
    }
  };

  const isOptionSelected = () => selectedOption !== null || extractedData !== null || useAIGenerated;

  return {
    uploadedFiles,
    uploading,
    extractedData,
    analyzing,
    responseType,
    manualData,
    useAIGenerated,
    selectedOption,
    setUploadedFiles,
    setResponseType,
    setManualData,
    handleFileUpload,
    handleRemoveFile,
    handleUseAIData,
    handleExtractData,
    handleManualDataChange,
    processManualData,
    handleGenerateChapter4,
    isOptionSelected
  };
};

export default useFindingsData;
