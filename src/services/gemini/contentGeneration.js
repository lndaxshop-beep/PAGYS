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

THESIS TITLE: "${promptData.topic}"
${promptData.researchTopic ? `RESEARCH QUESTION: "${promptData.researchTopic}"` : ''}
FIELD: ${promptData.field}
METHODOLOGY: ${promptData.methodology || 'Not specified'} — subtopics must align with this methodology
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
      generationConfig: { temperature: 0.7, topP: 0.85 }
    });
    const structureInstruction = '';

    let sourceModeInstruction = '';
    if (promptData.sourceMode === 'user-only' && promptData.userSources?.length > 0) {
      const sourcesJson = JSON.stringify(promptData.userSources.map(s => ({
        title: s.title, authors: s.authors, year: s.year,
        methodology: s.methodology, keyFindings: s.keyFindings,
        theoreticalFramework: s.theoreticalFramework
      })), null, 2);
      sourceModeInstruction = `
## USER-PROVIDED SOURCES (MANDATORY)
The student has uploaded the following papers. These are the ONLY sources you may cite.
${sourcesJson.substring(0, 15000)}

### USER SOURCE RULES
- For EACH paper listed above, use Google Search Grounding to find the ACTUAL publication, read its content, and cite specific findings from it.
- You MUST find and cite from the REAL published paper — not just the title and authors listed here.
- If Google Search Grounding cannot find a specific paper after trying, do NOT cite it.
- At least 2 different sources must be cited across the subsection.
- When discussing a concept or finding, reference the specific source: (Author, Year).
- Do NOT fabricate any citation. If you cannot find a real source for a claim, make the argument without a citation.`;
    } else if (promptData.sourceMode === 'combine' && promptData.userSources?.length > 0) {
      const sourcesJson = JSON.stringify(promptData.userSources.map(s => ({
        title: s.title, authors: s.authors, year: s.year,
        methodology: s.methodology, keyFindings: s.keyFindings,
        theoreticalFramework: s.theoreticalFramework
      })), null, 2);
      sourceModeInstruction = `
## USER-PROVIDED SOURCES (PRIORITY)
The student has uploaded the following papers. PRIORITIZE these sources for citations.
${sourcesJson.substring(0, 15000)}

### COMBINED SOURCE RULES
- Use Google Search Grounding to find the ACTUAL publications for the user's papers, read them, and cite specific findings.
- Supplement with additional sources found via Google Search Grounding where user sources do not provide sufficient coverage.
- At least 60% of citations should come from the user's papers.
- If Google cannot find a specific user paper, you may cite it using its listed title and authors as a last resort.`;
    }

    const prompt = `You are a PhD candidate writing a formal academic thesis section. Write at a professional academic level — clear, authoritative, and naturally scholarly.
${promptData.thesisContext ? `
## THESIS CONTEXT — PREVIOUS CHAPTERS
Earlier chapters have already established the following. Maintain consistency:
${promptData.thesisContext.previousChapters.map(ch => `### ${ch.title}\n${ch.summary}`).join('\n\n')}
- Use the same terminology and variable names.
- Reference earlier findings with phrases like "as discussed in Chapter X."
- Do not redefine terms already defined.` : ''}
THESIS TITLE: "${promptData.topic}"
${promptData.researchTopic ? `RESEARCH QUESTION: "${promptData.researchTopic}"` : ''}
FIELD: ${promptData.field || 'Not specified'}
CHAPTER: ${promptData.chapter}
SUBSECTION: ${promptData.subsection}
METHODOLOGY: ${promptData.methodology || 'mixed methods'}${promptData.organization ? `
CASE STUDY: ${promptData.organization}` : ''}${sourceModeInstruction}
${promptData.findings ? `RESEARCH FINDINGS DATA: ${typeof promptData.findings === 'object' ? JSON.stringify(promptData.findings) : promptData.findings}

## CHAPTER 4 — RESULTS & ANALYSIS
You are writing Chapter 4 (Results/Analysis). The findings data above contains survey responses and key results. Reference specific numbers and statistics. Present findings in past tense.` : ''}
${promptData.childrenTopics?.length > 0 ? `
## SUB-TOPICS TO COVER
Include each of the following as subheadings within this section:

