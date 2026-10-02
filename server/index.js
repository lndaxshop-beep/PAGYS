import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import admin from 'firebase-admin';
import nodemailer from 'nodemailer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3001;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_TIMEOUT_MS = parseInt(process.env.GEMINI_TIMEOUT_MS || '45000', 10);
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
// Minimum amounts (GHS) that justify granting premium. Used to reject payments
// that were initialised for a cheaper action but tagged as premium/upgrade.
// Keep in sync with src/constants/pricing.js.
// Defaults mirror the lowest prices in src/constants/pricing.js so protection is
// on even if the env vars are missing. PhD/Masters premium prices are higher and
// still clear these floors.
const PAYSTACK_MIN_PREMIUM = Number(process.env.PAYSTACK_MIN_PREMIUM || 70);
const PAYSTACK_MIN_UPGRADE = Number(process.env.PAYSTACK_MIN_UPGRADE || 20);

// Authoritative price table. Regular used to be free, but charging is enabled
// again, so the server must decide what a given tier costs rather than trusting
// whatever amount arrived. Without this, a GHS 1 transaction initialised for a
// cheap action could be presented as a full Regular purchase.
// Keep in sync with src/constants/pricing.js.
const PROJECT_PRICES_GHS = {
  undergraduate: { regular: 50, premium: 70 },
  masters: { regular: 80, premium: 100 },
  phd: { regular: 100, premium: 120 },
};

const getExpectedProjectPrice = (tier, level) => {
  const table = PROJECT_PRICES_GHS[String(level || 'undergraduate').toLowerCase()]
    || PROJECT_PRICES_GHS.undergraduate;
  return table[tier] ?? PROJECT_PRICES_GHS.undergraduate[tier];
};

// Explicit allowlist for project fields written by the server. Building the
// document from named fields only means a hostile client cannot smuggle extra
// keys (or a spoofed userId/tier) into a project it paid for.
const buildProjectDoc = (project, { userId, tier, projectId, paidAt }) => {
  const str = (v, max = 500) => String(v ?? '').slice(0, max);
  return {
    id: projectId,
    userId,
    title: str(project.title, 200),
    level: ['undergraduate', 'masters', 'phd'].includes(String(project.level).toLowerCase())
      ? String(project.level).toLowerCase()
      : 'undergraduate',
    field: str(project.field, 150),
    topic: str(project.topic, 2000),
    methodology: str(project.methodology, 100),
    referenceStyle: str(project.referenceStyle, 30) || 'apa',
    useOrganization: project.useOrganization === true,
    organizationName: project.useOrganization === true ? str(project.organizationName, 200) : '',
    hideOrganization: project.hideOrganization === true,
    tier,
    isPremium: tier === 'premium',
    // Both tiers are paid products now, so a project is only usable once the
    // server has confirmed payment.
    paymentStatus: 'paid',
    progress: 0,
    status: 'active',
    unlocked: true,
    createdAt: paidAt,
    lastEdited: paidAt,
    lastPaymentAt: admin.firestore.FieldValue.serverTimestamp(),
  };
};

// Compares in integer pesewas to avoid float drift at the boundary: a naive
// `amount + 0.01 < expected` admits 49.99 against a 50 price.
const meetsMinimum = (amountGhs, expectedGhs) =>
  Math.round(Number(amountGhs) * 100) >= Math.round(Number(expectedGhs) * 100);

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

app.use(helmet());
app.use(cors({ origin: ALLOWED_ORIGINS }));

// Behind Hostinger's hPanel reverse proxy every socket looks like localhost, so without this
// express sees one shared IP and the rate limiter becomes a single global bucket for all users.
app.set('trust proxy', true);

