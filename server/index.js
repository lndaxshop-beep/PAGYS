import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import Paystack from 'paystack';

const app = express();
const PORT = process.env.PORT || 3001;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');

const paystack = PAYSTACK_SECRET_KEY ? new Paystack(PAYSTACK_SECRET_KEY) : null;

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

app.post('/api/verify-payment', async (req, res) => {
  try {
    const { reference } = req.body;
    if (!reference) return res.status(400).json({ error: 'Missing payment reference' });

    if (!paystack) {
      return res.status(500).json({ error: 'Payment gateway not configured' });
    }

    const response = await paystack.transaction.verify(reference);

    if (response.data.status === 'success') {
      return res.json({
        success: true,
        verified: true,
        amount: response.data.amount / 100,
        currency: response.data.currency,
        reference: response.data.reference,
        email: response.data.customer?.email,
      });
    }

    return res.status(400).json({ error: 'Payment not successful', status: response.data.status });
  } catch (err) {
    console.error('Payment verification error:', err.message);
    res.status(500).json({ error: 'Payment verification failed' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', model: 'gemini-2.5-flash', paystack: !!paystack });
});

app.listen(PORT, () => {
  console.log(`PAGYS API Proxy running on port ${PORT}`);
  console.log(`Allowed origins: ${ALLOWED_ORIGINS.join(', ')}`);
  console.log(`Paystack configured: ${!!paystack}`);
});
