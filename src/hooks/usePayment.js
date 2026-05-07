import { useState } from 'react';

const usePayment = (onNotify) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [activeProjectForPayment, setActiveProjectForPayment] = useState(null);
  const [isPremium, setIsPremium] = useState(false);

  const handlePremiumClick = async () => {
    const { getProjects } = await import('../services/firestoreService');
    const projects = await getProjects();
    if (projects.length === 0) { if (onNotify) onNotify('Start a project first before upgrading to Premium.', 'error'); return; }
    if (isPremium) { if (onNotify) onNotify('You already have Premium access! Humanise and Feedback: up to 4 times per subsection.', 'info'); return; }
    let eligibleProject = null;
    for (const project of projects) {
      const savedContent = localStorage.getItem(`generatedContent_${project.id}`);
      if (savedContent) {
        const content = JSON.parse(savedContent);
        if (Object.keys(content).length > 0) { eligibleProject = project; break; }
      }
    }
    if (!eligibleProject) { if (onNotify) onNotify('Start writing first! Generate at least one subsection before upgrading to Premium.', 'error'); return; }
    setActiveProjectForPayment(eligibleProject);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async (response) => {
    if (!activeProjectForPayment) return;
    const { updateProject } = await import('../services/firestoreService');
    await updateProject(activeProjectForPayment.id, { isPremium: true, paymentReference: response.reference, paidAt: new Date().toISOString() });
    setIsPremium(true);
    setShowPaymentModal(false);
    setActiveProjectForPayment(null);
    if (onNotify) onNotify('Premium activated successfully! Humanise and Feedback: up to 4 times per subsection.', 'success');
  };

  const handleClosePayment = () => {
    setShowPaymentModal(false);
    setActiveProjectForPayment(null);
  };

  return {
    showPaymentModal, activeProjectForPayment, isPremium, setIsPremium,
    handlePremiumClick, handlePaymentSuccess, handleClosePayment
  };
};

export default usePayment;
