import { useState, useCallback, useRef } from 'react';
import { formatPrice, getUserCountry, PRICES_GHS, getCurrency, getProjectPrice } from '../constants/pricing';
import { useAuth } from '../contexts/AuthContext';

const PROXY_URL = import.meta.env.VITE_API_PROXY_URL || 'http://localhost:3001';
const DEV_BYPASS = import.meta.env.VITE_DEV_PAYMENT_BYPASS === 'true' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '';

const PENDING_PAYMENT_KEYS = [
  'paystack_return', 'paystack_reference', 'paystack_projectId',
  'paystack_tier', 'paystack_isUpgrade', 'paystack_amount', 'paystack_currency',
  'paystack_project',
];

// The project details are carried across the Paystack redirect because the server
// needs them to create the project document once payment succeeds, and the return
// trip is a full page load that loses all React state.
const storePaymentSessionData = (reference, projectId, tier, isUpgrade, amount, currency, project = null) => {
  sessionStorage.setItem('paystack_return', 'true');
  sessionStorage.setItem('paystack_reference', reference);
  sessionStorage.setItem('paystack_projectId', projectId);
  sessionStorage.setItem('paystack_tier', tier);
  sessionStorage.setItem('paystack_isUpgrade', String(!!isUpgrade));
  sessionStorage.setItem('paystack_amount', String(amount));
  sessionStorage.setItem('paystack_currency', currency);
  try {
    sessionStorage.setItem('paystack_project', JSON.stringify(project));
  } catch { /* project may be too large or storage unavailable; non-fatal */ }
};

export const clearPendingPayment = () => {
  PENDING_PAYMENT_KEYS.forEach(k => sessionStorage.removeItem(k));
};

const readPendingProject = () => {
  try {
    return JSON.parse(sessionStorage.getItem('paystack_project') || 'null');
  } catch { return null; }
};

export const getPendingPayment = () => {
  if (sessionStorage.getItem('paystack_return') !== 'true') return null;
  return {
    reference: sessionStorage.getItem('paystack_reference'),
    projectId: sessionStorage.getItem('paystack_projectId'),
    tier: sessionStorage.getItem('paystack_tier'),
    isUpgrade: sessionStorage.getItem('paystack_isUpgrade') === 'true',
    amount: Number(sessionStorage.getItem('paystack_amount')) || 0,
    currency: sessionStorage.getItem('paystack_currency') || 'GHS',
  };
};

const storePaymentRecord = async (paymentData) => {
  // Payment receipts are written by the server after verifying with Paystack.
  // firestore.rules blocks client-side writes here so users cannot forge receipts.
  // In DEV_BYPASS mode no server call happens, so the mock record is written locally.
  if (!DEV_BYPASS) return;
  try {
    const { db } = await import('../firebase');
    const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
    await addDoc(collection(db, 'payments'), {
      ...paymentData,
      createdAt: serverTimestamp(),
    });
  } catch (e) {
    console.error('Failed to store payment record:', e);
  }
};

// Tier and paymentStatus are written by the server only, after Paystack
// verification (see /api/verify-payment and /api/paystack-webhook). firestore.rules
// rejects any client-side write to either field, and rejects project creation
// outright now that both tiers are paid, so the browser never writes them.

