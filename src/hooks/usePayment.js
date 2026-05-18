import { useState, useCallback } from 'react';
import { formatPrice, getUserCountry, PRICES_USD } from '../constants/pricing';

const usePayment = (onNotify) => {
  const [processing, setProcessing] = useState(false);

  const processPayment = useCallback(async (projectId, tier) => {
    setProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      const { updateProject } = await import('../services/firestoreService');
      await updateProject(projectId, {
        tier,
        isPremium: tier === 'premium',
      });
      if (onNotify) onNotify(
        tier === 'premium'
          ? 'Premium project created! All features unlocked.'
          : 'Regular project created! You can upgrade anytime.',
        'success'
      );
      window.dispatchEvent(new CustomEvent('projectPaymentComplete', {
        detail: { projectId, tier }
      }));
      return true;
    } catch (e) {
      console.error('Error processing payment:', e);
      if (onNotify) onNotify('Payment failed. Please try again.', 'error');
      return false;
    } finally {
      setProcessing(false);
    }
  }, [onNotify]);

  const upgradeToPremium = useCallback(async (projectId) => {
    setProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      const { updateProject } = await import('../services/firestoreService');
      await updateProject(projectId, {
        tier: 'premium',
        isPremium: true,
      });
      if (onNotify) onNotify(`Project upgraded to Premium (${formatPrice(PRICES_USD.upgrade, getUserCountry(), false)})! All features unlocked.`, 'success');
      window.dispatchEvent(new CustomEvent('projectUpgraded', {
        detail: { projectId }
      }));
      return true;
    } catch (e) {
      console.error('Error upgrading project:', e);
      if (onNotify) onNotify('Upgrade failed. Please try again.', 'error');
      return false;
    } finally {
      setProcessing(false);
    }
  }, [onNotify]);

  return { processing, processPayment, upgradeToPremium };
};

export default usePayment;
