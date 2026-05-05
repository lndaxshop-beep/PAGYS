import { useState } from 'react';

const defaultForm = {
  title: '', level: 'undergraduate', field: '', topic: '', methodology: '', referenceStyle: 'apa',
};

export const useDashboardForm = (onSuccess) => {
  const [form, setForm] = useState(defaultForm);
  const [useOrganization, setUseOrganization] = useState(false);
  const [organizationName, setOrganizationName] = useState('');
  const [hideOrganization, setHideOrganization] = useState(false);
  const [questionModal, setQuestionModal] = useState(null);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const generateResearchQuestions = async () => {
    if (!form.title) { alert('Please enter a thesis title first'); return; }
    let questions = [];
    setLoadingQuestions(true);
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent(`You are an academic research advisor. Generate 6 professional, SHORT research questions for a thesis.

TOPIC: "${form.title}"
FIELD: ${form.field || 'general'}
LEVEL: ${form.level}
${organizationName ? `ORGANIZATION: ${organizationName}` : ''}

Requirements:
- Keep each question SHORT and DIRECT (under 15 words)
- Use simple, clear language
- Return ONLY a numbered list, one question per line

Examples:
1. How does AI affect cancer diagnosis accuracy?
2. What is the effect of water pH on maize germination?
3. How does internal auditing reduce fraud in banks?`);
      const text = result.response.text();
      questions = text.split('\n').filter(l => l.match(/^\d+\.\s/)).map(l => l.replace(/^\d+\.\s*/, '').trim()).slice(0, 8);
    } catch (e) {
      console.error('AI question generation failed:', e);
    }
    setLoadingQuestions(false);
    if (!questions.length) {
      questions = [
        `How does ${form.title} affect key outcomes in ${form.field || 'general'}?`,
        `What factors influence the effectiveness of ${form.title}?`,
        `How does ${form.title} vary across different contexts?`,
        `What are the main barriers to implementing ${form.title}?`,
        `How do stakeholders perceive the impact of ${form.title}?`,
        `What strategies improve the outcomes of ${form.title}?`,
      ];
    }
    setQuestionModal({
      title: form.title, questions,
      callback: (q) => setForm({ ...form, topic: q })
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const project = {
      id: Date.now(), ...form,
      createdAt: new Date().toISOString(),
      lastEdited: new Date().toISOString(),
      progress: 0, status: 'active', unlocked: true,
      useOrganization, organizationName: useOrganization ? organizationName : '',
      hideOrganization, isPremium: false,
    };
    await onSuccess(project);
    setForm(defaultForm);
    setUseOrganization(false);
    setOrganizationName('');
    setHideOrganization(false);
  };

  return {
    form, handleChange, useOrganization, setUseOrganization,
    organizationName, setOrganizationName, hideOrganization, setHideOrganization,
    questionModal, setQuestionModal, loadingQuestions,
    generateResearchQuestions, handleSubmit
  };
};
