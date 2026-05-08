import { genAI, MODEL } from './config';
import { cleanOutput, extractJSONArray } from './utils';
import { MERMAID_RULES, TABLE_RULES } from './writingRules';

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

    let chapterNames = { 'ONE': 'CHAPTER ONE', 'TWO': 'CHAPTER TWO', 'THREE': 'CHAPTER THREE', 'FOUR': 'CHAPTER FOUR', 'FIVE': 'CHAPTER FIVE' };
    let structureInstruction = promptData.isFirstSubsection && promptData.chapterNumber
      ? `Start with "${chapterNames[promptData.chapterNumber] || 'CHAPTER'}" on its own line, then the chapter title on its own line, then the subsection heading.`
      : `Start directly with the subsection heading.`;

    const prompt = `You are an advanced academic writing assistant helping a ${promptData.level} student write their thesis. Generate content that reads like a thoughtful, professional scholar's work — never like AI output. This is a PROFESSIONAL ACADEMIC THESIS.

TOPIC: "${promptData.topic}"
CHAPTER: ${promptData.chapter}
SUBSECTION: ${promptData.subsection}
TARGET WORD COUNT: ${targetWords} words (range: ${wordRange.min}–${wordRange.max})
METHODOLOGY: ${promptData.methodology || 'mixed methods'}
${promptData.organization ? `CASE STUDY: ${promptData.organization}` : ''}
${promptData.findings ? `RESEARCH FINDINGS: ${promptData.findings}` : ''}

${structureInstruction}

---

# CRITICAL RULES — FOLLOW EVERY SINGLE ONE

## ACADEMIC TONE AND PROFESSIONALISM
- This is a FORMAL ACADEMIC THESIS. Writing must be scholarly, professional, and authoritative.
- Use THIRD PERSON exclusively: "the researcher", "this study", "the findings suggest". Never use first-person pronouns (I, we, my, our).
- Use ACTIVE VOICE wherever possible: "The analysis reveals..." not "It is revealed by the analysis...".
- NO contractions: write out ALL words fully ("do not", "will not", "cannot", "it is").
- Write in a formal, objective register — no rhetorical questions, no colloquialisms, no conversational phrases.

## SENTENCE RHYTHM (BURSTINESS)
- Mix very short sentences (2–5 words) with long, complex ones (20–45 words). No predictable pattern.
- Vary paragraph lengths drastically — alternate between 2-sentence paragraphs and 7–8 sentence paragraphs.
- Use a mix of simple, compound, and complex sentence structures.
- Avoid starting consecutive sentences with the same word.
- No two adjacent paragraphs should have the same sentence-length profile.

## LANGUAGE BANS
You must NEVER use the following:
- Em dashes (—)
- "In today's rapidly evolving society" or any variation
- "In today's digital age/world/era"
- "Furthermore", "Moreover", "Additionally", "Consequently", "Thus", "Hence", "In conclusion"
- "It is worth noting that", "It is important to note that"
- "A myriad of", "The realm of", "A plethora of"
- Rhetorical questions ("What does this mean?", "Why is this important?")
- "This underscores", "This highlights", "This emphasizes"
- "Delves into", "Navigates the complexities of"
- "Paves the way for", "Sets the stage for"

## IN-TEXT CITATIONS (MANDATORY — EVERY PARAGRAPH)
- EVERY paragraph MUST contain at least one in-text citation.
- Use Google Search Grounding to find REAL sources. NEVER fabricate a citation.
- Format: (Author, Year) — e.g., (Smith, 2023).
- For two authors: (Author and Author, Year).
- For three+ authors: (Author et al., Year).
- If no grounded source exists for a claim, write the claim without a citation.
- Every (Author, Year) must correspond to an actual, searchable publication.

## REAL CITATIONS ONLY — NO FABRICATION
- EVERY in-text citation MUST correspond to a REAL source found via Google Search Grounding.
- NEVER fabricate, invent, or hallucinate any author, year, study, or paper.
- Only use author names and publication years from sources you have actually found.
- DO NOT make up citations that sound plausible.

## FORMATTING RULES
- Plain text only. NO markdown headings (###, ##), NO HTML tags.
- Do NOT write "(Word Count: X words)" or any word count footnote.
- Use a single blank line between paragraphs, never more (except before tables/diagrams).
${TABLE_RULES}
${MERMAID_RULES}
- For charts, use the format [CHART:{"title":"...","type":"bar","data":{"labels":["A","B"],"values":[10,20]},"caption":"..."}].

## VISUAL GUIDANCE
If the user has provided screenshots, images, or reference files:
- Analyse each uploaded image carefully — extract data, patterns, tables, and figures.
- Reference specific findings from images in your writing.
- Integrate visual information naturally into the academic narrative.

## NEGATIVE EXAMPLE — DO NOT WRITE LIKE THIS
"In today's rapidly evolving society, technology plays a crucial role in education. Furthermore, it is important to note that AI has significantly impacted learning outcomes. Moreover, this highlights the significance of technological integration in modern classrooms."
Why this is bad: generic opener, stacked transitions, no specific claim, no citation, no voice.

## POSITIVE EXAMPLE — WRITE LIKE THIS
"Over three semesters, students using AI-assisted tutoring scored 18% higher on standardised assessments than their peers in traditional classrooms (Park, 2023). The effect was most pronounced among students who entered with below-median prerequisite scores — a finding that challenges the assumption that AI tools primarily benefit advanced learners."
Why this is good: specific data, grounded claim, meaningful citation, original insight, varied sentence rhythm.

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
    const model = genAI.getGenerativeModel({ 
      model: MODEL,
      tools: [{ googleSearch: {} }]
    });
    let filesInstruction = feedback.files?.length ? `\nUploaded ${feedback.files.length} file(s): ${feedback.files.join(', ')}.` : '';
    const prompt = `You are an expert academic editor applying supervisor feedback to a thesis subsection. Address the feedback while preserving academic quality and structural integrity.

