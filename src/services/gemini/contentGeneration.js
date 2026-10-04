import { genAI, MODEL } from './config';
import { cleanOutput, extractJSONArray } from './utils';

// Builds the prompt section describing the literature the student supplied.
//
// Journal, DOI, URI and the abstract are included deliberately. With metadata
// alone the model can only gesture at a title ("as shown in Smith (2020)"),
// whereas the abstract lets it attribute an actual finding, which is what makes
// the in-text citation worth reading.
//
// Sources are emitted as a JSON array and entries are dropped whole rather than
// truncated mid-object. The old substring(0, 15000) could cut the final entry in
// half, leaving malformed JSON that the model would either misread or ignore.
const MAX_SOURCE_CHARS = 60000;

const describeUserSources = (userSources) => {
  const entries = [];
  let total = 0;
  let omitted = 0;

  for (const s of userSources) {
    const abstract = (Array.isArray(s.keyFindings) ? s.keyFindings.filter(Boolean).join(' ') : s.keyFindings) || '';
    const entry = {
      title: s.title,
      authors: s.authors,
      year: s.year,
      // Drop the placeholders the library assigns to unknown fields so they do
      // not read as real attributes of the paper.
      ...(s.journal && s.journal !== 'Not specified' ? { journal: s.journal } : {}),
      ...(s.doi ? { doi: s.doi } : {}),
      ...(s.uri ? { link: s.uri } : {}),
      ...(s.methodology && s.methodology !== 'Not specified' ? { methodology: s.methodology } : {}),
      ...(s.theoreticalFramework && s.theoreticalFramework !== 'Not specified' ? { theoreticalFramework: s.theoreticalFramework } : {}),
      ...(abstract ? { abstract: abstract.substring(0, 3000) } : {}),
    };
    const serialized = JSON.stringify(entry, null, 2);
    if (total + serialized.length > MAX_SOURCE_CHARS) { omitted++; continue; }
    entries.push(entry);
    total += serialized.length;
  }

  return JSON.stringify(entries, null, 2) + (omitted > 0
    ? `\n\n(${omitted} further source(s) omitted to fit the context window.)`
    : '');
};

/**
 * Builds the citation instructions for a generation prompt.
 *
 * One instruction set, whichever material is available. If the student supplied
 * literature we hand it over as the primary material; otherwise we tell the
 * model to ground its claims in real published work. Google Search Grounding is
 * enabled on the model either way, so the model remains free to bring in
 * whatever else genuinely supports the argument — the aim is a well-sourced
 * thesis, not a restricted one.
 *
 * The inline format is author-date for every style, including MLA and IEEE.
 * That is a hard requirement of the pipeline rather than a stylistic choice:
 * `extractCitations` parses (Author, Year) to build the reference list, so a
 * different inline shape would silently produce an empty bibliography. The
 * chosen style is applied when the reference list is generated.
 *
 * `caller` distinguishes whole-chapter generation from single-subsection work,
 * because the density expectation is expressed per paragraph either way.
 */
const buildCitationInstruction = (userSources, caller = 'subsection', referenceStyle = 'apa') => {
  const hasUserSources = userSources?.length > 0;
  const style = String(referenceStyle || 'apa').toUpperCase();

  const shared = `
## CITATION — READ THIS FIRST
Write the way a published thesis is written. Every substantive claim carries the
weight of real scholarship behind it. This is what separates a thesis from an
essay, and it should be unmissable in the prose.

Cite in author-date form, placed immediately before the full stop:
"...produced a significant effect (Smith, 2020)." Use (Smith & Jones, 2020),
or (Smith et al., 2020) for three or more authors. Narrative citation is also
natural and welcome: Smith (2020) argued that... Where several sources support
one claim, group them: (Smith, 2020; Jones, 2019).

Every paragraph of analytical prose should be supported by at least one
citation, and a short run of sentences carrying two or three is stronger than
one citation stretched across a long stretch of text. Cite every theory, model
or framework you name; every statistic, percentage or quantitative finding you
report; every claim attributed to a named researcher or school of thought; and
every direct quotation. Draw on different sources across paragraphs so the
section shows genuine breadth of reading rather than one source carrying the
whole section.

Where the student's own literature below covers a claim, cite it. Where it does
not, ground the claim in whatever real published work genuinely supports it and
cite that instead. Either way the citation must be one you are confident
actually exists and actually says what you are attributing to it.

## STYLE
The reference list will be generated in ${style} style. Cite in author-date form
inline so it can be matched back automatically; the ${style} formatting itself is
applied when the reference list is built.`;

  if (hasUserSources) {
    return `
${shared}

## THE STUDENT'S LITERATURE
These are the papers this student collected for this thesis. They are the
primary material for ${caller}. Read the abstracts closely and cite the specific
findings they report, naming the finding as well as the source.

${describeUserSources(userSources)}

Use Google Search Grounding where helpful to confirm publication details or to
locate a fuller version of any of these papers, and to support any claim they do
not cover.`;
  }

  return `
${shared}

## SOURCING
The student has not supplied their own literature for ${caller}. Use Google Search Grounding to find real, published academic work for every substantive claim: established theories, empirical findings, reported statistics, frameworks, and the main positions in any contested debate. Prefer peer-reviewed journal articles and credible academic publishers. Draw the work from a range of authors, years and perspectives rather than leaning on one study.`;
};

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

