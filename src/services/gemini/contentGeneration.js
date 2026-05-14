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

    const structureInstruction = 'Start directly with the subsection heading.';

    let sourceModeInstruction = '';
    if (promptData.sourceMode === 'user-only' && promptData.userSources?.length > 0) {
      const sourcesJson = JSON.stringify(promptData.userSources.map(s => ({
        title: s.title, authors: s.authors, year: s.year,
        methodology: s.methodology, keyFindings: s.keyFindings,
        theoreticalFramework: s.theoreticalFramework
      })), null, 2);
      sourceModeInstruction = `
## USER-PROVIDED SOURCES (MANDATORY — USE ONLY THESE)
The student has uploaded the following papers to be used as sources. You MUST use ONLY these sources for ALL citations in your response.
${sourcesJson.substring(0, 15000)}

### USER SOURCE RULES
- EVERY citation MUST come from these user-provided sources — do NOT use Google Search Grounding.
- Reference each source by the author and year as listed above.
- When discussing a finding or concept, cite the specific source that contains it.
- If no user source covers a needed point, make the argument without a citation rather than fabricating one.
- At least 2 different user sources should be cited across the subsection.`;
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
- FIRST check the user-provided sources for each claim.
- If the user sources cover a point, cite them.
- Supplement with Google Search Grounding only where user sources do not provide sufficient support.
- At least 60% of citations should come from user-provided sources.`;
    }

    const prompt = `You are an advanced academic writing assistant helping a ${promptData.level} student write their thesis. Generate content that reads like a thoughtful, professional scholar's work — never like AI output. This is a PROFESSIONAL ACADEMIC THESIS.

TOPIC: "${promptData.topic}"
CHAPTER: ${promptData.chapter}
SUBSECTION: ${promptData.subsection}
TARGET WORD COUNT: ${targetWords} words (range: ${wordRange.min}–${wordRange.max})
METHODOLOGY: ${promptData.methodology || 'mixed methods'}
${promptData.organization ? `CASE STUDY: ${promptData.organization}` : ''}${sourceModeInstruction}
${promptData.findings ? `RESEARCH FINDINGS DATA: ${typeof promptData.findings === 'object' ? JSON.stringify(promptData.findings) : promptData.findings}

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
- Every paragraph should connect to a specific finding from the data.` : ''}

## VISUAL EMBEDDING — USE YOUR JUDGEMENT
Throughout the thesis, embed a diagram, chart, or table wherever a visual element conveys information more effectively than text alone. Use your judgement — some chapters benefit from several visuals, others from few or none.

- In the Literature Review: conceptual framework diagrams, theoretical framework diagrams, comparison tables of literature.
- In the Methodology: research design flowcharts, sampling procedure diagrams, data collection process maps.
- In the Results/Analysis: charts showing distributions, tables presenting demographic profiles, diagrams illustrating patterns.
- In the Discussion: comparison tables or charts contrasting findings with prior research.
- In any chapter: mermaid flowcharts, sequence diagrams, or relationship diagrams where they clarify complex concepts.

Use code fences to embed visuals inline where they naturally fit:
- \`\`\`chart blocks for charts: followed by a JSON line with title, type (bar/pie/line), data (labels + values), and caption
- \`\`\`table blocks for tables: followed by a JSON line with title, headers, rows, and caption
- \`\`\`mermaid blocks for diagrams: followed by mermaid code
- Inline [CHART:{"title":"...","type":"bar","data":{"labels":[...],"values":[...]},"caption":"..."}] for simple single-value charts

Rules:
- Embed a visual only when it genuinely adds clarity — do not force visuals where text suffices.
- Place each visual block on its own line between paragraphs.
- Reference each visual in the surrounding text: "As Figure X shows", "Table Y presents", "The chart below illustrates".
- Use accurate captions with chapter-scoped numbers: "Figure X.Y: Descriptive caption" or "Table X.Z: Descriptive caption".
- Charts, tables, and diagrams must contain REAL data — never fabricate numbers.

${structureInstruction}
${promptData.guidelines ? `

## CHAPTER-SPECIFIC GUIDELINES
The student has provided the following custom instructions specific to this chapter. These take priority over general rules where they conflict:

${promptData.guidelines}
` : ''}

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
"Over three semesters, students using AI-assisted tutoring scored 18% higher on standardised assessments than their peers in traditional classrooms (Park, 2023). The effect was most pronounced among students who entered with below-median prerequisite scores: a finding that challenges the assumption that AI tools primarily benefit advanced learners."
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

TOPIC: "${promptData?.topic || 'thesis'}"
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
- Preserve ALL: tables, mermaid diagrams, [CHART:{...}] tags, data, numbers, statistics.
- Preserve ALL subsection headings exactly as they appear.
- DO NOT change the word count drastically (stay within 85–115% of original).
- Return ONLY the rewritten text. No explanations, no annotations, no meta-commentary.`;

    const result = await model.generateContent(prompt);
    return cleanOutput(result.response.text());
  } catch (error) { console.error('Error in self-review:', error); return text; }
};

