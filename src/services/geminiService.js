// Barrel exports - backward compatible with existing imports
export { generateSubtopics, generateAcademicContent, applyFeedbackToContent, humaniseContent } from './gemini/contentGeneration';
export { generateConceptualFramework, generateTheoreticalFramework, generateResearchDesignFlowchart, generateDataTable, generateChartData } from './gemini/visualElements';
export { generateDefenceQuestions, formatReferences, extractAbbreviations } from './gemini/analysisTools';
export { generateQuestionnaire, generateInterviewGuide, generateFocusGroupProtocol, generateObservationChecklist, generateDocumentAnalysisTemplate, generateCaseStudyProtocol } from './gemini/instruments';
export { getWordCountPreset } from './gemini/config';