${promptData.childrenTopics.map((t, i) => `${i + 1}. ${t}`).join('\n')}
` : ''}
${promptData.guidelines ? `
## CHAPTER-SPECIFIC GUIDELINES
${promptData.guidelines}
` : ''}

## VISUALS (optional reference)
If you include a table, chart, or framework diagram, the system will automatically render it. These formats are available:

- **Tables:** standard markdown table syntax
- **Charts:** [CHART: type | Title | Label1: value, Label2: value, ...] (types: bar, line, pie, horizontalBar)
- **Frameworks:** [FRAMEWORK: Title\n  Independent: ...\n  Dependent: ...\n  H1: ...\n]
- **Hierarchies:** [FRAMEWORK: Title\n  Hierarchy: Parent → Child\n]

Do not use code fences or ASCII art for visuals.

Write the complete content now.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const candidates = result.response.candidates;
    
    let sources = [];
    let groundingUsed = false;
    if (candidates && candidates[0]?.groundingMetadata?.groundingChunks) {
      sources = candidates[0].groundingMetadata.groundingChunks
        .filter(chunk => chunk.web)
        .map(chunk => ({ title: chunk.web.title || '', uri: chunk.web.uri || '' }));
      groundingUsed = sources.length > 0;
    }
    
    const cleanedText = cleanOutput(responseText);
    return {
      text: cleanedText,
      sources,
      groundingUsed
    };
  } catch (error) { console.error('Error generating academic content:', error); throw error; }
};

export const generateChapterContent = async (promptData) => {
  try {
    const model = genAI.getGenerativeModel({
      model: MODEL,
      tools: [{ googleSearch: {} }],
      generationConfig: { temperature: 0.7, topP: 0.85, maxOutputTokens: 64000 }
    });

    let sourceModeInstruction = '';
    if (promptData.sourceMode === 'user-only' && promptData.userSources?.length > 0) {
      const sourcesJson = JSON.stringify(promptData.userSources.map(s => ({
        title: s.title, authors: s.authors, year: s.year,
        methodology: s.methodology, keyFindings: s.keyFindings,
        theoreticalFramework: s.theoreticalFramework
      })), null, 2);
      sourceModeInstruction = `
## USER-PROVIDED SOURCES (MANDATORY)
The student has uploaded the following papers. These are the ONLY sources you may cite.
${sourcesJson.substring(0, 15000)}

### USER SOURCE RULES
- For EACH paper listed above, use Google Search Grounding to find the ACTUAL publication, read its content, and cite specific findings from it.
- You MUST find and cite from the REAL published paper.
- If Google Search Grounding cannot find a specific paper, do NOT cite it.
- At least 2 different sources must be cited across each subsection.
- Reference sources specifically within each subsection: (Author, Year).`;
    } else if (promptData.sourceMode === 'combine' && promptData.userSources?.length > 0) {
      const sourcesJson = JSON.stringify(promptData.userSources.map(s => ({
        title: s.title, authors: s.authors, year: s.year,
        methodology: s.methodology, keyFindings: s.keyFindings,
        theoreticalFramework: s.theoreticalFramework
      })), null, 2);
      sourceModeInstruction = `
## USER-PROVIDED SOURCES (PRIORITY)
The student has uploaded the following papers. PRIORITIZE these sources for citations.
${sourcesJson.substring(0, 15000)}