const TOKENS_PER_WORD = 1.5;
const OUTPUT_TOKEN_BUFFER = 800;
const MAX_OUTPUT_TOKENS = 32768;

export const budgetForWords = (min, max) => {
  const safeMax = Math.max(Number(max) || 0, Number(min) || 0, 200);
  const maxOutputTokens = Math.min(
    MAX_OUTPUT_TOKENS,
    Math.max(512, Math.ceil(safeMax * TOKENS_PER_WORD) + OUTPUT_TOKEN_BUFFER)
  );
  return { min: Math.max(0, Number(min) || 0), max: safeMax, maxOutputTokens };
};

const WORDS_PER_PARAGRAPH = 110;

// The model reliably lands at roughly 80-90% of the requested length, so we aim at the
// upper bound of the user's chosen range. That natural undershoot lands the final output
// inside [min, max] instead of below min.
const wordBudgetInstruction = (budget, childrenTopics) => {
  if (!budget) return '';
  const aim = budget.max;
  const paragraphs = Math.max(3, Math.round(aim / WORDS_PER_PARAGRAPH));
  const unit = childrenTopics?.length > 1 ? 'sub-sections' : 'paragraphs';
  return `
## LENGTH TARGET — STRICT
Write **${budget.min}-${budget.max} words** for this section. Aim for about **${aim} words** (roughly ${paragraphs} ${unit} of about ${WORDS_PER_PARAGRAPH} words each).
- Stay inside this range. Do not exceed ${budget.max} words.
- Do not fall short of ${budget.min} words either.
- Keep developing the argument until you reach the word target. Do NOT stop early.
- Control length by how much you develop each point, never by padding with repetition or filler.
- Never restate content that belongs in another section of this chapter.`;
};

