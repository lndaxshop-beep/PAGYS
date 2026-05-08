import { genAI, MODEL } from './config';
import { extractJSON } from './utils';

export const generateSampleData = async (project) => {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL });
    const prompt = `You are a research methodology expert. Generate realistic sample survey data for an academic study.

PROJECT TOPIC: "${project?.topic || project?.title || 'A research study'}"
FIELD: ${project?.field || 'Social Sciences'}
METHODOLOGY: ${project?.methodology || 'quantitative'}
LEVEL: ${project?.level || 'masters'}
ORGANIZATION: ${project?.organizationName || 'Not specified'}

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

Make all data contextually realistic for the specific topic and field. Data must be internally consistent (percentages add up, demographic totals match totalResponses).`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = extractJSON(text);
    if (parsed && parsed.totalResponses) return parsed;
    return getDefaultSampleData(project);
  } catch (error) {
    console.error('Error generating sample data:', error);
    return getDefaultSampleData(project);
  }
};

export const analyzeTranscriptText = async (text, project) => {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL });
    const truncated = text.substring(0, 20000);
    const prompt = `You are a qualitative research analyst. Analyze the following interview/transcript data and extract structured findings.

PROJECT TOPIC: "${project?.topic || project?.title || 'Research Study'}"
FIELD: ${project?.field || 'Social Sciences'}

TEXT TO ANALYZE:
${truncated}

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
}`;

    const result = await model.generateContent(prompt);
    const text_result = result.response.text();
    const parsed = extractJSON(text_result);
    if (parsed && parsed.totalResponses) return parsed;
    return {
      totalResponses: 0, themes: [], demographicData: {}, responses: [],
      keyFindings: ['Unable to analyze the provided text. Please check the format and try again.']
    };
  } catch (error) {
    console.error('Error analyzing transcript:', error);
    return {
      totalResponses: 0, themes: [], demographicData: {}, responses: [],
      keyFindings: ['Analysis failed. Please try again.']
    };
  }
};

const getDefaultSampleData = (project) => {
  const field = project?.field?.toLowerCase() || '';
  const isEducation = field.includes('education');
  const isBusiness = field.includes('business') || field.includes('management');

  if (isEducation) {
    return {
      totalResponses: 48,
      demographicData: {
        ageRanges: { '18-25': 8, '26-35': 20, '36-45': 12, '46-55': 6, '55+': 2 },
        gender: { Male: 18, Female: 30 },
        education: { 'High School': 5, "Bachelor's Degree": 22, "Master's Degree": 16, PhD: 5 }
      },
      responses: [
        { question: 'How would you rate the current teaching methods?', answers: { 'Very Poor': 3, Poor: 6, Average: 14, Good: 18, Excellent: 7 } },
        { question: 'Which teaching resources do you use most?', answers: { Textbooks: 38, 'Digital Tools': 32, 'Lab Equipment': 15, 'Online Platforms': 28, Charts: 10 } },
        { question: 'How has technology impacted learning outcomes?', answers: { 'Significantly Improved': 20, Improved: 16, 'No Change': 8, Declined: 3, 'Significantly Declined': 1 } }
      ],
      keyFindings: [
        '52% of educators rated current teaching methods as good or excellent',
        'Digital tools and online platforms are widely adopted alongside traditional textbooks',
        'Technology integration has positively impacted learning outcomes for 75% of respondents',
        'Experienced educators show higher satisfaction with existing resources',
        'Budget constraints remain the primary barrier to accessing advanced teaching resources'
      ],
      statisticalData: { meanAge: 34.6, satisfactionRate: 3.8, adoptionRate: 0.75, responseRate: 0.88 }
    };
  }

  if (isBusiness) {
    return {
      totalResponses: 55,
      demographicData: {
        ageRanges: { '18-25': 12, '26-35': 24, '36-45': 13, '46-55': 4, '55+': 2 },
        gender: { Male: 30, Female: 25 },
        education: { 'High School': 6, "Bachelor's Degree": 28, "Master's Degree": 18, PhD: 3 }
      },
      responses: [
        { question: 'What factors influence your business decisions most?', answers: { Cost: 42, Quality: 38, 'Customer Demand': 45, 'Market Trends': 30, Regulations: 18 } },
        { question: 'How frequently does your organization adopt new technology?', answers: { 'Very Frequently': 10, Frequently: 20, Occasionally: 15, Rarely: 7, Never: 3 } },
        { question: 'Rate the effectiveness of current management strategies', answers: { 'Very Effective': 8, Effective: 22, Neutral: 15, Ineffective: 7, 'Very Ineffective': 3 } }
      ],
      keyFindings: [
        'Customer demand and cost are the primary drivers of business decisions',
        '55% of organizations adopt new technology frequently or very frequently',
        'Management strategies are rated effective by 55% of respondents',
        'Smaller organizations show greater agility in technology adoption',
        'Market trends have growing influence on strategic planning'
      ],
      statisticalData: { meanAge: 33.2, satisfactionRate: 3.6, adoptionRate: 0.55, responseRate: 0.9 }
    };
  }

  return {
    totalResponses: 52,
    demographicData: {
      ageRanges: { '18-25': 15, '26-35': 22, '36-45': 10, '46-55': 4, '55+': 1 },
      gender: { Male: 28, Female: 24 },
      education: { 'High School': 8, "Bachelor's Degree": 25, "Master's Degree": 15, PhD: 4 }
    },
    responses: [
      { question: 'How frequently do you use technology in your daily work?', answers: { Never: 1, Rarely: 4, Sometimes: 10, Often: 22, 'Very Often': 15 } },
      { question: 'What technology tools do you currently use?', answers: { Smartphones: 48, 'Laptops/Computers': 45, Tablets: 18, 'Software Applications': 35, 'Cloud Services': 28 } },
      { question: 'How has technology impacted your work efficiency?', answers: { 'Significantly Improved': 25, Improved: 18, 'No Change': 6, Declined: 2, 'Significantly Declined': 1 } }
    ],
    keyFindings: [
      '85% of respondents use technology frequently in their work',
      'Smartphones and laptops are the most commonly used tools',
      'Technology has improved efficiency for 83% of users',
      'Younger respondents (18-35) show higher adoption rates',
      'Cloud services adoption is growing but remains lower than traditional tools'
    ],
    statisticalData: { meanAge: 32.4, satisfactionRate: 4.2, adoptionRate: 0.85, responseRate: 0.92 }
  };
};
