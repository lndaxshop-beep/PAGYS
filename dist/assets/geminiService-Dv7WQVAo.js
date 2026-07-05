import{genAI as p,MODEL as y}from"./config-ZRg6eLvn.js";import{getWordCountPreset as z}from"./config-ZRg6eLvn.js";import{c as R,b as A}from"./sourceExtractor-CdYfTMU0.js";import{e as ee,g as te}from"./sourceExtractor-CdYfTMU0.js";import{r as $}from"./instruments-C2dgth3O.js";import{a as re,g as oe,b as se,c as ie,d as ae,e as ce,f as le,h as he}from"./instruments-C2dgth3O.js";import"./mermaid-DnMQf98b.js";import"./react-vendor-BS-ySqmm.js";const k=async e=>{try{const t=p.getGenerativeModel({model:y,tools:[{googleSearch:{}}]});let n="",r=[];if(e.referenceData){if(e.referenceData.type==="combined"){const d=e.referenceData.text||"",g=(e.referenceData.files||[]).filter(c=>c.content?.startsWith("data:image/"));g.length>0?(r=g.map(c=>{const h=c.content.match(/^data:(image\/\w+);base64,(.+)$/);return h?{inlineData:{mimeType:h[1],data:h[2]}}:null}).filter(Boolean),n=`
The user has uploaded ${g.length} screenshot(s) showing their desired chapter structure, along with pasted text.

PASTED TEXT:
${d}

CRITICAL: Examine ALL images AND the pasted text carefully. Extract:
1. EVERY heading and sub-heading with exact numbering (2.1, 2.1.1, etc.)
2. The HIERARCHY and DEPTH of subsections
3. Where DIAGRAMS, TABLES, and FIGURES are placed
4. The overall FLOW and ORGANIZATION
5. The EXACT NUMBER of sections

Generate subtopics that MIRROR this structure EXACTLY for: "${e.topic}". DO NOT add or remove sections. Match precisely.`):n=`
UPLOADED REFERENCE TEXT:
${d}

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

Extract ONLY the structure (headings, numbering, hierarchy, visual placements). IGNORE the content. Match the structure EXACTLY for: "${e.topic}".`;else if(e.referenceData.type==="files"){const o=(e.referenceData.files||[]).filter(g=>g.content?.startsWith("data:image/"));r=o.map(g=>{const c=g.content.match(/^data:(image\/\w+);base64,(.+)$/);return c?{inlineData:{mimeType:c[1],data:c[2]}}:null}).filter(Boolean),n=`
The user has uploaded ${o.length} screenshot(s). Examine ALL images. Extract the complete structure: headings, numbering, hierarchy, visual placements, section count. Mirror EXACTLY for: "${e.topic}".`}else if(e.referenceData.content){if(e.referenceData.content?.startsWith("data:image/")){const o=e.referenceData.content.match(/^data:(image\/\w+);base64,(.+)$/);o&&(r=[{inlineData:{mimeType:o[1],data:o[2]}}])}n=`
UPLOADED REFERENCE:
${e.referenceData.content}

CRITICAL: Extract ONLY the structure (headings, numbering, hierarchy, visual placements, section count). IGNORE the content words. Match EXACTLY for: "${e.topic}". DO NOT add or remove sections.`}}const s=`You are an expert academic advisor helping a ${e.level} student structure their thesis.

THESIS TITLE: "${e.topic}"
${e.researchTopic?`RESEARCH QUESTION: "${e.researchTopic}"`:""}
FIELD: ${e.field}
METHODOLOGY: ${e.methodology||"Not specified"} — subtopics must align with this methodology
CHAPTER: ${e.chapterTitle}${e.referenceData?`
`+n:""}

${e.referenceData?"CRITICAL: Return ONLY a JSON array matching the EXACT structure, numbering, and count from the reference. Include ALL subsections at ALL levels.":"Generate 8-12 appropriate subsections with proper academic numbering. Return ONLY a JSON array."}

DO NOT include "References" as a subsection.

Example: ["2.0 Introduction", "2.1 Theoretical Framework", "2.1.1 Key Theory", "2.2 Empirical Review", "2.3 Summary"]`;let a=r.length>0?[...r,{text:s}]:[{text:s}];const u=(await t.generateContent({contents:[{role:"user",parts:a}]})).response.text();return A(u)}catch(t){return console.error("Error generating subtopics:",t),null}},F=async e=>{try{const t=p.getGenerativeModel({model:y,tools:[{googleSearch:{}}],generationConfig:{temperature:.7,topP:.85}}),n="";let r="";e.sourceMode==="user-only"&&e.userSources?.length>0?r=`
## USER-PROVIDED SOURCES (MANDATORY)
The student has uploaded the following papers. These are the ONLY sources you may cite.
${JSON.stringify(e.userSources.map(h=>({title:h.title,authors:h.authors,year:h.year,methodology:h.methodology,keyFindings:h.keyFindings,theoreticalFramework:h.theoreticalFramework})),null,2).substring(0,15e3)}

### USER SOURCE RULES
- For EACH paper listed above, use Google Search Grounding to find the ACTUAL publication, read its content, and cite specific findings from it.
- You MUST find and cite from the REAL published paper — not just the title and authors listed here.
- If Google Search Grounding cannot find a specific paper after trying, do NOT cite it.
- At least 2 different sources must be cited across the subsection.
- When discussing a concept or finding, reference the specific source: (Author, Year).
- Do NOT fabricate any citation. If you cannot find a real source for a claim, make the argument without a citation.`:e.sourceMode==="combine"&&e.userSources?.length>0&&(r=`
## USER-PROVIDED SOURCES (PRIORITY)
The student has uploaded the following papers. PRIORITIZE these sources for citations.
${JSON.stringify(e.userSources.map(h=>({title:h.title,authors:h.authors,year:h.year,methodology:h.methodology,keyFindings:h.keyFindings,theoreticalFramework:h.theoreticalFramework})),null,2).substring(0,15e3)}

### COMBINED SOURCE RULES
- Use Google Search Grounding to find the ACTUAL publications for the user's papers, read them, and cite specific findings.
- Supplement with additional sources found via Google Search Grounding where user sources do not provide sufficient coverage.
- At least 60% of citations should come from the user's papers.
- If Google cannot find a specific user paper, you may cite it using its listed title and authors as a last resort.`);const s=`You are a PhD candidate writing a formal academic thesis section. Write at a professional academic level — clear, authoritative, and naturally scholarly.
${e.thesisContext?`
## THESIS CONTEXT — PREVIOUS CHAPTERS
Earlier chapters have already established the following. Maintain consistency:
${e.thesisContext.previousChapters.map(c=>`### ${c.title}
${c.summary}`).join(`

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

${e.childrenTopics.map((c,h)=>`${h+1}. ${c}`).join(`
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

Write the complete content now.`,a=await t.generateContent(s),l=a.response.text(),u=a.response.candidates;let d=[],o=!1;return u&&u[0]?.groundingMetadata?.groundingChunks&&(d=u[0].groundingMetadata.groundingChunks.filter(c=>c.web).map(c=>({title:c.web.title||"",uri:c.web.uri||""})),o=d.length>0),{text:R(l),sources:d,groundingUsed:o}}catch(t){throw console.error("Error generating academic content:",t),t}},M=async e=>{try{const t=p.getGenerativeModel({model:y,tools:[{googleSearch:{}}],generationConfig:{temperature:.7,topP:.85,maxOutputTokens:64e3}});let n="";e.sourceMode==="user-only"&&e.userSources?.length>0?n=`
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
- At least 60% of citations should come from the user's papers.`);const r=e.subsections.map((m,i)=>{const E=(m.children||[]).map(f=>`    - ${f.title}`).join(`
`);return`  ${i+1}. [ID: ${m.id}] ${m.title}${E?`
`+E:""}`}).join(`
`),s=e.findings?`RESEARCH FINDINGS DATA: ${typeof e.findings=="object"?JSON.stringify(e.findings):e.findings}

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
- Every paragraph should connect to a specific finding from the data.`:"",a=e.subsections.map((m,i)=>`[WRITE_SUBSECTION: ${m.id}]
${m.title}
[/WRITE_SUBSECTION]`).join(`

`),l=`You are a human PhD candidate writing a formal academic thesis chapter. Write at a professional academic level — clear, authoritative, and naturally scholarly.
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
${s}

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

Write the complete chapter now.`,u=await t.generateContent(l),d=u.response.text(),o=u.response.candidates;let g=[],c=!1;return o&&o[0]?.groundingMetadata?.groundingChunks&&(g=o[0].groundingMetadata.groundingChunks.filter(m=>m.web).map(m=>({title:m.web.title||"",uri:m.web.uri||""})),c=g.length>0),{text:R(d),sources:g,groundingUsed:c}}catch(t){throw console.error("Error generating chapter content:",t),t}},P=async(e,t)=>{try{const n=p.getGenerativeModel({model:y,tools:[{googleSearch:{}}],generationConfig:{temperature:.5,topP:.85}}),r=t?.extraInstruction?`

## ADDITIONAL INSTRUCTION
${t.extraInstruction}`:"",s=`You are a senior academic editor performing a quality review on AI-generated thesis content. Your task: identify all detectable AI writing patterns and rewrite the text so it is COMPLETELY INDISTINGUISHABLE from human academic writing.

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
- Return ONLY the rewritten text. No explanations, no annotations, no meta-commentary.`,a=await n.generateContent(s);return R(a.response.text())}catch(n){return console.error("Error in self-review:",n),e}},G=async(e,t,n,r,s=null,a="ai-only")=>{try{const l=p.getGenerativeModel({model:y,tools:[{googleSearch:{}}]});let u="",d=[];if(t.files?.length){const m=t.files.filter(f=>f.type==="image"&&f.content),i=t.files.filter(f=>f.type!=="image");d=m.map(f=>{const T=f.content.match(/^data:(image\/\w+);base64,(.+)$/);return T?{inlineData:{mimeType:T[1],data:T[2]}}:null}).filter(Boolean);const E=t.files.map(f=>f.name).join(", ");u=`
Uploaded ${t.files.length} file(s): ${E}.`,i.length>0&&i.forEach(f=>{f.extractedText&&(u+=`
Content from ${f.name}: ${f.extractedText.substring(0,3e3)}`)})}let o="";a==="user-only"&&s?.length>0?o=`
## USER-PROVIDED SOURCES (MANDATORY)
The student has uploaded the following papers. These are the ONLY sources you may cite.
${JSON.stringify(s.map(i=>({title:i.title,authors:i.authors,year:i.year,methodology:i.methodology,keyFindings:i.keyFindings,theoreticalFramework:i.theoreticalFramework})),null,2).substring(0,15e3)}

### USER SOURCE RULES
- For EACH paper listed above, use Google Search Grounding to find the ACTUAL publication, read its content, and cite specific findings from it.
- You MUST find and cite from the REAL published paper — not just the title and authors listed here.
- If Google Search Grounding cannot find a specific paper after trying, do NOT cite it.
- At least 2 different sources must be cited across the subsection.
- When discussing a concept or finding, reference the specific source: (Author, Year).
- Do NOT fabricate any citation. If you cannot find a real source for a claim, make the argument without a citation.`:a==="combine"&&s?.length>0&&(o=`
## USER-PROVIDED SOURCES (PRIORITY)
The student has uploaded the following papers. PRIORITIZE these sources for citations.
${JSON.stringify(s.map(i=>({title:i.title,authors:i.authors,year:i.year,methodology:i.methodology,keyFindings:i.keyFindings,theoreticalFramework:i.theoreticalFramework})),null,2).substring(0,15e3)}

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
"${t.text}"${u}

CURRENT TEXT:
${R(e)}${o}

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

Return ONLY the complete modified text for this subsection.`,c=d.length>0?[...d,{text:g}]:[{text:g}],h=await l.generateContent({contents:[{role:"user",parts:c}]});return R(h.response.text())}catch(l){throw console.error("Error applying feedback:",l),l}},w=(e,t,n)=>{const r=t?.topic||"thesis topic",s=t?.field||"social sciences",a=t?.chapter||"thesis chapter",l=t?.subsection||"subsection",u=t?.diagnosticReport||"",d=t?.flaggedSentences||[];let o="";if(d.length>0){const I=d.filter(S=>S.aiProbability>.5).slice(0,15).map((S,b)=>`SENTENCE ${b+1}: "${S.text.slice(0,150)}"
  Flags: ${S.flags.join(", ")||"none"}
  Suggestions: ${S.suggestions.join(", ")||"none"}`).join(`

`);I&&(o=`
## TARGETED REWRITE — FLAGGED SENTENCES
The following sentences were flagged as AI-like. Rewrite each one with specific fixes:

${I}

For each flagged sentence above, apply its specific suggestions. Do NOT rewrite sentences not listed above.`)}const g=`You are a smart graduate student who writes clearly and naturally. Rewrite the following thesis excerpt so it sounds like a real person wrote it — not AI.

TEXT TO REWRITE:
${e}

THESIS TITLE: "${r}"
${t?.researchTopic?`RESEARCH QUESTION: "${t.researchTopic}"`:""}
FIELD: ${s}
CHAPTER: ${a}
SUBSECTION: ${l}
${u}${o}

## CRITICAL RULES — FOLLOW EVERY ONE

### 1. SENTENCE RHYTHM (MOST IMPORTANT)`,c=`
- DRAMATICALLY vary sentence length. Mix 3-word sentences with 30-word sentences.
- No two consecutive sentences should start with the same word.
- Vary paragraph lengths from 1 sentence to 8 sentences.
- Use short punchy statements: "This matters. Here's why."
- Then immediately follow with a longer, flowing sentence.`,h=`
- STRONG rhythm variation: freely mix very short (3-6 words), medium (15-25 words), and long (30-50 words) sentences.
- No two consecutive sentences should start with the same word.
- Include occasional one-sentence paragraphs for dramatic emphasis.
- Start some paragraphs with a short, direct statement followed by a longer explanatory sentence.
- Vary paragraph length unpredictably: some 2 sentences, some 8 sentences.`,m=`
- MAXIMUM burstiness: sentences should feel random in length — 4 words, then 50, then 7, then 30.
- No two sentences should have a similar structure or length pattern.
- Start most paragraphs with a very short punchy sentence (3-6 words).
- Let each paragraph have its own unique rhythm — some fast and punchy, some slow and flowing.
- Avoid any detectable pattern in sentence length or structure.`;let i,E,f,T;return n===1?(i=c,E=`
### 2. TONE — NATURAL ACADEMIC STYLE
- Write like a smart graduate student writing a thesis — clear and natural, not stiff or robotic.
- NO contractions: write out ALL words fully (do not, will not, cannot, it is, they are, that is, does not).
- Mix confident statements ("The data clearly show...") with thoughtful hedging ("This may suggest...", "It is possible that...").
- Simple vocabulary is GOOD. Avoid jargon and fancy words.
- Never say "furthermore", "moreover", "consequently", "thus", "hence", "in conclusion".`,f=`
### 3. VARIED ACADEMIC STYLE
- Start sentences with variety: "Notably...", "Critically...", "An important finding is...", "Turning to...", "What is particularly striking is..."
- Use THIRD PERSON exclusively: "the researcher", "this study", "the findings suggest".
- Use natural academic phrasing: "importantly", "notably", "interestingly", "critically", "in practice"
- Vary confidence: some claims sound certain, others hedge ("this may suggest", "it appears that").
- Long sentences should feel thoughtful and purposeful, not formulaic.`,T=`
### 4. WHAT TO AVOID AT ALL COSTS
- NO transitions (furthermore, moreover, additionally, consequently, thus, hence)
- NO formal openers ("This study examines", "The research aims to", "It is important to")
- NO overly complex sentences with multiple nested clauses
- NO perfect uniformity — sentences should have different rhythms
- NO big vocabulary where simple words work`):n===2?(i=h,E=`
### 2. TONE — LESS FORMAL ACADEMIC STYLE
- Write like a smart graduate student who has mastered the material and writes with natural confidence.
- NO contractions: write out ALL words fully (do not, will not, cannot, it is, they are, that is, does not).
- Use the simplest word that works — if a 10th grader could understand it, that is perfect.
- Sound certain where appropriate ("The data indicate..."), hedge where uncertain ("It appears that...", "This may reflect...").
- Never use "furthermore", "moreover", "consequently", "thus", "hence", "in conclusion", "additionally".`,f=`
### 3. NATURAL VARIED STYLE
- Vary sentence starters: "What is striking...", "An important observation...", "This connects to...", "Notably...", "A key point is...", "Looking at..."
- Use THIRD PERSON exclusively: "the researcher", "this study", "the findings suggest".
- Vary confidence levels naturally — some paragraphs sound definitive, others exploratory.
- Use natural academic connectors: "importantly", "notably", "interestingly", "in practice", "specifically"
- Write as if explaining to a colleague — clear, direct, but still academic.`,T=`
### 4. WHAT TO AVOID AT ALL COSTS
- NO formal openers ("This study examines", "The research aims to", "It should be noted")
- NO overly complex sentences with multiple nested clauses
- NO repeated sentence structures
- NO big vocabulary where simple words work
- NO two paragraphs with the same rhythm`):(i=m,E=`
### 2. TONE — MAXIMUM NATURAL
- Write like an experienced researcher explaining their work to a colleague — clear, direct, completely natural.
- NO contractions: write out ALL words fully (do not, will not, cannot, it is, they are, that is, does not).
- Use everyday academic vocabulary — the simplest word that conveys the meaning correctly.
- Sound completely natural: some sentences definitive, some speculative, some purely observational.
- Completely avoid "furthermore", "moreover", "consequently", "thus", "hence", "in conclusion", "additionally", "therefore".`,f=`
### 3. NATURAL FLUCTUATING STYLE
- Vary openings unpredictably: "What is striking...", "The data point to...", "A contrasting view comes from...", "Importantly...", "This raises a key question...", "A critical finding..."
- Use THIRD PERSON exclusively: "the researcher", "this study", "the findings suggest", "the data indicate".
- Each paragraph should have its own distinct voice and rhythm.
- Avoid ALL transition-like phrasing entirely. Let ideas connect naturally without signposting.
- Write like a published academic whose writing feels effortless and unforced.`,T=`
### 4. WHAT TO AVOID AT ALL COSTS
- NO detectable patterns in sentence structure or length
- NO formulaic academic writing of any kind
- NO two sentences that sound like they were written by the same template
- NO paragraphs that feel "balanced" or "structured" — they should feel organic
- NO vocabulary that feels chosen to impress rather than to communicate`),`${g}${i}${E}${f}${T}
### 5. STRUCTURAL PRESERVATION
- Keep ALL in-text citations (Author, Year) exactly as written.
- Keep ALL data, tables, [CHART:{...}] tags, and diagrams unchanged.
- Keep ALL subsection headings exactly as they appear.
- No markdown headings, no HTML tags.

Return ONLY the rewritten text. No explanations.`},Y=async(e,t=null,n=1)=>{try{const r={1:.9,2:1,3:1.1},s=p.getGenerativeModel({model:y,tools:[{googleSearch:{}}],generationConfig:{temperature:r[n]||.9,topP:.95}}),a=w(e,t,n),l=await s.generateContent(a);let u=R(l.response.text());return!u||u.trim().length<50?e:u}catch(r){throw console.error("Error humanising:",r),r}},H=async(e,t,n=null,r="ai-only")=>{try{const s=p.getGenerativeModel({model:y}),a=t==="apa"?"APA 7th edition: Author, A. A. (Year). Title of work. Source/Publisher. DOI or URL if available.":t==="mla"?"MLA 9th edition: Author Last, First. Title of Work. Publisher, Year.":"Chicago: Author Last, First. Year. Title of Work. Publisher.";let l="";n?.length>0&&(l=`
## USER-PROVIDED SOURCES
The student has uploaded the following papers. These are REAL sources with verified metadata. Use them to create reference entries when the in-text citations match.
 
${JSON.stringify(n.map(o=>({title:o.title,authors:o.authors,year:o.year,methodology:o.methodology,keyFindings:o.keyFindings,theoreticalFramework:o.theoreticalFramework})),null,2)}
 
### USER SOURCE RULES
- If an in-text citation matches one of these user sources (by author and year), use this metadata to format the reference.
- Format using the standard publication details from your training data, falling back to user-provided metadata when needed.
- When formatting from user metadata, produce a complete reference following the style guide: Author, A. A. (Year). Title. Retrieved from thesis sources.`);const u=`You are an expert academic reference librarian. Given in-text citations from a thesis, produce a properly formatted reference list.

IN-TEXT CITATIONS (extracted from thesis content):
${e.map(o=>`- ${o}`).join(`
`)}

REFERENCE STYLE: ${t.toUpperCase()}
STYLE GUIDE: ${a}
${l}

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
Smith, J. A. (2023). Understanding organizational behavior in digital transformation. Journal of Management Studies, 60(4), 1123-1145. https://doi.org/10.1111/joms.12901`,d=await s.generateContent(u);return R(d.response.text())}catch(s){throw console.error("Error generating references:",s),s}},O=`IMPORTANT TABLE RULES:
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
For Chapter 5: findings summary tables, comparison tables`,D=async e=>{try{const t=p.getGenerativeModel({model:y}),n=`Generate a conceptual framework description for a thesis.

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

List ALL variables with their full academic names. Use only the format above, no JSON.`;return(await t.generateContent(n)).response.text().trim()||null}catch(t){return console.error("Error:",t),null}},W=async e=>{try{const t=p.getGenerativeModel({model:y}),n=`Generate a theoretical framework description for a thesis.

Topic: ${e?.topic||e?.title}
Field: ${e?.field}

Return a structured description:

Theory 1: name and key concepts
Theory 2: name and key concepts
Relationship: how they connect
Application: how they apply to this study`;return(await t.generateContent(n)).response.text().trim()||null}catch(t){return console.error("Error:",t),null}},V=async e=>{try{const t=p.getGenerativeModel({model:y}),n=`Generate a research design description for a thesis.

Topic: ${e?.topic||e?.title}
Methodology: ${e?.methodology||"mixed methods"}

Return a structured description:

Step 1: ...
Step 2: ...
Step 3: ...
Step 4: ...
Step 5: ...

List the key methodological steps in order. Use plain text, no diagrams.`;return(await t.generateContent(n)).response.text().trim()||null}catch(t){return console.error("Error:",t),null}},B=async(e,t,n)=>{try{const r=p.getGenerativeModel({model:y}),s=n?`

REAL RESEARCH FINDINGS:
${JSON.stringify(n).substring(0,2e4)}`:"",a=`Generate realistic data for a results table.

Topic: ${t?.topic||t?.title}
Subsection: ${e}
Methodology: ${t?.methodology||"quantitative"}${s}

${O}

Return a markdown table with 4-6 rows of realistic data based on the research findings provided. Use proper column headers and realistic values.`;return(await r.generateContent(a)).response.text().trim()}catch(r){return console.error("Error:",r),null}},J=async(e,t,n,r)=>{try{const s=p.getGenerativeModel({model:y}),a=r?`

REAL RESEARCH FINDINGS:
${JSON.stringify(r).substring(0,2e4)}`:"",l=`Generate data for a ${e} chart.

Topic: ${n?.topic||n?.title}
Subsection: ${t}${a}

Return in this exact format:
[CHART: ${e} | Chart Title | Label1: value, Label2: value, Label3: value, ...]

Use REAL data values from the research findings. For pie charts, values should sum to 100.`;return(await s.generateContent(l)).response.text().trim()}catch(s){return console.error("Error:",s),null}},X=async e=>{try{const t=p.getGenerativeModel({model:y}),n=e.chapters||{},r=Object.entries(n);if(r.length===0)return null;const s=r.map(([o,g])=>{const c=g.title||o,h=g.content||"";return`--- ${c} ---
${h||"No content available."}`}).join(`

`),a=`You are a thesis defence expert preparing a student for their viva voce.

THESIS TITLE: "${e.title||""}"
${e.researchTopic?`RESEARCH QUESTION: "${e.researchTopic}"`:""}
FIELD: ${e.field||""}
LEVEL: ${e.level||""}

The student has written the following chapters. Below is the actual content of each completed chapter.

${s}

Based on this content, think of every possible question a panel member could ask about this specific thesis. Cover all areas: rationale, methodology, findings, limitations, theoretical choices, literature gaps, and implications.

For each question, provide ONE clear answer. Write the answer in plain, basic English — as if you are explaining to someone who is new to academic work. Use simple words and short sentences. Do not use jargon unless absolutely necessary, and explain it if you do. The answer should be a moderate length — a few sentences that give the most correct and helpful explanation without being too short or too long.

Return ONLY valid JSON with chapter IDs as keys and arrays of {question, answer} objects. Example:
{"proposal":[{"question":"...","answer":"..."}],"chapter1":[{"question":"...","answer":"..."}]}`,d=(await t.generateContent(a)).response.text().match(/\{[\s\S]*\}/);if(d)try{return JSON.parse(d[0])}catch{}return null}catch(t){return console.error("Error generating defence questions:",t),null}},q=(e,t)=>!e||e.length===0?"":[...new Set(e)].sort().map(r=>{const s=r.split(/[, ]+/),a=s[0]||"Author",l=s[1]||"n.d.";switch(t){case"apa":return`${a}. (${l}). Title of the work. Publisher.`;case"mla":return`${a}. Title of the Work. Publisher, ${l}.`;case"chicago":return`${a}. ${l}. Title of the Work. Publisher.`;case"harvard":return`${a} (${l}). Title of the work. Publisher.`;default:return`${a} (${l})`}}).join(`
`),K=async(e,t)=>{try{const n=p.getGenerativeModel({model:y}),r=e.substring(0,15e3),s=`Extract field-specific abbreviations from this thesis content. Only include abbreviations that are specialized technical terms relevant to the thesis topic or academic field.

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
- Return ONLY the JSON array, no other text`,a=await n.generateContent(s);return A(a.response.text())||[]}catch(n){return console.error("Error extracting abbreviations:",n),[]}},_=async(e,t)=>{try{const n=p.getGenerativeModel({model:y});let r="";Object.entries(t||{}).forEach(([d,o])=>{!o||typeof o!="object"||(r+=`
--- ${d} ---
`,Object.values(o).forEach(g=>{typeof g=="string"&&(r+=g.substring(0,3e3)+`
`)}))});const s=r.substring(0,5e4),a=`You are writing the abstract for an academic thesis.

THESIS TITLE: "${e?.title||""}"
${e?.topic?`RESEARCH QUESTION: "${e.topic}"`:""}
FIELD: ${e?.field||""}
LEVEL: ${e?.level||""}
METHODOLOGY: ${e?.methodology||""}

Below is the content of the thesis chapters. Read it and write a professional abstract.

THESIS CONTENT:
${s}

Write a concise academic abstract (200-350 words) that covers:
- Background and rationale for the study
- Research objectives or questions
- Methodology used
- Key findings and results
- Conclusions and implications

Use formal academic language in a single cohesive paragraph. Do not include headings, labels, or bracketed instructions. Return ONLY the abstract text.`;return(await n.generateContent(a)).response.text().trim()||null}catch(n){return console.error("Error generating abstract:",n),null}};export{re as analyzeTranscriptText,G as applyFeedbackToContent,K as extractAbbreviations,ee as extractPaperMetadata,q as formatReferences,_ as generateAbstract,F as generateAcademicContent,oe as generateCaseStudyProtocol,M as generateChapterContent,J as generateChartData,D as generateConceptualFramework,B as generateDataTable,X as generateDefenceQuestions,se as generateDocumentAnalysisTemplate,ie as generateFocusGroupProtocol,ae as generateInterviewGuide,te as generateLiteratureMatrix,ce as generateObservationChecklist,le as generateQuestionnaire,H as generateReferences,V as generateResearchDesignFlowchart,he as generateSampleData,k as generateSubtopics,W as generateTheoreticalFramework,z as getWordCountPreset,Y as humaniseContent,$ as recommendLiteratureReviewType,P as selfReviewContent};
