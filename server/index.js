import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import admin from 'firebase-admin';
import nodemailer from 'nodemailer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3001;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');

const paystackConfigured = !!PAYSTACK_SECRET_KEY;

const SMTP_USER = process.env.SMTP_USER || 'support@pagyss.com';
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: parseInt(process.env.SMTP_PORT || '465', 10),
  secure: true,
  auth: {
    user: SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Initialize Firebase Admin
let adminDb;
try {
  if (admin.apps.length === 0) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
        const cleaned = raw.replace(/^["']|["']$/g, '');
        const minified = cleaned.replace(/\n/g, ' ').replace(/\r/g, '');
        admin.initializeApp({ credential: admin.credential.cert(JSON.parse(minified)) });
      } catch (e) {
        console.warn('FIREBASE_SERVICE_ACCOUNT parse failed, trying individual vars:', e.message);
      }
    }
    if (admin.apps.length === 0 && process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/^["']|["']$/g, '').replace(/\\\\n/g, '\\n').replace(/\\n/g, '\n'),
        }),
      });
    }
    if (admin.apps.length === 0) {
      console.warn('Firebase Admin: No credentials provided. Server-side Firestore updates disabled.');
    }
  }
  if (admin.apps.length > 0) {
    adminDb = admin.firestore();
    console.log('Firebase Admin initialized');
  }
} catch (err) {
  console.warn('Firebase Admin not initialized:', err.message);
}

app.use(cors({ origin: ALLOWED_ORIGINS }));
app.use(express.json({ limit: '10mb' }));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: 'Too many requests. Please try again later.' },
});
app.use('/api/', limiter);

const paymentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many payment requests. Please wait.' },
});
app.use('/api/initialize-payment', paymentLimiter);
app.use('/api/verify-payment', paymentLimiter);
app.use('/api/upgrade-tier', paymentLimiter);

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

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText.substring(0, 300));
      const messages = {
        429: 'AI service is temporarily unavailable (quota exceeded). Please try again later.',
        403: 'AI service authentication failed. Please check your API key.',
        400: 'AI service rejected the request due to invalid input.',
      };
      return res.status(response.status).json({ error: messages[response.status] || 'AI service error. Please try again.' });
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

    if (!paystackConfigured) {
      return res.status(500).json({ error: 'Payment gateway not configured' });
    }

    const callbackUrl = process.env.PAYSTACK_CALLBACK_URL || `${ALLOWED_ORIGINS[0]}/dashboard`;
    const paystackCurrency = 'GHS';
    const amountInSubunit = Math.round(amount * 100);

    console.log(`[Paystack] Initializing: ${amount} ${paystackCurrency} for ${email}`);

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
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
      }),
    });

    const data = await response.json();
    if (!data.status) throw new Error(data.message || 'Paystack initialization failed');

    res.json({ authorizationUrl: data.data.authorization_url, reference: data.data.reference, accessCode: data.data.access_code });
  } catch (err) {
    console.error('Payment initialization error:', err.message);
    res.status(500).json({ error: 'Payment initialization failed' });
  }
});

