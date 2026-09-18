import{genAI as f,MODEL as E}from"./config-ZRg6eLvn.js";import{getWordCountPreset as q}from"./config-ZRg6eLvn.js";import{c as T,b as R}from"./sourceExtractor-CdYfTMU0.js";import{e as _,g as Z}from"./sourceExtractor-CdYfTMU0.js";import{r as O}from"./instruments-C2dgth3O.js";import{a as Q,g as ee,b as te,c as ne,d as re,e as oe,f as ae,h as ie}from"./instruments-C2dgth3O.js";import"./mermaid-DnMQf98b.js";import"./react-vendor-BS-ySqmm.js";const L=async e=>{try{const t=f.getGenerativeModel({model:E,tools:[{googleSearch:{}}]});let n="",r=[];if(e.referenceData){if(e.referenceData.type==="combined"){const u=e.referenceData.text||"",g=(e.referenceData.files||[]).filter(l=>l.content?.startsWith("data:image/"));g.length>0?(r=g.map(l=>{const d=l.content.match(/^data:(image\/\w+);base64,(.+)$/);return d?{inlineData:{mimeType:d[1],data:d[2]}}:null}).filter(Boolean),n=`
The user has uploaded ${g.length} screenshot(s) showing their desired chapter structure, along with pasted text.

PASTED TEXT:
${u}

CRITICAL: Examine ALL images AND the pasted text carefully. Extract:
1. EVERY heading and sub-heading with exact numbering (2.1, 2.1.1, etc.)
2. The HIERARCHY and DEPTH of subsections
3. Where DIAGRAMS, TABLES, and FIGURES are placed
4. The overall FLOW and ORGANIZATION
5. The EXACT NUMBER of sections

Generate subtopics that MIRROR this structure EXACTLY for: "${e.topic}". DO NOT add or remove sections. Match precisely.`):n=`
UPLOADED REFERENCE TEXT:
${u}

CRITICAL: Extract ONLY the structure:
1. EVERY heading with exact numbering
2. HIERARCHY and DEPTH
3. Where visuals are mentioned/placed
4. EXACT NUMBER of sections

IGNORE the actual content words. Generate subtopics matching this EXACT structure for: "${e.topic}".`}else if(e.referenceData.type==="file")if(e.referenceData.content?.startsWith("data:image/")){const o=e.referenceData.content.match(/^data:(image\/\w+);base64,(.+)$/);o&&(r=[{inlineData:{mimeType:o[1],data:o[2]}}]),n=`
The user has uploaded an IMAGE showing their desired chapter structure. Examine the image CAREFULLY. Extract ALL:
1. Headings and sub-headings with exact numbering (2.1, 2.1.1, 3.0)
2. HIERARCHY and DEPTH of subsections
3. Where DIAGRAMS, TABLES, and FIGURES are placed
4. Overall FLOW and ORGANIZATION
5. EXACT NUMBER of sections

Generate subtopics that MIRROR this structure EXACTLY for: "${e.topic}".`}else n=`
UPLOADED TEXT:
${e.referenceData.content||""}

Extract ONLY the structure (headings, numbering, hierarchy, visual placements). IGNORE the content. Match the structure EXACTLY for: "${e.topic}".`;else if(e.referenceData.type==="files"){const o=(e.referenceData.files||[]).filter(g=>g.content?.startsWith("data:image/"));r=o.map(g=>{const l=g.content.match(/^data:(image\/\w+);base64,(.+)$/);return l?{inlineData:{mimeType:l[1],data:l[2]}}:null}).filter(Boolean),n=`
The user has uploaded ${o.length} screenshot(s). Examine ALL images. Extract the complete structure: headings, numbering, hierarchy, visual placements, section count. Mirror EXACTLY for: "${e.topic}".`}else if(e.referenceData.content){if(e.referenceData.content?.startsWith("data:image/")){const o=e.referenceData.content.match(/^data:(image\/\w+);base64,(.+)$/);o&&(r=[{inlineData:{mimeType:o[1],data:o[2]}}])}n=`
UPLOADED REFERENCE:
${e.referenceData.content}

CRITICAL: Extract ONLY the structure (headings, numbering, hierarchy, visual placements, section count). IGNORE the content words. Match EXACTLY for: "${e.topic}". DO NOT add or remove sections.`}}const a=`You are an expert academic advisor helping a ${e.level} student structure their thesis.

THESIS TITLE: "${e.topic}"
${e.researchTopic?`RESEARCH QUESTION: "${e.researchTopic}"`:""}
FIELD: ${e.field}
METHODOLOGY: ${e.methodology||"Not specified"} — subtopics must align with this methodology
CHAPTER: ${e.chapterTitle}${e.referenceData?`
`+n:""}

${e.referenceData?"CRITICAL: Return ONLY a JSON array matching the EXACT structure, numbering, and count from the reference. Include ALL subsections at ALL levels.":"Generate 8-12 appropriate subsections with proper academic numbering. Return ONLY a JSON array."}

DO NOT include "References" as a subsection.

Example: ["2.0 Introduction", "2.1 Theoretical Framework", "2.1.1 Key Theory", "2.2 Empirical Review", "2.3 Summary"]`;let s=r.length>0?[...r,{text:a}]:[{text:a}];const h=(await t.generateContent({contents:[{role:"user",parts:s}]})).response.text();return R(h)}catch(t){return console.error("Error generating subtopics:",t),null}},$=async e=>{try{const t=f.getGenerativeModel({model:E,tools:[{googleSearch:{}}],generationConfig:{temperature:.7,topP:.85}}),n="";let r="";e.sourceMode==="user-only"&&e.userSources?.length>0?r=`
## USER-PROVIDED SOURCES (MANDATORY)
The student has uploaded the following papers. These are the ONLY sources you may cite.
${JSON.stringify(e.userSources.map(d=>({title:d.title,authors:d.authors,year:d.year,methodology:d.methodology,keyFindings:d.keyFindings,theoreticalFramework:d.theoreticalFramework})),null,2).substring(0,15e3)}

### USER SOURCE RULES
- For EACH paper listed above, use Google Search Grounding to find the ACTUAL publication, read its content, and cite specific findings from it.
- You MUST find and cite from the REAL published paper — not just the title and authors listed here.
- If Google Search Grounding cannot find a specific paper after trying, do NOT cite it.
- At least 2 different sources must be cited across the subsection.
- When discussing a concept or finding, reference the specific source: (Author, Year).
- Do NOT fabricate any citation. If you cannot find a real source for a claim, make the argument without a citation.`:e.sourceMode==="combine"&&e.userSources?.length>0&&(r=`
## USER-PROVIDED SOURCES (PRIORITY)
The student has uploaded the following papers. PRIORITIZE these sources for citations.
${JSON.stringify(e.userSources.map(d=>({title:d.title,authors:d.authors,year:d.year,methodology:d.methodology,keyFindings:d.keyFindings,theoreticalFramework:d.theoreticalFramework})),null,2).substring(0,15e3)}

### COMBINED SOURCE RULES
- Use Google Search Grounding to find the ACTUAL publications for the user's papers, read them, and cite specific findings.
- Supplement with additional sources found via Google Search Grounding where user sources do not provide sufficient coverage.
- At least 60% of citations should come from the user's papers.
- If Google cannot find a specific user paper, you may cite it using its listed title and authors as a last resort.`);const a=`You are a PhD candidate writing a formal academic thesis section. Write at a professional academic level — clear, authoritative, and naturally scholarly.
${e.thesisContext?`
## THESIS CONTEXT — PREVIOUS CHAPTERS
Earlier chapters have already established the following. Maintain consistency:
${e.thesisContext.previousChapters.map(l=>`### ${l.title}
${l.summary}`).join(`

`)}
- Use the same terminology and variable names.
- Reference earlier findings with phrases like "as discussed in Chapter X."
- Do not redefine terms already defined.`:""}
THESIS TITLE: "${e.topic}"
${e.researchTopic?`RESEARCH QUESTION: "${e.researchTopic}"`:""}
FIELD: ${e.field||"Not specified"}
CHAPTER: ${e.chapter}
SUBSECTION: ${e.subsection}
METHODOLOGY: ${e.methodology||"mixed methods"}${e.organization?`
CASE STUDY: ${e.organization}`:""}${r}
${e.findings?`RESEARCH FINDINGS DATA: ${typeof e.findings=="object"?JSON.stringify(e.findings):e.findings}

## CHAPTER 4 — RESULTS & ANALYSIS
You are writing Chapter 4 (Results/Analysis). The findings data above contains survey responses and key results. Reference specific numbers and statistics. Present findings in past tense.`:""}
${e.childrenTopics?.length>0?`
## SUB-TOPICS TO COVER
Include each of the following as subheadings within this section:

${e.childrenTopics.map((l,d)=>`${d+1}. ${l}`).join(`
`)}
`:""}
${e.guidelines?`
## CHAPTER-SPECIFIC GUIDELINES
${e.guidelines}
`:""}

## VISUALS (optional reference)
If you include a table, chart, or framework diagram, the system will automatically render it. These formats are available:

- **Tables:** standard markdown table syntax
- **Charts:** [CHART: type | Title | Label1: value, Label2: value, ...] (types: bar, line, pie, horizontalBar)
- **Frameworks:** [FRAMEWORK: Title
  Independent: ...
  Dependent: ...
  H1: ...
]
- **Hierarchies:** [FRAMEWORK: Title
  Hierarchy: Parent → Child
]

Do not use code fences or ASCII art for visuals.

Write the complete content now.`,s=await t.generateContent(a),c=s.response.text(),h=s.response.candidates;let u=[],o=!1;return h&&h[0]?.groundingMetadata?.groundingChunks&&(u=h[0].groundingMetadata.groundingChunks.filter(l=>l.web).map(l=>({title:l.web.title||"",uri:l.web.uri||""})),o=u.length>0),{text:T(c),sources:u,groundingUsed:o}}catch(t){throw console.error("Error generating academic content:",t),t}},x=async e=>{try{const t=f.getGenerativeModel({model:E,tools:[{googleSearch:{}}],generationConfig:{temperature:.7,topP:.85,maxOutputTokens:64e3}});let n="";e.sourceMode==="user-only"&&e.userSources?.length>0?n=`
## USER-PROVIDED SOURCES (MANDATORY)
The student has uploaded the following papers. These are the ONLY sources you may cite.
${JSON.stringify(e.userSources.map(i=>({title:i.title,authors:i.authors,year:i.year,methodology:i.methodology,keyFindings:i.keyFindings,theoreticalFramework:i.theoreticalFramework})),null,2).substring(0,15e3)}

### USER SOURCE RULES
- For EACH paper listed above, use Google Search Grounding to find the ACTUAL publication, read its content, and cite specific findings from it.
- You MUST find and cite from the REAL published paper.
- If Google Search Grounding cannot find a specific paper, do NOT cite it.
- At least 2 different sources must be cited across each subsection.
- Reference sources specifically within each subsection: (Author, Year).`:e.sourceMode==="combine"&&e.userSources?.length>0&&(n=`
## USER-PROVIDED SOURCES (PRIORITY)
The student has uploaded the following papers. PRIORITIZE these sources for citations.
${JSON.stringify(e.userSources.map(i=>({title:i.title,authors:i.authors,year:i.year,methodology:i.methodology,keyFindings:i.keyFindings,theoreticalFramework:i.theoreticalFramework})),null,2).substring(0,15e3)}

### COMBINED SOURCE RULES
- Use Google Search Grounding to find the ACTUAL publications for the user's papers.
- Supplement with additional sources found via Google Search Grounding where needed.
- At least 60% of citations should come from the user's papers.`);const r=e.subsections.map((m,i)=>{const y=(m.children||[]).map(p=>`    - ${p.title}`).join(`
`);return`  ${i+1}. [ID: ${m.id}] ${m.title}${y?`
`+y:""}`}).join(`
`),a=e.findings?`RESEARCH FINDINGS DATA: ${typeof e.findings=="object"?JSON.stringify(e.findings):e.findings}

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
- Every paragraph should connect to a specific finding from the data.`:"",s=e.subsections.map((m,i)=>`[WRITE_SUBSECTION: ${m.id}]
${m.title}
[/WRITE_SUBSECTION]`).join(`

`),c=`You are a human PhD candidate writing a formal academic thesis chapter. Write at a professional academic level — clear, authoritative, and naturally scholarly.
${e.thesisContext?`
## THESIS CONTEXT — PREVIOUS CHAPTERS
Earlier chapters have already established the following. Maintain consistency in terminology, arguments, and references:
${e.thesisContext.previousChapters.map(m=>`### ${m.title}
${m.summary}`).join(`

`)}

- Use the same terminology and variable names from earlier chapters.
- Reference earlier findings with phrases like "as discussed in Chapter X."
- Do not redefine terms already defined.`:""}
THESIS TITLE: "${e.topic}"
${e.researchTopic?`RESEARCH QUESTION: "${e.researchTopic}"`:""}
FIELD: ${e.field||"Not specified"}
CHAPTER: ${e.chapter}
METHODOLOGY: ${e.methodology||"mixed methods"}${e.organization?`
CASE STUDY: ${e.organization}`:""}${n}
${a}

## SUBSECTIONS TO WRITE
Write the entire chapter one subsection at a time, in the order listed below:

${r}

${e.guidelines?`
## CHAPTER-SPECIFIC GUIDELINES
${e.guidelines}
`:""}

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
- **Frameworks:** [FRAMEWORK: Title
  Independent: ...
  Dependent: ...
  H1: ...
]
- **Hierarchies:** [FRAMEWORK: Title
  Hierarchy: Parent → Child
]

Do not use code fences or ASCII art for visuals.

Write the complete chapter now.`,h=await t.generateContent(c),u=h.response.text(),o=h.response.candidates;let g=[],l=!1;return o&&o[0]?.groundingMetadata?.groundingChunks&&(g=o[0].groundingMetadata.groundingChunks.filter(m=>m.web).map(m=>({title:m.web.title||"",uri:m.web.uri||""})),l=g.length>0),{text:T(u),sources:g,groundingUsed:l}}catch(t){throw console.error("Error generating chapter content:",t),t}},U=async(e,t)=>{try{const n=f.getGenerativeModel({model:E,tools:[{googleSearch:{}}],generationConfig:{temperature:.5,topP:.85}}),r=t?.extraInstruction?`

## ADDITIONAL INSTRUCTION
${t.extraInstruction}`:"",a=`You are a senior academic editor performing a quality review on AI-generated thesis content. Your task: identify all detectable AI writing patterns and rewrite the text so it is COMPLETELY INDISTINGUISHABLE from human academic writing.

ORIGINAL TEXT (AI-generated):
${e}

THESIS TITLE: "${t?.topic||"thesis"}"
${t?.researchTopic?`RESEARCH QUESTION: "${t.researchTopic}"`:""}
FIELD: ${t?.field||"Not specified"}
CHAPTER: ${t?.chapter||"N/A"}
SUBSECTION: ${t?.subsection||"N/A"}${r}

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
- Return ONLY the rewritten text. No explanations, no annotations, no meta-commentary.`,s=await n.generateContent(a);return T(s.response.text())}catch(n){return console.error("Error in self-review:",n),e}},k=async(e,t,n,r,a=null,s="ai-only")=>{try{const c=f.getGenerativeModel({model:E,tools:[{googleSearch:{}}]});let h="",u=[];if(t.files?.length){const m=t.files.filter(p=>p.type==="image"&&p.content),i=t.files.filter(p=>p.type!=="image");u=m.map(p=>{const I=p.content.match(/^data:(image\/\w+);base64,(.+)$/);return I?{inlineData:{mimeType:I[1],data:I[2]}}:null}).filter(Boolean);const y=t.files.map(p=>p.name).join(", ");h=`
Uploaded ${t.files.length} file(s): ${y}.`,i.length>0&&i.forEach(p=>{p.extractedText&&(h+=`
Content from ${p.name}: ${p.extractedText.substring(0,3e3)}`)})}let o="";s==="user-only"&&a?.length>0?o=`
## USER-PROVIDED SOURCES (MANDATORY)
The student has uploaded the following papers. These are the ONLY sources you may cite.
${JSON.stringify(a.map(i=>({title:i.title,authors:i.authors,year:i.year,methodology:i.methodology,keyFindings:i.keyFindings,theoreticalFramework:i.theoreticalFramework})),null,2).substring(0,15e3)}

### USER SOURCE RULES
- For EACH paper listed above, use Google Search Grounding to find the ACTUAL publication, read its content, and cite specific findings from it.
- You MUST find and cite from the REAL published paper — not just the title and authors listed here.
- If Google Search Grounding cannot find a specific paper after trying, do NOT cite it.
- At least 2 different sources must be cited across the subsection.
- When discussing a concept or finding, reference the specific source: (Author, Year).
- Do NOT fabricate any citation. If you cannot find a real source for a claim, make the argument without a citation.`:s==="combine"&&a?.length>0&&(o=`
## USER-PROVIDED SOURCES (PRIORITY)
The student has uploaded the following papers. PRIORITIZE these sources for citations.
${JSON.stringify(a.map(i=>({title:i.title,authors:i.authors,year:i.year,methodology:i.methodology,keyFindings:i.keyFindings,theoreticalFramework:i.theoreticalFramework})),null,2).substring(0,15e3)}

### COMBINED SOURCE RULES
- Use Google Search Grounding to find the ACTUAL publications for the user's papers, read them, and cite specific findings.
- Supplement with additional sources found via Google Search Grounding where user sources do not provide sufficient coverage.
- At least 60% of citations should come from the user's papers.
- If Google cannot find a specific user paper, you may cite it using its listed title and authors as a last resort.`);const g=`You are an expert academic editor applying supervisor feedback to a thesis subsection. Address the feedback while preserving academic quality and structural integrity.

SUBSECTION: ${n}
THESIS TITLE: "${r?.title}"
${r?.topic?`RESEARCH QUESTION: "${r.topic}"`:""}
FIELD: ${r?.field}

FEEDBACK TO APPLY:
"${t.text}"${h}

CURRENT TEXT:
${T(e)}${o}

## INSTRUCTION HIERARCHY (highest to lowest priority)

### PRIORITY 1 — USER FEEDBACK (overrides everything else)
- The user's feedback text is the MOST IMPORTANT instruction. Apply it EXACTLY as written.
- If feedback asks to make it longer, MAKE IT LONGER. If it asks for two paragraphs, ADD TWO PARAGRAPHS.
- If feedback asks to rewrite, REWRITE. If it asks to expand, EXPAND.
- Do not second-guess or soften the user's instructions. Do what they say.
- Only if the feedback is vague (e.g., "improve this section") should you use your best judgment for minimal improvements.

### PRIORITY 2 — CITATION INTEGRITY
- ${o?"INTEGRATE user-provided sources into the text using (Author, Year) citations where relevant.":"PRESERVE ALL in-text citations exactly as they appear — do not change, remove, or replace any (Author, Year) markers."}
- PRESERVE [CITATION:...] markers exactly as they appear.
- ${o?"ADD new citations from user-provided sources where they support the arguments.":"DO NOT add new citations that were not in the original text."}
- Ensure every paragraph has at least one in-text citation after editing.

### PRIORITY 3 — STRUCTURAL PRESERVATION
- Keep ALL subsection headings exactly as they are — do not modify heading text.
- Keep ALL existing tables, diagrams, [CHART:{...}] tags, and data intact.
- Do not restructure or reorder paragraphs unless the feedback explicitly requests it.

### PRIORITY 4 — SUBSECTION BOUNDARIES
- Do not add content that belongs in a different subsection.
- Do not introduce new topics or arguments not present in the original text.
- Stay strictly within the scope of "${n}".

### PRIORITY 5 — FORMATTING
- Return ONLY the modified text — no explanations, no annotations, no meta-commentary.
- NO markdown headings (###, ##), NO HTML tags.
- NO word count footnotes.
- NO em dashes.
- Plain text only.

Return ONLY the complete modified text for this subsection.`,l=u.length>0?[...u,{text:g}]:[{text:g}],d=await c.generateContent({contents:[{role:"user",parts:l}]});return T(d.response.text())}catch(c){throw console.error("Error applying feedback:",c),c}},S=(e,t,n)=>{const r=t?.topic||"thesis topic",a=t?.field||"social sciences",s=t?.chapter||"thesis chapter",c=t?.subsection||"subsection",h={1:`LEVEL 1 — REWRITE THIS TEXT TO SOUND LIKE A REAL PERSON WROTE IT
Rewrite the text below following these specific techniques:

VARY SENTENCE LENGTHS DRAMATICALLY: Follow a long sentence (25-40 words) with a very short one (5-10 words). Never let three consecutive sentences have similar lengths. This creates a natural human rhythm.

PREFER ACTIVE VOICE: Write "the data show" instead of "it is shown by the data." Write "students lack knowledge" instead of "a lack of knowledge is observed among students."

USE PLAIN VOCABULARY: Choose the simplest word that works — "use" over "utilize," "show" over "demonstrate," "change" over "transform," "help" over "facilitate," "start" over "commence," "need" over "require," "get" over "obtain."

REDUCE COMPLEX NOUNS: Avoid words ending in -tion, -sion, -ment, -ness, -ity, -ance, -ence. Prefer verb forms: say "deciding" instead of "decision-making," "managing" instead of "management," "investigating" instead of "investigation," "educating" instead of "education," "improving" instead of "improvement."

NO CONTRACTIONS: Write out all words fully (do not, will not, cannot, it is, they are).

KEEP ALL CITATIONS AND DATA EXACTLY AS WRITTEN.`,2:`LEVEL 2 — REWRITE THIS TEXT TO SOUND COMPLETELY HUMAN
Apply everything from Level 1 more aggressively, plus:

MAXIMUM SENTENCE VARIETY: Create wild swings in sentence length — alternate 4-word sentences with 35-word sentences. Short punchy statements followed by long flowing explanations. No two adjacent sentences should feel rhythmically similar.

PURE ACTIVE VOICE: Every sentence should have a clear subject doing an action. Eliminate all passive constructions. Instead of "it was found that," write "the study found." Instead of "it is believed that," write "researchers believe."

SIMPLEST POSSIBLE ENGLISH: Replace every long word with a short one. Turn nouns into verbs. Instead of "the implementation of the program," write "putting the program into practice." Instead of "the management of finances," write "managing money." Instead of "the investigation revealed," write "the researcher found." Instead of "an examination of the data," write "looking at the data."

MINIMIZE NOMINALIZATIONS: Eliminate nearly all -tion, -sion, -ment, -ness, -ity, -ance, -ence words. Replace "analysis" with "analyzing," "education" with "teaching and learning," "observation" with "what researchers saw."

NO CONTRACTIONS. KEEP ALL CITATIONS AND DATA EXACTLY AS WRITTEN.`,3:`LEVEL 3 — REWRITE THIS TEXT TO PASS AS 100% HUMAN-WRITTEN
Apply everything from Levels 1 and 2 at maximum intensity, plus:

EXTREME BURSTINESS: Make sentence lengths unpredictable. Use 3-word sentences and 40-word sentences in the same paragraph. Let some paragraphs have one short sentence followed by a long one. Let others build gradually. Every paragraph should feel rhythmically unique.

COMPLETE ACTIVE VOICE: Zero passive constructions. Every sentence is a subject doing an action. Read every sentence back — if you see "is," "are," "was," "were," "been," or "being" followed by a past participle, rewrite the sentence.

SIMPLEST ENGLISH POSSIBLE: Write as if explaining this topic to a high school student who is smart but new to the subject. Use the most basic words. "Helps," "shows," "gives," "finds," "uses," "needs," "has," "does," "makes," "changes," "takes," "puts," "gets," "looks at" — these should be your core vocabulary.

NEAR-ZERO NOMINALIZATIONS: Replace every complex noun with a verb phrase. "Conducting an investigation" → "investigating." "The management of financial resources" → "managing money." "The implementation of strategies" → "putting plans into action." "The collection of data" → "gathering information."

NO CONTRACTIONS. KEEP ALL CITATIONS AND DATA EXACTLY AS WRITTEN.`};return`
You are a skilled writer. Your task is to rewrite thesis text so it reads like a human wrote it.

## THESIS CONTEXT
TITLE: "${r}"
FIELD: ${a}
CHAPTER: ${s}
SUBSECTION: ${c}

## TEXT TO REWRITE
${e}

## INSTRUCTIONS
${h[n]||h[1]}

## REFERENCE — HUMAN THESIS EXCERPTS (SCORED 0% AI)
These passages show the natural rhythm and simple vocabulary you should aim for:

"Financial literacy has emerged as one of the essential life skills that an individual can acquire in the present-day world. Indeed, in each and every day of their lives, people are expected to make decisions regarding money whether it comes to how to budget for daily expenses, save for tuition or even apply for a loan in either a banking institution or mobile money platform. Though small on their own, such decisions can have a huge impact when accumulated."

"This confidence is termed as financial self-efficacy, and empirical research indicates that it is a reliable predictor of sound financial behavior among young people (Sun & Chen, 2024). For instance, the student who has the confidence that he or she is able to follow the budget will be much more likely to plan and observe the budget compared to the student who does not believe that he or she has the ability to do that."

Key patterns in these examples:
- Sentence lengths swing naturally: short ("Though small on their own..."), long ("For instance, the student who...")
- Active phrasing: "research indicates," "the student... will be much more likely"
- Simple vocabulary carries the meaning without help from complex words
- Transitions like "Indeed" and "For instance" are used naturally, not overused

## RULES
- No contractions (do not, will not, cannot, it is, they are)
- Keep ALL in-text citations (Author, Year) exactly as written
- Keep ALL data, tables, [CHART:{...}] tags, and diagrams unchanged
- Keep ALL subsection headings exactly as they appear
- No markdown headings, no HTML tags

Return ONLY the rewritten text. No explanations.`},M=async(e,t=null,n=1)=>{try{const r={1:.9,2:1,3:1.1},a=f.getGenerativeModel({model:E,generationConfig:{temperature:r[n]||.9,topP:.95}}),s=S(e,t,n),c=await a.generateContent(s);let h=T(c.response.text());return!h||h.trim().length<50?e:h}catch(r){throw console.error("Error humanising:",r),r}},F=async(e,t,n=null,r="ai-only")=>{try{const a=f.getGenerativeModel({model:E}),s=t==="apa"?"APA 7th edition: Author, A. A. (Year). Title of work. Source/Publisher. DOI or URL if available.":t==="mla"?"MLA 9th edition: Author Last, First. Title of Work. Publisher, Year.":"Chicago: Author Last, First. Year. Title of Work. Publisher.";let c="";n?.length>0&&(c=`
## USER-PROVIDED SOURCES
The student has uploaded the following papers. These are REAL sources with verified metadata. Use them to create reference entries when the in-text citations match.
 
${JSON.stringify(n.map(o=>({title:o.title,authors:o.authors,year:o.year,methodology:o.methodology,keyFindings:o.keyFindings,theoreticalFramework:o.theoreticalFramework})),null,2)}
 
### USER SOURCE RULES
- If an in-text citation matches one of these user sources (by author and year), use this metadata to format the reference.
- Format using the standard publication details from your training data, falling back to user-provided metadata when needed.
- When formatting from user metadata, produce a complete reference following the style guide: Author, A. A. (Year). Title. Retrieved from thesis sources.`);const h=`You are an expert academic reference librarian. Given in-text citations from a thesis, produce a properly formatted reference list.

IN-TEXT CITATIONS (extracted from thesis content):
${e.map(o=>`- ${o}`).join(`
`)}

REFERENCE STYLE: ${t.toUpperCase()}
STYLE GUIDE: ${s}
${c}

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
- Format each reference precisely according to the ${t.toUpperCase()} style guide above.
- Return ONLY the reference entries, one per line, sorted alphabetically by the first author's last name.
- NO headings, NO explanations, NO numbering, NO bullet points.
- NO markdown formatting.
- NO empty lines between entries.
- Each entry must be a complete, standalone reference string.

Example (APA):
Smith, J. A. (2023). Understanding organizational behavior in digital transformation. Journal of Management Studies, 60(4), 1123-1145. https://doi.org/10.1111/joms.12901`,u=await a.generateContent(h);return T(u.response.text())}catch(a){throw console.error("Error generating references:",a),a}},b=`IMPORTANT TABLE RULES:
- Use natural markdown table format with header row and separator row
- Header row: | Column 1 | Column 2 | Column 3 |
- Separator row: |----------|----------|----------|
- Data rows: | Value 1 | Value 2 | Value 3 |
- NO brackets, asterisks, or special formatting inside cells
- Keep all cell content as plain text only
- Place ALL interpretation text BELOW the table, never inside it
- Use clear, descriptive column headers
- Tables must contain REAL data — never fabricate numbers

EXAMPLES of appropriate tables:
For Chapter 4: demographic profile tables, descriptive statistics, frequency distributions
For Chapter 2: literature comparison tables, theoretical summary tables
For Chapter 3: methodology summary tables
For Chapter 5: findings summary tables, comparison tables`,P=async e=>{try{const t=f.getGenerativeModel({model:E}),n=`Generate a conceptual framework description for a thesis.

Topic: ${e?.topic||e?.title}
Field: ${e?.field}
Methodology: ${e?.methodology}

Return a structured framework description in this exact format:

Independent: variable1, variable2, variable3
Dependent: outcome variable
Mediating: mediating variable (if any)
Moderating: moderating variable (if any)
H1: IndependentVariable → DependentVariable
H2: IndependentVariable → MediatingVariable → DependentVariable

List ALL variables with their full academic names. Use only the format above, no JSON.`;return(await t.generateContent(n)).response.text().trim()||null}catch(t){return console.error("Error:",t),null}},Y=async e=>{try{const t=f.getGenerativeModel({model:E}),n=`Generate a theoretical framework description for a thesis.

Topic: ${e?.topic||e?.title}
Field: ${e?.field}

Return a structured description:

Theory 1: name and key concepts
Theory 2: name and key concepts
Relationship: how they connect
Application: how they apply to this study`;return(await t.generateContent(n)).response.text().trim()||null}catch(t){return console.error("Error:",t),null}},G=async e=>{try{const t=f.getGenerativeModel({model:E}),n=`Generate a research design description for a thesis.

Topic: ${e?.topic||e?.title}
Methodology: ${e?.methodology||"mixed methods"}

Return a structured description:

Step 1: ...
Step 2: ...
Step 3: ...
Step 4: ...
Step 5: ...

List the key methodological steps in order. Use plain text, no diagrams.`;return(await t.generateContent(n)).response.text().trim()||null}catch(t){return console.error("Error:",t),null}},H=async(e,t,n)=>{try{const r=f.getGenerativeModel({model:E}),a=n?`

REAL RESEARCH FINDINGS:
${JSON.stringify(n).substring(0,2e4)}`:"",s=`Generate realistic data for a results table.

Topic: ${t?.topic||t?.title}
Subsection: ${e}
Methodology: ${t?.methodology||"quantitative"}${a}

${b}

Return a markdown table with 4-6 rows of realistic data based on the research findings provided. Use proper column headers and realistic values.`;return(await r.generateContent(s)).response.text().trim()}catch(r){return console.error("Error:",r),null}},D=async(e,t,n,r)=>{try{const a=f.getGenerativeModel({model:E}),s=r?`

REAL RESEARCH FINDINGS:
${JSON.stringify(r).substring(0,2e4)}`:"",c=`Generate data for a ${e} chart.

Topic: ${n?.topic||n?.title}
Subsection: ${t}${s}

Return in this exact format:
[CHART: ${e} | Chart Title | Label1: value, Label2: value, Label3: value, ...]

Use REAL data values from the research findings. For pie charts, values should sum to 100.`;return(await a.generateContent(c)).response.text().trim()}catch(a){return console.error("Error:",a),null}},W=async e=>{try{const t=f.getGenerativeModel({model:E}),n=e.chapters||{},r=Object.entries(n);if(r.length===0)return null;const a=r.map(([o,g])=>{const l=g.title||o,d=g.content||"";return`--- ${l} ---
${d||"No content available."}`}).join(`

`),s=`You are a thesis defence expert preparing a student for their viva voce.

THESIS TITLE: "${e.title||""}"
${e.researchTopic?`RESEARCH QUESTION: "${e.researchTopic}"`:""}
FIELD: ${e.field||""}
LEVEL: ${e.level||""}

The student has written the following chapters. Below is the actual content of each completed chapter.

${a}

Based on this content, think of every possible question a panel member could ask about this specific thesis. Cover all areas: rationale, methodology, findings, limitations, theoretical choices, literature gaps, and implications.

For each question, provide ONE clear answer. Write the answer in plain, basic English — as if you are explaining to someone who is new to academic work. Use simple words and short sentences. Do not use jargon unless absolutely necessary, and explain it if you do. The answer should be a moderate length — a few sentences that give the most correct and helpful explanation without being too short or too long.

Return ONLY valid JSON with chapter IDs as keys and arrays of {question, answer} objects. Example:
{"proposal":[{"question":"...","answer":"..."}],"chapter1":[{"question":"...","answer":"..."}]}`,u=(await t.generateContent(s)).response.text().match(/\{[\s\S]*\}/);if(u)try{return JSON.parse(u[0])}catch{}return null}catch(t){return console.error("Error generating defence questions:",t),null}},B=(e,t)=>!e||e.length===0?"":[...new Set(e)].sort().map(r=>{const a=r.split(/[, ]+/),s=a[0]||"Author",c=a[1]||"n.d.";switch(t){case"apa":return`${s}. (${c}). Title of the work. Publisher.`;case"mla":return`${s}. Title of the Work. Publisher, ${c}.`;case"chicago":return`${s}. ${c}. Title of the Work. Publisher.`;case"harvard":return`${s} (${c}). Title of the work. Publisher.`;default:return`${s} (${c})`}}).join(`
`),V=async(e,t)=>{try{const n=f.getGenerativeModel({model:E}),r=e.substring(0,15e3),a=`Extract field-specific abbreviations from this thesis content. Only include abbreviations that are specialized technical terms relevant to the thesis topic or academic field.

PROJECT: "${t}"

CONTENT:
${r}

Return JSON array: [{"abbr":"SEM","meaning":"Structural Equation Modelling"}].

RULES:
- Only include abbreviations that are directly related to the thesis topic or academic field
- EXCLUDE common everyday abbreviations: etc., e.g., i.e., vs., aka, approx, dept, min, max, avg, temp, info, etc.
- EXCLUDE currency codes: GHS, USD, EUR, GBP, etc.
- EXCLUDE standard units: kg, km, cm, mm, mg, ml, etc.
- EXCLUDE common English abbreviations: Mr., Mrs., Dr., St., Ave., etc.
- EXCLUDE very common non-technical terms: number, total, info, etc.
- Focus on abbreviations that a reader of this specific thesis would need defined (e.g., field-specific acronyms, statistical terms, methodology-specific abbreviations)
- Return [] if no abbreviations meeting these criteria are found
- Return ONLY the JSON array, no other text`,s=await n.generateContent(a);return R(s.response.text())||[]}catch(n){return console.error("Error extracting abbreviations:",n),[]}},X=async(e,t)=>{try{const n=f.getGenerativeModel({model:E});let r="";Object.entries(t||{}).forEach(([u,o])=>{!o||typeof o!="object"||(r+=`
--- ${u} ---
`,Object.values(o).forEach(g=>{typeof g=="string"&&(r+=g.substring(0,3e3)+`
`)}))});const a=r.substring(0,5e4),s=`You are writing the abstract for an academic thesis.

THESIS TITLE: "${e?.title||""}"
${e?.topic?`RESEARCH QUESTION: "${e.topic}"`:""}
FIELD: ${e?.field||""}
LEVEL: ${e?.level||""}
METHODOLOGY: ${e?.methodology||""}

Below is the content of the thesis chapters. Read it and write a professional abstract.

THESIS CONTENT:
${a}

Write a concise academic abstract (200-350 words) that covers:
- Background and rationale for the study
- Research objectives or questions
- Methodology used
- Key findings and results
- Conclusions and implications

Use formal academic language in a single cohesive paragraph. Do not include headings, labels, or bracketed instructions. Return ONLY the abstract text.`;return(await n.generateContent(s)).response.text().trim()||null}catch(n){return console.error("Error generating abstract:",n),null}};export{Q as analyzeTranscriptText,k as applyFeedbackToContent,V as extractAbbreviations,_ as extractPaperMetadata,B as formatReferences,X as generateAbstract,$ as generateAcademicContent,ee as generateCaseStudyProtocol,x as generateChapterContent,D as generateChartData,P as generateConceptualFramework,H as generateDataTable,W as generateDefenceQuestions,te as generateDocumentAnalysisTemplate,ne as generateFocusGroupProtocol,re as generateInterviewGuide,Z as generateLiteratureMatrix,oe as generateObservationChecklist,ae as generateQuestionnaire,F as generateReferences,G as generateResearchDesignFlowchart,ie as generateSampleData,L as generateSubtopics,Y as generateTheoreticalFramework,q as getWordCountPreset,M as humaniseContent,O as recommendLiteratureReviewType,U as selfReviewContent};