SUBSECTION: ${subsectionTitle}
TOPIC: "${project?.title}"
FIELD: ${project?.field}

FEEDBACK TO APPLY:
"${feedback.text}"${filesInstruction}

CURRENT TEXT:
${currentContent}

## CRITICAL RULES

### APPLICATION PRECISION
- Apply feedback precisely as instructed. Do not interpret or expand beyond what the feedback asks.
- If feedback is vague ("improve this section"), make only minimal, conservative improvements to clarity and flow.
- Do not rewrite the entire section unless the feedback explicitly demands it.
- Keep the modified text within 90–110% of the original word count.

### CITATION INTEGRITY
- PRESERVE ALL in-text citations exactly as they appear — do not change, remove, or replace any (Author, Year) markers.
- PRESERVE [CITATION:...] markers exactly as they appear.
- DO NOT add new citations that were not in the original text.
- Ensure every paragraph still has at least one in-text citation after editing.

### STRUCTURAL PRESERVATION
- Keep ALL subsection headings exactly as they are — do not modify heading text.
- Keep ALL existing tables, mermaid diagrams, [CHART:{...}] tags, and data intact.
- Do not restructure or reorder paragraphs unless the feedback explicitly requests it.

### SUBSECTION BOUNDARIES
- Do not add content that belongs in a different subsection.
- Do not introduce new topics or arguments not present in the original text.
- Stay strictly within the scope of "${subsectionTitle}".

