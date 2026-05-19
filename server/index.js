import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

const app = express();
const PORT = process.env.PORT || 3001;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');

if (!GEMINI_API_KEY) {
  console.error('FATAL: GEMINI_API_KEY environment variable is not set.');
  process.exit(1);
}

app.use(cors({ origin: ALLOWED_ORIGINS }));
app.use(express.json({ limit: '10mb' }));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: 'Too many requests. Please try again later.' },
});
app.use('/api/', limiter);

app.post('/api/generate', async (req, res) => {
  try {
    const { prompt, model } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

    const modelName = model || 'gemini-2.5-flash';
    let requestBody;

    if (typeof prompt === 'string') {
      requestBody = { contents: [{ role: 'user', parts: [{ text: prompt }] }] };
    } else if (typeof prompt === 'object' && prompt.contents) {
      requestBody = prompt;
    } else if (typeof prompt === 'object' && prompt.text) {
      requestBody = { contents: [{ role: 'user', parts: [{ text: prompt.text }] }] };
    } else {
      return res.status(400).json({ error: 'Invalid prompt format' });
    }

    if (req.body.tools) requestBody.tools = req.body.tools;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText.substring(0, 300));
      return res.status(response.status).json({ error: 'AI service error. Please try again.' });
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';
    res.json({ text, candidates: data.candidates });
  } catch (err) {
    console.error('Server error:', err.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', model: 'gemini-2.5-flash' });
});

app.listen(PORT, () => {
  console.log(`PAGYS API Proxy running on port ${PORT}`);
  console.log(`Allowed origins: ${ALLOWED_ORIGINS.join(', ')}`);
});
