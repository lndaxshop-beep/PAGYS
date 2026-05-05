import { useState } from 'react';
import { generateAIData, generateUploadData, parseManualData } from '../utils/findingsHelpers';

const useFindingsData = (project, onUpload, onGenerateWithAI) => {
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
    setUploadedFiles([...uploadedFiles, ...files]);
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

  const handleUseAIData = () => {
    setSelectedOption('ai');
    setUseAIGenerated(true);
    setAnalyzing(true);
    setTimeout(() => {
      setExtractedData(generateAIData(project));
      setAnalyzing(false);
    }, 2000);
  };

  const handleExtractData = async () => {
    if (uploadedFiles.length === 0) {
      alert('Please upload at least one file');
      return;
    }
    setAnalyzing(true);
    setUseAIGenerated(false);
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      setExtractedData(generateUploadData());
    } catch (error) {
      console.error('Error extracting data:', error);
      alert('Error processing files. Please try again.');
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
      alert('Please enter your findings data');
      return;
    }
    setAnalyzing(true);
    setUseAIGenerated(false);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setExtractedData(parseManualData(manualData));
    } catch (error) {
      console.error('Error processing manual data:', error);
      alert('Error processing data. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerateChapter4 = () => {
    if (!extractedData && !useAIGenerated) {
      alert('Please provide findings data first');
      return;
    }
    if (useAIGenerated) {
      onGenerateWithAI();
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
