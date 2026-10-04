import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useResponsive } from '../hooks/useResponsive';
import { getPendingPayment, clearPendingPayment } from '../hooks/usePayment';

import ResearchQuestionModal from '../components/ResearchQuestionModal';
import ConfirmModal from '../components/ConfirmModal';
import Toast from '../components/Toast';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import RecycleBin from '../components/dashboard/RecycleBin';
import NewProjectForm from '../components/dashboard/NewProjectForm';
import ProjectsList from '../components/dashboard/ProjectsList';
import PaymentModal from '../components/PaymentModal';
import PaymentReceipt from '../components/PaymentReceipt';
import MockPaymentModal from '../components/MockPaymentModal';
import ProjectConfirmationModal from '../components/ProjectConfirmationModal';
import { useDashboardData } from '../hooks/useDashboardData';
import { useDashboardForm } from '../hooks/useDashboardForm';
import { PageSkeleton } from '../components/Skeleton';
import { useCurrency } from '../hooks/useCurrency';
import { PRICES_GHS, getUserCountry, getProjectPrice } from '../constants/pricing';
import OnboardingWizard from '../components/OnboardingWizard';
import useSourceLibrary from '../hooks/useSourceLibrary';
import SourceSetupModal from '../components/SourceSetupModal';
import usePayment from '../hooks/usePayment';