export const applyFeedbackToContent = async (currentContent, feedback, subsectionTitle, project) => {
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
    const parts = imageParts.length > 0 ? [...imageParts, { text: prompt }] : [{ text: prompt }];
    const result = await model.generateContent({ contents: [{ role: "user", parts }] });
    return cleanOutput(result.response.text());
  } catch (error) { console.error('Error applying feedback:', error); throw error; }
};

export const humaniseContent = async (text, promptData = null) => {
  try {
    const model = genAI.getGenerativeModel({
      model: MODEL,
      tools: [{ googleSearch: {} }],
      generationConfig: { temperature: 0.9, topP: 0.95 }
    });
    const topic = promptData?.topic || 'thesis topic';
    const field = promptData?.field || 'social sciences';
    const chapter = promptData?.chapter || 'thesis chapter';
    const subsection = promptData?.subsection || 'subsection';
    const diagnosticReport = promptData?.diagnosticReport || '';

    const fieldVocabulary = {
      'education': ['pedagogical', 'curricular', 'instructional strategies', 'learner outcomes', 'differentiated instruction', 'formative assessment', 'scaffolding', 'constructivist'],
      'psychology': ['cognitive processes', 'behavioral patterns', 'psychological constructs', 'affective factors', 'neuropsychological', 'developmental trajectories', 'therapeutic interventions'],
      'business': ['organizational performance', 'strategic alignment', 'stakeholder value', 'competitive advantage', 'operational efficiency', 'market dynamics', 'corporate governance'],
      'computer science': ['computational efficiency', 'algorithmic complexity', 'system architecture', 'data structures', 'implementation details', 'performance benchmarks', 'software engineering practices'],
      'engineering': ['design parameters', 'performance metrics', 'structural integrity', 'system optimization', 'engineering tolerances', 'failure modes', 'prototype evaluation'],
      'medicine': ['clinical outcomes', 'diagnostic accuracy', 'therapeutic efficacy', 'patient prognosis', 'physiological mechanisms', 'treatment protocols', 'biomarker analysis'],
      'sociology': ['social structures', 'cultural norms', 'institutional frameworks', 'demographic patterns', 'social stratification', 'community dynamics', 'collective behavior'],
      'economics': ['market efficiency', 'resource allocation', 'economic indicators', 'welfare implications', 'distributional effects', 'incentive structures', 'equilibrium analysis'],
    };
    const fieldTerms = fieldVocabulary[field.toLowerCase()] || ['empirical evidence', 'theoretical foundations', 'analytical framework', 'research findings', 'methodological approach'];

    const pass1Prompt = `You are Professor ${field.charAt(0).toUpperCase() + field.slice(1)} Studies, a renowned scholar with 25 years of published research. Rewrite the following thesis excerpt as YOU would write it — with genuine academic voice, ${field}-specific vocabulary, and the natural rhythm of someone who has written dozens of peer-reviewed articles.

TEXT TO REWRITE:
${text}

TOPIC: "${topic}"
FIELD: ${field}
CHAPTER: ${chapter}
SUBSECTION: ${subsection}
${diagnosticReport}

## HUMAN WRITING FINGERPRINTS TO INJECT

### CONFIDENCE VARIATION (CRITICAL)
Vary your certainty level across the text, never within the same sentence:
- Be ASSERTIVE about findings you can defend: "The data demonstrate a clear pattern."
- Be TENTATIVE about interpretations: "This may suggest a relationship, though further research is needed."
- Be NEUTRAL when describing methods: "Participants were asked to rate their agreement."
The same author should sound confident about some claims and cautious about others — this is a hallmark of honest academic writing.

### SYNTAX VARIETY (CRITICAL)
Mix these patterns unpredictably — never two sentences with the same structure in a row:
- Fronted adverbial: "Unlike prior studies, this analysis focused on..."
- Mid-sentence aside: "The results, it should be noted, were not uniform."
- Inversion for emphasis: "Of greater significance is the finding that..."
- Short punch: "This was not the case."
- Long nested clause: "The extent to which these factors, when considered together, influence the outcome remains an open question."
- Simple declarative: "Three themes emerged from the data."

### FIELD-SPECIFIC VOCABULARY
Use vocabulary natural to ${field} scholars:
${fieldTerms.map(t => `- "${t}"`).join('\n')}
AVOID generic social-science filler: "explores", "delves into", "navigates", "investigates", "the realm of", "a myriad of".

### STRATEGIC REPETITION
When a concept is central to the argument, repeat the exact term rather than substituting synonyms. Academic readers expect precise terminology. Only use a synonym when the meaning genuinely shifts.

### PARAGRAPH-LEVEL THINKING
Each paragraph should feel like a UNIT of thought, not a sequence of sentences:
- Start with a claim or observation
- Develop it with evidence or reasoning
- Optionally acknowledge a nuance or counterpoint
- End with a link to the next paragraph
Not every paragraph needs all four steps, but readers should sense an intentional shape.

### HEDGING PLACEMENT
Use hedging language ONLY in interpretations, NEVER in descriptions of what was done:
- Good: "The intervention appeared to improve outcomes, though the small sample size warrants caution."
- Bad: "The study appeared to use a convenience sampling method." (This is a fact — don't hedge it)

## STRUCTURAL PRESERVATION RULES
- Keep ALL in-text citations (Author, Year) exactly as written.
- Keep ALL data, tables, [CHART:{...}] tags, and mermaid diagrams unchanged.
- Keep ALL subsection headings exactly as they appear.
- KEEP the total word count within 85-115% of the original.
- Do NOT add reference lists, bibliographies, or word count footnotes.
- NO markdown headings, NO HTML tags, NO em dashes.
- NO contractions — write out all words fully.
- Maintain formal academic third-person tone throughout.

Return ONLY the rewritten text. No explanations, no meta-commentary.`;

    // Pass 1: Humanise (high temp)
    const result1 = await model.generateContent(pass1Prompt);
    let humanised = cleanOutput(result1.response.text());
    if (!humanised || humanised.trim().length < 50) return text;

    // Pass 2: Polish (low temp) — ensure academic tone preserved, fix any errors from Pass 1
    try {
      const polishModel = genAI.getGenerativeModel({
        model: MODEL,
        generationConfig: { temperature: 0.4, topP: 0.85 }
      });
      const polishPrompt = `You are a meticulous academic copy-editor. Review the following text for any issues introduced during editing and polish it.

TEXT TO POLISH:
${humanised}

## POLISH CHECKLIST
1. Are all in-text citations still properly formatted as (Author, Year)? Fix any that got corrupted.
2. Are there any grammatical errors, missing words, or broken sentences? Fix them.
3. Is the academic tone consistent and formal? No contractions, no casual language.
4. Are all data, tables, chart tags, and mermaid diagrams intact? Do not modify them.
5. Are all subsection headings preserved exactly?
6. Is the word count within 85-115% of the original?
7. NO em dashes — use commas or parentheses instead.
8. NO markdown headings, NO HTML tags.

Return ONLY the polished text. No explanations, no annotations.`;
      const result2 = await polishModel.generateContent(polishPrompt);
      const polished = cleanOutput(result2.response.text());
      if (polished && polished.trim().length > 50) {
        humanised = polished;
      }
    } catch (e) {
      console.warn('[humaniseContent] Polish pass failed, using humanised output:', e.message);
    }

    return humanised;
  } catch (error) { console.error('Error humanising:', error); throw error; }
};