### FORMATTING
- Return ONLY the modified text — no explanations, no annotations, no meta-commentary.
- NO markdown headings (###, ##), NO HTML tags.
- NO word count footnotes.
- NO em dashes.
- Plain text only.

Return ONLY the complete modified text for this subsection.`;
    const result = await model.generateContent(prompt);
    return cleanOutput(result.response.text());
  } catch (error) { console.error('Error applying feedback:', error); throw error; }
};

export const humaniseContent = async (text) => {
  try {
    const model = genAI.getGenerativeModel({ 
      model: MODEL,
      tools: [{ googleSearch: {} }]
    });
    const prompt = `You are an expert editor who transforms AI-generated academic text into writing that is COMPLETELY INDISTINGUISHABLE from human academic writing — while maintaining a PROFESSIONAL, FORMAL, SCHOLARLY tone.

TEXT TO HUMANISE:
${text}

## CRITICAL RULES

### SENTENCE RHYTHM (BURSTINESS)
1. DESTROY UNIFORMITY — dramatic sentence length variation. Mix 2–5 word sentences with 20–45 word sentences. No two consecutive sentences should have similar lengths.
2. VARY PARAGRAPH LENGTHS drastically — alternate between 2-sentence paragraphs and 7–8 sentence paragraphs unpredictably.
3. VARY SENTENCE STRUCTURE — alternate simple, compound, and complex sentences. No two consecutive sentences should start with the same word.

### TRANSITION ELIMINATION
4. KILL ROBOTIC TRANSITIONS — do NOT use: "Furthermore", "Moreover", "Additionally", "Consequently", "Thus", "Hence", "In conclusion", "It is worth noting that", "This highlights".
5. Where a transition is genuinely needed, use formal alternatives sparingly: "In addition", "Similarly", "Conversely", "Nevertheless", "Accordingly", "Therefore", "Specifically".

### CITATION INTEGRITY
6. PRESERVE ALL citation integrity — keep EVERY in-text citation exactly as written. Do not change, remove, or add any (Author, Year) markers.
7. PRESERVE [CITATION:...] markers exactly as they appear — do not modify, remove, or replace them.
8. ENSURE every paragraph has at least one in-text citation after rewriting — do not strip citations from any paragraph.
9. ENSURE the total citation count stays the same or increases slightly — never reduce the number of citations.

### STRUCTURAL PRESERVATION
10. Keep ALL data, tables, [CHART:{...}] tags, and mermaid diagrams exactly as they are.
11. Keep subsection headings unchanged — do not modify heading text.
12. DO NOT add reference lists, bibliographies, or word count footnotes.

### FORMATTING
13. NO markdown headings (###, ##), NO HTML tags.
14. NO contractions — write out all words fully.
15. NO em dashes (—) — use commas or parentheses instead.
16. MAINTAIN FORMAL ACADEMIC THIRD-PERSON TONE throughout.

Return ONLY the rewritten text. No explanations, no meta-commentary.`;

    const result = await model.generateContent(prompt);
    return cleanOutput(result.response.text());
  } catch (error) { console.error('Error humanising:', error); throw error; }
};

export const generateReferences = async (citations, style) => {
  try {
    const model = genAI.getGenerativeModel({ 
      model: MODEL,
      tools: [{ googleSearch: {} }]
    });
    const styleGuide = style === 'apa'
      ? 'APA 7th edition: Author, A. A. (Year). Title of work. Source/Publisher. DOI or URL if available.'
      : style === 'mla'
      ? 'MLA 9th edition: Author Last, First. Title of Work. Publisher, Year.'
      : 'Chicago: Author Last, First. Year. Title of Work. Publisher.';
    const prompt = `You are an expert academic reference librarian. Given in-text citations from a thesis, produce a properly formatted reference list using REAL, VERIFIABLE sources found via Google Search Grounding.

IN-TEXT CITATIONS (extracted from thesis content):
${citations.map(c => `- ${c}`).join('\n')}

REFERENCE STYLE: ${style.toUpperCase()}
STYLE GUIDE: ${styleGuide}

## CRITICAL RULES

### SOURCE VERIFICATION
- Search Google for EACH citation independently to find the REAL publication.
- Use ONLY real publications, journals, books, and papers that actually exist and are verifiable.
- If you find the real source, format it according to the style guide with the real title, journal, volume, pages, and DOI/URL.
- CROSS-CHECK: Ensure the author names and year in the generated reference match the in-text citation exactly.

### FILTERING INCOMPLETE CITATIONS
- If you CANNOT find a real, verifiable source for a given citation after searching, SKIP it entirely. Do not include it in the reference list.
- NEVER use placeholder text ("Title of the work", "Source", "Publisher", "Unknown", "n.d."). Either produce a real reference or omit the entry.
- It is better to omit an unfindable citation than to fabricate details.

### NO NEW CITATIONS
- ONLY produce references for citations in the list above.
- Do NOT add, invent, or generate references for citations that are not in the provided list.
- If Google Search Grounding suggests additional related sources, ignore them — only format what was given.

### FORMATTING
- Use the EXACT author names and years from the citations.
- Format each reference precisely according to the ${style.toUpperCase()} style guide above.
- Return ONLY the reference entries, one per line, sorted alphabetically by the first author's last name.
- NO headings, NO explanations, NO numbering, NO bullet points.
- NO markdown formatting.
- NO empty lines between entries.
- Each entry must be a complete, standalone reference string.

Example (APA):
Smith, J. A. (2023). Understanding organizational behavior in digital transformation. Journal of Management Studies, 60(4), 1123-1145. https://doi.org/10.1111/joms.12901`;

    const result = await model.generateContent(prompt);
    return cleanOutput(result.response.text());
  } catch (error) { console.error('Error generating references:', error); throw error; }
};
