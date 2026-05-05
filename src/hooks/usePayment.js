import { useState } from 'react';

const usePayment = () => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [activeProjectForPayment, setActiveProjectForPayment] = useState(null);
  const [isPremium, setIsPremium] = useState(false);

  const handlePremiumClick = async () => {
    const { getProjects } = await import('../services/firestoreService');
    const projects = await getProjects();
    if (projects.length === 0) { alert('Start a project first before upgrading to Premium.'); return; }
    if (isPremium) { alert('You already have Premium access!\n\nHumanise: up to 4 times per subsection\nFeedback: up to 4 times per subsection'); return; }
    let eligibleProject = null;
    for (const project of projects) {
      const savedContent = localStorage.getItem(`generatedContent_${project.id}`);
      if (savedContent) {
        const content = JSON.parse(savedContent);
        if (Object.keys(content).length > 0) { eligibleProject = project; break; }
      }
    }
    if (!eligibleProject) { alert('Start writing first! Generate at least one subsection before upgrading to Premium.'); return; }
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
    alert('Premium activated successfully!\n\nYou can now use:\nHumanise: 4 times per subsection\nFeedback: 4 times per subsection');
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
