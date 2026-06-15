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

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const generateResearchQuestions = async () => {
    if (!form.title.trim()) {
      onNotify?.('Please enter a thesis title first', 'error');
      return;
    }
    let questions = [];
    setLoadingQuestions(true);
    try {
      const proxyUrl = import.meta.env.VITE_API_PROXY_URL || 'http://localhost:3001';
      const geminiRes = await fetch(`${proxyUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemini-2.5-flash',
          prompt: `You are an academic research advisor. Generate 6 concise, well-formed research questions for a thesis.

TOPIC: "${form.title}"
FIELD: ${form.field || 'general'}
LEVEL: ${form.level}
${organizationName ? `ORGANIZATION: ${organizationName}` : ''}

Requirements:
- Each question: 8-20 words, concise but with natural, grammatically correct academic English
- Avoid awkward or truncated phrasing — the sentence must read naturally
- Match the depth and terminology to the specified academic level and field
- Return ONLY a numbered list, one question per line`
        }),
      });
      const geminiData = await geminiRes.json();
      const text = geminiData.text || '';
      questions = text.split('\n').filter(l => l.match(/^\d+\.\s/)).map(l => l.replace(/^\d+\.\s*/, '').trim()).slice(0, 8);
    } catch (e) {
      console.error('AI question generation failed:', e);
    }
    setLoadingQuestions(false);
    if (!questions.length) {
      onNotify?.('Could not generate questions. Please try again or type your own.', 'error');
      return;
    }
    setQuestionModal({
      title: form.title, questions,
      callback: (q) => setForm(prev => ({ ...prev, topic: q }))
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
