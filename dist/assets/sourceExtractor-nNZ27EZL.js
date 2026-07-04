import{genAI as g,MODEL as p}from"./config-DCzKqYyT.js";const y=["in this contemporary world","in today's rapidly evolving society","in today's modern world","in today's rapidly evolving world","in today's digital age","in the current digital era","in the modern era","in this day and age","it is important to note that","it is worth noting that","it should be noted that","this study aims to","this research aims to","the aim of this research","the purpose of this study","there has been a growing interest in","this highlights the significance of","the realm of","a myriad of","a plethora of","delves into","navigates the complexities of","paves the way for","sets the stage for","a large body of research","a growing body of evidence","a growing body of literature","it is widely accepted that","it is generally agreed that"],v=t=>{if(!t)return"";let e=t;e=e.replace(/^#{1,6}\s+/gm,""),e=e.replace(/\*\*(.*?)\*\*/g,"$1"),e=e.replace(/\*(.*?)\*/g,"$1"),e=e.replace(/<p[^>]*>/gi,`
`),e=e.replace(/<\/p>/gi,""),e=e.replace(/<center>/gi,""),e=e.replace(/<\/center>/gi,""),e=e.replace(/<br\s*\/?>/gi,""),e=e.replace(/<div[^>]*>/gi,""),e=e.replace(/<\/div>/gi,""),e=e.replace(/<span[^>]*>/gi,""),e=e.replace(/<\/span>/gi,""),e=e.replace(/<strong>/gi,""),e=e.replace(/<\/strong>/gi,""),e=e.replace(/<em>/gi,""),e=e.replace(/<\/em>/gi,""),e=e.replace(/\(Word Count:?\s*\d+\s*words?\)/gi,""),e=e.replace(/\n*Word Count:?\s*\d+\s*words?\n*/gi,""),e=e.replace(/^.*Syntax error in text.*$/gm,"");for(const a of y){const r=new RegExp(`\\s*${a.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}\\s*,?\\s*`,"gi");r.test(e)&&(e=e.replace(r," "))}return e=e.replace(/\s*—\s*/g,", "),e=e.replace(/\n{3,}/g,`

`),e=f(e),e=S(e),e=e.trim(),e},f=t=>t.replace(/```(mermaid|chart|table|diagram|graph)\s*[\s\S]*?```\s*/gi,""),h=new Set(["/","\\","^","_","=","*"]),w=/^[A-Z][a-zA-Z\s]{2,60}$/,S=t=>{const e=t.split(`
`),a=[];let r=0;for(;r<e.length;){const o=e[r],i=o.replace(/\s/g,"");if(i.length>0&&[...i].filter(n=>h.has(n)).length/i.length>=.25){for(r++;r<e.length;){const n=e[r],l=n.replace(/\s/g,""),d=[...l].filter(u=>h.has(u)).length;if((l.length>0?d/l.length:0)<.25&&!w.test(n.trim()))break;r++}continue}a.push(o),r++}return a.join(`
`)},c=t=>{if(!t)return null;const e=t.match(/\{[\s\S]*?\}/);if(e)try{return JSON.parse(e[0])}catch{}const a=t.match(/\{[\s\S]*\}/);if(a)try{return JSON.parse(a[0])}catch{}return null},b=t=>{if(!t)return null;const e=t.match(/\[[\s\S]*?\]/);if(e)try{return JSON.parse(e[0])}catch{}const a=t.match(/\[[\s\S]*\]/);if(a)try{return JSON.parse(a[0])}catch{}return null},F=async(t,e)=>{try{const a=g.getGenerativeModel({model:p});let r;if(e==="image"){r=`You are an academic librarian. Analyze this screenshot/image of a research paper and extract its key metadata.

Return ONLY valid JSON with this exact structure:
{
  "title": "Full paper title",
  "authors": "Author names",
  "year": 2023,
  "journal": "Journal name or venue",
  "methodology": "quantitative/qualitative/mixed/review/theoretical",
  "sampleSize": "description or number",
  "keyFindings": ["Finding 1", "Finding 2", "Finding 3"],
  "theoreticalFramework": "Name of theory/framework used",
  "limitations": ["Limitation 1", "Limitation 2"],
  "relevanceToTopic": "high/medium/low"
}

If you cannot read the image content clearly, return null.`;const s=[{inlineData:{mimeType:t.match(/^data:([^;]+);/)?.[1]||"image/png",data:t.replace(/^data:image\/\w+;base64,/,"")}},{text:r}],n=(await a.generateContent({contents:[{role:"user",parts:s}]})).response.text();return c(n)}r=`You are an academic librarian. Extract the key metadata from the following research paper text.

PAPER TEXT:
${t.substring(0,2e4)}

Return ONLY valid JSON with this exact structure:
{
  "title": "Full paper title",
  "authors": "Author names",
  "year": 2023,
  "journal": "Journal name or venue (if identifiable)",
  "methodology": "quantitative/qualitative/mixed/review/theoretical",
  "sampleSize": "Description of sample or 'N/A'",
  "keyFindings": ["Finding 1", "Finding 2", "Finding 3"],
  "theoreticalFramework": "Name of theory/framework used or 'Not specified'",
  "limitations": ["Limitation 1", "Limitation 2"] if mentioned, otherwise empty array,
  "relevanceToTopic": "high/medium/low"
}

If the text does not appear to be a research paper or academic article, return null.`;const i=(await a.generateContent(r)).response.text();return c(i)}catch(a){return console.error("Error extracting paper metadata:",a),null}},N=async(t,e)=>{if(!t||t.length===0)return null;try{const a=g.getGenerativeModel({model:p}),r=JSON.stringify(t,null,2),o=`You are a research synthesis expert. Create a literature matrix comparing the following research papers for a thesis.

PROJECT TOPIC: "${e?.topic||e?.title||"Research Study"}"
FIELD: ${e?.field||"Social Sciences"}

PAPERS:
${r.substring(0,25e3)}

Generate a literature matrix as a JSON object with:
1. A summary paragraph synthesizing the key themes across all papers
2. A matrix table with rows = papers and columns: Author(s), Year, Methodology, Sample Size, Key Findings, Theoretical Framework, Limitations
3. A list of research gaps identified from the literature

Return ONLY valid JSON:
{
  "summary": "Synthesis paragraph...",
  "matrixHeaders": ["Author(s)", "Year", "Methodology", "Sample Size", "Key Findings", "Theoretical Framework", "Limitations"],
  "matrixRows": [
    ["Author", 2023, "quantitative", "N=200", "Finding summary", "TAM", "Limitation"]
  ],
  "researchGaps": ["Gap 1", "Gap 2"],
  "recommendedDirection": "Brief suggestion for the thesis based on this literature"
}`,s=(await a.generateContent(o)).response.text();return c(s)}catch(a){return console.error("Error generating literature matrix:",a),null}};export{c as a,b,v as c,F as e,N as g};
