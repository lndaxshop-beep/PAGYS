import { useState } from 'react';

const usePayment = (onNotify) => {
  const [showPremiumConfirm, setShowPremiumConfirm] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  const handlePremiumClick = async () => {
    let projects;
    try {
      const { getProjects } = await import('../services/firestoreService');
      projects = await getProjects();
    } catch (e) {
      console.error('Error loading projects for premium:', e);
      if (onNotify) onNotify('Failed to check premium status. Please try again.', 'error');
      return;
    }
    if (!projects || projects.length === 0) {
      if (onNotify) onNotify('Create a project first before upgrading to Premium.', 'error');
      return;
    }
    if (projects.some(p => p.isPremium)) {
      if (onNotify) onNotify('You already have Premium access! Humanise and Feedback: up to 4 times per subsection.', 'info');
      return;
    }
    setShowPremiumConfirm(true);
  };

  const handleConfirmPremium = async () => {
    try {
      const { getProjects, updateProject } = await import('../services/firestoreService');
      const projects = await getProjects();
      await Promise.all(projects.map(p => updateProject(p.id, { isPremium: true })));
      try {
        const stored = JSON.parse(localStorage.getItem('thesisProjects') || '[]');
        localStorage.setItem('thesisProjects', JSON.stringify(stored.map(p => ({ ...p, isPremium: true }))));
      } catch (e) { console.warn('Failed to sync localStorage:', e); }
      setIsPremium(true);
      setShowPremiumConfirm(false);
      window.dispatchEvent(new CustomEvent('premiumActivated'));
      if (onNotify) onNotify('Premium activated successfully! Humanise and Feedback: up to 4 times per subsection.', 'success');
      return true;
    } catch (e) {
      console.error('Error updating premium status:', e);
      if (onNotify) onNotify('Failed to activate premium. Please try again.', 'error');
      return false;
    }
  };

  const handleCancelPremium = () => {
    setShowPremiumConfirm(false);
  };

  return {
    showPremiumConfirm, isPremium,
    handlePremiumClick,
    handleConfirmPremium,
    handleCancelPremium,
  };
};

export default usePayment;
