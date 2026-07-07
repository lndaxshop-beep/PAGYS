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

  const levelInstructions = {
    1: `Polish this thesis text to sound like a capable graduate student wrote it. Improve fluency and readability while keeping the original structure and flow. The writing should feel clear, direct, and naturally academic.`,

    2: `Rewrite this thesis text as a human scholar would naturally write it. Restructure paragraphs for organic flow. Vary confidence levels — some claims sound definitive, others are thoughtfully hedged. Use transitions where they fit naturally. Let paragraphs breathe with varied lengths and purposes.`,

    3: `Rewrite this thesis text completely naturally, as if a human scholar wrote it from scratch. Do not think about rules or formulas — simply write as a real academic would. Vary sentence flow organically. Use parenthetical asides and natural hedging where appropriate. Let the writing feel genuinely human — confident in places, exploratory in others, always natural.`
  };

  const humanWritingExamples = `
## HUMAN WRITING REFERENCE EXAMPLES
Study these excerpts from a real thesis that scored 0% AI probability. They show what natural academic writing looks like in practice.

EXAMPLE 1 (Natural narrative flow — short and long sentences, confident opening):
"Financial literacy has emerged as one of the essential life skills that an individual can acquire in the present-day world. Indeed, in each and every day of their lives, people are expected to make decisions regarding money whether it comes to how to budget for daily expenses, save for tuition or even apply for a loan in either a banking institution or mobile money platform. Though small on their own, such decisions can have a huge impact when accumulated."

EXAMPLE 2 (Confidence variation, natural hedging, integrated citations):
"This confidence is termed as financial self-efficacy, and empirical research indicates that it is a reliable predictor of sound financial behavior among young people (Sun & Chen, 2024). For instance, the student who has the confidence that he or she is able to follow the budget will be much more likely to plan and observe the budget compared to the student who does not believe that he or she has the ability to do that. College years are characterized by strong peer influence on the part of college students."

Notice what makes these passages work:
- Sentences vary in length naturally, without mechanical patterns
- Transitions emerge where they fit ('Indeed', 'For instance') — they are not forced nor avoided
- Some claims are confident ('research indicates'), others are hedged ('may be', 'it appears')
- Citations are woven into the narrative naturally
- The rhythm comes from the writer's ideas, not from counting words
- Academic vocabulary serves the point; the simplest word that works is preferred`;

  const patternsSection = `
## WRITING GUIDELINES
- Write in third person (the researcher, the findings suggest, the data indicate)
- No contractions — write out all words fully (do not, will not, cannot, it is, they are)
- Vary confidence naturally — some paragraphs are definitive, others exploratory
- Use transitions where they fit naturally (however, furthermore, therefore, nevertheless are all fine)
- Parenthetical asides and brief qualifying statements add a human feel
- Each paragraph should have its own rhythm — some short and direct, others longer and more developed
- Keep vocabulary straightforward; clarity matters more than impressiveness

## STRUCTURAL PRESERVATION
- Keep ALL in-text citations (Author, Year) exactly as written
- Keep ALL data, tables, [CHART:{...}] tags, and diagrams unchanged
- Keep ALL subsection headings exactly as they appear
- No markdown headings, no HTML tags

Return ONLY the rewritten text. No explanations.`;

  return `
You are a skilled academic writer. Rewrite thesis content so it reads like a human scholar wrote it.

## THESIS CONTEXT
TITLE: "${topic}"
FIELD: ${field}
CHAPTER: ${chapter}
SUBSECTION: ${subsection}

## TEXT TO REWRITE
${text}

## LEVEL OF REWRITING
${levelInstructions[humaniseLevel] || levelInstructions[1]}
${humanWritingExamples}
${patternsSection}`;
};

export const humaniseContent = async (text, promptData = null, humaniseLevel = 1) => {
  try {
    const temps = { 1: 0.7, 2: 0.8, 3: 0.9 };
    const model = genAI.getGenerativeModel({
      model: MODEL,
      generationConfig: { temperature: temps[humaniseLevel] || 0.7, topP: 0.95 }
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
