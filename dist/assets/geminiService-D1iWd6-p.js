import{genAI as m,MODEL as f}from"./config-DImYIzpB.js";import{getWordCountPreset as re}from"./config-DImYIzpB.js";import{c as p,b as S}from"./sourceExtractor-CJjdJV3P.js";import{e as oe,g as ie}from"./sourceExtractor-CJjdJV3P.js";import{r as P}from"./instruments-CcCf8mdK.js";import{a as ce,g as le,b as he,c as de,d as ue,e as ge,f as me,h as fe}from"./instruments-CcCf8mdK.js";import"./mermaid-D-4jvfT0.js";import"./react-vendor-BS-ySqmm.js";const v=6e4,R=e=>{const t=[];let r=0,n=0;for(const a of e){const o=(Array.isArray(a.keyFindings)?a.keyFindings.filter(Boolean).join(" "):a.keyFindings)||"",i={title:a.title,authors:a.authors,year:a.year,...a.journal&&a.journal!=="Not specified"?{journal:a.journal}:{},...a.doi?{doi:a.doi}:{},...a.uri?{link:a.uri}:{},...a.methodology&&a.methodology!=="Not specified"?{methodology:a.methodology}:{},...a.theoreticalFramework&&a.theoreticalFramework!=="Not specified"?{theoreticalFramework:a.theoreticalFramework}:{},...o?{abstract:o.substring(0,3e3)}:{}},c=JSON.stringify(i,null,2);if(r+c.length>v){n++;continue}t.push(i),r+=c.length}return JSON.stringify(t,null,2)+(n>0?`

(${n} further source(s) omitted to fit the context window.)`:"")},I=(e,t="subsection",r="apa")=>{const n=e?.length>0,a=String(r||"apa").toUpperCase(),o=`
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
The reference list will be generated in ${a} style. Cite in author-date form
inline so it can be matched back automatically; the ${a} formatting itself is
applied when the reference list is built.`;return n?`
${o}

## THE STUDENT'S LITERATURE
These are the papers this student collected for this thesis. They are the
primary material for ${t}. Read the abstracts closely and cite the specific
findings they report, naming the finding as well as the source.

${R(e)}

Use Google Search Grounding where helpful to confirm publication details or to
locate a fuller version of any of these papers, and to support any claim they do
not cover.`:`
${o}

## SOURCING
The student has not supplied their own literature for ${t}. Use Google Search Grounding to find real, published academic work for every substantive claim: established theories, empirical findings, reported statistics, frameworks, and the main positions in any contested debate. Prefer peer-reviewed journal articles and credible academic publishers. Draw the work from a range of authors, years and perspectives rather than leaning on one study.`},G=async e=>{try{const t=m.getGenerativeModel({model:f,tools:[{googleSearch:{}}]});let r="",n=[];if(e.referenceData){if(e.referenceData.type==="combined"){const h=e.referenceData.text||"",l=(e.referenceData.files||[]).filter(g=>g.content?.startsWith("data:image/"));l.length>0?(n=l.map(g=>{const d=g.content.match(/^data:(image\/\w+);base64,(.+)$/);return d?{inlineData:{mimeType:d[1],data:d[2]}}:null}).filter(Boolean),r=`
The user has uploaded ${l.length} screenshot(s) showing their desired chapter structure, along with pasted text.

PASTED TEXT:
${h}

CRITICAL: Examine ALL images AND the pasted text carefully. Extract:
1. EVERY heading and sub-heading with exact numbering (2.1, 2.1.1, etc.)
2. The HIERARCHY and DEPTH of subsections
3. Where DIAGRAMS, TABLES, and FIGURES are placed
4. The overall FLOW and ORGANIZATION
5. The EXACT NUMBER of sections

Generate subtopics that MIRROR this structure EXACTLY for: "${e.topic}". DO NOT add or remove sections. Match precisely.`):r=`
UPLOADED REFERENCE TEXT:
${h}

CRITICAL: Extract ONLY the structure:
1. EVERY heading with exact numbering
2. HIERARCHY and DEPTH
3. Where visuals are mentioned/placed
4. EXACT NUMBER of sections

IGNORE the actual content words. Generate subtopics matching this EXACT structure for: "${e.topic}".`}else if(e.referenceData.type==="file")if(e.referenceData.content?.startsWith("data:image/")){const s=e.referenceData.content.match(/^data:(image\/\w+);base64,(.+)$/);s&&(n=[{inlineData:{mimeType:s[1],data:s[2]}}]),r=`
The user has uploaded an IMAGE showing their desired chapter structure. Examine the image CAREFULLY. Extract ALL:
1. Headings and sub-headings with exact numbering (2.1, 2.1.1, 3.0)
2. HIERARCHY and DEPTH of subsections
3. Where DIAGRAMS, TABLES, and FIGURES are placed
4. Overall FLOW and ORGANIZATION
5. EXACT NUMBER of sections

Generate subtopics that MIRROR this structure EXACTLY for: "${e.topic}".`}else r=`
UPLOADED TEXT:
${e.referenceData.content||""}

Extract ONLY the structure (headings, numbering, hierarchy, visual placements). IGNORE the content. Match the structure EXACTLY for: "${e.topic}".`;else if(e.referenceData.type==="files"){const s=(e.referenceData.files||[]).filter(l=>l.content?.startsWith("data:image/"));n=s.map(l=>{const g=l.content.match(/^data:(image\/\w+);base64,(.+)$/);return g?{inlineData:{mimeType:g[1],data:g[2]}}:null}).filter(Boolean),r=`
The user has uploaded ${s.length} screenshot(s). Examine ALL images. Extract the complete structure: headings, numbering, hierarchy, visual placements, section count. Mirror EXACTLY for: "${e.topic}".`}else if(e.referenceData.content){if(e.referenceData.content?.startsWith("data:image/")){const s=e.referenceData.content.match(/^data:(image\/\w+);base64,(.+)$/);s&&(n=[{inlineData:{mimeType:s[1],data:s[2]}}])}r=`
UPLOADED REFERENCE:
${e.referenceData.content}

CRITICAL: Extract ONLY the structure (headings, numbering, hierarchy, visual placements, section count). IGNORE the content words. Match EXACTLY for: "${e.topic}". DO NOT add or remove sections.`}}const a=`You are an expert academic advisor helping a ${e.level} student structure their thesis.

THESIS TITLE: "${e.topic}"
${e.researchTopic?`RESEARCH QUESTION: "${e.researchTopic}"`:""}
FIELD: ${e.field}
METHODOLOGY: ${e.methodology||"Not specified"} — subtopics must align with this methodology
CHAPTER: ${e.chapterTitle}${e.referenceData?`
`+r:""}

${e.referenceData?"CRITICAL: Return ONLY a JSON array matching the EXACT structure, numbering, and count from the reference. Include ALL subsections at ALL levels.":"Generate 8-12 appropriate subsections with proper academic numbering. Return ONLY a JSON array."}

DO NOT include "References" as a subsection.

Example: ["2.0 Introduction", "2.1 Theoretical Framework", "2.1.1 Key Theory", "2.2 Empirical Review", "2.3 Summary"]`;let o=n.length>0?[...n,{text:a}]:[{text:a}];const c=(await t.generateContent({contents:[{role:"user",parts:o}]})).response.text();return S(c)}catch(t){return console.error("Error generating subtopics:",t),null}},C=1.5,A=800,N=32768,O=(e,t)=>{const r=Math.max(Number(t)||0,Number(e)||0,200),n=Math.min(N,Math.max(512,Math.ceil(r*C)+A));return{min:Math.max(0,Number(e)||0),max:r,maxOutputTokens:n}},w=110,L=(e,t)=>{if(!e)return"";const r=e.max,n=Math.max(3,Math.round(r/w)),a=t?.length>1?"sub-sections":"paragraphs";return`
## LENGTH TARGET — STRICT
Write **${e.min}-${e.max} words** for this section. Aim for about **${r} words** (roughly ${n} ${a} of about ${w} words each).
- Stay inside this range. Do not exceed ${e.max} words.
- Do not fall short of ${e.min} words either.
- Keep developing the argument until you reach the word target. Do NOT stop early.
- Control length by how much you develop each point, never by padding with repetition or filler.
- Never restate content that belongs in another section of this chapter.`},Y=async e=>{try{const t=e.targetWords?O(e.targetWords.min,e.targetWords.max):null,r=m.getGenerativeModel({model:f,tools:[{googleSearch:{}}],generationConfig:{temperature:.7,topP:.85,thinkingConfig:{thinkingBudget:0},...t?{maxOutputTokens:t.maxOutputTokens}:{}}}),n="";let a=I(e.userSources,"the subsection",e.referenceStyle);const o=`You are a PhD candidate writing a formal academic thesis section. Write at a professional academic level — clear, authoritative, and naturally scholarly.
${e.thesisContext?`
## THESIS CONTEXT — PREVIOUS CHAPTERS
Earlier chapters have already established the following. Maintain consistency:
${e.thesisContext.previousChapters.map(d=>`### ${d.title}
${d.summary}`).join(`

`)}
- Use the same terminology and variable names.
- Reference earlier findings with phrases like "as discussed in Chapter X."
- Do not redefine terms already defined.`:""}
THESIS TITLE: "${e.topic}"
${e.researchTopic?`RESEARCH QUESTION: "${e.researchTopic}"`:""}
FIELD: ${e.field||"Not specified"}
CHAPTER: ${e.chapter}
SUBSECTION: ${e.subsection}${e.continuity?.openingOfChapter?`

## CHAPTER OPENING (already written — continue from here, do NOT rewrite or repeat it)
${e.continuity.openingOfChapter}`:""}${e.continuity?.previousSubsection?`

## PREVIOUS SUBSECTION (${e.continuity.previousSubsection.title})
The previous subsection ended like this:
"${e.continuity.closingParagraph}"
- Continue the argument naturally from this point.
- Do NOT re-introduce concepts, definitions or sources already covered above.
- Do NOT open with a transition that restates the previous subsection.`:""}${e.continuity?.previousSegment?`

## CONTINUING THE SAME SECTION (${e.continuity.previousSegment.title})
The immediately preceding part of this same section ended like this:
"${e.continuity.previousSegment.closingParagraph}"
- You are writing the NEXT PART of the same section. Continue the argument seamlessly from the quoted point.
- Do NOT repeat, restate, summarise or re-introduce anything already written above.
- Do NOT add an introduction, heading or conclusion; just continue the prose.`:""}
METHODOLOGY: ${e.methodology||"mixed methods"}${e.organization?`
CASE STUDY: ${e.organization}`:""}${a}
${e.findings?`RESEARCH FINDINGS DATA: ${typeof e.findings=="object"?JSON.stringify(e.findings):e.findings}

## CHAPTER 4 — RESULTS & ANALYSIS
You are writing Chapter 4 (Results/Analysis). The findings data above contains survey responses and key results. Reference specific numbers and statistics. Present findings in past tense.`:""}
${e.childrenTopics?.length>0?`
## SUB-TOPICS TO COVER
Include each of the following as subheadings within this section:

${e.childrenTopics.map((d,u)=>`${u+1}. ${d}`).join(`
`)}
`:""}${L(t,e.childrenTopics)}
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

Write the complete content now.${t?`

REMINDER: this section must be ${t.min}-${t.max} words (aim about ${t.max}). Do not finish until you have written at least ${t.min} words.`:""}`,i=await r.generateContent(o),c=i.response.text(),h=i.response.candidates;let s=[],l=!1;return h&&h[0]?.groundingMetadata?.groundingChunks&&(s=h[0].groundingMetadata.groundingChunks.filter(d=>d.web).map(d=>({title:d.web.title||"",uri:d.web.uri||""})),l=s.length>0),{text:p(c),sources:s,groundingUsed:l}}catch(t){throw console.error("Error generating academic content:",t),t}},W=async e=>{try{const t=m.getGenerativeModel({model:f,tools:[{googleSearch:{}}],generationConfig:{temperature:.7,topP:.85,maxOutputTokens:64e3}});let r=I(e.userSources,"each subsection",e.referenceStyle);const n=e.subsections.map((u,T)=>{const y=(u.children||[]).map(E=>`    - ${E.title}`).join(`
`);return`  ${T+1}. [ID: ${u.id}] ${u.title}${y?`
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
- Every paragraph should connect to a specific finding from the data.`:"",o=e.subsections.map((u,T)=>`[WRITE_SUBSECTION: ${u.id}]
${u.title}
[/WRITE_SUBSECTION]`).join(`

`),i=`You are a human PhD candidate writing a formal academic thesis chapter. Write at a professional academic level — clear, authoritative, and naturally scholarly.
${e.thesisContext?`
## THESIS CONTEXT — PREVIOUS CHAPTERS
Earlier chapters have already established the following. Maintain consistency in terminology, arguments, and references:
${e.thesisContext.previousChapters.map(u=>`### ${u.title}
${u.summary}`).join(`

`)}

- Use the same terminology and variable names from earlier chapters.
- Reference earlier findings with phrases like "as discussed in Chapter X."
- Do not redefine terms already defined.`:""}
THESIS TITLE: "${e.topic}"
${e.researchTopic?`RESEARCH QUESTION: "${e.researchTopic}"`:""}
FIELD: ${e.field||"Not specified"}
CHAPTER: ${e.chapter}
METHODOLOGY: ${e.methodology||"mixed methods"}${e.organization?`
CASE STUDY: ${e.organization}`:""}${r}
${a}

## SUBSECTIONS TO WRITE
Write the entire chapter one subsection at a time, in the order listed below:

${n}

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

Write the complete chapter now.`,c=await t.generateContent(i),h=c.response.text(),s=c.response.candidates;let l=[],g=!1;return s&&s[0]?.groundingMetadata?.groundingChunks&&(l=s[0].groundingMetadata.groundingChunks.filter(u=>u.web).map(u=>({title:u.web.title||"",uri:u.web.uri||""})),g=l.length>0),{text:p(h),sources:l,groundingUsed:g}}catch(t){throw console.error("Error generating chapter content:",t),t}},D=async(e,t)=>{try{const r=m.getGenerativeModel({model:f,tools:[{googleSearch:{}}],generationConfig:{temperature:.5,topP:.85}}),n=t?.extraInstruction?`

## ADDITIONAL INSTRUCTION
${t.extraInstruction}`:"",a=`You are a senior academic editor performing a quality review on AI-generated thesis content. Your task: identify all detectable AI writing patterns and rewrite the text so it is COMPLETELY INDISTINGUISHABLE from human academic writing.

ORIGINAL TEXT (AI-generated):
${e}

THESIS TITLE: "${t?.topic||"thesis"}"
${t?.researchTopic?`RESEARCH QUESTION: "${t.researchTopic}"`:""}
FIELD: ${t?.field||"Not specified"}
CHAPTER: ${t?.chapter||"N/A"}
SUBSECTION: ${t?.subsection||"N/A"}${n}

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
- Return ONLY the rewritten text. No explanations, no annotations, no meta-commentary.`,o=await r.generateContent(a);return p(o.response.text())}catch(r){return console.error("Error in self-review:",r),e}},B=async(e,t,r,n,a=null)=>{try{const o=m.getGenerativeModel({model:f,tools:[{googleSearch:{}}]});let i="",c=[];if(t.files?.length){const u=t.files.filter(E=>E.type==="image"&&E.content),T=t.files.filter(E=>E.type!=="image");c=u.map(E=>{const b=E.content.match(/^data:(image\/\w+);base64,(.+)$/);return b?{inlineData:{mimeType:b[1],data:b[2]}}:null}).filter(Boolean);const y=t.files.map(E=>E.name).join(", ");i=`
Uploaded ${t.files.length} file(s): ${y}.`,T.length>0&&T.forEach(E=>{E.extractedText&&(i+=`
Content from ${E.name}: ${E.extractedText.substring(0,3e3)}`)})}let h=I(a,"the subsection",n?.referenceStyle);const s=(a?.length||0)>0,l=`You are an expert academic editor carrying out your supervisor's explicit revision instructions on a thesis subsection. Your ONLY task is to produce text that satisfies the feedback below. You are not reviewing, not suggesting, and not deciding whether the feedback is a good idea. You implement it.

SUBSECTION: ${r}
THESIS TITLE: "${n?.title}"
${n?.topic?`RESEARCH QUESTION: "${n.topic}"`:""}
FIELD: ${n?.field||"Not specified"}

## THE STUDENT'S EXACT REQUEST
${t.text?`"${t.text}"`:"See the uploaded files below — apply the corrections they show."}${i}

The request above is a command, not a suggestion. It is the single source of truth for what this subsection must become.

## CURRENT TEXT (to be revised)
${p(e)}${h}

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
- ${s?"Work the student's own sources into the text, and where they support the arguments, cite them alongside the existing citations.":"Where the existing text is under-supported, strengthen it with further grounded citations from real published work, in the same author-date form."}
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
4. Are all headings, tables, and statistics from the original still present and correct?`,g=c.length>0?[...c,{text:l}]:[{text:l}],d=await o.generateContent({contents:[{role:"user",parts:g}]});return p(d.response.text())}catch(o){throw console.error("Error applying feedback:",o),o}},$=(e,t,r)=>{const n=t?.topic||"thesis topic",a=t?.field||"social sciences",o=t?.chapter||"thesis chapter",i=t?.subsection||"subsection",c={1:`LEVEL 1 — REWRITE THIS TEXT TO SOUND LIKE A REAL PERSON WROTE IT
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
TITLE: "${n}"
FIELD: ${a}
CHAPTER: ${o}
SUBSECTION: ${i}

## TEXT TO REWRITE
${e}

## INSTRUCTIONS
${c[r]||c[1]}

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

Return ONLY the rewritten text. No explanations.`},X=async(e,t=null,r=1)=>{try{const n={1:.9,2:1,3:1.1},a=m.getGenerativeModel({model:f,generationConfig:{temperature:n[r]||.9,topP:.95}}),o=$(e,t,r),i=await a.generateContent(o);let c=p(i.response.text());return!c||c.trim().length<50?e:c}catch(n){throw console.error("Error humanising:",n),n}},V=async(e,t,r=null)=>{try{const n=m.getGenerativeModel({model:f,tools:[{googleSearch:{}}]}),a=t==="apa"?"APA 7th edition: Author, A. A. (Year). Title of work. Source/Publisher. DOI or URL if available.":t==="mla"?"MLA 9th edition: Author Last, First. Title of Work. Publisher, Year.":"Chicago: Author Last, First. Year. Title of Work. Publisher.";let o="";r?.length>0&&(o=`
## THE STUDENT'S LITERATURE
These are the papers this student collected. Where an in-text citation matches
one of them by author and year, this is the authoritative record of the work —
use it in preference to anything you might recall.

${R(r)}

Match on author and year. Include journal, DOI and link where they appear above.`);const i=`You are an expert academic reference librarian. Given in-text citations from a thesis, produce a properly formatted reference list.

IN-TEXT CITATIONS (extracted from thesis content):
${e.map(h=>`- ${h}`).join(`
`)}

REFERENCE STYLE: ${t.toUpperCase()}
STYLE GUIDE: ${a}
${o}

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
- Format each reference precisely according to the ${t.toUpperCase()} style guide above.
- Return ONLY the reference entries, one per line, sorted alphabetically by the first author's last name.
- NO headings, NO explanations, NO numbering, NO bullet points.
- NO markdown formatting.
- NO empty lines between entries.
- Each entry must be a complete, standalone reference string.

Example (APA):
Smith, J. A. (2023). Understanding organizational behavior in digital transformation. Journal of Management Studies, 60(4), 1123-1145. https://doi.org/10.1111/joms.12901`,c=await n.generateContent(i);return p(c.response.text())}catch(n){throw console.error("Error generating references:",n),n}},x=`IMPORTANT TABLE RULES:
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
For Chapter 5: findings summary tables, comparison tables`,q=async e=>{try{const t=m.getGenerativeModel({model:f}),r=`Generate a conceptual framework description for a thesis.

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

List ALL variables with their full academic names. Use only the format above, no JSON.`;return(await t.generateContent(r)).response.text().trim()||null}catch(t){return console.error("Error:",t),null}},K=async e=>{try{const t=m.getGenerativeModel({model:f}),r=`Generate a theoretical framework description for a thesis.

Topic: ${e?.topic||e?.title}
Field: ${e?.field}

Return a structured description:

Theory 1: name and key concepts
Theory 2: name and key concepts
Relationship: how they connect
Application: how they apply to this study`;return(await t.generateContent(r)).response.text().trim()||null}catch(t){return console.error("Error:",t),null}},_=async e=>{try{const t=m.getGenerativeModel({model:f}),r=`Generate a research design description for a thesis.

Topic: ${e?.topic||e?.title}
Methodology: ${e?.methodology||"mixed methods"}

Return a structured description:

Step 1: ...
Step 2: ...
Step 3: ...
Step 4: ...
Step 5: ...

List the key methodological steps in order. Use plain text, no diagrams.`;return(await t.generateContent(r)).response.text().trim()||null}catch(t){return console.error("Error:",t),null}},J=async(e,t,r)=>{try{const n=m.getGenerativeModel({model:f}),a=r?`

REAL RESEARCH FINDINGS:
${JSON.stringify(r).substring(0,2e4)}`:"",o=`Generate realistic data for a results table.

Topic: ${t?.topic||t?.title}
Subsection: ${e}
Methodology: ${t?.methodology||"quantitative"}${a}

${x}

Return a markdown table with 4-6 rows of realistic data based on the research findings provided. Use proper column headers and realistic values.`;return(await n.generateContent(o)).response.text().trim()}catch(n){return console.error("Error:",n),null}},j=async(e,t,r,n)=>{try{const a=m.getGenerativeModel({model:f}),o=n?`

REAL RESEARCH FINDINGS:
${JSON.stringify(n).substring(0,2e4)}`:"",i=`Generate data for a ${e} chart.

Topic: ${r?.topic||r?.title}
Subsection: ${t}${o}

Return in this exact format:
[CHART: ${e} | Chart Title | Label1: value, Label2: value, Label3: value, ...]

Use REAL data values from the research findings. For pie charts, values should sum to 100.`;return(await a.generateContent(i)).response.text().trim()}catch(a){return console.error("Error:",a),null}},Q=async e=>{try{const t=m.getGenerativeModel({model:f}),r=e.chapters||{},n=Object.entries(r);if(n.length===0)return null;const a=n.map(([s,l])=>{const g=l.title||s,d=l.content||"";return`--- ${g} ---
${d||"No content available."}`}).join(`

`),o=`You are a thesis defence expert preparing a student for their viva voce.

THESIS TITLE: "${e.title||""}"
${e.researchTopic?`RESEARCH QUESTION: "${e.researchTopic}"`:""}
FIELD: ${e.field||""}
LEVEL: ${e.level||""}

The student has written the following chapters. Below is the actual content of each completed chapter.

${a}

Based on this content, think of every possible question a panel member could ask about this specific thesis. Cover all areas: rationale, methodology, findings, limitations, theoretical choices, literature gaps, and implications.

For each question, provide ONE clear answer. Write the answer in plain, basic English — as if you are explaining to someone who is new to academic work. Use simple words and short sentences. Do not use jargon unless absolutely necessary, and explain it if you do. The answer should be a moderate length — a few sentences that give the most correct and helpful explanation without being too short or too long.

Return ONLY valid JSON with chapter IDs as keys and arrays of {question, answer} objects. Example:
{"proposal":[{"question":"...","answer":"..."}],"chapter1":[{"question":"...","answer":"..."}]}`,h=(await t.generateContent(o)).response.text().match(/\{[\s\S]*\}/);if(h)try{return JSON.parse(h[0])}catch{}return null}catch(t){return console.error("Error generating defence questions:",t),null}},z=(e,t)=>!e||e.length===0?"":[...new Set(e)].sort().map(n=>{const a=n.split(/[, ]+/),o=a[0]||"Author",i=a[1]||"n.d.";switch(t){case"apa":return`${o}. (${i}). Title of the work. Publisher.`;case"mla":return`${o}. Title of the Work. Publisher, ${i}.`;case"chicago":return`${o}. ${i}. Title of the Work. Publisher.`;case"harvard":return`${o} (${i}). Title of the work. Publisher.`;default:return`${o} (${i})`}}).join(`
`),Z=async(e,t)=>{try{const r=m.getGenerativeModel({model:f}),n=e.substring(0,15e3),a=`Extract field-specific abbreviations from this thesis content. Only include abbreviations that are specialized technical terms relevant to the thesis topic or academic field.

PROJECT: "${t}"

CONTENT:
${n}

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
- Return ONLY the JSON array, no other text`,o=await r.generateContent(a);return S(o.response.text())||[]}catch(r){return console.error("Error extracting abbreviations:",r),[]}},ee=async(e,t)=>{try{const r=m.getGenerativeModel({model:f});let n="";Object.entries(t||{}).forEach(([h,s])=>{!s||typeof s!="object"||(n+=`
--- ${h} ---
`,Object.values(s).forEach(l=>{typeof l=="string"&&(n+=l.substring(0,3e3)+`
`)}))});const a=n.substring(0,5e4),o=`You are writing the abstract for an academic thesis.

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

Use formal academic language in a single cohesive paragraph. Do not include headings, labels, or bracketed instructions. Return ONLY the abstract text.`;return(await r.generateContent(o)).response.text().trim()||null}catch(r){return console.error("Error generating abstract:",r),null}};export{ce as analyzeTranscriptText,B as applyFeedbackToContent,Z as extractAbbreviations,oe as extractPaperMetadata,z as formatReferences,ee as generateAbstract,Y as generateAcademicContent,le as generateCaseStudyProtocol,W as generateChapterContent,j as generateChartData,q as generateConceptualFramework,J as generateDataTable,Q as generateDefenceQuestions,he as generateDocumentAnalysisTemplate,de as generateFocusGroupProtocol,ue as generateInterviewGuide,ie as generateLiteratureMatrix,ge as generateObservationChecklist,me as generateQuestionnaire,V as generateReferences,_ as generateResearchDesignFlowchart,fe as generateSampleData,G as generateSubtopics,K as generateTheoreticalFramework,re as getWordCountPreset,X as humaniseContent,P as recommendLiteratureReviewType,D as selfReviewContent};