export const generateReferences = async (citations, style, userSources = null, sourceMode = 'ai-only') => {
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

    let userSourcesSection = '';
    if (userSources?.length > 0 && (sourceMode === 'user-only' || sourceMode === 'combine')) {
      userSourcesSection = `
## USER-PROVIDED SOURCES (VERIFIED)
The student has uploaded the following papers. These are REAL, VERIFIABLE sources. Use them to create reference entries when the in-text citations match.

${JSON.stringify(userSources.map(s => ({
  title: s.title, authors: s.authors, year: s.year,
  methodology: s.methodology, keyFindings: s.keyFindings,
  theoreticalFramework: s.theoreticalFramework
})), null, 2)}

### USER SOURCE RULES
- If an in-text citation matches one of these user sources (by author and year), use this metadata to format the reference.
- These sources may not have DOI/URL — format them as "Author, A. A. (Year). Title. [Unpublished source]" if no publication venue is known.
- Prioritize Google Search Grounding for complete reference details, but fall back to user-provided metadata when search fails.`;
    }

    const prompt = `You are an expert academic reference librarian. Given in-text citations from a thesis, produce a properly formatted reference list using REAL, VERIFIABLE sources found via Google Search Grounding.

IN-TEXT CITATIONS (extracted from thesis content):
${citations.map(c => `- ${c}`).join('\n')}

REFERENCE STYLE: ${style.toUpperCase()}
STYLE GUIDE: ${styleGuide}
${userSourcesSection}

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
