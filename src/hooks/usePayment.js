import { useState, useCallback } from 'react';
import { formatPrice, getUserCountry, PRICES_USD } from '../constants/pricing';

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
    if (onNotify) onNotify(
      isUpgrade
        ? `Project upgraded to Premium (${formatPrice(PRICES_USD.upgrade, getUserCountry(), false)})! All features unlocked.`
        : tier === 'premium'
          ? 'Premium project created! All features unlocked.'
          : 'Regular project created! You can upgrade anytime.',
      'success'
    );
    window.dispatchEvent(new CustomEvent(isUpgrade ? 'projectUpgraded' : 'projectPaymentComplete', {
      detail: { projectId, tier }
    }));
  }, [onNotify]);

  const verifyPayment = useCallback(async (reference, projectId, tier, isUpgrade, amount) => {
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
        amount: data.amount,
        currency: data.currency,
        reference: data.reference,
        email: data.email,
        paidAt: data.paidAt,
        channel: data.channel,
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

  const processPayment = useCallback(async (projectId, tier) => {
    setProcessing(true);
    try {
      if (DEV_BYPASS) {
        await new Promise(resolve => setTimeout(resolve, 800));
        await updateProjectTier(projectId, tier, false);
        await storePaymentRecord({
          userId: JSON.parse(localStorage.getItem('currentUser') || '{}').uid,
          projectId, tier, amount: tier === 'premium' ? PRICES_USD.premium : PRICES_USD.regular,
          currency: 'USD', reference: `dev_${Date.now()}`, paidAt: new Date().toISOString(),
          channel: 'dev_bypass', type: 'project_creation', status: 'verified',
        });
        return true;
      }

      const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const amount = tier === 'premium' ? PRICES_USD.premium : PRICES_USD.regular;

      const res = await fetch(`${PROXY_URL}/api/initialize-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email || 'customer@example.com',
          amount,
          metadata: { projectId, tier, type: 'project_creation' },
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to initialize payment');
      }

      const data = await res.json();
      window.location.href = data.authorizationUrl;

      return new Promise((resolve) => {
        const checkReturn = setInterval(() => {
          const returned = sessionStorage.getItem('paystack_return');
          if (returned) {
            clearInterval(checkReturn);
            sessionStorage.removeItem('paystack_return');
            const ref = sessionStorage.getItem('paystack_reference');
            if (ref) {
              verifyPayment(ref, projectId, tier, false, amount).then((result) => {
                resolve(!!result);
              });
            } else {
              resolve(false);
            }
          }
        }, 500);
        setTimeout(() => { clearInterval(checkReturn); resolve(false); }, 120000);
      });
    } catch (e) {
      console.error('Error processing payment:', e);
      if (onNotify) onNotify('Payment failed. Please try again.', 'error');
      return false;
    } finally {
      setProcessing(false);
    }
  }, [onNotify, verifyPayment, updateProjectTier]);

  const upgradeToPremium = useCallback(async (projectId) => {
    setProcessing(true);
    try {
      if (DEV_BYPASS) {
        await new Promise(resolve => setTimeout(resolve, 800));
        await updateProjectTier(projectId, 'premium', true);
        await storePaymentRecord({
          userId: JSON.parse(localStorage.getItem('currentUser') || '{}').uid,
          projectId, tier: 'premium', amount: PRICES_USD.upgrade,
          currency: 'USD', reference: `dev_${Date.now()}`, paidAt: new Date().toISOString(),
          channel: 'dev_bypass', type: 'upgrade', status: 'verified',
        });
        return true;
      }

      const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const amount = PRICES_USD.upgrade;

      const res = await fetch(`${PROXY_URL}/api/initialize-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email || 'customer@example.com',
          amount,
          metadata: { projectId, tier: 'premium', type: 'upgrade' },
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to initialize payment');
      }

      const data = await res.json();
      window.location.href = data.authorizationUrl;

      return new Promise((resolve) => {
        const checkReturn = setInterval(() => {
          const returned = sessionStorage.getItem('paystack_return');
          if (returned) {
            clearInterval(checkReturn);
            sessionStorage.removeItem('paystack_return');
            const ref = sessionStorage.getItem('paystack_reference');
            if (ref) {
              verifyPayment(ref, projectId, 'premium', true, amount).then((result) => {
                resolve(!!result);
              });
            } else {
              resolve(false);
            }
          }
        }, 500);
        setTimeout(() => { clearInterval(checkReturn); resolve(false); }, 120000);
      });
    } catch (e) {
      console.error('Error upgrading project:', e);
      if (onNotify) onNotify('Upgrade failed. Please try again.', 'error');
      return false;
    } finally {
      setProcessing(false);
    }
  }, [onNotify, verifyPayment, updateProjectTier]);

  const processSmallPayment = useCallback(async (projectId, amount, metadata, onSuccess) => {
    setProcessing(true);
    try {
      if (DEV_BYPASS) {
        await new Promise(resolve => setTimeout(resolve, 800));
        await storePaymentRecord({
          userId: JSON.parse(localStorage.getItem('currentUser') || '{}').uid,
          projectId, amount, currency: 'USD', reference: `dev_${Date.now()}`,
          paidAt: new Date().toISOString(), channel: 'dev_bypass',
          type: metadata.type || 'micro_payment', status: 'verified',
        });
        if (onSuccess) onSuccess();
        return true;
      }

      const user = JSON.parse(localStorage.getItem('currentUser') || '{}');

      const res = await fetch(`${PROXY_URL}/api/initialize-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email || 'customer@example.com',
          amount,
          metadata: { projectId, ...metadata },
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to initialize payment');
      }

      const data = await res.json();
      window.location.href = data.authorizationUrl;

      return new Promise((resolve) => {
        const checkReturn = setInterval(() => {
          const returned = sessionStorage.getItem('paystack_return');
          if (returned) {
            clearInterval(checkReturn);
            sessionStorage.removeItem('paystack_return');
            const ref = sessionStorage.getItem('paystack_reference');
            if (ref) {
              verifyPayment(ref, projectId, metadata.tier || 'regular', false, amount).then((result) => {
                if (result && onSuccess) onSuccess();
                resolve(!!result);
              });
            } else {
              resolve(false);
            }
          }
        }, 500);
        setTimeout(() => { clearInterval(checkReturn); resolve(false); }, 120000);
      });
    } catch (e) {
      console.error('Error processing payment:', e);
      if (onNotify) onNotify('Payment failed. Please try again.', 'error');
      return false;
    } finally {
      setProcessing(false);
    }
  }, [onNotify, verifyPayment]);

  return { processing, processPayment, upgradeToPremium, processSmallPayment, devBypass: DEV_BYPASS };
};

export default usePayment;