app.post('/api/paystack-webhook', async (req, res) => {
  try {
    const signature = req.headers['x-paystack-signature'];
    if (!signature) {
      console.warn('Webhook received without signature');
      return res.status(401).json({ error: 'Missing signature' });
    }

    const rawBody = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha512', PAYSTACK_SECRET_KEY)
      .update(rawBody)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error('Webhook signature verification failed');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = req.body;

    if (event.event === 'charge.success') {
      const data = event.data;
      console.log('Paystack webhook: charge.success (verified)', {
        reference: data.reference,
        amount: data.amount / 100,
        email: data.customer?.email,
        metadata: data.metadata,
      });

      if (adminDb && data.metadata?.projectId) {
        try {
          const tier = data.metadata?.tier || 'regular';
          const isUpgrade = data.metadata?.type === 'upgrade';
          const projectRef = adminDb.collection('projects').doc(data.metadata.projectId);
          await projectRef.update({
            tier,
            isPremium: tier === 'premium',
            lastPaymentAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          await adminDb.collection('payments').add({
            userId: data.metadata.userId || '',
            projectId: data.metadata.projectId,
            tier,
            amount: data.amount / 100,
            currency: data.currency || 'GHS',
            reference: data.reference,
            email: data.customer?.email,
            paidAt: data.paid_at || new Date().toISOString(),
            channel: data.channel || 'webhook',
            type: data.metadata?.type || 'project_creation',
            status: 'verified',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          console.log(`[Webhook] Tier updated for project ${data.metadata.projectId}`);
        } catch (dbErr) {
          console.error('[Webhook] Firestore update failed:', dbErr.message);
        }
      }

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
    const { reference, projectId, tier, userId, idToken } = req.body;
    if (!reference) return res.status(400).json({ error: 'Missing payment reference' });

    if (!paystackConfigured) {
      return res.status(500).json({ error: 'Payment gateway not configured' });
    }

    let verifiedUserId = userId;
    if (idToken && admin.apps.length > 0) {
      try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        verifiedUserId = decodedToken.uid;
      } catch (authErr) {
        console.warn('Firebase ID token verification failed:', authErr.message);
      }
    }

    const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}` },
    });

    const verifyData = await verifyResponse.json();
    if (!verifyData.status) throw new Error(verifyData.message || 'Paystack verification failed');

    if (verifyData.data.status === 'success') {
      const paymentData = {
        success: true,
        verified: true,
        amount: verifyData.data.amount / 100,
        currency: verifyData.data.currency,
        reference: verifyData.data.reference,
        email: verifyData.data.customer?.email,
        paidAt: verifyData.data.paid_at,
        channel: verifyData.data.channel,
        metadata: verifyData.data.metadata,
      };

      if (adminDb && projectId) {
        try {
          const isUpgrade = verifyData.data.metadata?.type === 'upgrade';
          const projectTier = verifyData.data.metadata?.tier || tier || 'regular';
          const projectRef = adminDb.collection('projects').doc(projectId);
          await projectRef.update({
            tier: projectTier,
            isPremium: projectTier === 'premium',
            lastPaymentAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          await adminDb.collection('payments').add({
            userId: verifiedUserId || '',
            projectId,
            tier: projectTier,
            amount: paymentData.amount,
            currency: paymentData.currency,
            reference: paymentData.reference,
            email: paymentData.email,
            paidAt: paymentData.paidAt || new Date().toISOString(),
            channel: paymentData.channel || 'inline',
            type: isUpgrade ? 'upgrade' : 'project_creation',
            status: 'verified',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          console.log(`[Verify] Tier updated server-side for project ${projectId}`);
        } catch (dbErr) {
          console.error('[Verify] Firestore update failed:', dbErr.message);
        }
      }

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
  res.json({ status: 'ok', model: 'gemini-2.5-flash', paystack: paystackConfigured, firebaseAdmin: !!adminDb });
});

// Serve built frontend in production
const distPath = path.resolve(__dirname, '..', 'dist');
app.use(express.static(distPath, { maxAge: 0 }));

app.post('/api/send-email', async (req, res) => {
  try {
    const { to, subject, text, html } = req.body;
    if (!to || !subject || !text) {
      return res.status(400).json({ error: 'Missing required fields: to, subject, text' });
    }
    const info = await transporter.sendMail({
      from: SMTP_USER,
      to,
      subject,
      text,
      html: html || undefined,
    });
    console.log('Email sent:', info.messageId);
    res.json({ success: true });
  } catch (err) {
    console.error('Email send error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// SPA fallback — any non-API GET route serves index.html
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return;
  res.set('Cache-Control', 'no-cache, must-revalidate');
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`PAGYS API Proxy running on port ${PORT}`);
  console.log(`Allowed origins: ${ALLOWED_ORIGINS.join(', ')}`);
  console.log(`Paystack configured: ${paystackConfigured}`);
  console.log(`Firebase Admin: ${!!adminDb}`);
  console.log(`Frontend: ${distPath}`);
});
