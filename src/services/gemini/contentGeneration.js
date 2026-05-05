import { genAI, MODEL } from './config';
import { cleanOutput, extractJSONArray } from './utils';

export const generateSubtopics = async (promptData) => {
  try {
    const model = genAI.getGenerativeModel({ 
      model: MODEL,
      tools: [{ googleSearch: {} }]
    });
    let referenceInstruction = '';
    let imageParts = [];
    
    if (promptData.referenceData) {
      if (promptData.referenceData.type === 'combined') {
        const textContent = promptData.referenceData.text || '';
        const files = promptData.referenceData.files || [];
        const imageFiles = files.filter(f => f.content?.startsWith('data:image/'));
        if (imageFiles.length > 0) {
          imageParts = imageFiles.map(f => {
            const matches = f.content.match(/^data:(image\/\w+);base64,(.+)$/);
            if (matches) return { inlineData: { mimeType: matches[1], data: matches[2] } };
            return null;
          }).filter(Boolean);
          referenceInstruction = `\nThe user has uploaded ${imageFiles.length} screenshot(s) showing their desired chapter structure, along with pasted text.\n\nPASTED TEXT:\n${textContent}\n\nCRITICAL: Examine ALL images AND the pasted text carefully. Extract:\n1. EVERY heading and sub-heading with exact numbering (2.1, 2.1.1, etc.)\n2. The HIERARCHY and DEPTH of subsections\n3. Where DIAGRAMS, TABLES, and FIGURES are placed\n4. The overall FLOW and ORGANIZATION\n5. The EXACT NUMBER of sections\n\nGenerate subtopics that MIRROR this structure EXACTLY for: "${promptData.topic}". DO NOT add or remove sections. Match precisely.`;
        } else {
          referenceInstruction = `\nUPLOADED REFERENCE TEXT:\n${textContent}\n\nCRITICAL: Extract ONLY the structure:\n1. EVERY heading with exact numbering\n2. HIERARCHY and DEPTH\n3. Where visuals are mentioned/placed\n4. EXACT NUMBER of sections\n\nIGNORE the actual content words. Generate subtopics matching this EXACT structure for: "${promptData.topic}".`;
        }
      }
      else if (promptData.referenceData.type === 'file') {
        const isImage = promptData.referenceData.content?.startsWith('data:image/');
        if (isImage) {
          const matches = promptData.referenceData.content.match(/^data:(image\/\w+);base64,(.+)$/);
          if (matches) imageParts = [{ inlineData: { mimeType: matches[1], data: matches[2] } }];
          referenceInstruction = `\nThe user has uploaded an IMAGE showing their desired chapter structure. Examine the image CAREFULLY. Extract ALL:\n1. Headings and sub-headings with exact numbering (2.1, 2.1.1, 3.0)\n2. HIERARCHY and DEPTH of subsections\n3. Where DIAGRAMS, TABLES, and FIGURES are placed\n4. Overall FLOW and ORGANIZATION\n5. EXACT NUMBER of sections\n\nGenerate subtopics that MIRROR this structure EXACTLY for: "${promptData.topic}".`;
        } else {
          referenceInstruction = `\nUPLOADED TEXT:\n${promptData.referenceData.content || ''}\n\nExtract ONLY the structure (headings, numbering, hierarchy, visual placements). IGNORE the content. Match the structure EXACTLY for: "${promptData.topic}".`;
        }
      }
      else if (promptData.referenceData.type === 'files') {
        const files = promptData.referenceData.files || [];
        const imageFiles = files.filter(f => f.content?.startsWith('data:image/'));
        imageParts = imageFiles.map(f => {
          const matches = f.content.match(/^data:(image\/\w+);base64,(.+)$/);
          if (matches) return { inlineData: { mimeType: matches[1], data: matches[2] } };
          return null;
        }).filter(Boolean);
        referenceInstruction = `\nThe user has uploaded ${imageFiles.length} screenshot(s). Examine ALL images. Extract the complete structure: headings, numbering, hierarchy, visual placements, section count. Mirror EXACTLY for: "${promptData.topic}".`;
      }
      else if (promptData.referenceData.content) {
        const isImage = promptData.referenceData.content?.startsWith('data:image/');
        if (isImage) {
          const matches = promptData.referenceData.content.match(/^data:(image\/\w+);base64,(.+)$/);
          if (matches) imageParts = [{ inlineData: { mimeType: matches[1], data: matches[2] } }];
        }
        referenceInstruction = `\nUPLOADED REFERENCE:\n${promptData.referenceData.content}\n\nCRITICAL: Extract ONLY the structure (headings, numbering, hierarchy, visual placements, section count). IGNORE the content words. Match EXACTLY for: "${promptData.topic}". DO NOT add or remove sections.`;
      }
    }
    
    const promptText = `You are an expert academic advisor helping a ${promptData.level} student structure their thesis.

RESEARCH TOPIC: "${promptData.topic}"
FIELD: ${promptData.field}
CHAPTER: ${promptData.chapterTitle}${promptData.referenceData ? '\n' + referenceInstruction : ''}

${promptData.referenceData ? 'CRITICAL: Return ONLY a JSON array matching the EXACT structure, numbering, and count from the reference. Include ALL subsections at ALL levels.' : 'Generate 8-12 appropriate subsections with proper academic numbering. Return ONLY a JSON array.'}

DO NOT include "References" as a subsection.

Example: ["2.0 Introduction", "2.1 Theoretical Framework", "2.1.1 Key Theory", "2.2 Empirical Review", "2.3 Summary"]`;

    let parts = imageParts.length > 0 ? [...imageParts, { text: promptText }] : [{ text: promptText }];
    const result = await model.generateContent({ contents: [{ role: "user", parts }] });
    const text = result.response.text();
    return extractJSONArray(text);
  } catch (error) { console.error('Error generating subtopics:', error); return null; }
};

