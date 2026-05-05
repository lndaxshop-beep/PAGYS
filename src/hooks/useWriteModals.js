import { useState, useCallback } from 'react';

export const useWriteModals = () => {
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [currentFeedbackSubsection, setCurrentFeedbackSubsection] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackFiles, setFeedbackFiles] = useState([]);
  const [applyingSubFeedback, setApplyingSubFeedback] = useState(false);
  const [showChapterStructureModal, setShowChapterStructureModal] = useState(false);
  const [pendingChapterForStructure, setPendingChapterForStructure] = useState(null);
  const [uploadedStructureFile, setUploadedStructureFile] = useState(null);
  const [showWordCountModal, setShowWordCountModal] = useState(false);
  const [pendingChapterAfterWordCount, setPendingChapterAfterWordCount] = useState(null);
  const [showLiteratureTypeModal, setShowLiteratureTypeModal] = useState(false);
  const [literatureReviewType, setLiteratureReviewType] = useState(null);
  const [showDataCollectionModal, setShowDataCollectionModal] = useState(false);
  const [showUploadFindings, setShowUploadFindings] = useState(false);

  const openFeedbackModal = useCallback((subsection) => {
    setCurrentFeedbackSubsection(subsection);
    setFeedbackText('');
    setFeedbackFiles([]);
    setShowFeedbackModal(true);
  }, []);

  const handleFeedbackFileUpload = useCallback((e) => {
    setFeedbackFiles(prev => [...prev, ...Array.from(e.target.files)]);
  }, []);

  const handleRemoveFeedbackFile = useCallback((index) => {
    setFeedbackFiles(prev => { const next = [...prev]; next.splice(index, 1); return next; });
  }, []);

  return {
    showFeedbackModal, setShowFeedbackModal,
    currentFeedbackSubsection, setCurrentFeedbackSubsection,
    feedbackText, setFeedbackText,
    feedbackFiles, setFeedbackFiles,
    applyingSubFeedback, setApplyingSubFeedback,
    showChapterStructureModal, setShowChapterStructureModal,
    pendingChapterForStructure, setPendingChapterForStructure,
    uploadedStructureFile, setUploadedStructureFile,
    showWordCountModal, setShowWordCountModal,
    pendingChapterAfterWordCount, setPendingChapterAfterWordCount,
    showLiteratureTypeModal, setShowLiteratureTypeModal,
    literatureReviewType, setLiteratureReviewType,
    showDataCollectionModal, setShowDataCollectionModal,
    showUploadFindings, setShowUploadFindings,
    openFeedbackModal, handleFeedbackFileUpload, handleRemoveFeedbackFile
  };
};