### COMBINED SOURCE RULES
- Use Google Search Grounding to find the ACTUAL publications for the user's papers.
- Supplement with additional sources found via Google Search Grounding where needed.
- At least 60% of citations should come from the user's papers.`;
    }

    const subsOutline = promptData.subsections.map((sub, i) => {
      const children = (sub.children || []).map(c => `    - ${c.title}`).join('\n');
      return `  ${i + 1}. [ID: ${sub.id}] ${sub.title}${children ? '\n' + children : ''}`;
    }).join('\n');

    const findingsInstruction = promptData.findings ? `RESEARCH FINDINGS DATA: ${typeof promptData.findings === 'object' ? JSON.stringify(promptData.findings) : promptData.findings}

## CHAPTER 4 — RESULTS & ANALYSIS INSTRUCTIONS
You are writing Chapter 4 (Results/Analysis). The RESEARCH FINDINGS DATA above contains real survey responses, demographic data, and key findings.

### DATA ANALYSIS
- Reference specific numbers, percentages, and statistics from the findings data.
- Identify meaningful patterns and trends in the data.
- Connect findings to the research questions or objectives implied by the topic.
- Use proper statistical language: "the mean score was", "a majority of respondents", "the distribution shows".

### ACADEMIC RESULTS WRITING
- Present findings objectively in past tense: "the data revealed", "respondents reported".
- Describe what the data shows without interpreting causes in Chapter 4.
- Follow proper academic structure: introduce the analysis, present the data, highlight key observations.
- Every paragraph should connect to a specific finding from the data.` : '';

    const subsectionsList = promptData.subsections.map((sub, i) => {
      return `[WRITE_SUBSECTION: ${sub.id}]
${sub.title}
[/WRITE_SUBSECTION]`;
    }).join('\n\n');

    const prompt = `You are a human PhD candidate writing a formal academic thesis chapter. Write at a professional academic level — clear, authoritative, and naturally scholarly.
${promptData.thesisContext ? `
## THESIS CONTEXT — PREVIOUS CHAPTERS
Earlier chapters have already established the following. Maintain consistency in terminology, arguments, and references:
${promptData.thesisContext.previousChapters.map(ch => `### ${ch.title}\n${ch.summary}`).join('\n\n')}

