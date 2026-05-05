import { useState, useEffect } from 'react';
import { saveAs } from 'file-saver';
import { generateQuestions, generateWordContent } from '../utils/questionnaireHelpers';

const useQuestionnaire = (project, onClose, onDownload) => {
  const [generating, setGenerating] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [customQuestions, setCustomQuestions] = useState([]);
  const [newCustomQuestion, setNewCustomQuestion] = useState('');
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    generateQuestionnaire();
  }, []);

  const generateQuestionnaire = async () => {
    setGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setQuestions(generateQuestions(project));
    } catch (error) {
      console.error('Error generating questionnaire:', error);
      alert('Error generating questions. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleAddCustomQuestion = () => {
    if (newCustomQuestion.trim()) {
      setCustomQuestions([...customQuestions, {
        id: `custom_${Date.now()}`,
        text: newCustomQuestion,
        type: 'open-ended',
        isCustom: true
      }]);
      setNewCustomQuestion('');
    }
  };

  const handleRemoveCustomQuestion = (id) => {
    setCustomQuestions(customQuestions.filter(q => q.id !== id));
  };

  const handleDownload = () => {
    exportAsWord();
    setDownloaded(true);
    if (onDownload) { onDownload(); }
  };

  const exportAsWord = () => {
    const content = generateWordContent(project, questions, customQuestions);
    const blob = new Blob([content], { type: 'application/msword' });
    saveAs(blob, `Questionnaire-${project.title.replace(/\s+/g, '_')}.doc`);
  };

  return {
    generating,
    questions,
    customQuestions,
    newCustomQuestion,
    downloaded,
    setNewCustomQuestion,
    handleAddCustomQuestion,
    handleRemoveCustomQuestion,
    handleDownload,
    exportAsPDF: exportAsWord
  };
};

export default useQuestionnaire;