export const generateAcademicContent = async (promptData) => {
  try {
    const budget = promptData.targetWords ? budgetForWords(promptData.targetWords.min, promptData.targetWords.max) : null;
    const model = genAI.getGenerativeModel({
      model: MODEL,
      tools: [{ googleSearch: {} }],
      generationConfig: {
        temperature: 0.7,
        topP: 0.85,
        thinkingConfig: { thinkingBudget: 0 },
        ...(budget ? { maxOutputTokens: budget.maxOutputTokens } : {}),
      }
    });
    const structureInstruction = '';

    let sourceModeInstruction = buildCitationInstruction(promptData.userSources, 'the subsection', promptData.referenceStyle);

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
SUBSECTION: ${promptData.subsection}${promptData.continuity?.openingOfChapter ? `

## CHAPTER OPENING (already written — continue from here, do NOT rewrite or repeat it)
${promptData.continuity.openingOfChapter}` : ''}${promptData.continuity?.previousSubsection ? `

## PREVIOUS SUBSECTION (${promptData.continuity.previousSubsection.title})
The previous subsection ended like this:
"${promptData.continuity.closingParagraph}"
- Continue the argument naturally from this point.
- Do NOT re-introduce concepts, definitions or sources already covered above.
- Do NOT open with a transition that restates the previous subsection.` : ''}${promptData.continuity?.previousSegment ? `

## CONTINUING THE SAME SECTION (${promptData.continuity.previousSegment.title})
The immediately preceding part of this same section ended like this:
"${promptData.continuity.previousSegment.closingParagraph}"
- You are writing the NEXT PART of the same section. Continue the argument seamlessly from the quoted point.
- Do NOT repeat, restate, summarise or re-introduce anything already written above.
- Do NOT add an introduction, heading or conclusion; just continue the prose.` : ''}
METHODOLOGY: ${promptData.methodology || 'mixed methods'}${promptData.organization ? `
CASE STUDY: ${promptData.organization}` : ''}${sourceModeInstruction}
${promptData.findings ? `RESEARCH FINDINGS DATA: ${typeof promptData.findings === 'object' ? JSON.stringify(promptData.findings) : promptData.findings}

## CHAPTER 4 — RESULTS & ANALYSIS
You are writing Chapter 4 (Results/Analysis). The findings data above contains survey responses and key results. Reference specific numbers and statistics. Present findings in past tense.` : ''}
${promptData.childrenTopics?.length > 0 ? `
## SUB-TOPICS TO COVER
Include each of the following as subheadings within this section:

${promptData.childrenTopics.map((t, i) => `${i + 1}. ${t}`).join('\n')}
` : ''}${wordBudgetInstruction(budget, promptData.childrenTopics)}
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

Write the complete content now.${budget ? `

REMINDER: this section must be ${budget.min}-${budget.max} words (aim about ${budget.max}). Do not finish until you have written at least ${budget.min} words.` : ''}`;

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

    let sourceModeInstruction = buildCitationInstruction(promptData.userSources, 'each subsection', promptData.referenceStyle);

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
Check: Does every paragraph carry at least one (Author, Year) or [CITATION:...] marker? Uncited paragraphs are a plagiarism risk.
Fix: Preserve every existing citation exactly as written. If a paragraph has no citation at all, add a real, verifiable one from Google Search Grounding. Never invent an author, year, or publication.

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

export const applyFeedbackToContent = async (currentContent, feedback, subsectionTitle, project, userSources = null) => {
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

    let sourceModeInstruction = buildCitationInstruction(userSources, 'the subsection', project?.referenceStyle);

    // Whether the student supplied literature, decided from the library rather
    // than from a stored mode. A rewrite must not silently drop citations the
    // original text already had just because no sources were uploaded.
    const hasUserSources = (userSources?.length || 0) > 0;

    const prompt = `You are an expert academic editor carrying out your supervisor's explicit revision instructions on a thesis subsection. Your ONLY task is to produce text that satisfies the feedback below. You are not reviewing, not suggesting, and not deciding whether the feedback is a good idea. You implement it.

SUBSECTION: ${subsectionTitle}
THESIS TITLE: "${project?.title}"
${project?.topic ? `RESEARCH QUESTION: "${project.topic}"` : ''}
FIELD: ${project?.field || 'Not specified'}

## THE STUDENT'S EXACT REQUEST
${feedback.text ? `"${feedback.text}"` : 'See the uploaded files below — apply the corrections they show.'}${filesInstruction}

The request above is a command, not a suggestion. It is the single source of truth for what this subsection must become.

## CURRENT TEXT (to be revised)
${cleanOutput(currentContent)}${sourceModeInstruction}

## COMPLIANCE REQUIREMENTS

### 1. THE REQUEST IS BINDING
- Carry out every element of the request. If it asks for a rewrite, REWRITE. If it asks for expansion, EXPAND. If it asks to add paragraphs, ADD THEM. If it asks to remove something, REMOVE IT.
- If the request specifies a quantity ("add three paragraphs", "make it twice as long", "shorten this by half"), hit that quantity precisely. Verify by counting before you return.
- If the request changes tone, register, structure, argument, evidence, or emphasis, make that change throughout. Do not apply it to one sentence and leave the rest untouched.
- Do NOT second-guess the request, soften it, or substitute a smaller change you think is more appropriate.
- Do NOT reply with a plan, a summary, or a note about what you changed. Output the revised text itself.
- If the request conflicts with any preservation rule below, THE REQUEST WINS. Preserve nothing that the request told you to change.

### 2. CITATION INTEGRITY
- PRESERVE every existing in-text citation exactly as written. Never delete, reword, or renumber an (Author, Year) citation.
- PRESERVE [CITATION:...] markers exactly as they appear.
- ${hasUserSources
      ? 'Work the student\'s own sources into the text, and where they support the arguments, cite them alongside the existing citations.'
      : 'Where the existing text is under-supported, strengthen it with further grounded citations from real published work, in the same author-date form.'}
- Any citation you add must be one you are confident actually exists and actually says what you attribute to it.

### 3. PRESERVE WHAT THE REQUEST DID NOT ASK YOU TO CHANGE
- Keep ALL subsection headings exactly as they are.
- Keep ALL existing tables, figures, [CHART:{...}] tags, numbers, and statistics intact and accurate.
- Keep the scholarly register: formal third person, no contractions, no em dashes, no rhetorical questions.
- Do not drift into a neighbouring subsection or introduce unrelated topics, UNLESS the request asks for exactly that.
- If the request is genuinely broad ("improve this", "make it better"), apply your best judgement to raise clarity, coherence, specificity, and academic quality without padding.

### 4. OUTPUT FORMAT
- Return ONLY the complete revised text for this subsection.
- No preamble, no closing remarks, no meta-commentary, no bracketed annotations.
- No markdown headings (###, ##) and no HTML tags.
- Plain text only.

## FINAL CHECK BEFORE YOU RETURN
Confirm all four of these, silently, then output the text only:
1. Did I do literally what the request asked, in full?
2. If the request named a number of paragraphs, sentences, or words, did I match it?
3. Is every paragraph still supported by an in-text citation where one was present?
4. Are all headings, tables, and statistics from the original still present and correct?`;
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
    1: `LEVEL 1 — REWRITE THIS TEXT TO SOUND LIKE A REAL PERSON WROTE IT
Rewrite the text below following these specific techniques:

VARY SENTENCE LENGTHS DRAMATICALLY: Follow a long sentence (25-40 words) with a very short one (5-10 words). Never let three consecutive sentences have similar lengths. This creates a natural human rhythm.

PREFER ACTIVE VOICE: Write "the data show" instead of "it is shown by the data." Write "students lack knowledge" instead of "a lack of knowledge is observed among students."

USE PLAIN VOCABULARY: Choose the simplest word that works — "use" over "utilize," "show" over "demonstrate," "change" over "transform," "help" over "facilitate," "start" over "commence," "need" over "require," "get" over "obtain."

REDUCE COMPLEX NOUNS: Avoid words ending in -tion, -sion, -ment, -ness, -ity, -ance, -ence. Prefer verb forms: say "deciding" instead of "decision-making," "managing" instead of "management," "investigating" instead of "investigation," "educating" instead of "education," "improving" instead of "improvement."

NO CONTRACTIONS: Write out all words fully (do not, will not, cannot, it is, they are).

KEEP ALL CITATIONS AND DATA EXACTLY AS WRITTEN.`,

    2: `LEVEL 2 — REWRITE THIS TEXT TO SOUND COMPLETELY HUMAN
Apply everything from Level 1 more aggressively, plus:

MAXIMUM SENTENCE VARIETY: Create wild swings in sentence length — alternate 4-word sentences with 35-word sentences. Short punchy statements followed by long flowing explanations. No two adjacent sentences should feel rhythmically similar.

PURE ACTIVE VOICE: Every sentence should have a clear subject doing an action. Eliminate all passive constructions. Instead of "it was found that," write "the study found." Instead of "it is believed that," write "researchers believe."

SIMPLEST POSSIBLE ENGLISH: Replace every long word with a short one. Turn nouns into verbs. Instead of "the implementation of the program," write "putting the program into practice." Instead of "the management of finances," write "managing money." Instead of "the investigation revealed," write "the researcher found." Instead of "an examination of the data," write "looking at the data."

MINIMIZE NOMINALIZATIONS: Eliminate nearly all -tion, -sion, -ment, -ness, -ity, -ance, -ence words. Replace "analysis" with "analyzing," "education" with "teaching and learning," "observation" with "what researchers saw."

NO CONTRACTIONS. KEEP ALL CITATIONS AND DATA EXACTLY AS WRITTEN.`,

    3: `LEVEL 3 — REWRITE THIS TEXT TO PASS AS 100% HUMAN-WRITTEN
Apply everything from Levels 1 and 2 at maximum intensity, plus:

EXTREME BURSTINESS: Make sentence lengths unpredictable. Use 3-word sentences and 40-word sentences in the same paragraph. Let some paragraphs have one short sentence followed by a long one. Let others build gradually. Every paragraph should feel rhythmically unique.

COMPLETE ACTIVE VOICE: Zero passive constructions. Every sentence is a subject doing an action. Read every sentence back — if you see "is," "are," "was," "were," "been," or "being" followed by a past participle, rewrite the sentence.

SIMPLEST ENGLISH POSSIBLE: Write as if explaining this topic to a high school student who is smart but new to the subject. Use the most basic words. "Helps," "shows," "gives," "finds," "uses," "needs," "has," "does," "makes," "changes," "takes," "puts," "gets," "looks at" — these should be your core vocabulary.

NEAR-ZERO NOMINALIZATIONS: Replace every complex noun with a verb phrase. "Conducting an investigation" → "investigating." "The management of financial resources" → "managing money." "The implementation of strategies" → "putting plans into action." "The collection of data" → "gathering information."

NO CONTRACTIONS. KEEP ALL CITATIONS AND DATA EXACTLY AS WRITTEN.`
  };

  const referenceExamples = `
## REFERENCE — HUMAN THESIS EXCERPTS (SCORED 0% AI)
These passages show the natural rhythm and simple vocabulary you should aim for:

"Financial literacy has emerged as one of the essential life skills that an individual can acquire in the present-day world. Indeed, in each and every day of their lives, people are expected to make decisions regarding money whether it comes to how to budget for daily expenses, save for tuition or even apply for a loan in either a banking institution or mobile money platform. Though small on their own, such decisions can have a huge impact when accumulated."

"This confidence is termed as financial self-efficacy, and empirical research indicates that it is a reliable predictor of sound financial behavior among young people (Sun & Chen, 2024). For instance, the student who has the confidence that he or she is able to follow the budget will be much more likely to plan and observe the budget compared to the student who does not believe that he or she has the ability to do that."

Key patterns in these examples:
- Sentence lengths swing naturally: short ("Though small on their own..."), long ("For instance, the student who...")
- Active phrasing: "research indicates," "the student... will be much more likely"
- Simple vocabulary carries the meaning without help from complex words
- Transitions like "Indeed" and "For instance" are used naturally, not overused`;

  const structuralRules = `
## RULES
- No contractions (do not, will not, cannot, it is, they are)
- Keep ALL in-text citations (Author, Year) exactly as written
- Keep ALL data, tables, [CHART:{...}] tags, and diagrams unchanged
- Keep ALL subsection headings exactly as they appear
- No markdown headings, no HTML tags

Return ONLY the rewritten text. No explanations.`;

  return `
You are a skilled writer. Your task is to rewrite thesis text so it reads like a human wrote it.

## THESIS CONTEXT
TITLE: "${topic}"
FIELD: ${field}
CHAPTER: ${chapter}
SUBSECTION: ${subsection}

## TEXT TO REWRITE
${text}

## INSTRUCTIONS
${levelInstructions[humaniseLevel] || levelInstructions[1]}
${referenceExamples}
${structuralRules}`;
};

export const humaniseContent = async (text, promptData = null, humaniseLevel = 1) => {
  try {
    const temps = { 1: 0.9, 2: 1.0, 3: 1.1 };
    const model = genAI.getGenerativeModel({
      model: MODEL,
      generationConfig: { temperature: temps[humaniseLevel] || 0.9, topP: 0.95 }
    });
    const prompt = buildHumanisePrompt(text, promptData, humaniseLevel);
    const result = await model.generateContent(prompt);
    let humanised = cleanOutput(result.response.text());
    if (!humanised || humanised.trim().length < 50) return text;
    return humanised;
  } catch (error) { console.error('Error humanising:', error); throw error; }
};

export const generateReferences = async (citations, style, userSources = null) => {
  try {
    // Grounding is enabled here for the same reason it is on the writing model:
    // a reference list assembled from recalled publication details produces
    // plausible-looking but wrong volume and page numbers. The model can look
    // the work up instead.
    const model = genAI.getGenerativeModel({
      model: MODEL,
      tools: [{ googleSearch: {} }],
    });
    const styleGuide = style === 'apa'
      ? 'APA 7th edition: Author, A. A. (Year). Title of work. Source/Publisher. DOI or URL if available.'
      : style === 'mla'
      ? 'MLA 9th edition: Author Last, First. Title of Work. Publisher, Year.'
      : 'Chicago: Author Last, First. Year. Title of Work. Publisher.';

    let userSourcesSection = '';
    if (userSources?.length > 0) {
      userSourcesSection = `
## THE STUDENT'S LITERATURE
These are the papers this student collected. Where an in-text citation matches
one of them by author and year, this is the authoritative record of the work —
use it in preference to anything you might recall.

${describeUserSources(userSources)}

Match on author and year. Include journal, DOI and link where they appear above.`;
    }

    const prompt = `You are an expert academic reference librarian. Given in-text citations from a thesis, produce a properly formatted reference list.

IN-TEXT CITATIONS (extracted from thesis content):
${citations.map(c => `- ${c}`).join('\n')}

REFERENCE STYLE: ${style.toUpperCase()}
STYLE GUIDE: ${styleGuide}
${userSourcesSection}

## CRITICAL RULES

### NO ANNOTATIONS WHATSOEVER
- Output the reference entries themselves. No preamble, no commentary, no notes about how you assembled the list.
- Every entry should read as a finished, professional reference.

### PRODUCE A REFERENCE FOR EVERY CITATION
- You MUST produce a formatted reference entry for EVERY citation in the list above. Do not skip any.
- Establish the publication details for each work: use the student's own metadata above where it matches, and otherwise use Google Search Grounding to confirm the title, journal, volume, pages and DOI/URL.
- Do not rely on recollection for volume, issue or page numbers. Look them up, or omit the detail you cannot confirm rather than guess at it — an entry that is correct as far as it goes is better than one padded with invented numbers.
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
