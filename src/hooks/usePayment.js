import { useState, useCallback } from 'react';
import { formatPrice, getUserCountry, PRICES_GHS, getCurrency } from '../constants/pricing';

const PROXY_URL = import.meta.env.VITE_API_PROXY_URL || 'http://localhost:3001';
const DEV_BYPASS = import.meta.env.VITE_DEV_PAYMENT_BYPASS === 'true';
const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '';

const storePaymentRecord = async (paymentData) => {
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

const usePayment = (onNotify) => {
  const [processing, setProcessing] = useState(false);

  const updateProjectTier = useCallback(async (projectId, tier, isUpgrade) => {
    const { updateProject } = await import('../services/firestoreService');
    await updateProject(projectId, {
      tier,
      isPremium: tier === 'premium',
    });
    const country = getUserCountry();
    const priceKey = isUpgrade ? 'upgrade' : tier;
    const amount = PRICES_GHS[priceKey] || PRICES_GHS.regular;
    if (onNotify) onNotify(
      isUpgrade
        ? `Project upgraded to Premium (${formatPrice(amount, country, false)})! All features unlocked.`
        : tier === 'premium'
          ? 'Premium project created! All features unlocked.'
          : 'Regular project created! You can upgrade anytime.',
      'success'
    );
    window.dispatchEvent(new CustomEvent(isUpgrade ? 'projectUpgraded' : 'projectPaymentComplete', {
      detail: { projectId, tier }
    }));
  }, [onNotify]);

  const verifyPayment = useCallback(async (reference, projectId, tier, isUpgrade, amount, currency) => {
    try {
      const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const res = await fetch(`${PROXY_URL}/api/verify-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference, projectId, tier, userId: user?.uid }),
      });
      const data = await res.json();
      if (!res.ok || !data.verified) {
        throw new Error(data.error || 'Payment verification failed');
      }
      await updateProjectTier(projectId, tier, isUpgrade);
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
  }, [onNotify, updateProjectTier]);

  const openPaystackPopup = useCallback((email, amount, currency, metadata) => {
    return new Promise((resolve) => {
      const handler = PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email,
        amount: Math.round(amount * 100),
        currency: currency.toUpperCase(),
        ref: `PAGYS_${Date.now()}_${Math.floor(Math.random() * 1000000)}`,
        metadata: { custom_fields: [{ display_name: 'Project Type', variable_name: 'project_type', value: metadata?.type || 'project_creation' }] },
        callback: (response) => {
          resolve({ reference: response.reference, status: 'success' });
        },
        onClose: () => {
          resolve({ reference: null, status: 'closed' });
        },
      });
      handler.openIframe();
    });
  }, []);

  const processPayment = useCallback(async (projectId, tier) => {
    setProcessing(true);
    try {
      if (DEV_BYPASS) {
        await new Promise(resolve => setTimeout(resolve, 800));
        await updateProjectTier(projectId, tier, false);
        await storePaymentRecord({
          userId: JSON.parse(localStorage.getItem('currentUser') || '{}').uid,
          projectId, tier, amount: PRICES_GHS[tier] || PRICES_GHS.regular,
          currency: 'GHS', reference: `dev_${Date.now()}`, paidAt: new Date().toISOString(),
          channel: 'dev_bypass', type: 'project_creation', status: 'verified',
        });
        return true;
      }

      const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const country = getUserCountry();
      const currency = getCurrency(country);
      const ghsPrice = PRICES_GHS[tier] || PRICES_GHS.regular;
      const localAmount = Math.round(ghsPrice * currency.rate);

      const result = await openPaystackPopup(
        user.email || 'customer@example.com',
        localAmount,
        currency.code,
        { projectId, tier, type: 'project_creation' }
      );

      if (result.status === 'success' && result.reference) {
        const verified = await verifyPayment(result.reference, projectId, tier, false, localAmount, currency.code);
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
  }, [onNotify, verifyPayment, updateProjectTier, openPaystackPopup]);

  const upgradeToPremium = useCallback(async (projectId) => {
    setProcessing(true);
    try {
      if (DEV_BYPASS) {
        await new Promise(resolve => setTimeout(resolve, 800));
        await updateProjectTier(projectId, 'premium', true);
        await storePaymentRecord({
          userId: JSON.parse(localStorage.getItem('currentUser') || '{}').uid,
          projectId, tier: 'premium', amount: PRICES_GHS.upgrade,
          currency: 'GHS', reference: `dev_${Date.now()}`, paidAt: new Date().toISOString(),
          channel: 'dev_bypass', type: 'upgrade', status: 'verified',
        });
        return true;
      }

      const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const country = getUserCountry();
      const currency = getCurrency(country);
      const ghsPrice = PRICES_GHS.upgrade;
      const localAmount = Math.round(ghsPrice * currency.rate);

      const result = await openPaystackPopup(
        user.email || 'customer@example.com',
        localAmount,
        currency.code,
        { projectId, tier: 'premium', type: 'upgrade' }
      );

      if (result.status === 'success' && result.reference) {
        const verified = await verifyPayment(result.reference, projectId, 'premium', true, localAmount, currency.code);
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
  }, [onNotify, verifyPayment, updateProjectTier, openPaystackPopup]);

  const processSmallPayment = useCallback(async (projectId, ghsAmount, metadata, onSuccess) => {
    setProcessing(true);
    try {
      if (DEV_BYPASS) {
        await new Promise(resolve => setTimeout(resolve, 800));
        await storePaymentRecord({
          userId: JSON.parse(localStorage.getItem('currentUser') || '{}').uid,
          projectId, amount: ghsAmount, currency: 'GHS', reference: `dev_${Date.now()}`,
          paidAt: new Date().toISOString(), channel: 'dev_bypass',
          type: metadata.type || 'micro_payment', status: 'verified',
        });
        if (onSuccess) onSuccess();
        return true;
      }

      const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const country = getUserCountry();
      const currency = getCurrency(country);
      const localAmount = Math.round(ghsAmount * currency.rate);

      const result = await openPaystackPopup(
        user.email || 'customer@example.com',
        localAmount,
        currency.code,
        { projectId, ...metadata }
      );

      if (result.status === 'success' && result.reference) {
        const verified = await verifyPayment(result.reference, projectId, metadata.tier || 'regular', false, localAmount, currency.code);
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
  }, [onNotify, verifyPayment, openPaystackPopup]);

  return { processing, processPayment, upgradeToPremium, processSmallPayment, devBypass: DEV_BYPASS };
};

export default usePayment;
