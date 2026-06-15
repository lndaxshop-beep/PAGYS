const PROXY_URL = import.meta.env.VITE_API_PROXY_URL || 'http://localhost:3001';

const getAuthToken = async () => {
  try {
    const { getAuth } = await import('firebase/auth');
    const user = getAuth().currentUser;
    return user ? await user.getIdToken() : null;
  } catch { return null; }
};

const callProxy = async (promptOrRequest, modelName, tools) => {
  const body = { prompt: promptOrRequest, model: modelName };
  if (tools) body.tools = tools;
  const token = await getAuthToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${PROXY_URL}/api/generate`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `API error: ${response.status}`);
  }

  return response.json();
};

export const genAI = {
  getGenerativeModel: ({ model, tools }) => ({
    generateContent: async (promptOrRequest) => {
      const data = await callProxy(promptOrRequest, model || 'gemini-2.5-flash', tools);
      const text = data.text || '';
      return {
        response: {
          text: () => text,
        },
        candidates: data.candidates,
      };
    },
  }),
};

export const MODEL = 'gemini-2.5-flash';

export const WORD_COUNT_PRESETS = {
  undergraduate: {
    proposal: { min: 1000, max: 1500 }, chapter1: { min: 1000, max: 1800 },
    chapter2: { min: 2500, max: 4000 }, chapter3: { min: 1500, max: 2500 },
    chapter4: { min: 1500, max: 3000 }, chapter5: { min: 1000, max: 2000 }
  },
  masters: {
    proposal: { min: 1500, max: 2000 }, chapter1: { min: 1500, max: 2500 },
    chapter2: { min: 4000, max: 7000 }, chapter3: { min: 2500, max: 4000 },
    chapter4: { min: 3000, max: 5000 }, chapter5: { min: 2500, max: 4000 }
  },
  phd: {
    proposal: { min: 2000, max: 3000 }, chapter1: { min: 4000, max: 6000 },
    chapter2: { min: 15000, max: 25000 }, chapter3: { min: 8000, max: 12000 },
    chapter4: { min: 10000, max: 20000 }, chapter5: { min: 10000, max: 15000 }
  }
};

export const getWordCountPreset = (level, chapterId) => {
  return WORD_COUNT_PRESETS[level]?.[chapterId] || { min: 1000, max: 2000 };
};