- Use the same terminology and variable names from earlier chapters.
- Reference earlier findings with phrases like "as discussed in Chapter X."
- Do not redefine terms already defined.` : ''}
THESIS TITLE: "${promptData.topic}"
${promptData.researchTopic ? `RESEARCH QUESTION: "${promptData.researchTopic}"` : ''}
FIELD: ${promptData.field || 'Not specified'}
CHAPTER: ${promptData.chapter}
METHODOLOGY: ${promptData.methodology || 'mixed methods'}${promptData.organization ? `
CASE STUDY: ${promptData.organization}` : ''}${sourceModeInstruction}
${findingsInstruction}

## SUBSECTIONS TO WRITE
Write the entire chapter one subsection at a time, in the order listed below:

${subsOutline}

${promptData.guidelines ? `
## CHAPTER-SPECIFIC GUIDELINES
${promptData.guidelines}
` : ''}

## OUTPUT FORMAT
Wrap each subsection with markers matching the ID from the list above:

[WRITE_SUBSECTION: chapter2_sub_1]
2.0 Introduction
Content here...
[/WRITE_SUBSECTION]
[WRITE_SUBSECTION: chapter2_sub_2]
2.1 Theoretical Framework
Content here...
[/WRITE_SUBSECTION]

Write ALL subsections in order. Do not skip any.

## VISUALS (optional reference)
If you include a table, chart, or framework diagram, the system will automatically render it as a professional visual. These formats are available if you choose to use them:

- **Tables:** standard markdown table syntax
- **Charts:** [CHART: type | Title | Label1: value, Label2: value, ...] (types: bar, line, pie, horizontalBar)
- **Frameworks:** [FRAMEWORK: Title\n  Independent: ...\n  Dependent: ...\n  H1: ...\n]
- **Hierarchies:** [FRAMEWORK: Title\n  Hierarchy: Parent → Child\n]

Do not use code fences or ASCII art for visuals.

Write the complete chapter now.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const candidates = result.response.candidates;

    let sources = [];
    let groundingUsed = false;
    if (candidates && candidates[0]?.groundingMetadata?.groundingChunks) {
      sources = candidates[0].groundingMetadata.groundingChunks
        .filter(chunk => chunk.web)
        .map(chunk => ({ title: chunk.web.title || '', uri: chunk.web.uri || '' }));
      groundingUsed = sources.length > 0;
    }

    const cleanedText = cleanOutput(responseText);
    return {
      text: cleanedText,
      sources,
      groundingUsed
    };
  } catch (error) { console.error('Error generating chapter content:', error); throw error; }
};

export const selfReviewContent = async (text, promptData) => {
  try {
    const model = genAI.getGenerativeModel({
      model: MODEL,
      tools: [{ googleSearch: {} }],
      generationConfig: { temperature: 0.5, topP: 0.85 }
    });
    const extraInstr = promptData?.extraInstruction ? `\n\n## ADDITIONAL INSTRUCTION\n${promptData.extraInstruction}` : '';
    const prompt = `You are a senior academic editor performing a quality review on AI-generated thesis content. Your task: identify all detectable AI writing patterns and rewrite the text so it is COMPLETELY INDISTINGUISHABLE from human academic writing.

ORIGINAL TEXT (AI-generated):
${text}

THESIS TITLE: "${promptData?.topic || 'thesis'}"
${promptData?.researchTopic ? `RESEARCH QUESTION: "${promptData.researchTopic}"` : ''}
FIELD: ${promptData?.field || 'Not specified'}
CHAPTER: ${promptData?.chapter || 'N/A'}
SUBSECTION: ${promptData?.subsection || 'N/A'}${extraInstr}

## DETECTION CHECKLIST — Scan the text for every item below

### 1. BANNED PHRASES
Remove: "In this contemporary world", "it is important to note that", "furthermore", "moreover", "additionally", "consequently", "thus", "hence", "in conclusion", "this highlights", "this underscores", "the realm of", "a myriad of", "a plethora of", "delves into", "navigates the complexities of", "plays a crucial role in", "in today's rapidly evolving society", "it is worth noting that".

### 2. BURSTINESS (Sentence Rhythm)
Check: Are sentence lengths too uniform? Are paragraphs all the same length?
Fix: Break long sentences. Combine short ones. Vary paragraph lengths (2 to 8 sentences). No two consecutive sentences should start with the same word.

### 3. TRANSITION STACKING
Check: Are robotic transitions used multiple times? ("Furthermore... Moreover... Additionally...")
Fix: Remove most transitions entirely. Let ideas flow naturally. Use transitions only where genuinely needed, and vary them.

### 4. CITATION INTEGRITY
Check: Does every paragraph have at least one (Author, Year) or [CITATION:...] marker?
Fix: Do NOT add new citations. Do NOT remove existing ones. Keep [CITATION:...] markers untouched.

### 5. DEPTH AND SPECIFICITY
Check: Does the text make specific, grounded claims? Or does it use generic statements that could apply to any topic?
Fix: Replace vague claims with specific ones. Remove filler. Add concrete details from the original context.

### 6. ACADEMIC TONE
Check: Are there contractions, first-person pronouns, rhetorical questions, or informal phrases?
Fix: Maintain third person, no contractions, formal register, no em dashes.

## REWRITE INSTRUCTIONS
- Rewrite the ENTIRE text incorporating all fixes above.
- Preserve ALL: tables, diagrams, [CHART:{...}] tags, data, numbers, statistics.
- Preserve ALL subsection headings exactly as they appear.
- Return ONLY the rewritten text. No explanations, no annotations, no meta-commentary.`;

    const result = await model.generateContent(prompt);
    return cleanOutput(result.response.text());
  } catch (error) { console.error('Error in self-review:', error); return text; }
};