const usePayment = (onNotify) => {
  const { user, getIdToken } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [mockPaymentConfig, setMockPaymentConfig] = useState(null);
  const pendingCallbacksRef = useRef(new Map());
  const intervalRefs = useRef([]);

  const verifyPayment = useCallback(async (reference, projectId, tier, isUpgrade, amount, currency, project = null) => {
if (reference && reference.startsWith('mock_')) {
    // A mocked payment never reaches the server, but the server is the only thing
    // allowed to create project documents now. Ask it to do so through the
    // dev-only endpoint, which is disabled unless ALLOW_DEV_MOCK_PAYMENTS=true.
    const idToken = await getIdToken();
    const res = await fetch(`${PROXY_URL}/api/dev-mock-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}) },
      body: JSON.stringify({ projectId, tier, project }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Mock payment failed. Is ALLOW_DEV_MOCK_PAYMENTS=true on the local server?');
    }
    const country = getUserCountry(user);
      const priceKey = isUpgrade ? 'upgrade' : tier;
      const ghsAmount = PRICES_GHS[priceKey] || PRICES_GHS.regular;
      if (onNotify) onNotify(
        isUpgrade
          ? `Project upgraded to Premium (${formatPrice(ghsAmount, country)})! All features unlocked.`
          : tier === 'premium'
            ? 'Premium project created! All features unlocked.'
            : 'Regular project created! You can upgrade anytime.',
        'success'
      );
      window.dispatchEvent(new CustomEvent(isUpgrade ? 'projectUpgraded' : 'projectPaymentComplete', {
        detail: { projectId, tier }
      }));
// No client-side payment record: receipts are written server-side only.
    return { verified: true, amount, currency: currency || 'GHS' };
    }

    try {
      const idToken = await getIdToken();
      const res = await fetch(`${PROXY_URL}/api/verify-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {}) },
        body: JSON.stringify({ reference, projectId, tier, project }),
      });
      const data = await res.json();
      if (!res.ok || !data.verified) {
        throw new Error(data.error || 'Payment verification failed');
      }

      const country = getUserCountry(user);
      const priceKey = isUpgrade ? 'upgrade' : tier;
      const ghsAmount = PRICES_GHS[priceKey] || PRICES_GHS.regular;
      if (onNotify) onNotify(
        isUpgrade
          ? `Project upgraded to Premium (${formatPrice(ghsAmount, country)})! All features unlocked.`
          : tier === 'premium'
            ? 'Premium project created! All features unlocked.'
            : 'Regular project created! You can upgrade anytime.',
        'success'
      );
      window.dispatchEvent(new CustomEvent(isUpgrade ? 'projectUpgraded' : 'projectPaymentComplete', {
        detail: { projectId, tier }
      }));

      await storePaymentRecord({
        userId: user?.uid,
        projectId,
        tier,
        amount: data.amount || amount,
        currency: data.currency || currency,
        reference: data.reference || reference,
        email: data.email || user?.email,
        paidAt: data.paidAt || new Date().toISOString(),
        channel: data.channel || 'inline',
        type: isUpgrade ? 'upgrade' : 'project_creation',
        status: 'verified',
      });
      
      return data;
    } catch (e) {
      console.error('Payment verification error:', e);
      if (onNotify) onNotify('Payment verification failed. Contact support.', 'error');
      return null;
    }
  }, [onNotify, user, getIdToken]);

  const handleMockPaymentSuccess = useCallback(async (result) => {
    setMockPaymentConfig(null);
    const callbacks = [...pendingCallbacksRef.current.values()];
    pendingCallbacksRef.current.clear();
    for (const cb of callbacks) {
      if (result?.status === 'success') {
        await verifyPayment(cb.reference, cb.projectId, cb.tier, cb.isUpgrade, cb.amount, cb.currency);
        if (cb.resolve) cb.resolve({ reference: cb.reference, status: 'success' });
        if (cb.onSuccess) cb.onSuccess();
      } else {
        if (cb.resolve) cb.resolve({ reference: null, status: 'closed' });
      }
    }
  }, [verifyPayment]);

  const handleMockPaymentClose = useCallback(() => {
    setMockPaymentConfig(null);
    const callbacks = [...pendingCallbacksRef.current.values()];
    pendingCallbacksRef.current.clear();
    for (const cb of callbacks) {
      if (cb.resolve) cb.resolve({ reference: null, status: 'closed' });
    }
  }, []);

  const openPaystackPopup = useCallback((email, amount, metadata) => {
    return new Promise((resolve) => {
      if (typeof PaystackPop === 'undefined') {
        console.warn('PaystackPop not loaded, falling back to server redirect');
        resolve({ useRedirect: true });
        return;
      }

      try {
        const handler = PaystackPop.setup({
          key: PAYSTACK_PUBLIC_KEY,
          email,
          amount: Math.round(amount * 100),
          currency: 'GHS',
          ref: `PAGYSS_${Date.now()}_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`,
          // These must be top-level metadata keys, not only custom_fields. The
          // server reads metadata.projectId / .tier / .type to decide what the
          // payment is for: omitting them made every popup purchase look like a
          // Regular project creation, so Premium silently downgraded and upgrades
          // took the creation branch and never applied the tier.
          metadata: {
            projectId: metadata?.projectId,
            tier: metadata?.tier || 'regular',
            type: metadata?.type || 'project_creation',
            custom_fields: [{
              display_name: 'Project Type',
              variable_name: 'project_type',
              value: metadata?.type || 'project_creation',
            }],
          },
          callback: (response) => {
            resolve({ reference: response.reference, status: 'success' });
          },
          onClose: () => {
            resolve({ reference: null, status: 'closed' });
          },
        });
        handler.openIframe();
      } catch (e) {
        console.error('Paystack inline popup error:', e);
        resolve({ useRedirect: true });
      }
    });
  }, []);

  const cleanupIntervals = useCallback(() => {
    intervalRefs.current.forEach(clearInterval);
    intervalRefs.current = [];
  }, []);

  const processPayment = useCallback(async (projectId, tier, level, project = null) => {
    setProcessing(true);
    try {
      if (DEV_BYPASS) {
        const country = getUserCountry(user);
        const currency = getCurrency(country);
        const ghsPrice = getProjectPrice(tier, level);
        const localAmount = Math.round(ghsPrice * currency.rate);
        const mockRef = `mock_${Date.now()}`;

        return new Promise((resolve) => {
          pendingCallbacksRef.current.set(mockRef, {
            reference: mockRef,
            projectId, tier, isUpgrade: false,
            amount: localAmount, currency: currency.code,
            resolve,
          });
          setMockPaymentConfig({
            email: user?.email || 'test@example.com',
            amount: localAmount,
            currency: currency.code,
            metadata: { projectId, tier, type: 'project_creation' },
          });
        });
      }

      const country = getUserCountry(user);
      const currency = getCurrency(country);
      const ghsPrice = getProjectPrice(tier, level);
      const localAmount = Math.round(ghsPrice * currency.rate);

      const result = await openPaystackPopup(
        user?.email || 'customer@example.com',
        ghsPrice,
        { projectId, tier, type: 'project_creation' }
      );

      if (result.useRedirect) {
        const idToken = await getIdToken();
        const res = await fetch(`${PROXY_URL}/api/initialize-payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {}) },
          body: JSON.stringify({
            email: user?.email || 'customer@example.com',
            amount: ghsPrice,
            currency: 'GHS',
            metadata: { projectId, tier, type: 'project_creation' },
          }),
        });
        if (!res.ok) throw new Error('Failed to initialize payment');
        const data = await res.json();
        storePaymentSessionData(data.reference, projectId, tier, false, ghsPrice, 'GHS', project);
        window.location.href = data.authorizationUrl;
        return new Promise((resolve) => {
          const checkReturn = setInterval(() => {
            const pending = getPendingPayment();
            if (pending) {
              clearInterval(checkReturn);
              // Must be read before clearPendingPayment(): the project payload the
              // server needs in order to create the document lives in the same
              // sessionStorage keys that get wiped here.
              const pendingProject = readPendingProject();
              clearPendingPayment();
              verifyPayment(pending.reference, pending.projectId, pending.tier, pending.isUpgrade, pending.amount, pending.currency, pendingProject)
                .then((v) => resolve(!!v));
            }
          }, 500);
          intervalRefs.current.push(checkReturn);
          setTimeout(() => { clearInterval(checkReturn); resolve(false); }, 120000);
        });
      }

      if (result.status === 'success' && result.reference) {
        const verified = await verifyPayment(result.reference, projectId, tier, false, ghsPrice, 'GHS', project);
        return !!verified;
      }
      return false;
    } catch (e) {
      console.error('Error processing payment:', e);
      if (onNotify) onNotify('Payment failed. Please try again.', 'error');
      return false;
    } finally {
      setProcessing(false);
    }
  }, [onNotify, verifyPayment, user, getIdToken, openPaystackPopup, cleanupIntervals]);

  const upgradeToPremium = useCallback(async (projectId) => {
    setProcessing(true);
    try {
      if (DEV_BYPASS) {
        const country = getUserCountry(user);
        const currency = getCurrency(country);
        const ghsPrice = PRICES_GHS.upgrade;
        const localAmount = Math.round(ghsPrice * currency.rate);
        const mockRef = `mock_${Date.now()}`;

        return new Promise((resolve) => {
          pendingCallbacksRef.current.set(mockRef, {
            reference: mockRef,
            projectId, tier: 'premium', isUpgrade: true,
            amount: localAmount, currency: currency.code,
            resolve,
          });
          setMockPaymentConfig({
            email: user?.email || 'test@example.com',
            amount: localAmount,
            currency: currency.code,
            metadata: { projectId, tier: 'premium', type: 'upgrade' },
          });
        });
      }

      const country = getUserCountry(user);
      const currency = getCurrency(country);
      const ghsPrice = PRICES_GHS.upgrade;
      const localAmount = Math.round(ghsPrice * currency.rate);

      const result = await openPaystackPopup(
        user?.email || 'customer@example.com',
        ghsPrice,
        { projectId, tier: 'premium', type: 'upgrade' }
      );

      if (result.useRedirect) {
        const idToken = await getIdToken();
        const res = await fetch(`${PROXY_URL}/api/initialize-payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {}) },
          body: JSON.stringify({
            email: user?.email || 'customer@example.com',
            amount: ghsPrice,
            currency: 'GHS',
            metadata: { projectId, tier: 'premium', type: 'upgrade' },
          }),
        });
        if (!res.ok) throw new Error('Failed to initialize payment');
        const data = await res.json();
        storePaymentSessionData(data.reference, projectId, 'premium', true, ghsPrice, 'GHS');
        window.location.href = data.authorizationUrl;
        return new Promise((resolve) => {
          const checkReturn = setInterval(() => {
            const pending = getPendingPayment();
            if (pending) {
              clearInterval(checkReturn);
              clearPendingPayment();
              verifyPayment(pending.reference, pending.projectId, pending.tier, pending.isUpgrade, pending.amount, pending.currency).then((v) => resolve(!!v));
            }
          }, 500);
          intervalRefs.current.push(checkReturn);
          setTimeout(() => { clearInterval(checkReturn); resolve(false); }, 120000);
        });
      }

      if (result.status === 'success' && result.reference) {
        const verified = await verifyPayment(result.reference, projectId, 'premium', true, ghsPrice, 'GHS');
        return !!verified;
      }
      return false;
    } catch (e) {
      console.error('Error upgrading project:', e);
      if (onNotify) onNotify('Upgrade failed. Please try again.', 'error');
      return false;
    } finally {
      setProcessing(false);
    }
  }, [onNotify, verifyPayment, user, getIdToken, openPaystackPopup, cleanupIntervals]);

  const processSmallPayment = useCallback(async (projectId, ghsAmount, metadata, onSuccess) => {
    setProcessing(true);
    try {
      if (DEV_BYPASS) {
        const country = getUserCountry(user);
        const currency = getCurrency(country);
        const localAmount = Math.round(ghsAmount * currency.rate);
        const mockRef = `mock_${Date.now()}`;

        return new Promise((resolve) => {
          pendingCallbacksRef.current.set(mockRef, {
            reference: mockRef,
            projectId, tier: metadata.tier || 'regular', isUpgrade: false,
            amount: localAmount, currency: currency.code,
            onSuccess,
            resolve,
          });
          setMockPaymentConfig({
            email: user?.email || 'test@example.com',
            amount: localAmount,
            currency: currency.code,
            metadata: { projectId, ...metadata },
          });
        });
      }

      const country = getUserCountry(user);
      const currency = getCurrency(country);
      const localAmount = Math.round(ghsAmount * currency.rate);

      const result = await openPaystackPopup(
        user?.email || 'customer@example.com',
        ghsAmount,
        { projectId, ...metadata }
      );

      if (result.useRedirect) {
        const idToken = await getIdToken();
        const res = await fetch(`${PROXY_URL}/api/initialize-payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {}) },
          body: JSON.stringify({
            email: user?.email || 'customer@example.com',
            amount: ghsAmount,
            currency: 'GHS',
            metadata: { projectId, ...metadata },
          }),
        });
        if (!res.ok) throw new Error('Failed to initialize payment');
        const data = await res.json();
        storePaymentSessionData(data.reference, projectId, metadata.tier || 'regular', false, ghsAmount, 'GHS');
        window.location.href = data.authorizationUrl;
        return new Promise((resolve) => {
          const checkReturn = setInterval(() => {
            const pending = getPendingPayment();
            if (pending) {
              clearInterval(checkReturn);
              clearPendingPayment();
              verifyPayment(pending.reference, pending.projectId, pending.tier, pending.isUpgrade, pending.amount, pending.currency).then((v) => {
                  if (v && onSuccess) onSuccess();
                  resolve(!!v);
                });
            }
          }, 500);
          intervalRefs.current.push(checkReturn);
          setTimeout(() => { clearInterval(checkReturn); resolve(false); }, 120000);
        });
      }

      if (result.status === 'success' && result.reference) {
        const verified = await verifyPayment(result.reference, projectId, metadata.tier || 'regular', false, ghsAmount, 'GHS');
        if (verified && onSuccess) onSuccess();
        return !!verified;
      }
      return false;
    } catch (e) {
      console.error('Error processing payment:', e);
      if (onNotify) onNotify('Payment failed. Please try again.', 'error');
      return false;
    } finally {
      setProcessing(false);
    }
  }, [onNotify, verifyPayment, user, getIdToken, openPaystackPopup, cleanupIntervals]);

  return {
    processing,
    processPayment,
    upgradeToPremium,
    processSmallPayment,
    verifyPayment,
    devBypass: DEV_BYPASS,
    mockPaymentConfig,
    onMockPaymentSuccess: handleMockPaymentSuccess,
    onMockPaymentClose: handleMockPaymentClose,
  };
};

export default usePayment;