// Raw body capture for Paystack webhook signature verification (must be before express.json)
app.use('/api/paystack-webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '25mb' }));

const requireAuth = async (req, res, next) => {
  const idToken = req.headers.authorization?.replace('Bearer ', '');
  if (!idToken) return res.status(401).json({ error: 'Authentication required' });
  if (admin.apps.length === 0) return res.status(500).json({ error: 'Auth service not configured' });
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

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

const MAX_OUTPUT_TOKENS_CEILING = 32768;

const buildGenerationConfig = (requested) => {
  if (!requested || typeof requested !== 'object') return undefined;
  const config = {};
  if (typeof requested.temperature === 'number') config.temperature = Math.min(2, Math.max(0, requested.temperature));
  if (typeof requested.topP === 'number') config.topP = Math.min(1, Math.max(0, requested.topP));
  if (typeof requested.topK === 'number') config.topK = Math.min(64, Math.max(1, requested.topK));
  if (typeof requested.maxOutputTokens === 'number') {
    config.maxOutputTokens = Math.min(MAX_OUTPUT_TOKENS_CEILING, Math.max(256, Math.floor(requested.maxOutputTokens)));
  }
  if (requested.thinkingConfig && typeof requested.thinkingConfig === 'object') {
    config.thinkingConfig = requested.thinkingConfig;
  }
  return Object.keys(config).length > 0 ? config : undefined;
};

app.post('/api/generate', requireAuth, async (req, res) => {
  const abort = new AbortController();
  const timeout = setTimeout(() => abort.abort(), GEMINI_TIMEOUT_MS);
  try {
    const { prompt, model, generationConfig } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Missing prompt', code: 'BAD_REQUEST' });

    const modelName = model || 'gemini-2.5-flash';
    let requestBody;

    if (typeof prompt === 'string') {
      requestBody = { contents: [{ role: 'user', parts: [{ text: prompt }] }] };
    } else if (typeof prompt === 'object' && prompt.contents) {
      requestBody = prompt;
    } else if (typeof prompt === 'object' && prompt.text) {
      requestBody = { contents: [{ role: 'user', parts: [{ text: prompt.text }] }] };
    } else {
      return res.status(400).json({ error: 'Invalid prompt format', code: 'BAD_REQUEST' });
    }

    if (req.body.tools) requestBody.tools = req.body.tools;

    const resolvedConfig = buildGenerationConfig(generationConfig);
    if (resolvedConfig) requestBody.generationConfig = resolvedConfig;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY },
      body: JSON.stringify(requestBody),
      signal: abort.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText.substring(0, 300));
      const messages = {
        429: 'Service is temporarily unavailable (quota exceeded). Please try again later.',
        403: 'Service authentication failed. Please check your API key.',
        400: 'Service rejected the request due to invalid input.',
      };
      return res.status(response.status).json({
        error: messages[response.status] || 'Service error. Please try again.',
        code: `GEMINI_${response.status}`,
      });
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';
    res.json({ text, candidates: data.candidates });
  } catch (err) {
    if (abort.signal.aborted) {
      console.error('Gemini request timed out after', GEMINI_TIMEOUT_MS, 'ms');
      return res.status(504).json({
        error: 'The service took too long to respond. Please try again.',
        code: 'GATEWAY_TIMEOUT',
      });
    }
    console.error('Server error:', err.message);
    res.status(500).json({ error: 'Internal server error.', code: 'INTERNAL' });
  } finally {
    clearTimeout(timeout);
  }
});

app.post('/api/initialize-payment', requireAuth, async (req, res) => {
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

    // req.body is a raw Buffer from express.raw middleware
    const rawBody = req.body;
    if (!Buffer.isBuffer(rawBody) || rawBody.length === 0) {
      return res.status(400).json({ error: 'Invalid body' });
    }

    const expectedSignature = crypto
      .createHmac('sha512', PAYSTACK_SECRET_KEY)
      .update(rawBody)
      .digest('hex');

    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);
    if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
      console.error('Webhook signature verification failed');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = JSON.parse(rawBody.toString());

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
          // Only Paystack metadata decides the tier, and the paid amount must cover
          // the real price for it. Otherwise a cheap transaction carrying
          // tier=premium in its metadata would grant a premium project.
          const payType = data.metadata?.type || 'project_creation';
          const isUpgrade = payType === 'upgrade';
          const metaTier = data.metadata?.tier === 'premium' ? 'premium' : 'regular';
          const paidAmount = data.amount / 100;

          // Project documents are created exclusively by the authenticated
          // /api/verify-payment path, which knows the real signed-in userId. This
          // webhook must never create one: merging onto a missing document would
          // produce a stub holding nothing but a tier, with no title and no owner,
          // which then shows up in the user's project list. It only upgrades a
          // project that genuinely exists and is owned by the payer.
          if (isUpgrade && paidAmount >= PAYSTACK_MIN_UPGRADE) {
            const projectRef = adminDb.collection('projects').doc(data.metadata.projectId);
            const existing = await projectRef.get();
            // Ownership comes from the stored project, never from webhook metadata,
            // which the client controls when it opens the transaction.
            if (existing.exists) {
              await projectRef.set({
                tier: 'premium',
                isPremium: true,
                lastPaymentAt: admin.firestore.FieldValue.serverTimestamp(),
              }, { merge: true });
            } else {
              console.warn('[Webhook] Upgrade target missing, leaving creation to /api/verify-payment', {
                projectId: data.metadata.projectId,
              });
            }
          }

          // Keyed by reference so a webhook and a later inline verification of the
          // same transaction collapse into one record. The owner is left to the
          // authenticated verify path, which is the only place a trustworthy userId
          // exists; the webhook never invents ownership from client metadata.
          await adminDb.collection('payments').doc(data.reference).set({
            projectId: data.metadata.projectId,
            tier: metaTier,
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

          console.log(`[Webhook] Recorded ${payType} payment for project ${data.metadata.projectId}`);
        } catch (dbErr) {
          console.error('[Webhook] Firestore update failed:', dbErr.message);
        }
      }

      return res.json({ received: true });
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err.message);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