export const applyFeedbackToContent = async (currentContent, feedback, subsectionTitle, project, userSources = null, sourceMode = 'ai-only') => {
  try {
    const model = genAI.getGenerativeModel({ 
      model: MODEL,
      tools: [{ googleSearch: {} }]
    });
    let filesInstruction = '';
    let imageParts = [];
    if (feedback.files?.length) {
      const imageFiles = feedback.files.filter(f => f.type === 'image' && f.content);
      const nonImageFiles = feedback.files.filter(f => f.type !== 'image');
      imageParts = imageFiles.map(f => {
        const matches = f.content.match(/^data:(image\/\w+);base64,(.+)$/);
        if (matches) return { inlineData: { mimeType: matches[1], data: matches[2] } };
        return null;
      }).filter(Boolean);
      const fileNames = feedback.files.map(f => f.name).join(', ');
      filesInstruction = `\nUploaded ${feedback.files.length} file(s): ${fileNames}.`;
      if (nonImageFiles.length > 0) {
        nonImageFiles.forEach(f => {
          if (f.extractedText) filesInstruction += `\nContent from ${f.name}: ${f.extractedText.substring(0, 3000)}`;
        });
      }
    }

    let sourceModeInstruction = '';
    if (sourceMode === 'user-only' && userSources?.length > 0) {
      const sourcesJson = JSON.stringify(userSources.map(s => ({
        title: s.title, authors: s.authors, year: s.year,
        methodology: s.methodology, keyFindings: s.keyFindings,
        theoreticalFramework: s.theoreticalFramework
      })), null, 2);
      sourceModeInstruction = `
## USER-PROVIDED SOURCES (MANDATORY)
The student has uploaded the following papers. These are the ONLY sources you may cite.
${sourcesJson.substring(0, 15000)}

### USER SOURCE RULES
- For EACH paper listed above, use Google Search Grounding to find the ACTUAL publication, read its content, and cite specific findings from it.
- You MUST find and cite from the REAL published paper — not just the title and authors listed here.
- If Google Search Grounding cannot find a specific paper after trying, do NOT cite it.
- At least 2 different sources must be cited across the subsection.
- When discussing a concept or finding, reference the specific source: (Author, Year).
- Do NOT fabricate any citation. If you cannot find a real source for a claim, make the argument without a citation.`;
    } else if (sourceMode === 'combine' && userSources?.length > 0) {
      const sourcesJson = JSON.stringify(userSources.map(s => ({
        title: s.title, authors: s.authors, year: s.year,
        methodology: s.methodology, keyFindings: s.keyFindings,
        theoreticalFramework: s.theoreticalFramework
      })), null, 2);
      sourceModeInstruction = `
## USER-PROVIDED SOURCES (PRIORITY)
The student has uploaded the following papers. PRIORITIZE these sources for citations.
${sourcesJson.substring(0, 15000)}

### COMBINED SOURCE RULES
- Use Google Search Grounding to find the ACTUAL publications for the user's papers, read them, and cite specific findings.
- Supplement with additional sources found via Google Search Grounding where user sources do not provide sufficient coverage.
- At least 60% of citations should come from the user's papers.
- If Google cannot find a specific user paper, you may cite it using its listed title and authors as a last resort.`;
    }

    const prompt = `You are an expert academic editor applying supervisor feedback to a thesis subsection. Address the feedback while preserving academic quality and structural integrity.

SUBSECTION: ${subsectionTitle}
THESIS TITLE: "${project?.title}"
${project?.topic ? `RESEARCH QUESTION: "${project.topic}"` : ''}
FIELD: ${project?.field}

FEEDBACK TO APPLY:
"${feedback.text}"${filesInstruction}

CURRENT TEXT:
${cleanOutput(currentContent)}${sourceModeInstruction}

## INSTRUCTION HIERARCHY (highest to lowest priority)

### PRIORITY 1 — USER FEEDBACK (overrides everything else)
- The user's feedback text is the MOST IMPORTANT instruction. Apply it EXACTLY as written.
- If feedback asks to make it longer, MAKE IT LONGER. If it asks for two paragraphs, ADD TWO PARAGRAPHS.
- If feedback asks to rewrite, REWRITE. If it asks to expand, EXPAND.
- Do not second-guess or soften the user's instructions. Do what they say.
- Only if the feedback is vague (e.g., "improve this section") should you use your best judgment for minimal improvements.

### PRIORITY 2 — CITATION INTEGRITY
- ${sourceModeInstruction ? 'INTEGRATE user-provided sources into the text using (Author, Year) citations where relevant.' : 'PRESERVE ALL in-text citations exactly as they appear — do not change, remove, or replace any (Author, Year) markers.'}
- PRESERVE [CITATION:...] markers exactly as they appear.
- ${sourceModeInstruction ? 'ADD new citations from user-provided sources where they support the arguments.' : 'DO NOT add new citations that were not in the original text.'}
- Ensure every paragraph has at least one in-text citation after editing.

### PRIORITY 3 — STRUCTURAL PRESERVATION
- Keep ALL subsection headings exactly as they are — do not modify heading text.
- Keep ALL existing tables, diagrams, [CHART:{...}] tags, and data intact.
- Do not restructure or reorder paragraphs unless the feedback explicitly requests it.

### PRIORITY 4 — SUBSECTION BOUNDARIES
- Do not add content that belongs in a different subsection.
- Do not introduce new topics or arguments not present in the original text.
- Stay strictly within the scope of "${subsectionTitle}".

### PRIORITY 5 — FORMATTING
- Return ONLY the modified text — no explanations, no annotations, no meta-commentary.
- NO markdown headings (###, ##), NO HTML tags.
- NO word count footnotes.
- NO em dashes.
- Plain text only.

Return ONLY the complete modified text for this subsection.`;
    const parts = imageParts.length > 0 ? [...imageParts, { text: prompt }] : [{ text: prompt }];
    const result = await model.generateContent({ contents: [{ role: "user", parts }] });
    return cleanOutput(result.response.text());
  } catch (error) { console.error('Error applying feedback:', error); throw error; }
};

