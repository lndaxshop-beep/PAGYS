// Generate AI sample data based on project info
export const generateAIData = (project) => ({
  totalResponses: 52,
  demographicData: {
    ageRanges: { '18-25': 15, '26-35': 22, '36-45': 10, '46-55': 4, '55+': 1 },
    gender: { Male: 28, Female: 24 },
    education: { 'High School': 8, "Bachelor's Degree": 25, "Master's Degree": 15, PhD: 4 }
  },
  responses: [
    {
      question: 'How frequently do you use technology in your daily work?',
      answers: { Never: 1, Rarely: 4, Sometimes: 10, Often: 22, 'Very Often': 15 }
    },
    {
      question: 'What technology tools do you currently use?',
      answers: { Smartphones: 48, 'Laptops/Computers': 45, Tablets: 18, 'Software Applications': 35, 'Cloud Services': 28 }
    },
    {
      question: 'How has technology impacted your work efficiency?',
      openEnded: ['Increased productivity significantly', 'Made communication faster', 'Reduced manual errors', 'Enabled remote work', 'Streamlined processes']
    }
  ],
  keyFindings: [
    '85% of respondents use technology frequently in their work',
    'Younger respondents (18-35) show higher adoption rates',
    'Cost and training are the main barriers to adoption',
    'Technology has improved efficiency for 78% of users',
    'Mobile devices are the most commonly used tools'
  ],
  statisticalData: { meanAge: 32.4, satisfactionRate: 4.2, adoptionRate: 0.85, responseRate: 0.92 }
});

// Generate sample data from uploaded files
export const generateUploadData = () => ({
  totalResponses: 45,
  demographicData: {
    ageRanges: { '18-25': 12, '26-35': 18, '36-45': 8, '46-55': 5, '55+': 2 },
    gender: { Male: 22, Female: 23 },
    education: { 'High School': 8, "Bachelor's Degree": 25, "Master's Degree": 10, PhD: 2 }
  },
  responses: [
    {
      question: 'How frequently do you use technology in your daily work?',
      answers: { Never: 2, Rarely: 5, Sometimes: 12, Often: 18, 'Very Often': 8 }
    },
    {
      question: 'What technology tools do you currently use?',
      answers: { Smartphones: 40, 'Laptops/Computers': 38, Tablets: 15, 'POS Systems': 22, 'Accounting Software': 18, 'CRM Software': 12, Other: 5 }
    },
    {
      question: 'What challenges have you faced with technology adoption?',
      openEnded: ['High implementation costs', 'Staff training requirements', 'Technical issues', 'Resistance to change', 'Data security concerns']
    }
  ],
  keyFindings: [
    '85% of respondents use technology daily in their work',
    'Smartphones and laptops are the most commonly used tools',
    'Efficiency improvement is the most cited benefit',
    'Cost and training are the main challenges',
    'Younger employees show higher adoption rates'
  ]
});

// Parse manual data entries into structured format
export const parseManualData = (manualText) => {
  const lines = manualText.split('\n').filter(line => line.trim());
  return {
    totalResponses: lines.length,
    responses: lines.map((line, index) => ({ question: `Response ${index + 1}`, answer: line })),
    keyFindings: [`Processed ${lines.length} manual entries`, 'Data ready for Chapter 4 generation']
  };
};

// Export extracted data as CSV
export const exportToCSV = (extractedData, projectTitle) => {
  let csvContent = 'Question,Answer,Count\n';
  if (extractedData.responses) {
    extractedData.responses.forEach(item => {
      if (item.answers) {
        Object.entries(item.answers).forEach(([answer, count]) => {
          csvContent += `"${item.question}","${answer}",${count}\n`;
        });
      } else if (item.openEnded) {
        item.openEnded.forEach(answer => {
          csvContent += `"${item.question}","${answer}",1\n`;
        });
      }
    });
  }
  return csvContent;
};

// Format a camelCase key to readable label
export const formatKey = (key) => key.replace(/([A-Z])/g, ' $1').trim();
