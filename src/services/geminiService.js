// Barrel exports - backward compatible with existing imports
export { generateSubtopics, generateAcademicContent, generateChapterContent, selfReviewContent, applyFeedbackToContent, humaniseContent, generateReferences } from './gemini/contentGeneration';
export { generateConceptualFramework, generateTheoreticalFramework, generateResearchDesignFlowchart, generateDataTable, generateChartData } from './gemini/visualElements';
export { generateDefenceQuestions, formatReferences, extractAbbreviations, generateAbstract } from './gemini/analysisTools';
export { generateSampleData, analyzeTranscriptText } from './gemini/dataAnalysis';
export { generateQuestionnaire, generateInterviewGuide, generateFocusGroupProtocol, generateObservationChecklist, generateDocumentAnalysisTemplate, generateCaseStudyProtocol, recommendLiteratureReviewType } from './gemini/instruments';
export { getWordCountPreset } from './gemini/config';
export { extractPaperMetadata, generateLiteratureMatrix } from './gemini/sourceExtractor';