const buildHumanisePrompt = (text, promptData, humaniseLevel) => {
  const topic = promptData?.topic || 'thesis topic';
  const field = promptData?.field || 'social sciences';
  const chapter = promptData?.chapter || 'thesis chapter';
  const subsection = promptData?.subsection || 'subsection';
  const diagnosticReport = promptData?.diagnosticReport || '';
  const flaggedSentences = promptData?.flaggedSentences || [];

  let flaggedSection = '';
  if (flaggedSentences.length > 0) {
    const list = flaggedSentences
      .filter(s => s.aiProbability > 0.5)
      .slice(0, 15)
      .map((s, i) =>
        `SENTENCE ${i + 1}: "${s.text.slice(0, 150)}"\n  Flags: ${s.flags.join(', ') || 'none'}\n  Suggestions: ${s.suggestions.join(', ') || 'none'}`
      )
      .join('\n\n');
    if (list) {
      flaggedSection = `
## TARGETED REWRITE — FLAGGED SENTENCES
The following sentences were flagged as AI-like. Rewrite each one with specific fixes:

${list}

For each flagged sentence above, apply its specific suggestions. Do NOT rewrite sentences not listed above.`;
    }
  }

  const baseHeader = `You are a smart graduate student who writes clearly and naturally. Rewrite the following thesis excerpt so it sounds like a real person wrote it — not AI.

TEXT TO REWRITE:
${text}

THESIS TITLE: "${topic}"
${promptData?.researchTopic ? `RESEARCH QUESTION: "${promptData.researchTopic}"` : ''}
FIELD: ${field}
CHAPTER: ${chapter}
SUBSECTION: ${subsection}
${diagnosticReport}${flaggedSection}

## CRITICAL RULES — FOLLOW EVERY ONE

### 1. SENTENCE RHYTHM (MOST IMPORTANT)`;

  const level1Rhythm = `
- DRAMATICALLY vary sentence length. Mix 3-word sentences with 30-word sentences.
- No two consecutive sentences should start with the same word.
- Vary paragraph lengths from 1 sentence to 8 sentences.
- Use short punchy statements: "This matters. Here's why."
- Then immediately follow with a longer, flowing sentence.`;

  const level2Rhythm = `
- STRONG rhythm variation: freely mix very short (3-6 words), medium (15-25 words), and long (30-50 words) sentences.
- No two consecutive sentences should start with the same word.
- Include occasional one-sentence paragraphs for dramatic emphasis.
- Start some paragraphs with a short, direct statement followed by a longer explanatory sentence.
- Vary paragraph length unpredictably: some 2 sentences, some 8 sentences.`;

  const level3Rhythm = `
- MAXIMUM burstiness: sentences should feel random in length — 4 words, then 50, then 7, then 30.
- No two sentences should have a similar structure or length pattern.
- Start most paragraphs with a very short punchy sentence (3-6 words).
- Let each paragraph have its own unique rhythm — some fast and punchy, some slow and flowing.
- Avoid any detectable pattern in sentence length or structure.`;

  let rhythmSection;
  let toneSection;
  let styleSection;
  let avoidSection;

  if (humaniseLevel === 1) {
    rhythmSection = level1Rhythm;
    toneSection = `
### 2. TONE — NATURAL ACADEMIC STYLE
- Write like a smart graduate student writing a thesis — clear and natural, not stiff or robotic.
- NO contractions: write out ALL words fully (do not, will not, cannot, it is, they are, that is, does not).
- Mix confident statements ("The data clearly show...") with thoughtful hedging ("This may suggest...", "It is possible that...").
- Simple vocabulary is GOOD. Avoid jargon and fancy words.
- Never say "furthermore", "moreover", "consequently", "thus", "hence", "in conclusion".`;
    styleSection = `
### 3. VARIED ACADEMIC STYLE
- Start sentences with variety: "Notably...", "Critically...", "An important finding is...", "Turning to...", "What is particularly striking is..."
- Use THIRD PERSON exclusively: "the researcher", "this study", "the findings suggest".
- Use natural academic phrasing: "importantly", "notably", "interestingly", "critically", "in practice"
- Vary confidence: some claims sound certain, others hedge ("this may suggest", "it appears that").
- Long sentences should feel thoughtful and purposeful, not formulaic.`;
    avoidSection = `
### 4. WHAT TO AVOID AT ALL COSTS
- NO transitions (furthermore, moreover, additionally, consequently, thus, hence)
- NO formal openers ("This study examines", "The research aims to", "It is important to")
- NO overly complex sentences with multiple nested clauses
- NO perfect uniformity — sentences should have different rhythms
- NO big vocabulary where simple words work`;
  } else if (humaniseLevel === 2) {
    rhythmSection = level2Rhythm;
    toneSection = `
### 2. TONE — LESS FORMAL ACADEMIC STYLE
- Write like a smart graduate student who has mastered the material and writes with natural confidence.
- NO contractions: write out ALL words fully (do not, will not, cannot, it is, they are, that is, does not).
- Use the simplest word that works — if a 10th grader could understand it, that is perfect.
- Sound certain where appropriate ("The data indicate..."), hedge where uncertain ("It appears that...", "This may reflect...").
- Never use "furthermore", "moreover", "consequently", "thus", "hence", "in conclusion", "additionally".`;
    styleSection = `
### 3. NATURAL VARIED STYLE
- Vary sentence starters: "What is striking...", "An important observation...", "This connects to...", "Notably...", "A key point is...", "Looking at..."
- Use THIRD PERSON exclusively: "the researcher", "this study", "the findings suggest".
- Vary confidence levels naturally — some paragraphs sound definitive, others exploratory.
- Use natural academic connectors: "importantly", "notably", "interestingly", "in practice", "specifically"
- Write as if explaining to a colleague — clear, direct, but still academic.`;
    avoidSection = `
### 4. WHAT TO AVOID AT ALL COSTS
- NO formal openers ("This study examines", "The research aims to", "It should be noted")
- NO overly complex sentences with multiple nested clauses
- NO repeated sentence structures
- NO big vocabulary where simple words work
- NO two paragraphs with the same rhythm`;
  } else {
    rhythmSection = level3Rhythm;
    toneSection = `
### 2. TONE — MAXIMUM NATURAL
- Write like an experienced researcher explaining their work to a colleague — clear, direct, completely natural.
- NO contractions: write out ALL words fully (do not, will not, cannot, it is, they are, that is, does not).
- Use everyday academic vocabulary — the simplest word that conveys the meaning correctly.
- Sound completely natural: some sentences definitive, some speculative, some purely observational.
- Completely avoid "furthermore", "moreover", "consequently", "thus", "hence", "in conclusion", "additionally", "therefore".`;
    styleSection = `
### 3. NATURAL FLUCTUATING STYLE
- Vary openings unpredictably: "What is striking...", "The data point to...", "A contrasting view comes from...", "Importantly...", "This raises a key question...", "A critical finding..."
- Use THIRD PERSON exclusively: "the researcher", "this study", "the findings suggest", "the data indicate".
- Each paragraph should have its own distinct voice and rhythm.
- Avoid ALL transition-like phrasing entirely. Let ideas connect naturally without signposting.
- Write like a published academic whose writing feels effortless and unforced.`;
    avoidSection = `
### 4. WHAT TO AVOID AT ALL COSTS
- NO detectable patterns in sentence structure or length
- NO formulaic academic writing of any kind
- NO two sentences that sound like they were written by the same template
- NO paragraphs that feel "balanced" or "structured" — they should feel organic
- NO vocabulary that feels chosen to impress rather than to communicate`;
  }

  const structuralSection = `
### 5. STRUCTURAL PRESERVATION
- Keep ALL in-text citations (Author, Year) exactly as written.
- Keep ALL data, tables, [CHART:{...}] tags, and diagrams unchanged.
- Keep ALL subsection headings exactly as they appear.
- No markdown headings, no HTML tags.

Return ONLY the rewritten text. No explanations.`;

  return `${baseHeader}${rhythmSection}${toneSection}${styleSection}${avoidSection}${structuralSection}`;
};

