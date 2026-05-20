import 'dotenv/config';
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

app.post('/api/initialize-payment', async (req, res) => {
  try {
    const { email, amount, currency, metadata } = req.body;
    if (!email || !amount) return res.status(400).json({ error: 'Missing email or amount' });

    if (!paystack) {
      return res.status(500).json({ error: 'Payment gateway not configured' });
    }

    const callbackUrl = process.env.PAYSTACK_CALLBACK_URL || `${ALLOWED_ORIGINS[0]}/dashboard`;
    const paystackCurrency = (currency || 'GHS').toLowerCase();
    const amountInSubunit = Math.round(amount * 100);

    console.log(`[Paystack] Initializing: ${amount} ${paystackCurrency.toUpperCase()} for ${email}`);

    const response = await paystack.transaction.initialize({
      email,
      amount: amountInSubunit,
      currency: paystackCurrency,
      callback_url: callbackUrl,
      metadata: {
        ...metadata,
        custom_fields: [
          { display_name: 'Project Type', variable_name: 'project_type', value: metadata?.type || 'project_creation' },
        ],
      },
    });

    res.json({ authorizationUrl: response.data.authorization_url, reference: response.data.reference, accessCode: response.data.access_code });
  } catch (err) {
    console.error('Payment initialization error:', err.message);
    res.status(500).json({ error: 'Payment initialization failed' });
  }
});

app.post('/api/paystack-webhook', async (req, res) => {
  try {
    const event = req.body;

    if (event.event === 'charge.success') {
      const data = event.data;
      console.log('Paystack webhook: charge.success', {
        reference: data.reference,
        amount: data.amount / 100,
        email: data.customer?.email,
        metadata: data.metadata,
      });

      return res.json({ received: true });
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err.message);
    res.status(200).json({ received: true });
  }
});

app.post('/api/verify-payment', async (req, res) => {
  try {
    const { reference, projectId, tier, userId } = req.body;
    if (!reference) return res.status(400).json({ error: 'Missing payment reference' });

    if (!paystack) {
      return res.status(500).json({ error: 'Payment gateway not configured' });
    }

    const response = await paystack.transaction.verify(reference);

    if (response.data.status === 'success') {
      const paymentData = {
        success: true,
        verified: true,
        amount: response.data.amount / 100,
        currency: response.data.currency,
        reference: response.data.reference,
        email: response.data.customer?.email,
        paidAt: response.data.paid_at,
        channel: response.data.channel,
        metadata: response.data.metadata,
      };

      console.log('Payment verified:', { reference, amount: paymentData.amount, projectId, tier });
      return res.json(paymentData);
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
