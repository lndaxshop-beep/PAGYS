import{genAI as a,MODEL as s}from"./config-ZRg6eLvn.js";import{a as n}from"./sourceExtractor-CdYfTMU0.js";const p=async e=>{try{const t=a.getGenerativeModel({model:s}),o=`You are a research methodology expert. Generate realistic sample survey data for an academic study.

PROJECT TOPIC: "${e?.topic||e?.title||"A research study"}"
FIELD: ${e?.field||"Social Sciences"}
METHODOLOGY: ${e?.methodology||"quantitative"}
LEVEL: ${e?.level||"masters"}
ORGANIZATION: ${e?.organizationName||"Not specified"}

Generate a complete, realistic dataset that includes:
1. Total responses (between 30-80)
2. Demographic data (age ranges, gender distribution, education levels appropriate to the field)
3. 3-5 survey questions with realistic response distributions
4. At least 5 key findings derived from the data
5. Basic statistical measures

Return ONLY valid JSON with this exact structure:
{
  "totalResponses": number,
  "demographicData": {
    "ageRanges": { "18-25": number, "26-35": number, "36-45": number, "46-55": number, "55+": number },
    "gender": { "Male": number, "Female": number },
    "education": { "High School": number, "Bachelor's Degree": number, "Master's Degree": number, "PhD": number }
  },
  "responses": [
    {
      "question": "string",
      "answers": { "option1": count, "option2": count }
    }
  ],
  "keyFindings": ["string"],
  "statisticalData": { "meanAge": number, "satisfactionRate": number, "adoptionRate": number, "responseRate": number }
}

Make all data contextually realistic for the specific topic and field. Data must be internally consistent (percentages add up, demographic totals match totalResponses).`,c=(await t.generateContent(o)).response.text(),r=n(c);return r&&r.totalResponses?r:d(e)}catch(t){return console.error("Error generating sample data:",t),d(e)}},g=async(e,t)=>{try{const o=a.getGenerativeModel({model:s}),i=e.substring(0,2e4),c=`You are a qualitative research analyst. Analyze the following interview/transcript data and extract structured findings.

PROJECT TOPIC: "${t?.topic||t?.title||"Research Study"}"
FIELD: ${t?.field||"Social Sciences"}

TEXT TO ANALYZE:
${i}

Extract:
1. Total number of respondents/interviews
2. Main themes that emerged (3-6 themes)
3. For each theme: how many respondents mentioned it, key quotes, and a brief description
4. 5 key findings based on the analysis

Return ONLY valid JSON:
{
  "totalResponses": number,
  "themes": [
    { "name": "Theme Name", "frequency": number, "description": "string", "keyQuotes": ["quote1", "quote2"] }
  ],
  "demographicData": {},
  "responses": [
    { "question": "Key Theme: Theme Name", "answers": { "Mentioned": count, "Not mentioned": number } }
  ],
  "keyFindings": ["string"]
}`,u=(await o.generateContent(c)).response.text(),l=n(u);return l&&l.totalResponses?l:{totalResponses:0,themes:[],demographicData:{},responses:[],keyFindings:["Unable to analyze the provided text. Please check the format and try again."]}}catch(o){return console.error("Error analyzing transcript:",o),{totalResponses:0,themes:[],demographicData:{},responses:[],keyFindings:["Analysis failed. Please try again."]}}},d=e=>{const t=e?.field?.toLowerCase()||"",o=t.includes("education"),i=t.includes("business")||t.includes("management");return o?{totalResponses:48,demographicData:{ageRanges:{"18-25":8,"26-35":20,"36-45":12,"46-55":6,"55+":2},gender:{Male:18,Female:30},education:{"High School":5,"Bachelor's Degree":22,"Master's Degree":16,PhD:5}},responses:[{question:"How would you rate the current teaching methods?",answers:{"Very Poor":3,Poor:6,Average:14,Good:18,Excellent:7}},{question:"Which teaching resources do you use most?",answers:{Textbooks:38,"Digital Tools":32,"Lab Equipment":15,"Online Platforms":28,Charts:10}},{question:"How has technology impacted learning outcomes?",answers:{"Significantly Improved":20,Improved:16,"No Change":8,Declined:3,"Significantly Declined":1}}],keyFindings:["52% of educators rated current teaching methods as good or excellent","Digital tools and online platforms are widely adopted alongside traditional textbooks","Technology integration has positively impacted learning outcomes for 75% of respondents","Experienced educators show higher satisfaction with existing resources","Budget constraints remain the primary barrier to accessing advanced teaching resources"],statisticalData:{meanAge:34.6,satisfactionRate:3.8,adoptionRate:.75,responseRate:.88}}:i?{totalResponses:55,demographicData:{ageRanges:{"18-25":12,"26-35":24,"36-45":13,"46-55":4,"55+":2},gender:{Male:30,Female:25},education:{"High School":6,"Bachelor's Degree":28,"Master's Degree":18,PhD:3}},responses:[{question:"What factors influence your business decisions most?",answers:{Cost:42,Quality:38,"Customer Demand":45,"Market Trends":30,Regulations:18}},{question:"How frequently does your organization adopt new technology?",answers:{"Very Frequently":10,Frequently:20,Occasionally:15,Rarely:7,Never:3}},{question:"Rate the effectiveness of current management strategies",answers:{"Very Effective":8,Effective:22,Neutral:15,Ineffective:7,"Very Ineffective":3}}],keyFindings:["Customer demand and cost are the primary drivers of business decisions","55% of organizations adopt new technology frequently or very frequently","Management strategies are rated effective by 55% of respondents","Smaller organizations show greater agility in technology adoption","Market trends have growing influence on strategic planning"],statisticalData:{meanAge:33.2,satisfactionRate:3.6,adoptionRate:.55,responseRate:.9}}:{totalResponses:52,demographicData:{ageRanges:{"18-25":15,"26-35":22,"36-45":10,"46-55":4,"55+":1},gender:{Male:28,Female:24},education:{"High School":8,"Bachelor's Degree":25,"Master's Degree":15,PhD:4}},responses:[{question:"How frequently do you use technology in your daily work?",answers:{Never:1,Rarely:4,Sometimes:10,Often:22,"Very Often":15}},{question:"What technology tools do you currently use?",answers:{Smartphones:48,"Laptops/Computers":45,Tablets:18,"Software Applications":35,"Cloud Services":28}},{question:"How has technology impacted your work efficiency?",answers:{"Significantly Improved":25,Improved:18,"No Change":6,Declined:2,"Significantly Declined":1}}],keyFindings:["85% of respondents use technology frequently in their work","Smartphones and laptops are the most commonly used tools","Technology has improved efficiency for 83% of users","Younger respondents (18-35) show higher adoption rates","Cloud services adoption is growing but remains lower than traditional tools"],statisticalData:{meanAge:32.4,satisfactionRate:4.2,adoptionRate:.85,responseRate:.92}}},y=async e=>{try{const t=a.getGenerativeModel({model:s}),o=`You are an expert research methodology advisor. Generate a complete, research-specific questionnaire.

PROJECT TITLE: "${e.title}"
FIELD: ${e.field}
METHODOLOGY: ${e.methodology||"mixed methods"}
ACADEMIC LEVEL: ${e.level}
${e.topic?`RESEARCH QUESTION(S): ${e.topic}`:""}
${e.organizationName?`ORGANIZATION/CASE STUDY: ${e.organizationName}`:""}

Your task is to design every questionnaire item so that it directly investigates the research topic and addresses the research question(s). No generic or filler questions. Each substantive question should measure a specific variable, concept, or relationship from the study. Use your expertise to determine the optimal number and mix of questions — do not limit yourself to a fixed count. Include enough items to produce valid, publishable results at the ${e.level} level.

Return ONLY valid JSON in this structure:
{
  "title": "Research Questionnaire: [Project Title]",
  "sections": [
    {
      "sectionName": "Section A: Demographics",
      "questions": [
        { "text": "What is your age range?", "type": "multiple-choice", "options": ["18-25", "26-35", "36-45", "46-55", "55+"] }
      ]
    },
    {
      "sectionName": "Section B: [Theme directly tied to the research]",
      "questions": [
        { "text": "Question that measures a specific research variable", "type": "likert", "options": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"] }
      ]
    }
  ]
}

Available question types: multiple-choice, likert, checkbox, scale, open-ended, ranking.

Rules:
- Demographic section should include standard fields (age, gender, education, experience, etc.) relevant to the study population.
- Every substantive question after demographics must map directly to the research question(s) or a key variable in the study.
- Use a mix of question types appropriate for the methodology and level of research.
- Organize questions into thematic sections, each targeting a different dimension of the research.
- For Likert-scale questions, tailor the scale wording to the construct being measured.
- Include open-ended questions where qualitative depth is needed.
- Do NOT include generic questions unrelated to the specific research topic.

Return ONLY valid JSON.`,i=await t.generateContent(o);return n(i.response.text())}catch(t){return console.error("Error generating questionnaire:",t),null}},f=async e=>{try{const t=a.getGenerativeModel({model:s}),o=`You are an expert qualitative researcher. Generate a semi-structured interview guide tailored to the specific research study.

PROJECT TITLE: "${e.title}"
FIELD: ${e.field}
METHODOLOGY: ${e.methodology||"qualitative"}
ACADEMIC LEVEL: ${e.level}
${e.topic?`RESEARCH QUESTION(S): ${e.topic}`:""}
${e.organizationName?`ORGANIZATION/CASE STUDY: ${e.organizationName}`:""}

Your task is to design interview questions and probes that directly explore the research question(s). Every core question should investigate a specific aspect of the study. Do not limit yourself to a fixed number of questions — generate as many as needed to comprehensively cover all dimensions of the research at the ${e.level} level.

Return ONLY valid JSON in this structure:
{
  "title": "Interview Guide: [Project Title]",
  "estimatedDuration": "45-60 minutes",
  "sections": [
    {
      "sectionName": "Introduction & Consent",
      "items": [
        { "type": "script", "content": "Welcome and introduction script specific to this study..." },
        { "type": "note", "content": "Researcher note about ethical considerations..." }
      ]
    },
    {
      "sectionName": "Background & Context",
      "items": [
        { "type": "question", "text": "Question that establishes participant background relevant to the study", "probes": ["Probe that digs deeper into a specific aspect", "Another probe"] }
      ]
    },
    {
      "sectionName": "Core Research Themes",
      "items": [
        { "type": "question", "text": "Question exploring a specific research question", "probes": ["Follow-up probe", "Clarifying probe"] }
      ]
    }
  ]
}

Item types: script, question, note, probe.

Rules:
- The introduction script should reference the actual research topic and study purpose.
- Warm-up questions should naturally lead into the research domain — avoid generic icebreakers.
- Every core question must map to at least one research question or study objective.
- Include detailed probes for each core question to help the interviewer dig deeper.
- Organize questions into logical sections that build from broad context to specific research themes.
- Include a closing section that allows participants to add anything not covered.
- The depth and number of questions should be appropriate for the academic level and methodology.

Return ONLY valid JSON.`,i=await t.generateContent(o);return n(i.response.text())}catch(t){return console.error("Error generating interview guide:",t),null}},v=async e=>{try{const t=a.getGenerativeModel({model:s}),o=`You are an expert in qualitative focus group methodology. Generate a discussion protocol tailored to the specific research study.

PROJECT TITLE: "${e.title}"
FIELD: ${e.field}
METHODOLOGY: ${e.methodology||"qualitative"}
ACADEMIC LEVEL: ${e.level}
${e.topic?`RESEARCH QUESTION(S): ${e.topic}`:""}
${e.organizationName?`ORGANIZATION/CASE STUDY: ${e.organizationName}`:""}

Your task is to design discussion topics and activities that directly investigate the research question(s) through group interaction. Every discussion topic must explore a specific dimension of the study. Generate as many topics and activities as needed to comprehensively cover the research at the ${e.level} level — do not limit yourself to a fixed count.

Return ONLY valid JSON in this structure:
{
  "title": "Focus Group Protocol: [Project Title]",
  "totalDuration": "90 minutes",
  "sections": [
    {
      "sectionName": "Welcome & Ground Rules",
      "duration": "10 min",
      "facilitatorNotes": "Notes specific to this study's context and ethical considerations",
      "items": [
        { "type": "script", "content": "Welcome script that introduces the actual research topic..." },
        { "type": "activity", "name": "Brief introduction round", "instructions": "Each participant shares their name and their connection to the research topic..." }
      ]
    },
    {
      "sectionName": "Discussion Topic 1: [Theme from the research]",
      "duration": "15 min",
      "facilitatorNotes": "What the facilitator should listen for in responses",
      "items": [
        { "type": "question", "text": "Discussion question exploring a specific research dimension", "instructions": "Allow open discussion, encourage all participants to share" }
      ]
    }
  ]
}

Item types: script, question, activity, note.

Rules:
- The welcome script must reference the actual research topic and study purpose.
- The icebreaker should transition participants into thinking about the research domain.
- Every discussion topic must explore a specific research question or theme from the study.
- Include facilitator notes for each section describing what to listen for and how to manage discussion.
- Organize topics so they build from general perceptions to deeper analysis of the research problem.
- Include a wrap-up section that summarizes key themes and invites final reflections.
- The number and depth of topics should be appropriate for the academic level and research scope.

Return ONLY valid JSON.`,i=await t.generateContent(o);return n(i.response.text())}catch(t){return console.error("Error generating focus group protocol:",t),null}},b=async e=>{try{const t=a.getGenerativeModel({model:s}),o=`You are an expert in observational research methodology. Generate a structured observation checklist tailored to the specific research study.

PROJECT TITLE: "${e.title}"
FIELD: ${e.field}
METHODOLOGY: ${e.methodology||"qualitative"}
ACADEMIC LEVEL: ${e.level}
${e.topic?`RESEARCH QUESTION(S): ${e.topic}`:""}
${e.organizationName?`ORGANIZATION/CASE STUDY: ${e.organizationName}`:""}

Your task is to design every field, indicator, and observation item so that it directly measures evidence related to the research question(s). No generic or boilerplate items. Generate as many indicators as needed to comprehensively observe all dimensions of the research at the ${e.level} level.

Return ONLY valid JSON in this structure:
{
  "title": "Observation Checklist: [Project Title]",
  "sections": [
    {
      "sectionName": "Context Information",
      "fields": [
        { "label": "Date", "type": "text" },
        { "label": "Location", "type": "text" },
        { "label": "Observer Name", "type": "text" }
      ]
    },
    {
      "sectionName": "Behavioral Indicators",
      "indicators": [
        { "label": "Specific observable behavior tied to the research topic", "type": "count" },
        { "label": "Quality of interaction related to a study variable", "type": "rating", "scale": [1, 2, 3, 4, 5] }
      ]
    }
  ]
}

Field types: text, select, count, rating, yes-no, duration, checkbox.

Rules:
- Context fields should include information relevant to the specific observation setting for this study.
- Every behavioral indicator must be an observable measure of a specific research variable or concept.
- Use a mix of field types appropriate for what is being observed (counts, ratings, checkboxes, etc.).
- Organize indicators into logical sections (e.g., behavioral indicators, environmental factors, interaction patterns).
- Each indicator label should describe exactly what the observer should look for, specific to the research context.
- For rating scales, tailor the scale anchors to the construct being measured.
- The number and specificity of indicators should be appropriate for the academic level and research scope.

Return ONLY valid JSON.`,i=await t.generateContent(o);return n(i.response.text())}catch(t){return console.error("Error generating observation checklist:",t),null}},E=async e=>{try{const t=a.getGenerativeModel({model:s}),o=`You are an expert in document analysis and content analysis methodology. Generate a document analysis template tailored to the specific research study.

PROJECT TITLE: "${e.title}"
FIELD: ${e.field}
METHODOLOGY: ${e.methodology||"qualitative"}
ACADEMIC LEVEL: ${e.level}
${e.topic?`RESEARCH QUESTION(S): ${e.topic}`:""}
${e.organizationName?`ORGANIZATION/CASE STUDY: ${e.organizationName}`:""}

Your task is to design classification fields, coding categories, and analysis criteria that directly map to the research question(s). The coding framework must enable systematic extraction of data relevant to the study. Generate as many codes and fields as needed to thoroughly analyze documents at the ${e.level} level — do not limit yourself to a fixed count.

Return ONLY valid JSON in this structure:
{
  "title": "Document Analysis Template: [Project Title]",
  "sections": [
    {
      "sectionName": "Document Classification",
      "fields": [
        { "label": "Document Type", "type": "select", "options": ["Policy", "Report", "Memo", "Email", "Meeting Minutes", "Other"] },
        { "label": "Date Created", "type": "text" },
        { "label": "Author/Source", "type": "text" }
      ]
    },
    {
      "sectionName": "Content Coding Framework",
      "codes": [
        { "code": "C1", "label": "Theme directly tied to a research question", "description": "Specific description of what to look for in the document" }
      ]
    }
  ]
}

Field types: text, select, count, rating, yes-no, duration, checkbox, textarea.

Rules:
- Classification fields should capture metadata relevant to the document types being analyzed in this study.
- Every coding category must map to a specific research question, variable, or theoretical concept.
- Each code should have a clear description of what evidence to look for in the documents.
- Include extraction fields that capture data points needed to answer the research questions.
- Include analysis criteria for evaluating document credibility, relevance, and bias in the context of this study.
- Organize codes into thematic sections that align with the study's conceptual framework.
- The number and depth of codes should be appropriate for the academic level and research scope.

Return ONLY valid JSON.`,i=await t.generateContent(o);return n(i.response.text())}catch(t){return console.error("Error generating document analysis template:",t),null}},O=async e=>{try{const t=a.getGenerativeModel({model:s}),o=`You are an expert in case study research methodology. Generate a comprehensive research protocol tailored to the specific study.

PROJECT TITLE: "${e.title}"
FIELD: ${e.field}
METHODOLOGY: ${e.methodology||"qualitative"}
ACADEMIC LEVEL: ${e.level}
${e.topic?`RESEARCH QUESTION(S): ${e.topic}`:""}
${e.organizationName?`ORGANIZATION/CASE STUDY: ${e.organizationName}`:""}

Your task is to design every element of the case study protocol — case selection, data sources, triangulation, and validity measures — so that each is specifically tailored to the research question(s). No boilerplate or generic criteria. Generate as many items as needed to produce a rigorous protocol at the ${e.level} level.

Return ONLY valid JSON in this structure:
{
  "title": "Case Study Protocol: [Project Title]",
  "sections": [
    {
      "sectionName": "Case Selection Criteria",
      "criteria": [
        { "criterion": "Criterion directly tied to the research question", "description": "Specific explanation of why this criterion matters for this study" }
      ]
    },
    {
      "sectionName": "Data Collection Plan",
      "sources": [
        { "source": "Interviews with stakeholders related to the case", "type": "primary", "participants": "5-10", "duration": "45-60 min each" },
        { "source": "Documents specific to the case context", "type": "secondary", "description": "Specific document types relevant to this study" }
      ]
    },
    {
      "sectionName": "Triangulation Strategy",
      "description": "How multiple data sources will be used to validate findings for this specific study",
      "methods": ["Specific triangulation method 1 tied to the research", "Specific triangulation method 2"]
    }
  ]
}

Rules:
- Every case selection criterion must be directly relevant to the research question(s) and study context.
- Every data source must be justified by what it contributes to answering the research question(s).
- The triangulation strategy must describe how findings will be cross-validated for this specific study.
- Include validity and reliability measures specific to the case study design.
- Include an ethical considerations section relevant to the study context and participants.
- Include a timeline with phases appropriate for the scope and level of the research.
- The depth and rigor should be appropriate for the academic level.

Return ONLY valid JSON.`,i=await t.generateContent(o);return n(i.response.text())}catch(t){return console.error("Error generating case study protocol:",t),null}},N=async e=>{try{const t=a.getGenerativeModel({model:s}),o=`You are an expert research methodology advisor. Based on the following research project, recommend the most appropriate literature review type.

PROJECT TITLE: "${e.title}"
FIELD: ${e.field}
METHODOLOGY: ${e.methodology||"Not specified"}
ACADEMIC LEVEL: ${e.level}

Available literature review types:
1. descriptive - Summarizes and describes existing literature without critical evaluation. Best for introductory research, mapping a field, undergraduate theses.
2. analytical - Compares and contrasts different studies, identifies patterns and themes. Best for most masters theses, identifying research gaps.
3. critical - Evaluates strengths and weaknesses of existing research, challenges assumptions. Best for PhD theses, developing new theoretical frameworks.
4. systematic - Comprehensive, methodical review following strict protocols. Best for sciences, medical research, evidence-based practice.

Return ONLY valid JSON in this structure:
{
  "recommendedType": "analytical",
  "reason": "Specific paragraph explaining why this type is best for this particular project, referencing the topic, field, and methodology.",
  "approach": "Concise paragraph describing how to approach the review using this type.",
  "keyElements": ["Element 1", "Element 2", "Element 3", "Element 4"]
}`,i=await t.generateContent(o);return n(i.response.text())}catch(t){return console.error("Error recommending literature review type:",t),null}};export{g as a,E as b,v as c,f as d,b as e,y as f,O as g,p as h,N as r};
