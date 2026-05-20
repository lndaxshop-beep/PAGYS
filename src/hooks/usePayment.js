import { useState, useCallback } from 'react';
import { formatPrice, getUserCountry, PRICES_USD } from '../constants/pricing';

const PROXY_URL = import.meta.env.VITE_API_PROXY_URL || 'http://localhost:3001';
const DEV_BYPASS = import.meta.env.VITE_DEV_PAYMENT_BYPASS === 'true';
const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '';

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

  const verifyPayment = useCallback(async (reference, projectId, tier, isUpgrade) => {
    try {
      const res = await fetch(`${PROXY_URL}/api/verify-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference }),
      });
      const data = await res.json();
      if (!res.ok || !data.verified) {
        throw new Error(data.error || 'Payment verification failed');
      }
      await updateProjectTier(projectId, tier, isUpgrade);
      return true;
    } catch (e) {
      console.error('Payment verification error:', e);
      if (onNotify) onNotify('Payment verification failed. Contact support.', 'error');
      return false;
    }
  }, [onNotify, updateProjectTier]);

  const processPayment = useCallback(async (projectId, tier) => {
    setProcessing(true);
    try {
      if (DEV_BYPASS) {
        await new Promise(resolve => setTimeout(resolve, 800));
        await updateProjectTier(projectId, tier, false);
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
        throw new Error('Failed to initialize payment');
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
              verifyPayment(ref, projectId, tier, false).then(resolve);
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

  const upgradeToPremium = useCallback(async (projectId) => {
    setProcessing(true);
    try {
      if (DEV_BYPASS) {
        await new Promise(resolve => setTimeout(resolve, 800));
        await updateProjectTier(projectId, 'premium', true);
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
        throw new Error('Failed to initialize payment');
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
              verifyPayment(ref, projectId, 'premium', true).then(resolve);
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
  }, [onNotify, verifyPayment]);

  const processSmallPayment = useCallback(async (projectId, amount, metadata, onSuccess) => {
    setProcessing(true);
    try {
      if (DEV_BYPASS) {
        await new Promise(resolve => setTimeout(resolve, 800));
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

      if (!res.ok) throw new Error('Failed to initialize payment');

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
              verifyPayment(ref, projectId, metadata.tier || 'regular', false).then((v) => {
                if (v && onSuccess) onSuccess();
                resolve(v);
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
