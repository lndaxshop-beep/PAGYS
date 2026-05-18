import { genAI, MODEL } from './config';
import { extractJSON } from './utils';

export const extractPaperMetadata = async (text, type) => {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL });
    let prompt;

    if (type === 'image') {
      prompt = `You are an academic librarian. Analyze this screenshot/image of a research paper and extract its key metadata.

Return ONLY valid JSON with this exact structure:
{
  "title": "Full paper title",
  "authors": "Author names",
  "year": 2023,
  "journal": "Journal name or venue",
  "methodology": "quantitative/qualitative/mixed/review/theoretical",
  "sampleSize": "description or number",
  "keyFindings": ["Finding 1", "Finding 2", "Finding 3"],
  "theoreticalFramework": "Name of theory/framework used",
  "limitations": ["Limitation 1", "Limitation 2"],
  "relevanceToTopic": "high/medium/low"
}

If you cannot read the image content clearly, return null.`;
      const parts = [
        { inlineData: { mimeType: text.match(/^data:([^;]+);/)?.[1] || 'image/png', data: text.replace(/^data:image\/\w+;base64,/, '') } },
        { text: prompt }
      ];
      const result = await model.generateContent({ contents: [{ role: 'user', parts }] });
      const responseText = result.response.text();
      return extractJSON(responseText);
    }

    prompt = `You are an academic librarian. Extract the key metadata from the following research paper text.

PAPER TEXT:
${text.substring(0, 20000)}

Return ONLY valid JSON with this exact structure:
{
  "title": "Full paper title",
  "authors": "Author names",
  "year": 2023,
  "journal": "Journal name or venue (if identifiable)",
  "methodology": "quantitative/qualitative/mixed/review/theoretical",
  "sampleSize": "Description of sample or 'N/A'",
  "keyFindings": ["Finding 1", "Finding 2", "Finding 3"],
  "theoreticalFramework": "Name of theory/framework used or 'Not specified'",
  "limitations": ["Limitation 1", "Limitation 2"] if mentioned, otherwise empty array,
  "relevanceToTopic": "high/medium/low"
}

If the text does not appear to be a research paper or academic article, return null.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    return extractJSON(responseText);
  } catch (error) {
    console.error('Error extracting paper metadata:', error);
    return null;
  }
};

export const generateLiteratureMatrix = async (papers, project) => {
  if (!papers || papers.length === 0) return null;
  try {
    const model = genAI.getGenerativeModel({ model: MODEL });
    const papersJson = JSON.stringify(papers, null, 2);
    const prompt = `You are a research synthesis expert. Create a literature matrix comparing the following research papers for a thesis.

PROJECT TOPIC: "${project?.topic || project?.title || 'Research Study'}"
FIELD: ${project?.field || 'Social Sciences'}

PAPERS:
${papersJson.substring(0, 25000)}

Generate a literature matrix as a JSON object with:
1. A summary paragraph synthesizing the key themes across all papers
2. A matrix table with rows = papers and columns: Author(s), Year, Methodology, Sample Size, Key Findings, Theoretical Framework, Limitations
3. A list of research gaps identified from the literature

Return ONLY valid JSON:
{
  "summary": "Synthesis paragraph...",
  "matrixHeaders": ["Author(s)", "Year", "Methodology", "Sample Size", "Key Findings", "Theoretical Framework", "Limitations"],
  "matrixRows": [
    ["Author", 2023, "quantitative", "N=200", "Finding summary", "TAM", "Limitation"]
  ],
  "researchGaps": ["Gap 1", "Gap 2"],
  "recommendedDirection": "Brief suggestion for the thesis based on this literature"
}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    return extractJSON(responseText);
  } catch (error) {
    console.error('Error generating literature matrix:', error);
    return null;
  }
};