export const humaniseContent = async (text, promptData = null, humaniseLevel = 1) => {
  try {
    const temps = { 1: 0.9, 2: 1.0, 3: 1.1 };
    const model = genAI.getGenerativeModel({
      model: MODEL,
      tools: [{ googleSearch: {} }],
      generationConfig: { temperature: temps[humaniseLevel] || 0.9, topP: 0.95 }
    });
    const prompt = buildHumanisePrompt(text, promptData, humaniseLevel);
    const result = await model.generateContent(prompt);
    let humanised = cleanOutput(result.response.text());
    if (!humanised || humanised.trim().length < 50) return text;
    return humanised;
  } catch (error) { console.error('Error humanising:', error); throw error; }
};

export const generateReferences = async (citations, style, userSources = null, sourceMode = 'ai-only') => {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL });
    const styleGuide = style === 'apa'
      ? 'APA 7th edition: Author, A. A. (Year). Title of work. Source/Publisher. DOI or URL if available.'
      : style === 'mla'
      ? 'MLA 9th edition: Author Last, First. Title of Work. Publisher, Year.'
      : 'Chicago: Author Last, First. Year. Title of Work. Publisher.';

    let userSourcesSection = '';
    if (userSources?.length > 0) {
      userSourcesSection = `
## USER-PROVIDED SOURCES
The student has uploaded the following papers. These are REAL sources with verified metadata. Use them to create reference entries when the in-text citations match.
 
${JSON.stringify(userSources.map(s => ({
  title: s.title, authors: s.authors, year: s.year,
  methodology: s.methodology, keyFindings: s.keyFindings,
  theoreticalFramework: s.theoreticalFramework
})), null, 2)}
 
### USER SOURCE RULES
- If an in-text citation matches one of these user sources (by author and year), use this metadata to format the reference.
- Format using the standard publication details from your training data, falling back to user-provided metadata when needed.
- When formatting from user metadata, produce a complete reference following the style guide: Author, A. A. (Year). Title. Retrieved from thesis sources.`;
    }

    const prompt = `You are an expert academic reference librarian. Given in-text citations from a thesis, produce a properly formatted reference list.

IN-TEXT CITATIONS (extracted from thesis content):
${citations.map(c => `- ${c}`).join('\n')}

REFERENCE STYLE: ${style.toUpperCase()}
STYLE GUIDE: ${styleGuide}
${userSourcesSection}

## CRITICAL RULES

### NO ANNOTATIONS WHATSOEVER
- NEVER output any warning, annotation, placeholder, bracket text, or meta-commentary.
- No "⚠️", no "UNVERIFIED", no "NOTE:", no "[Source details unavailable]", no "[Retrieved from]", no "[Unpublished source]".
- Every entry must be a clean, complete reference that looks professionally researched.
- The output must be indistinguishable from a reference list in a published thesis.

### PRODUCE A REFERENCE FOR EVERY CITATION
- You MUST produce a formatted reference entry for EVERY citation in the list above. Do not skip any.
- Use your training knowledge of academic publications to format each reference with the appropriate title, journal, volume, pages, and DOI/URL.
- If user-provided metadata is available for a citation, use it to construct the reference.
- CROSS-CHECK: Ensure author names and year match the in-text citation exactly.

### NO NEW CITATIONS
- ONLY produce references for citations in the list above.
- Do NOT add, invent, or generate references for citations that are not in the provided list.

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
