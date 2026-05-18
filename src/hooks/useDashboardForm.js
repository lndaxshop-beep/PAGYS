import { useState } from 'react';

const defaultForm = {
  title: '', level: 'undergraduate', field: '', topic: '', methodology: '', referenceStyle: 'apa',
};

export const useDashboardForm = (onSuccess, { onNotify } = {}) => {
  const [form, setForm] = useState(defaultForm);
  const [useOrganization, setUseOrganization] = useState(false);
  const [organizationName, setOrganizationName] = useState('');
  const [hideOrganization, setHideOrganization] = useState(false);
  const [questionModal, setQuestionModal] = useState(null);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const extractKeyword = () => {
    const t = form.title.trim();
    const stopWords = ['a', 'an', 'the', 'of', 'in', 'on', 'for', 'to', 'and', 'or', 'is', 'are', 'with', 'from', 'by', 'at', 'impact', 'study', 'analysis', 'research', 'effects', 'role'];
    const words = t.replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 3 && !stopWords.includes(w.toLowerCase()));
    return words.slice(0, 3).join(' ') || t.slice(0, 40);
  };

  const generateResearchQuestions = async () => {
    if (!form.title.trim()) {
      onNotify?.('Please enter a thesis title first', 'error');
      return;
    }
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
      const kw = extractKeyword();
      questions = [
        `How does ${kw} affect outcomes in ${form.field || 'this field'}?`,
        `What factors influence the effectiveness of ${kw}?`,
        `How does ${kw} perform across different contexts?`,
        `What are the main barriers to ${kw}?`,
        `How do stakeholders perceive the impact of ${kw}?`,
        `What strategies improve ${kw} outcomes?`,
      ];
    }
    setQuestionModal({
      title: form.title, questions,
      callback: (q) => setForm({ ...form, topic: q })
    });
  };

  const setFormData = (data) => {
    setForm({
      title: data.title || '',
      level: data.level || 'undergraduate',
      field: data.field || '',
      topic: data.topic || '',
      methodology: data.methodology || '',
      referenceStyle: data.referenceStyle || 'apa',
    });
    setUseOrganization(data.useOrganization || false);
    setOrganizationName(data.organizationName || '');
    setHideOrganization(data.hideOrganization || false);
  };

  const resetForm = () => {
    setForm(defaultForm);
    setUseOrganization(false);
    setOrganizationName('');
    setHideOrganization(false);
  };

  const handleSubmit = async (e, tier) => {
    e.preventDefault();
    const project = {
      id: crypto.randomUUID ? crypto.randomUUID().replace(/-/g, '').slice(0, 12) : 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), ...form,
      createdAt: new Date().toISOString(),
      lastEdited: new Date().toISOString(),
      progress: 0, status: 'active', unlocked: true,
      useOrganization, organizationName: useOrganization ? organizationName : '',
      hideOrganization, tier: tier || 'regular',
      isPremium: (tier || 'regular') === 'premium',
    };
    await onSuccess(project, tier);
  };

  return {
    form, handleChange, useOrganization, setUseOrganization,
    organizationName, setOrganizationName, hideOrganization, setHideOrganization,
    questionModal, setQuestionModal, loadingQuestions,
    generateResearchQuestions, handleSubmit,
    setFormData, resetForm
  };
};