const DEV_BYPASS = import.meta.env.VITE_DEV_PAYMENT_BYPASS === 'true' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const Dashboard = () => {
  const { colors } = useTheme();
  const { isMobile } = useResponsive();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [showRecycleBin, setShowRecycleBin] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hoveredProject, setHoveredProject] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState(null);
  const [toast, setToast] = useState(null);
  const [showSourceSetup, setShowSourceSetup] = useState(false);
  const [createdProjectId, setCreatedProjectId] = useState(null);
  const [createdProjectTier, setCreatedProjectTier] = useState(null);
  const [selectedTier, setSelectedTier] = useState('regular');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentProject, setPaymentProject] = useState(null);
  const [paymentTier, setPaymentTier] = useState(null);
  const [paymentIsUpgrade, setPaymentIsUpgrade] = useState(false);
  const [paymentReceipt, setPaymentReceipt] = useState(null);
  const [confirmationProject, setConfirmationProject] = useState(null);
  const [confirmationTier, setConfirmationTier] = useState(null);

  const confirmAction = useCallback((config) => {
    return new Promise((resolve) => {
      setConfirmConfig({ ...config, resolve });
    });
  }, []);

  const notify = useCallback((message, type) => {
    setToast({ message, type });
  }, []);

  // Previously this rebuilt projects client-side from the payments collection when a
  // document was missing. That is both impossible now (clients cannot create project
  // documents) and unnecessary: /api/verify-payment creates the project inside the
  // same request that records the payment, so a payment can never exist without its
  // project. A payment that completed without creating a project is therefore not a
  // recoverable state, and is logged server-side instead of silently duplicated here.
  const recoverLostProjects = useCallback(async () => 0, []);

  // Projects are created by the server only after payment, so there is no client
  // side project to restore from a local backup anymore.
  const restorePendingBackup = useCallback(async () => 0, []);

  const { processing: processingPayment, processPayment, upgradeToPremium, verifyPayment, mockPaymentConfig, onMockPaymentSuccess, onMockPaymentClose } = usePayment(notify);

  const {
    projects, deletedProjects, projectsWithProgress, loading, progressLoading,
    loadProjects, loadDeletedProjects,
    handleDeleteProject, handleRestoreProject, handlePermanentDelete, handleEmptyRecycleBin,
    continueProject
  } = useDashboardData({ confirmAction, notify, userId: user?.uid });

  const {
    form, handleChange, useOrganization, setUseOrganization,
    organizationName, setOrganizationName, hideOrganization, setHideOrganization,
    questionModal, setQuestionModal, loadingQuestions,
    generateResearchQuestions, handleSubmit,
    setFormData, resetForm
  } = useDashboardForm(async (project, tier) => {
    setConfirmationProject(project);
    setConfirmationTier(tier || 'regular');
  }, { onNotify: notify });

  const projectIdRef = useRef(null);

  useEffect(() => {
    if (user) {
      const onboarded = localStorage.getItem('onboardingComplete_' + user.uid);
      if (!onboarded) setShowOnboarding(true);
      (async () => {
        await loadProjects();
        await loadDeletedProjects();
        const restored = await restorePendingBackup(user.uid);
        const recovered = await recoverLostProjects(user.uid);
        if (restored > 0 || recovered > 0) {
          notify(`${restored + recovered} project(s) recovered.`, 'success');
          loadProjects();
        }
      })();
    }
  }, [user]);

  useEffect(() => {
    const pending = getPendingPayment();
    if (pending) {
      clearPendingPayment();
      verifyPayment(pending.reference, pending.projectId, pending.tier, pending.isUpgrade, pending.amount, pending.currency);
    }
  }, []);

  const handleDismissOnboarding = () => {
    if (user) {
      localStorage.setItem('onboardingComplete_' + user.uid, 'true');
    }
    setShowOnboarding(false);
  };

  const handleConfirm = () => {
    if (confirmConfig) {
      confirmConfig.resolve(true);
      setConfirmConfig(null);
    }
  };

  const handleCancel = () => {
    if (confirmConfig) {
      confirmConfig.resolve(false);
      setConfirmConfig(null);
    }
  };

  // The server creates the project document after Paystack confirms payment, so
  // nothing is written from the browser here. Both tiers are paid products.
  const saveProjectAndFinalize = async (project, tier, { isUpgrade = false, receipt = null, successToast = null } = {}) => {
    if (!project) return;
    if (isUpgrade) {
      setShowPaymentModal(false);
      if (receipt) setPaymentReceipt(receipt);
      setPaymentProject(null);
      setPaymentTier(null);
      loadProjects();
      return;
    }
    setShowPaymentModal(false);
    if (receipt) setPaymentReceipt(receipt);
    setPaymentProject(null);
    setPaymentTier(null);
    if (successToast) notify(successToast, 'success');
    loadProjects();
    setShowSourceSetup(true);
  };

  const handlePaymentConfirm = async () => {
    if (!paymentProject) return;
    const success = await processPayment(paymentProject.id, paymentTier, paymentProject.level, paymentProject);
    if (success) {
      const priceKey = paymentIsUpgrade ? 'upgrade' : (paymentTier === 'premium' ? 'premium' : 'regular');
      const receiptData = {
        type: paymentIsUpgrade ? 'upgrade' : 'project_creation',
        amount: getProjectPrice(priceKey, paymentProject.level),
        currency: 'GHS',
        reference: paymentProject.lastPaymentReference || `PAY_${Date.now()}`,
        email: user?.email,
        paidAt: new Date().toISOString(),
        channel: DEV_BYPASS ? 'mock' : 'card',
      };
      await saveProjectAndFinalize(paymentProject, paymentTier, { isUpgrade: paymentIsUpgrade, receipt: receiptData });
    }
  };

  const handleClosePayment = () => {
    setShowPaymentModal(false);
    setPaymentProject(null);
    setPaymentTier(null);
    resetForm();
  };

  const handleUpgrade = (project) => {
    setPaymentProject(project);
    setPaymentTier('premium');
    setPaymentIsUpgrade(true);
    setShowPaymentModal(true);
  };

  const handleUpgradeConfirm = async () => {
    if (!paymentProject) return;
    const success = await upgradeToPremium(paymentProject.id);
    if (success) {
      setShowPaymentModal(false);
      const receiptData = {
        type: 'upgrade',
        amount: PRICES_GHS.upgrade,
        currency: 'GHS',
        reference: paymentProject.lastPaymentReference || `PAY_${Date.now()}`,
        email: user?.email,
        paidAt: new Date().toISOString(),
        channel: DEV_BYPASS ? 'mock' : 'card',
      };
      setPaymentReceipt(receiptData);
      setPaymentProject(null);
      setPaymentIsUpgrade(false);
      loadProjects();
    }
  };

  const handleDevBypass = async () => {
    if (!paymentProject) return;
    if (paymentIsUpgrade) {
      await upgradeToPremium(paymentProject.id);
    } else {
      await processPayment(paymentProject.id, paymentTier, paymentProject.level, paymentProject);
    }
    setShowPaymentModal(false);
    setPaymentProject(null);
    setPaymentTier(null);
    setPaymentIsUpgrade(false);
    loadProjects();
    if (!paymentIsUpgrade) {
      setShowSourceSetup(true);
    }
  };

  const handleConfirmProject = async () => {
    if (!confirmationProject) return;
    const project = confirmationProject;
    const tier = confirmationTier;
    setConfirmationProject(null);
    setConfirmationTier(null);
    setShowNewProjectForm(false);
    setCreatedProjectId(project.id);
    setCreatedProjectTier(tier);

    // Both tiers are paid, so every new project goes through payment first. The
    // server creates the project document once Paystack confirms, which means an
    // abandoned payment can never leave a usable free project behind.
    setPaymentProject(project);
    setPaymentTier(tier);
    setPaymentIsUpgrade(false);
    setShowPaymentModal(true);
  };

  const handleEditConfirmation = () => {
    setConfirmationProject(null);
    setConfirmationTier(null);
  };

  const handleCancelConfirmation = () => {
    setConfirmationProject(null);
    setConfirmationTier(null);
    resetForm();
    setShowNewProjectForm(false);
  };

  if (!user) return <PageSkeleton />;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.background, padding: isMobile ? '16px' : '32px', transition: 'all 0.3s' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <DashboardHeader
          user={user}
          showRecycleBin={showRecycleBin}
          onToggleRecycleBin={() => setShowRecycleBin(!showRecycleBin)}
          onCreateProject={() => setShowNewProjectForm(!showNewProjectForm)}
          deletedCount={deletedProjects.length}
        />

        {showRecycleBin && (
          <RecycleBin
            deletedProjects={deletedProjects}
            onRestore={handleRestoreProject}
            onPermanentDelete={handlePermanentDelete}
            onEmpty={handleEmptyRecycleBin}
          />
        )}

        {showNewProjectForm && (
          <NewProjectForm
            form={form} onChange={handleChange}
            useOrganization={useOrganization} setUseOrganization={setUseOrganization}
            organizationName={organizationName} setOrganizationName={setOrganizationName}
            hideOrganization={hideOrganization} setHideOrganization={setHideOrganization}
            onGenerateQuestions={generateResearchQuestions}
            onSubmit={handleSubmit}
            onCancel={() => setShowNewProjectForm(false)}
            selectedTier={selectedTier}
            onTierChange={setSelectedTier}
          />
        )}
        <div style={{ marginBottom: isMobile ? '20px' : '32px' }}>
          <h2 style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: '600', marginBottom: '16px', color: colors.text }}>Your Projects</h2>
          <ProjectsList
            projects={projectsWithProgress}
            loading={loading}
            progressLoading={progressLoading}
            hoveredProject={hoveredProject}
            onHover={setHoveredProject}
            onContinue={continueProject}
            onDelete={handleDeleteProject}
            onCreateFirst={() => setShowNewProjectForm(true)}
            onUpgrade={handleUpgrade}
          />
        </div>
      </div>

      {questionModal && (
        <ResearchQuestionModal
          title={questionModal.title}
          questions={questionModal.questions}
          onSelect={(q) => { questionModal.callback(q); setQuestionModal(null); }}
          onCancel={() => setQuestionModal(null)}
        />
      )}

      {confirmConfig && (
        <ConfirmModal
          title={confirmConfig.title}
          message={confirmConfig.message}
          confirmText={confirmConfig.confirmText}
          cancelText={confirmConfig.cancelText}
          danger={confirmConfig.danger}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {showOnboarding && <OnboardingWizard onDismiss={handleDismissOnboarding} />}

      {confirmationProject && (
        <ProjectConfirmationModal
          project={confirmationProject}
          tier={confirmationTier}
          onConfirm={handleConfirmProject}
          onEdit={handleEditConfirmation}
          onCancel={handleCancelConfirmation}
        />
      )}

      {showPaymentModal && paymentProject && (
        <PaymentModal
          project={paymentProject}
          tier={paymentTier}
          amount={paymentIsUpgrade ? PRICES_GHS.upgrade : getProjectPrice(paymentTier, paymentProject?.level)}
          isUpgrade={paymentIsUpgrade}
          processingPayment={processingPayment}
          onConfirm={paymentIsUpgrade ? handleUpgradeConfirm : handlePaymentConfirm}
          onCancel={handleClosePayment}
          onDevBypass={DEV_BYPASS ? handleDevBypass : undefined}
        />
      )}

      {paymentReceipt && (
        <PaymentReceipt
          payment={paymentReceipt}
          onClose={() => setPaymentReceipt(null)}
        />
      )}

      {mockPaymentConfig && (
        <MockPaymentModal
          email={mockPaymentConfig.email}
          amount={mockPaymentConfig.amount}
          currency={mockPaymentConfig.currency}
          metadata={mockPaymentConfig.metadata}
          onClose={onMockPaymentClose}
          onSuccess={onMockPaymentSuccess}
        />
      )}

      {showSourceSetup && createdProjectId && (
        <SourceSetupModalWrapper
          projectId={createdProjectId}
          isPremium={createdProjectTier === 'premium'}
          onClose={() => { setShowSourceSetup(false); setCreatedProjectId(null); setCreatedProjectTier(null); resetForm(); }}
          onContinue={() => { setShowSourceSetup(false); setCreatedProjectId(null); setCreatedProjectTier(null); resetForm(); }}
        />
      )}

      {loadingQuestions && (
        <div style={{
          position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
          backgroundColor: colors.primary, color: 'white', padding: '12px 24px',
          borderRadius: '30px', zIndex: 10001, fontWeight: '500', fontSize: '14px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: '10px'
        }}>
          <div style={{ width: '18px', height: '18px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          Generating research questions...
        </div>
      )}
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

const SourceSetupModalWrapper = ({ projectId, isPremium, onClose, onContinue }) => {
  const sourceLibrary = useSourceLibrary(projectId);

  const handleAddFile = async (e) => {
    const files = e.target.files;
    for (let i = 0; i < files.length; i++) {
      await sourceLibrary.addSource(files[i]);
    }
    e.target.value = '';
  };

  return (
    <SourceSetupModal
      sources={sourceLibrary.sources}
      extracting={sourceLibrary.extracting}
      onAddFile={handleAddFile}
      onRemoveSource={sourceLibrary.removeSource}
      onGenerateMatrix={() => sourceLibrary.generateMatrix({ title: '' })}
      generatingMatrix={sourceLibrary.generatingMatrix}
      matrix={sourceLibrary.matrix}
      onClose={onClose}
      onContinue={onContinue}
      isPremium={isPremium}
    />
  );
};

export default Dashboard;
