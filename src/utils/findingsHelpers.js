export const parseCSV = (text) => {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return null;

  const firstLine = lines[0];
  const commaCount = (firstLine.match(/,/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const delimiter = tabCount > commaCount ? '\t' : ',';

  const headers = parseLine(firstLine, delimiter).map(h => h.trim().replace(/^"|"$/g, ''));
  const rows = lines.slice(1).map(line => parseLine(line, delimiter)).filter(r => r.length === headers.length);
  const totalRows = rows.length;

  const variables = headers.map((name, i) => {
    const values = rows.map(r => r[i]).filter(v => v !== '');
    const numericValues = values.map(v => parseFloat(v)).filter(v => !isNaN(v));
    const isNumeric = numericValues.length > 0 && numericValues.length >= values.length * 0.6;

    const variable = { name, type: isNumeric ? 'numeric' : 'categorical' };

    if (isNumeric) {
      variable.stats = computeNumericStats(numericValues);
      variable.values = numericValues;
    } else {
      variable.distribution = computeFrequencies(values);
    }

    return variable;
  });

  const demographicSummary = extractDemographics(variables);
  const keyFindings = generateKeyFindings(variables, totalRows);
  const surveyQuestions = buildSurveyQuestions(variables);

  return {
    totalResponses: totalRows,
    source: 'csv',
    demographicData: demographicSummary,
    responses: surveyQuestions,
    keyFindings,
    statisticalData: extractStatisticalData(variables),
    variables
  };
};

export const analyzeManualData = async (text, project, analyzeTextFn) => {
  const lines = text.split('\n').filter(line => line.trim());
  const totalResponses = lines.length;

  if (totalResponses <= 3) {
    const keyFindings = [];
    const responses = lines.map((line, i) => ({
      question: `Response ${i + 1}`,
      answer: line.trim()
    }));

    if (totalResponses >= 1) keyFindings.push(`Data contains ${totalResponses} response(s) ready for analysis`);
    if (totalResponses >= 2) keyFindings.push('Responses should be interpreted in the context of the research questions');
    if (totalResponses >= 3) keyFindings.push('Consider collecting additional data for more robust analysis');

    return {
      totalResponses,
      source: 'manual',
      demographicData: {},
      responses,
      keyFindings,
      statisticalData: {}
    };
  }

  if (analyzeTextFn) {
    try {
      return await analyzeTextFn(text, project);
    } catch (e) {
      console.warn('AI analysis failed, falling back to basic parsing:', e);
    }
  }

  return {
    totalResponses,
    source: 'manual',
    demographicData: {},
    responses: lines.map((line, i) => ({ question: `Entry ${i + 1}`, answer: line.trim() })),
    keyFindings: [`Processed ${totalResponses} entries`, 'Review data quality before generating Chapter 4'],
    statisticalData: {}
  };
};

export const exportToCSV = (extractedData) => {
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

export const formatKey = (key) => key.replace(/([A-Z])/g, ' $1').trim();

function parseLine(line, delimiter) {
  const values = [];
  let current = '';
  let inQuotes = false;
  for (const char of line) {
    if (char === '"') inQuotes = !inQuotes;
    else if (char === delimiter && !inQuotes) {
      values.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else current += char;
  }
  values.push(current.trim().replace(/^"|"$/g, ''));
  return values;
}

function computeNumericStats(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / values.length;
  const median = values.length % 2 === 0
    ? (sorted[values.length / 2 - 1] + sorted[values.length / 2]) / 2
    : sorted[Math.floor(values.length / 2)];
  const min = sorted[0];
  const max = sorted[values.length - 1];
  const variance = values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / values.length;
  const stdDev = Math.sqrt(variance);

  return { mean: round(mean, 1), median: round(median, 1), min, max, stdDev: round(stdDev, 1) };
}

function computeFrequencies(values) {
  const freq = {};
  values.forEach(v => { freq[v] = (freq[v] || 0) + 1; });
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
  return Object.fromEntries(sorted);
}

function extractDemographics(variables) {
  const demographic = {};
  const nameLower = variables.map(v => ({ ...v, lowerName: v.name.toLowerCase() }));

  const ageVar = nameLower.find(v =>
    ['age', 'age_range', 'age group', 'agegroup', 'age bracket'].includes(v.lowerName)
  );
  if (ageVar && ageVar.distribution) demographic.ageRanges = ageVar.distribution;

  const genderVar = nameLower.find(v =>
    ['gender', 'sex'].includes(v.lowerName)
  );
  if (genderVar && genderVar.distribution) demographic.gender = genderVar.distribution;

  const eduVar = nameLower.find(v =>
    ['education', 'educational level', 'qualification', 'education level'].includes(v.lowerName)
  );
  if (eduVar && eduVar.distribution) demographic.education = eduVar.distribution;

  return demographic;
}

function generateKeyFindings(variables, totalRows) {
  const findings = [];
  const categorical = variables.filter(v => v.type === 'categorical' && v.distribution);

  categorical.forEach(v => {
    const entries = Object.entries(v.distribution);
    if (entries.length > 0) {
      const top = entries[0];
      const pct = round((top[1] / totalRows) * 100, 0);
      findings.push(`${pct}% of respondents selected "${top[0]}" for ${v.name}`);
    }
  });

  const numeric = variables.filter(v => v.type === 'numeric' && v.stats);
  numeric.forEach(v => {
    if (v.stats) {
      findings.push(`The mean for ${v.name} was ${v.stats.mean} (SD = ${v.stats.stdDev}, range: ${v.stats.min}–${v.stats.max})`);
    }
  });

  if (findings.length === 0) {
    findings.push(`Analysis of ${totalRows} responses completed`);
  }

  if (findings.length > 6) {
    return findings.slice(0, 6);
  }

  return findings;
}

function buildSurveyQuestions(variables) {
  return variables
    .filter(v => v.type === 'categorical' && v.distribution)
    .map(v => ({
      question: v.name,
      answers: v.distribution
    }));
}

function extractStatisticalData(variables) {
  const stats = {};
  const ageVar = variables.find(v => v.name.toLowerCase().includes('age'));
  if (ageVar && ageVar.stats) stats.meanAge = ageVar.stats.mean;
  const numeric = variables.filter(v => v.type === 'numeric' && v.stats);
  if (numeric.length > 0) {
    numeric.forEach(v => {
      const key = v.name.replace(/[^a-zA-Z]/g, '').charAt(0).toLowerCase() + v.name.replace(/[^a-zA-Z]/g, '').slice(1) || 'variable';
      stats[key + 'Mean'] = v.stats.mean;
      stats[key + 'StdDev'] = v.stats.stdDev;
    });
  }
  return stats;
}

function round(num, decimals) {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
}
