import{genAI as f,MODEL as p}from"./config-Cvdz1bDW.js";import{getWordCountPreset as B}from"./config-Cvdz1bDW.js";import{c as E,b as T}from"./sourceExtractor-DmEHPLDx.js";import{e as K,g as q}from"./sourceExtractor-DmEHPLDx.js";import{r as S}from"./instruments-DxZjInA5.js";import{a as Q,g as z,b as j,c as Z,d as _,e as ee,f as te,h as ne}from"./instruments-DxZjInA5.js";import"./mermaid-DnMQf98b.js";import"./react-vendor-BS-ySqmm.js";const y=`IMPORTANT TABLE RULES:
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
For Chapter 5: findings summary tables, comparison tables`,C=async e=>{try{const t=f.getGenerativeModel({model:p,tools:[{googleSearch:{}}]});let n="",r=[];if(e.referenceData){if(e.referenceData.type==="combined"){const d=e.referenceData.text||"",h=(e.referenceData.files||[]).filter(u=>u.content?.startsWith("data:image/"));h.length>0?(r=h.map(u=>{const m=u.content.match(/^data:(image\/\w+);base64,(.+)$/);return m?{inlineData:{mimeType:m[1],data:m[2]}}:null}).filter(Boolean),n=`
The user has uploaded ${h.length} screenshot(s) showing their desired chapter structure, along with pasted text.

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

IGNORE the actual content words. Generate subtopics matching this EXACT structure for: "${e.topic}".`}else if(e.referenceData.type==="file")if(e.referenceData.content?.startsWith("data:image/")){const a=e.referenceData.content.match(/^data:(image\/\w+);base64,(.+)$/);a&&(r=[{inlineData:{mimeType:a[1],data:a[2]}}]),n=`
The user has uploaded an IMAGE showing their desired chapter structure. Examine the image CAREFULLY. Extract ALL:
1. Headings and sub-headings with exact numbering (2.1, 2.1.1, 3.0)
2. HIERARCHY and DEPTH of subsections
3. Where DIAGRAMS, TABLES, and FIGURES are placed
4. Overall FLOW and ORGANIZATION
5. EXACT NUMBER of sections

Generate subtopics that MIRROR this structure EXACTLY for: "${e.topic}".`}else n=`
UPLOADED TEXT:
${e.referenceData.content||""}

Extract ONLY the structure (headings, numbering, hierarchy, visual placements). IGNORE the content. Match the structure EXACTLY for: "${e.topic}".`;else if(e.referenceData.type==="files"){const a=(e.referenceData.files||[]).filter(h=>h.content?.startsWith("data:image/"));r=a.map(h=>{const u=h.content.match(/^data:(image\/\w+);base64,(.+)$/);return u?{inlineData:{mimeType:u[1],data:u[2]}}:null}).filter(Boolean),n=`
The user has uploaded ${a.length} screenshot(s). Examine ALL images. Extract the complete structure: headings, numbering, hierarchy, visual placements, section count. Mirror EXACTLY for: "${e.topic}".`}else if(e.referenceData.content){if(e.referenceData.content?.startsWith("data:image/")){const a=e.referenceData.content.match(/^data:(image\/\w+);base64,(.+)$/);a&&(r=[{inlineData:{mimeType:a[1],data:a[2]}}])}n=`
UPLOADED REFERENCE:
${e.referenceData.content}

CRITICAL: Extract ONLY the structure (headings, numbering, hierarchy, visual placements, section count). IGNORE the content words. Match EXACTLY for: "${e.topic}". DO NOT add or remove sections.`}}const o=`You are an expert academic advisor helping a ${e.level} student structure their thesis.

THESIS TITLE: "${e.topic}"
${e.researchTopic?`RESEARCH QUESTION: "${e.researchTopic}"`:""}
FIELD: ${e.field}
METHODOLOGY: ${e.methodology||"Not specified"} — subtopics must align with this methodology
CHAPTER: ${e.chapterTitle}${e.referenceData?`
`+n:""}

${e.referenceData?"CRITICAL: Return ONLY a JSON array matching the EXACT structure, numbering, and count from the reference. Include ALL subsections at ALL levels.":"Generate 8-12 appropriate subsections with proper academic numbering. Return ONLY a JSON array."}

DO NOT include "References" as a subsection.

Example: ["2.0 Introduction", "2.1 Theoretical Framework", "2.1.1 Key Theory", "2.2 Empirical Review", "2.3 Summary"]`;let s=r.length>0?[...r,{text:o}]:[{text:o}];const g=(await t.generateContent({contents:[{role:"user",parts:s}]})).response.text();return T(g)}catch(t){return console.error("Error generating subtopics:",t),null}},N=async e=>{try{const t=f.getGenerativeModel({model:p,tools:[{googleSearch:{}}],generationConfig:{temperature:.4,topP:.85}}),n=e.wordCount||{min:500,max:1e3},r=Math.floor((n.min+n.max)/2),o="Start directly with the subsection heading.";let s="";e.sourceMode==="user-only"&&e.userSources?.length>0?s=`
## USER-PROVIDED SOURCES (MANDATORY)
The student has uploaded the following papers. These are the ONLY sources you may cite.
${JSON.stringify(e.userSources.map(c=>({title:c.title,authors:c.authors,year:c.year,methodology:c.methodology,keyFindings:c.keyFindings,theoreticalFramework:c.theoreticalFramework})),null,2).substring(0,15e3)}

### USER SOURCE RULES
- For EACH paper listed above, use Google Search Grounding to find the ACTUAL publication, read its content, and cite specific findings from it.
- You MUST find and cite from the REAL published paper — not just the title and authors listed here.
- If Google Search Grounding cannot find a specific paper after trying, do NOT cite it.
- At least 2 different sources must be cited across the subsection.
- When discussing a concept or finding, reference the specific source: (Author, Year).
- Do NOT fabricate any citation. If you cannot find a real source for a claim, make the argument without a citation.`:e.sourceMode==="combine"&&e.userSources?.length>0&&(s=`
## USER-PROVIDED SOURCES (PRIORITY)
The student has uploaded the following papers. PRIORITIZE these sources for citations.
${JSON.stringify(e.userSources.map(c=>({title:c.title,authors:c.authors,year:c.year,methodology:c.methodology,keyFindings:c.keyFindings,theoreticalFramework:c.theoreticalFramework})),null,2).substring(0,15e3)}

### COMBINED SOURCE RULES
- Use Google Search Grounding to find the ACTUAL publications for the user's papers, read them, and cite specific findings.
- Supplement with additional sources found via Google Search Grounding where user sources do not provide sufficient coverage.
- At least 60% of citations should come from the user's papers.
- If Google cannot find a specific user paper, you may cite it using its listed title and authors as a last resort.`);const l=`You are an advanced academic writing assistant helping a ${e.level} student write their thesis. Generate content that reads like a thoughtful, professional scholar's work — never like AI output. This is a PROFESSIONAL ACADEMIC THESIS.
${e.thesisContext?`
## THESIS CONTEXT — PREVIOUS CHAPTERS
This thesis has already written the following chapters. Use this context to maintain consistency in terminology, arguments, and references across chapters:
${e.thesisContext.previousChapters.map(i=>`### ${i.title}
${i.summary}`).join(`

`)}

### CONSISTENCY RULES
- Use the same terminology and variable names established in previous chapters.
- When referencing findings or arguments from earlier chapters, use phrases like "as discussed in Chapter X" or "consistent with the findings presented earlier."
- Do not redefine terms that were already defined in previous chapters.
- Build upon arguments from previous chapters rather than repeating them.`:""}
THESIS TITLE: "${e.topic}"
${e.researchTopic?`RESEARCH QUESTION: "${e.researchTopic}"`:""}
FIELD: ${e.field||"Not specified"}
CHAPTER: ${e.chapter}
SUBSECTION: ${e.subsection}
TARGET WORD COUNT: ${r} words (range: ${n.min}–${n.max})
METHODOLOGY: ${e.methodology||"mixed methods"} — all content MUST align with this methodology
${e.organization?`CASE STUDY: ${e.organization}`:""}${s}
${e.findings?`RESEARCH FINDINGS DATA: ${typeof e.findings=="object"?JSON.stringify(e.findings):e.findings}

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
- Every paragraph should connect to a specific finding from the data.`:""}

## VISUALS — YOU MUST INCLUDE THEM WHERE APPROPRIATE

You MUST include proper tables, charts, and diagrams throughout the thesis. Use the following chapter-specific guidelines:

**Chapter 2 (Literature Review):** Include at least one conceptual framework diagram showing independent, dependent, mediating, and moderating variables. Include comparison tables of literature. Use [FRAMEWORK: ...] for conceptual frameworks.

**Chapter 3 (Methodology):** Include a research design flowchart. Use [FRAMEWORK: flowchart | ...] for methodologies.

**Chapter 4 (Results/Analysis):** This chapter MUST have:
- A demographic profile table of respondents
- Descriptive statistics tables for each research question
- Charts showing distributions — use [CHART: bar | title | Label1: value, Label2: value, ...] for categorical data
- Use [CHART: pie | title | data] for percentage/proportion data
- Use [CHART: line | title | data] for trend data
- Tables at appropriate places showing frequencies, means, correlations

**Chapter 5 (Discussion/Conclusion):** Include comparison tables contrasting findings with prior research.

**FORMAT FOR TABLES:** Write natural markdown tables:
| Variable | Frequency | Percentage |
|----------|-----------|-----------|
| Male | 45 | 45.0% |
| Female | 55 | 55.0% |

**FORMAT FOR CHARTS:** Use this simple inline format:
[CHART: type | Title | Label1: value, Label2: value, Label3: value, ...]
Types: bar, line, pie, horizontalBar
Example: [CHART: bar | Satisfaction Levels | Very Satisfied: 45, Satisfied: 30, Neutral: 15, Dissatisfied: 10]

**FORMAT FOR CONCEPTUAL FRAMEWORKS:** Use this format:
[FRAMEWORK: Title of Framework
  Independent: Variable1, Variable2
  Dependent: Variable3
  Mediating: Variable4
  Moderating: Variable5
  H1: Variable1 → Variable3
  H2: Variable2 → Variable4
]

For hierarchical structures (org charts, governance, classifications), use:
[FRAMEWORK: Title
  Hierarchy: Parent → Child1, Child2
  Hierarchy: Child1 → Grandchild
]

**GUIDELINES:**
- Place each visual on its own line between paragraphs
- Reference each visual in the text: "As Table X shows", "Figure Y illustrates"
- All data in tables and charts must come from the research findings provided
- For Chapter 4 especially: every claim should be backed by a table or chart showing the actual data
- Do NOT use code fences (\`\`\`) for visuals — use the formats above
- **CRITICAL: NEVER draw text-based diagrams using ASCII characters (├, ──, └, │, etc.). If a visual format does not fit your content, describe the relationship in plain text instead.**
- **CRITICAL: NEVER describe a framework, hierarchy, org chart, or relationship using plain text with dashes or bullet points as a substitute for a diagram. If you find yourself writing something like "Figure X.Y:" followed by a list of items with dashes, STOP — use [FRAMEWORK: ...] format instead. The system needs the structured format to render the diagram properly.**
- **CRITICAL: NEVER include ASCII art, text diagrams, or visual elements drawn with characters like / \\ | ^ _ - = * in your response. These do not render in the final thesis document. If you need to describe a visual, use [FRAMEWORK: ...], [CHART: ...], or a markdown table.**
- **CRITICAL: NEVER use \`\`\`mermaid, \`\`\`chart, \`\`\`table, or \`\`\`diagram code fences. These formats are deprecated and do not render. Use [FRAMEWORK: ...] for frameworks and hierarchies, [CHART: type | Title | data] for charts, and markdown tables for tabular data.**

${o}
${e.childrenTopics?.length>0?`

## SUB-TOPICS TO COVER IN THIS SECTION
This section has the following sub-topics that must be covered. Include EACH as an H3 subheading within the text:

${e.childrenTopics.map((i,c)=>`${c+1}. ${i}`).join(`
`)}
`:""}
${e.guidelines?`

## CHAPTER-SPECIFIC GUIDELINES
The student has provided the following custom instructions specific to this chapter. These take priority over general rules where they conflict:

${e.guidelines}
`:""}

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
- For tables, use natural markdown table format: | Header 1 | Header 2 |
- For charts, use inline format: [CHART: type | Title | Label1: value, Label2: value]
- For frameworks, use: [FRAMEWORK: Title | Independent: ... | Dependent: ...]
${y}

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

Write the complete content now. Aim for approximately ${r} words.`,g=await t.generateContent(l),d=g.response.text(),a=g.response.candidates;let h=[],u=!1;a&&a[0]?.groundingMetadata?.groundingChunks&&(h=a[0].groundingMetadata.groundingChunks.filter(i=>i.web).map(i=>({title:i.web.title||"",uri:i.web.uri||""})),u=h.length>0);const m=E(d);return{text:u?m:`[NOTE: Google Search Grounding was not used for this response. Citations may not be verified.] ${m}`,sources:h,groundingUsed:u}}catch(t){throw console.error("Error generating academic content:",t),t}},v=async(e,t)=>{try{const n=f.getGenerativeModel({model:p,tools:[{googleSearch:{}}],generationConfig:{temperature:.5,topP:.85}}),r=t?.extraInstruction?`

## ADDITIONAL INSTRUCTION
${t.extraInstruction}`:"",o=`You are a senior academic editor performing a quality review on AI-generated thesis content. Your task: identify all detectable AI writing patterns and rewrite the text so it is COMPLETELY INDISTINGUISHABLE from human academic writing.

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
- DO NOT change the word count drastically (stay within 85–115% of original).
- Return ONLY the rewritten text. No explanations, no annotations, no meta-commentary.`,s=await n.generateContent(o);return E(s.response.text())}catch(n){return console.error("Error in self-review:",n),e}},L=async(e,t,n,r)=>{try{const o=f.getGenerativeModel({model:p,tools:[{googleSearch:{}}]});let s="",l=[];if(t.files?.length){const h=t.files.filter(i=>i.type==="image"&&i.content),u=t.files.filter(i=>i.type!=="image");l=h.map(i=>{const c=i.content.match(/^data:(image\/\w+);base64,(.+)$/);return c?{inlineData:{mimeType:c[1],data:c[2]}}:null}).filter(Boolean);const m=t.files.map(i=>i.name).join(", ");s=`
Uploaded ${t.files.length} file(s): ${m}.`,u.length>0&&u.forEach(i=>{i.extractedText&&(s+=`
Content from ${i.name}: ${i.extractedText.substring(0,3e3)}`)})}const g=`You are an expert academic editor applying supervisor feedback to a thesis subsection. Address the feedback while preserving academic quality and structural integrity.

SUBSECTION: ${n}
THESIS TITLE: "${r?.title}"
${r?.topic?`RESEARCH QUESTION: "${r.topic}"`:""}
FIELD: ${r?.field}

FEEDBACK TO APPLY:
"${t.text}"${s}

CURRENT TEXT:
${E(e)}

## INSTRUCTION HIERARCHY (highest to lowest priority)

### PRIORITY 1 — USER FEEDBACK (overrides everything else)
- The user's feedback text is the MOST IMPORTANT instruction. Apply it EXACTLY as written.
- If feedback asks to make it longer, MAKE IT LONGER. If it asks for two paragraphs, ADD TWO PARAGRAPHS.
- If feedback asks to rewrite, REWRITE. If it asks to expand, EXPAND.
- Do not second-guess or soften the user's instructions. Do what they say.
- Only if the feedback is vague (e.g., "improve this section") should you use your best judgment for minimal improvements.

### PRIORITY 2 — CITATION INTEGRITY
- PRESERVE ALL in-text citations exactly as they appear — do not change, remove, or replace any (Author, Year) markers.
- PRESERVE [CITATION:...] markers exactly as they appear.
- DO NOT add new citations that were not in the original text.
- Ensure every paragraph still has at least one in-text citation after editing.

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

Return ONLY the complete modified text for this subsection.`,d=l.length>0?[...l,{text:g}]:[{text:g}],a=await o.generateContent({contents:[{role:"user",parts:d}]});return E(a.response.text())}catch(o){throw console.error("Error applying feedback:",o),o}},x=async(e,t=null)=>{try{const n=f.getGenerativeModel({model:p,tools:[{googleSearch:{}}],generationConfig:{temperature:.9,topP:.95}}),r=t?.topic||"thesis topic",o=t?.field||"social sciences",s=t?.chapter||"thesis chapter",l=t?.subsection||"subsection",g=t?.diagnosticReport||"",d=t?.flaggedSentences||[];let a="";if(d.length>0){const i=d.filter(c=>c.aiProbability>.5).slice(0,15).map((c,I)=>`SENTENCE ${I+1}: "${c.text.slice(0,150)}"
  Flags: ${c.flags.join(", ")||"none"}
  Suggestions: ${c.suggestions.join(", ")||"none"}`).join(`

`);i&&(a=`
## TARGETED REWRITE — FLAGGED SENTENCES
The following sentences were flagged as AI-like. Rewrite each one with specific fixes:

${i}

For each flagged sentence above, apply its specific suggestions. Do NOT rewrite sentences not listed above.`)}const h=`You are a smart graduate student who writes clearly and naturally. Rewrite the following thesis excerpt so it sounds like a real person wrote it — not AI.

TEXT TO REWRITE:
${e}

THESIS TITLE: "${r}"
${t?.researchTopic?`RESEARCH QUESTION: "${t.researchTopic}"`:""}
FIELD: ${o}
CHAPTER: ${s}
SUBSECTION: ${l}
${g}${a}

## CRITICAL RULES — FOLLOW EVERY ONE

### 1. SENTENCE RHYTHM (MOST IMPORTANT)
- DRAMATICALLY vary sentence length. Mix 3-word sentences with 30-word sentences.
- No two consecutive sentences should start with the same word.
- Vary paragraph lengths from 1 sentence to 8 sentences.
- Use short punchy statements: "This matters. Here's why."
- Then immediately follow with a longer, flowing sentence.

### 2. TONE — SOUND LIKE A PERSON, NOT A PROFESSOR
- Write like a smart student explaining something, not a textbook.
- USE contractions: don't, won't, isn't, it's, they're, there's, hasn't, wasn't.
- Mix confident statements ("The data clearly show...") with thoughtful uncertainty ("This might suggest...", "It's possible that...").
- Simple vocabulary is GOOD. Avoid jargon and fancy words.
- Never say "furthermore", "moreover", "consequently", "thus", "hence", "in conclusion".

### 3. CONVERSATIONAL ACADEMIC STYLE
- Start sentences with variety: "So...", "But...", "What's interesting is...", "Looking at...", "The thing about..."
- Use "I" or "we" occasionally: "I found that...", "We can see..."
- Add natural fillers: "actually", "basically", "importantly", "interestingly", "honestly"
- Vary confidence: some claims sound certain, others sound like speculation.
- Long sentences should feel like someone thinking out loud, not formulaic.

### 4. WHAT TO AVOID AT ALL COSTS
- NO transitions (furthermore, moreover, additionally, consequently, thus, hence)
- NO formal openers ("This study examines", "The research aims to", "It is important to")
- NO overly complex sentences with multiple nested clauses
- NO perfect uniformity — sentences should have different rhythms
- NO big vocabulary where simple words work

### 5. STRUCTURAL PRESERVATION
- Keep ALL in-text citations (Author, Year) exactly as written.
- Keep ALL data, tables, [CHART:{...}] tags, and diagrams unchanged.
- Keep ALL subsection headings exactly as they appear.
- Keep the total word count within 85-115% of the original.
- No markdown headings, no HTML tags.

Return ONLY the rewritten text. No explanations.`,u=await n.generateContent(h);let m=E(u.response.text());return!m||m.trim().length<50?e:m}catch(n){throw console.error("Error humanising:",n),n}},$=async(e,t,n=null,r="ai-only")=>{try{const o=f.getGenerativeModel({model:p,tools:[{googleSearch:{}}]}),s=t==="apa"?"APA 7th edition: Author, A. A. (Year). Title of work. Source/Publisher. DOI or URL if available.":t==="mla"?"MLA 9th edition: Author Last, First. Title of Work. Publisher, Year.":"Chicago: Author Last, First. Year. Title of Work. Publisher.";let l="";n?.length>0&&(r==="user-only"||r==="combine")&&(l=`
## USER-PROVIDED SOURCES (VERIFIED)
The student has uploaded the following papers. These are REAL, VERIFIABLE sources. Use them to create reference entries when the in-text citations match.

${JSON.stringify(n.map(a=>({title:a.title,authors:a.authors,year:a.year,methodology:a.methodology,keyFindings:a.keyFindings,theoreticalFramework:a.theoreticalFramework})),null,2)}

### USER SOURCE RULES
- If an in-text citation matches one of these user sources (by author and year), use this metadata to format the reference.
- These sources may not have DOI/URL — format them as "Author, A. A. (Year). Title. [Unpublished source]" if no publication venue is known.
- Prioritize Google Search Grounding for complete reference details, but fall back to user-provided metadata when search fails.`);const g=`You are an expert academic reference librarian. Given in-text citations from a thesis, produce a properly formatted reference list using REAL, VERIFIABLE sources found via Google Search Grounding.

IN-TEXT CITATIONS (extracted from thesis content):
${e.map(a=>`- ${a}`).join(`
`)}

REFERENCE STYLE: ${t.toUpperCase()}
STYLE GUIDE: ${s}
${l}

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
- Format each reference precisely according to the ${t.toUpperCase()} style guide above.
- Return ONLY the reference entries, one per line, sorted alphabetically by the first author's last name.
- NO headings, NO explanations, NO numbering, NO bullet points.
- NO markdown formatting.
- NO empty lines between entries.
- Each entry must be a complete, standalone reference string.

Example (APA):
Smith, J. A. (2023). Understanding organizational behavior in digital transformation. Journal of Management Studies, 60(4), 1123-1145. https://doi.org/10.1111/joms.12901`,d=await o.generateContent(g);return E(d.response.text())}catch(o){throw console.error("Error generating references:",o),o}},U=async e=>{try{const t=f.getGenerativeModel({model:p}),n=`Generate a conceptual framework description for a thesis.

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

List ALL variables with their full academic names. Use only the format above, no JSON.`;return(await t.generateContent(n)).response.text().trim()||null}catch(t){return console.error("Error:",t),null}},F=async e=>{try{const t=f.getGenerativeModel({model:p}),n=`Generate a theoretical framework description for a thesis.

Topic: ${e?.topic||e?.title}
Field: ${e?.field}

Return a structured description:

Theory 1: name and key concepts
Theory 2: name and key concepts
Relationship: how they connect
Application: how they apply to this study`;return(await t.generateContent(n)).response.text().trim()||null}catch(t){return console.error("Error:",t),null}},M=async e=>{try{const t=f.getGenerativeModel({model:p}),n=`Generate a research design description for a thesis.

Topic: ${e?.topic||e?.title}
Methodology: ${e?.methodology||"mixed methods"}

Return a structured description:

Step 1: ...
Step 2: ...
Step 3: ...
Step 4: ...
Step 5: ...

List the key methodological steps in order. Use plain text, no diagrams.`;return(await t.generateContent(n)).response.text().trim()||null}catch(t){return console.error("Error:",t),null}},k=async(e,t,n)=>{try{const r=f.getGenerativeModel({model:p}),o=n?`

REAL RESEARCH FINDINGS:
${JSON.stringify(n).substring(0,2e4)}`:"",s=`Generate realistic data for a results table.

Topic: ${t?.topic||t?.title}
Subsection: ${e}
Methodology: ${t?.methodology||"quantitative"}${o}

${y}

Return a markdown table with 4-6 rows of realistic data based on the research findings provided. Use proper column headers and realistic values.`;return(await r.generateContent(s)).response.text().trim()}catch(r){return console.error("Error:",r),null}},G=async(e,t,n,r)=>{try{const o=f.getGenerativeModel({model:p}),s=r?`

REAL RESEARCH FINDINGS:
${JSON.stringify(r).substring(0,2e4)}`:"",l=`Generate data for a ${e} chart.

Topic: ${n?.topic||n?.title}
Subsection: ${t}${s}

Return in this exact format:
[CHART: ${e} | Chart Title | Label1: value, Label2: value, Label3: value, ...]

Use REAL data values from the research findings. For pie charts, values should sum to 100.`;return(await o.generateContent(l)).response.text().trim()}catch(o){return console.error("Error:",o),null}},P=async e=>{try{const t=f.getGenerativeModel({model:p}),n=e.chapters||{},r=Object.entries(n);if(r.length===0)return null;const o=r.map(([a,h])=>{const u=h.title||a,m=h.content||"";return`--- ${u} ---
${m||"No content available."}`}).join(`

`),s=`You are a thesis defence expert preparing a student for their viva voce.

THESIS TITLE: "${e.title||""}"
${e.researchTopic?`RESEARCH QUESTION: "${e.researchTopic}"`:""}
FIELD: ${e.field||""}
LEVEL: ${e.level||""}

The student has written the following chapters. Below is the actual content of each completed chapter.

${o}

Based on this content, think of every possible question a panel member could ask about this specific thesis. Cover all areas: rationale, methodology, findings, limitations, theoretical choices, literature gaps, and implications.

For each question, provide ONE clear answer. Write the answer in plain, basic English — as if you are explaining to someone who is new to academic work. Use simple words and short sentences. Do not use jargon unless absolutely necessary, and explain it if you do. The answer should be a moderate length — a few sentences that give the most correct and helpful explanation without being too short or too long.

Return ONLY valid JSON with chapter IDs as keys and arrays of {question, answer} objects. Example:
{"proposal":[{"question":"...","answer":"..."}],"chapter1":[{"question":"...","answer":"..."}]}`,d=(await t.generateContent(s)).response.text().match(/\{[\s\S]*\}/);if(d)try{return JSON.parse(d[0])}catch{}return null}catch(t){return console.error("Error generating defence questions:",t),null}},H=(e,t)=>!e||e.length===0?"":[...new Set(e)].sort().map(r=>{const o=r.split(/[, ]+/),s=o[0]||"Author",l=o[1]||"n.d.";switch(t){case"apa":return`${s}. (${l}). Title of the work. Publisher.`;case"mla":return`${s}. Title of the Work. Publisher, ${l}.`;case"chicago":return`${s}. ${l}. Title of the Work. Publisher.`;case"harvard":return`${s} (${l}). Title of the work. Publisher.`;default:return`${s} (${l})`}}).join(`
`),Y=async(e,t)=>{try{const n=f.getGenerativeModel({model:p}),r=e.substring(0,15e3),o=`Extract field-specific abbreviations from this thesis content. Only include abbreviations that are specialized technical terms relevant to the thesis topic or academic field.

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
- Return ONLY the JSON array, no other text`,s=await n.generateContent(o);return T(s.response.text())||[]}catch(n){return console.error("Error extracting abbreviations:",n),[]}},D=async(e,t)=>{try{const n=f.getGenerativeModel({model:p});let r="";Object.entries(t||{}).forEach(([d,a])=>{!a||typeof a!="object"||(r+=`
--- ${d} ---
`,Object.values(a).forEach(h=>{typeof h=="string"&&(r+=h.substring(0,3e3)+`
`)}))});const o=r.substring(0,5e4),s=`You are writing the abstract for an academic thesis.

THESIS TITLE: "${e?.title||""}"
${e?.topic?`RESEARCH QUESTION: "${e.topic}"`:""}
FIELD: ${e?.field||""}
LEVEL: ${e?.level||""}
METHODOLOGY: ${e?.methodology||""}

Below is the content of the thesis chapters. Read it and write a professional abstract.

THESIS CONTENT:
${o}

Write a concise academic abstract (200-350 words) that covers:
- Background and rationale for the study
- Research objectives or questions
- Methodology used
- Key findings and results
- Conclusions and implications

Use formal academic language in a single cohesive paragraph. Do not include headings, labels, or bracketed instructions. Return ONLY the abstract text.`;return(await n.generateContent(s)).response.text().trim()||null}catch(n){return console.error("Error generating abstract:",n),null}};export{Q as analyzeTranscriptText,L as applyFeedbackToContent,Y as extractAbbreviations,K as extractPaperMetadata,H as formatReferences,D as generateAbstract,N as generateAcademicContent,z as generateCaseStudyProtocol,G as generateChartData,U as generateConceptualFramework,k as generateDataTable,P as generateDefenceQuestions,j as generateDocumentAnalysisTemplate,Z as generateFocusGroupProtocol,_ as generateInterviewGuide,q as generateLiteratureMatrix,ee as generateObservationChecklist,te as generateQuestionnaire,$ as generateReferences,M as generateResearchDesignFlowchart,ne as generateSampleData,C as generateSubtopics,F as generateTheoreticalFramework,B as getWordCountPreset,x as humaniseContent,S as recommendLiteratureReviewType,v as selfReviewContent};