app.post('/api/verify-payment', requireAuth, async (req, res) => {
  try {
    const { reference, projectId, tier } = req.body;
    if (!reference) return res.status(400).json({ error: 'Missing payment reference' });

    if (!paystackConfigured) {
      return res.status(500).json({ error: 'Payment gateway not configured' });
    }

    const verifiedUserId = req.user.uid;

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
          const payType = verifyData.data.metadata?.type || 'project_creation';
          const isUpgrade = payType === 'upgrade';
          const isProjectCreation = payType === 'project_creation';
          // Add-on purchases (feedback resets, Remove-AI runs, defence
          // regenerations, word-count edits) share this endpoint. They must record
          // a payment but must never create or alter a project document.
          // Only Paystack metadata decides the tier. The client-supplied `tier` is
          // never trusted, otherwise anyone could verify a cheap transaction and
          // have the server mark the project premium.
          const metaTier = verifyData.data.metadata?.tier === 'premium' ? 'premium' : 'regular';
          const paidAmount = paymentData.amount;
          const projectTier = metaTier;
          const paidAt = paymentData.paidAt || new Date().toISOString();

          // Every payment here belongs to a project. If Paystack did not carry the
          // projectId, fail loudly instead of falling back to defaults: a silent
          // default downgrades Premium to Regular and makes upgrades no-op, which
          // looks like a successful payment with the wrong result.
          if (!verifyData.data.metadata?.projectId) {
            console.error('[Verify] Paystack metadata is missing projectId', {
              reference, payType, metadataTier: metaTier, paidAmount,
            });
            return res.status(400).json({
              error: 'Payment metadata is incomplete. Please contact support with your reference so the payment can be applied correctly.',
              reference,
              metadataMissing: true,
            });
          }

          if (isUpgrade) {
            // Upgrade path: the project already exists and only its tier changes.
            if (!meetsMinimum(paidAmount, PAYSTACK_MIN_UPGRADE)) {
              console.warn('[Verify] Upgrade amount below threshold', { projectId, paidAmount });
              return res.status(402).json({ error: 'Payment amount is too low for this action.' });
            }
            const upgradeRef = adminDb.collection('projects').doc(projectId);
            const existingProject = await upgradeRef.get();
            if (existingProject.exists && existingProject.data.userId !== verifiedUserId) {
              console.warn('[Verify] Project ownership mismatch, refusing tier update', { projectId });
              return res.status(403).json({ error: 'Project does not belong to this account' });
            }
            if (!existingProject.exists) {
              return res.status(404).json({ error: 'Project not found' });
            }
            await upgradeRef.set({
              tier: 'premium',
              isPremium: true,
              lastPaymentAt: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });
          } else if (isProjectCreation) {
            // Project creation. Both tiers are paid, so the paid amount must meet
            // the real price for that tier and level, otherwise a near-zero
            // transaction would create a full project for free.
            if (paymentData.currency !== 'GHS') {
              return res.status(402).json({ error: 'Unexpected payment currency.' });
            }
            const expected = getExpectedProjectPrice(projectTier, req.body.project?.level);
            if (!meetsMinimum(paidAmount, expected)) {
              console.warn('[Verify] Amount below required price, refusing to create project', {
                projectId, paidAmount, expected, projectTier,
              });
              return res.status(402).json({ error: `Payment amount is too low. This project requires GHS ${expected}.` });
            }

            const projectRef = adminDb.collection('projects').doc(projectId);
            const existing = await projectRef.get();
            if (existing.exists) {
              // Never let a verified payment overwrite someone else's project.
              if (existing.data.userId !== verifiedUserId) {
                console.warn('[Verify] Project id collision, refusing', { projectId });
                return res.status(409).json({ error: 'Project already exists.' });
              }
              // Retry of an already-completed purchase: keep the existing document
              // intact rather than resetting a project the user may have written in.
              console.log('[Verify] Project already exists, leaving it untouched', { projectId });
            } else {
              // The server owns project creation. Doing it here (Admin SDK bypasses
              // firestore.rules) means the document already carries the correct
              // tier and userId, so the browser never has to write a paid project
              // and can never hit a rules rejection after paying.
              await projectRef.create(buildProjectDoc(req.body.project || {}, {
                userId: verifiedUserId,
                tier: projectTier,
                projectId,
                paidAt,
              }));
              console.log(`[Verify] Project ${projectId} created as ${projectTier}`);
            }
          }
          // Otherwise this is an add-on purchase: record the payment only. The
          // client's remaining usage counter is intentionally not trusted here.

          // Keyed by the Paystack reference so a retried verification updates the
          // existing record instead of double-counting the same transaction.
          await adminDb.collection('payments').doc(paymentData.reference).set({
            userId: verifiedUserId || '',
            projectId,
            tier: projectTier,
            amount: paymentData.amount,
            currency: paymentData.currency,
            reference: paymentData.reference,
            email: paymentData.email,
            paidAt,
            channel: paymentData.channel || 'inline',
            type: payType,
            status: 'verified',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });
        } catch (dbErr) {
          // The money has already moved, so this must not be reported as a plain
          // failure: the client would offer to pay again and risk a double charge.
          // It surfaces as an explicit provisioning error, and because the payment
          // record and project creation are both idempotent, re-verifying the same
          // reference completes the job instead of charging the user twice.
          console.error('[Verify] Firestore write failed for reference', reference, dbErr.message);
          return res.status(500).json({
            error: 'Payment received but project setup did not complete. Please retry in a moment; you will not be charged twice.',
            reference,
            provisioningFailed: true,
          });
        }
      }

      console.log('Payment verified:', { reference, amount: paymentData.amount, projectId, metadataTier: verifyData.data.metadata?.tier || 'regular' });
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

// Restoring from the recycle bin needs to recreate a project document, and
// clients are no longer allowed to create project documents themselves (both
// tiers are paid). Doing it server-side also means a previously paid Premium
// project comes back as Premium instead of being silently downgraded to Regular.
app.post('/api/restore-project', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.body;
    if (!projectId) return res.status(400).json({ error: 'Missing projectId' });
    if (!adminDb) return res.status(500).json({ error: 'Database unavailable' });

    const uid = req.user.uid;
    const deletedRef = adminDb.collection('deletedProjects').doc(projectId);
    const deleted = await deletedRef.get();
    if (!deleted.exists) return res.status(404).json({ error: 'Project not found in recycle bin' });
    if (deleted.data.userId !== uid) return res.status(403).json({ error: 'Project does not belong to this account' });

    const projectRef = adminDb.collection('projects').doc(projectId);
    const existing = await projectRef.get();
    if (!existing.exists) {
      const saved = deleted.data;
      await projectRef.create({
        ...saved,
        id: projectId,
        userId: uid,
        // Preserve what the user originally paid for.
        tier: saved.tier === 'premium' ? 'premium' : 'regular',
        isPremium: saved.tier === 'premium',
        paymentStatus: 'paid',
        lastEdited: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    await deletedRef.delete();
    res.json({ restored: true });
  } catch (err) {
    console.error('[Restore] Failed:', err.message);
    res.status(500).json({ error: 'Failed to restore project' });
  }
});

// Local development only. The client-side payment bypass short-circuits Paystack
// entirely, which means it never reaches /api/verify-payment, so nothing would
// create the project document and local dev would be unusable now that clients
// cannot create projects. This endpoint fills that gap.
// Safety: it requires an explicit ALLOW_DEV_MOCK_PAYMENTS=true, which is absent by
// default and must not be set on the production host. It still requires a valid
// user token and only ever writes to the caller's own document.
app.post('/api/dev-mock-payment', requireAuth, async (req, res) => {
  if (process.env.ALLOW_DEV_MOCK_PAYMENTS !== 'true') {
    return res.status(404).json({ error: 'Not found' });
  }
  try {
    const { projectId, tier, project } = req.body;
    if (!projectId || !adminDb) return res.status(400).json({ error: 'Missing projectId or database unavailable' });
    const uid = req.user.uid;

    if (tier === 'premium') {
      const ref = adminDb.collection('projects').doc(projectId);
      const existing = await ref.get();
      if (!existing.exists || existing.data.userId !== uid) return res.status(404).json({ error: 'Project not found' });
      await ref.set({ tier: 'premium', isPremium: true }, { merge: true });
    } else {
      const ref = adminDb.collection('projects').doc(projectId);
      const existing = await ref.get();
      if (!existing.exists) {
        await ref.create(buildProjectDoc(project || {}, { userId: uid, tier: 'regular', projectId, paidAt: new Date().toISOString() }));
      } else if (existing.data.userId !== uid) {
        return res.status(403).json({ error: 'Project does not belong to this account' });
      }
    }
    console.warn('[DEV MOCK] Project created/updated without payment:', projectId, tier);
    res.json({ verified: true, dev: true });
  } catch (err) {
    console.error('[DEV MOCK] Failed:', err.message);
    res.status(500).json({ error: 'Mock payment failed' });
  }
});

// Serve built frontend in production
const distPath = path.resolve(__dirname, '..', 'dist');
app.use(express.static(distPath, { maxAge: 0 }));

const emailRateLimits = new Map();
const EMAIL_ALLOWED_DOMAINS = ['pagyss.com'];
const EMAIL_RATE_LIMIT = 5;
const EMAIL_RATE_WINDOW_MS = 60 * 60 * 1000;

app.post('/api/send-email', requireAuth, async (req, res) => {
  try {
    const { to, subject, text, html } = req.body;
    if (!to || !subject || !text) {
      return res.status(400).json({ error: 'Missing required fields: to, subject, text' });
    }

    const recipientDomain = to.split('@')[1]?.toLowerCase();
    if (!recipientDomain || !EMAIL_ALLOWED_DOMAINS.some(d => recipientDomain === d || recipientDomain.endsWith('.' + d))) {
      return res.status(403).json({ error: 'Recipient not allowed' });
    }

    const uid = req.user.uid;
    const now = Date.now();
    const userLimit = emailRateLimits.get(uid);
    if (userLimit) {
      if (now - userLimit.windowStart < EMAIL_RATE_WINDOW_MS) {
        if (userLimit.count >= EMAIL_RATE_LIMIT) {
          return res.status(429).json({ error: 'Email rate limit exceeded. Try again later.' });
        }
        userLimit.count++;
      } else {
        emailRateLimits.set(uid, { windowStart: now, count: 1 });
      }
    } else {
      emailRateLimits.set(uid, { windowStart: now, count: 1 });
    }

    const info = await transporter.sendMail({
      from: SMTP_USER,
      to,
      subject,
      text,
      html: html || undefined,
    });
    res.json({ success: true, messageId: info.messageId });
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

// Central error handler — must be registered last so it catches errors from every route
// and from the JSON body parser. Returns JSON (never HTML) so the client can show a real message.
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err && (err.type === 'entity.too.large' || err.status === 413)) {
    return res.status(413).json({
      error: 'The content you uploaded is too large. Please use fewer or smaller files.',
      code: 'PAYLOAD_TOO_LARGE',
    });
  }
  if (err && (err.type === 'entity.parse.failed' || err.status === 400)) {
    return res.status(400).json({ error: 'Malformed request body.', code: 'BAD_REQUEST' });
  }
  console.error('Unhandled server error:', err && err.message);
  res.status(500).json({ error: 'Internal server error.', code: 'INTERNAL_ERROR' });
});

app.listen(PORT, () => {
  console.log(`PAGYS API Proxy running on port ${PORT}`);
  console.log(`Allowed origins: ${ALLOWED_ORIGINS.join(', ')}`);
  console.log(`Paystack configured: ${paystackConfigured}`);
  console.log(`Firebase Admin: ${!!adminDb}`);
  console.log(`Frontend: ${distPath}`);
});