export const generateAcademicContent = async (promptData) => {
  try {
    const model = genAI.getGenerativeModel({ 
      model: MODEL,
      tools: [{ googleSearch: {} }],
      generationConfig: { temperature: 0.88, topP: 0.92 }
    });
    const wordRange = promptData.wordCount || { min: 500, max: 1000 };
    const targetWords = Math.floor((wordRange.min + wordRange.max) / 2);

    const visualGuidance = `VISUALS: You may use a markdown table or a chart [CHART:…] if it genuinely supports the argument. For diagrams, use only the simplest Mermaid flowchart. ONLY letters A‑Z for node IDs, plain text labels, NO styling, NO CSS, NO fill or stroke, max 10 nodes and 10 arrows, under 12 lines. If uncertain, DO NOT include a diagram.`;

    let chapterNames = { 'ONE': 'CHAPTER ONE', 'TWO': 'CHAPTER TWO', 'THREE': 'CHAPTER THREE', 'FOUR': 'CHAPTER FOUR', 'FIVE': 'CHAPTER FIVE' };
    let structureInstruction = promptData.isFirstSubsection && promptData.chapterNumber
      ? `Start with "${chapterNames[promptData.chapterNumber] || 'CHAPTER'}" on its own line, then the chapter title on its own line, then the subsection heading.`
      : `Start directly with the subsection heading.`;

    const prompt = `You are an advanced academic writing assistant. Generate a thesis draft that reads like a thoughtful, professional scholar's work—never like AI output. This is a PROFESSIONAL ACADEMIC THESIS.

TOPIC: "${promptData.topic}"
CHAPTER: ${promptData.chapter}
SUBSECTION: ${promptData.subsection}
${promptData.realCitations ? `\nREAL CITATIONS YOU MUST USE:\n${promptData.realCitations}\n\nIMPORTANT: You MUST use ONLY the citations listed above in your in-text citations. Use their exact author names and years.` : ''}
TARGET WORD COUNT: ${targetWords} words (write between ${wordRange.min}-${wordRange.max})
METHODOLOGY: ${promptData.methodology || 'mixed methods'}
${promptData.organization ? `CASE STUDY: ${promptData.organization}` : ''}
${promptData.findings ? `RESEARCH FINDINGS: ${promptData.findings}` : ''}

${structureInstruction}
${visualGuidance}

---

# CRITICAL RULES — FOLLOW EVERY SINGLE ONE

## ACADEMIC TONE AND PROFESSIONALISM
- This is a FORMAL ACADEMIC THESIS. The writing must be scholarly, professional, and authoritative.
- Use THIRD PERSON exclusively: "the researcher", "this study", "the findings suggest". Never use first-person pronouns.
- NO contractions: write out ALL words fully.

## SENTENCE RHYTHM (BURSTINESS)
- Mix very short sentences (2-5 words) with long, complex ones (20-45 words). No predictable pattern.
- Vary paragraph lengths drastically.

## LANGUAGE AND PHRASING BANS
You must NEVER use: em dashes (—), "In today's rapidly evolving society", "Furthermore", "Moreover", "Additionally", "Consequently", "Thus", "Hence", "In conclusion".

## IN-TEXT CITATIONS (MANDATORY — EVERY PARAGRAPH)
- EVERY paragraph MUST contain at least one in-text citation.
- If real citations are provided above, use ONLY those. Do not invent new ones.

## FORMATTING
- Plain text only. NO markdown headings (###), NO HTML.
- Do NOT write "(Word Count: X words)".

Write the complete content now. Aim for approximately ${targetWords} words.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const candidates = result.response.candidates;
    
    let sources = [];
    if (candidates && candidates[0]?.groundingMetadata?.groundingChunks) {
      sources = candidates[0].groundingMetadata.groundingChunks
        .filter(chunk => chunk.web)
        .map(chunk => ({ title: chunk.web.title || '', uri: chunk.web.uri || '' }));
    }
    
    return { text: cleanOutput(responseText), sources };
  } catch (error) { console.error('Error generating academic content:', error); throw error; }
};

export const applyFeedbackToContent = async (currentContent, feedback, subsectionTitle, project) => {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL });
    let filesInstruction = feedback.files?.length ? `\nUploaded ${feedback.files.length} file(s): ${feedback.files.join(', ')}.` : '';
    const prompt = `You are an expert academic editor. Apply this supervisor feedback to the academic text.\n\nSUBSECTION: ${subsectionTitle}\nTOPIC: "${project?.title}"\nFIELD: ${project?.field}\n\nFEEDBACK: "${feedback.text}"${filesInstruction}\n\nCURRENT TEXT:\n${currentContent}\n\nApply the changes precisely. Keep all citations, tables, charts, diagrams, and formatting intact. Return ONLY the modified text.`;
    const result = await model.generateContent(prompt);
    return cleanOutput(result.response.text());
  } catch (error) { console.error('Error applying feedback:', error); throw error; }
};

export const humaniseContent = async (text) => {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL });
    const prompt = `You are an expert editor who transforms AI-generated academic text into writing that is COMPLETELY INDISTINGUISHABLE from human academic writing — while maintaining a PROFESSIONAL, FORMAL, SCHOLARLY tone.

TEXT TO HUMANISE:
${text}

RULES:
1. Destroy uniformity — dramatic sentence length variation
2. Kill robotic transitions — replace "Furthermore", "Moreover" with formal alternatives
3. Vary paragraph structure — some 2 sentences, others 7-8
4. Add strategic natural variation
5. Keep ALL citations, data, tables, [CHART:{...}] tags, and mermaid diagrams exactly as they are
6. Keep subsection headings unchanged
7. DO NOT add reference lists or word count footnotes
8. NO markdown (###), NO HTML tags
9. MAINTAIN FORMAL ACADEMIC THIRD-PERSON TONE
10. NO contractions
11. NO em dashes (—)
12. ENSURE every paragraph has in-text citations

Return ONLY the rewritten text. No explanations.`;

    const result = await model.generateContent(prompt);
    return cleanOutput(result.response.text());
  } catch (error) { console.error('Error humanising:', error); throw error; }
};

export const generateReferences = async (citations, style) => {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL });
    const styleGuide = style === 'apa'
      ? 'APA 7th edition: Author, A. A. (Year). Title of work. Source/Publisher. DOI or URL if available.'
      : style === 'mla'
      ? 'MLA 9th edition: Author Last, First. Title of Work. Publisher, Year.'
      : 'Chicago: Author Last, First. Year. Title of Work. Publisher.';
    const prompt = `You are an expert academic reference librarian. Generate a properly formatted reference list for these in-text citations.

CITATIONS TO FORMAT:
${citations.map(c => `- ${c}`).join('\n')}

REFERENCE STYLE: ${style.toUpperCase()}
STYLE GUIDE: ${styleGuide}

RULES:
- Generate a complete, properly formatted reference for EACH citation above
- Use the EXACT author names and years from the citations
- Fill in realistic academic titles, journals, publishers based on the citation context
- Format precisely according to the style guide above
- Return ONLY the reference entries, one per line, sorted alphabetically by first author
- NO headings, NO explanations, NO numbering
- DO NOT invent additional citations not listed above

Example APA:
Smith, J. A. (2023). Understanding organizational behavior in digital transformation. Journal of Management Studies, 60(4), 1123-1145. https://doi.org/10.1111/joms.12901`;

    const result = await model.generateContent(prompt);
    return cleanOutput(result.response.text());
  } catch (error) { console.error('Error generating references:', error); throw error; }
};
