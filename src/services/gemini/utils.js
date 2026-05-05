export const cleanOutput = (text) => {
  if (!text) return '';
  let cleaned = text;
  cleaned = cleaned.replace(/^#{1,6}\s+/gm, '');
  cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, '$1');
  cleaned = cleaned.replace(/\*(.*?)\*/g, '$1');
  cleaned = cleaned.replace(/<center>/gi, '');
  cleaned = cleaned.replace(/<\/center>/gi, '');
  cleaned = cleaned.replace(/<br\s*\/?>/gi, '');
  cleaned = cleaned.replace(/<div[^>]*>/gi, '');
  cleaned = cleaned.replace(/<\/div>/gi, '');
  cleaned = cleaned.replace(/\(Word Count:?\s*\d+\s*words?\)/gi, '');
  cleaned = cleaned.replace(/\n*Word Count:?\s*\d+\s*words?\n*/gi, '');
  cleaned = cleaned.replace(/^.*Syntax error in text.*$/gm, '');
  cleaned = cleaned.replace(/^.*mermaid version.*$/gm, '');
  cleaned = cleaned.replace(/—/g, ', ');
  cleaned = cleaned.replace(/```mermaid\s*\n\s*(\w+)/g, '```mermaid\n$1');
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  cleaned = cleaned.trim();
  return cleaned;
};

export const extractMermaidCode = (response) => {
  const mermaidMatch = response.match(/```mermaid\s*([\s\S]*?)```/);
  if (mermaidMatch) return mermaidMatch[1].trim();
  return response.trim();
};

export const extractJSON = (response) => {
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (jsonMatch) { try { return JSON.parse(jsonMatch[0]); } catch (e) {} }
  return null;
};

export const extractJSONArray = (response) => {
  const jsonMatch = response.match(/\[[\s\S]*\]/);
  if (jsonMatch) { try { return JSON.parse(jsonMatch[0]); } catch (e) {} }
  return null;
};

export const getDefaultConceptualFramework = () => `graph TD
    A[Independent Variables] --> C[Dependent Variable]
    B[Moderating Variables] --> C
    A --> D[Research Outcomes]
    C --> D`;

export const getDefaultTheoreticalFramework = () => `graph TD
    T1[Theory 1] --> CF[Conceptual Framework]
    T2[Theory 2] --> CF
    CF --> RQ[Research Questions]
    RQ --> M[Methodology]`;

export const getDefaultResearchDesign = () => `graph LR
    A[Research Question] --> B[Research Design]
    B --> C[Data Collection]
    C --> D[Data Analysis]
    D --> E[Findings]
    E --> F[Conclusions]`;

export const getDefaultTable = () => ({
  title: "Sample Data Table",
  headers: ["Variable", "Mean", "SD", "N"],
  rows: [["Variable 1", "3.45", "0.89", "150"], ["Variable 2", "4.12", "0.76", "150"], ["Variable 3", "2.98", "1.02", "150"], ["Variable 4", "3.87", "0.65", "150"]],
  caption: "Descriptive statistics for key variables"
});

export const getDefaultChart = (chartType) => ({
  title: "Sample Chart", type: chartType,
  data: { labels: ["A", "B", "C", "D", "E"], values: [35, 25, 20, 12, 8] },
  caption: "Distribution of responses across categories"
});
