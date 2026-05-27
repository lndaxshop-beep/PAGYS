import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { saveProject } from '../services/firestoreService';
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
import { PRICES_GHS, getUserCountry } from '../constants/pricing';
import OnboardingWizard from '../components/OnboardingWizard';
import useSourceLibrary from '../hooks/useSourceLibrary';
import SourceSetupModal from '../components/SourceSetupModal';
import usePayment from '../hooks/usePayment';

const DEV_BYPASS = import.meta.env.VITE_DEV_PAYMENT_BYPASS === 'true';

const Dashboard = () => {
  const { colors } = useTheme();
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

  const { processing: processingPayment, processPayment, upgradeToPremium, mockPaymentConfig, onMockPaymentSuccess, onMockPaymentClose } = usePayment(notify);

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
      loadProjects();
      loadDeletedProjects();
    }
  }, [user]);

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

  const handlePaymentConfirm = async () => {
    if (!paymentProject) return;
    const success = await processPayment(paymentProject.id, paymentTier);
    if (success) {
      if (!paymentIsUpgrade) {
        try {
          await saveProject(paymentProject, user?.uid);
        } catch (e) {
          notify('Project saved but payment recorded. Contact support if the project does not appear.', 'warning');
        }
      }
      setShowPaymentModal(false);
      const country = getUserCountry(user);
      const priceKey = paymentIsUpgrade ? 'upgrade' : (paymentTier === 'premium' ? 'premium' : 'regular');
      const receiptData = {
        type: paymentIsUpgrade ? 'upgrade' : 'project_creation',
        amount: PRICES_GHS[priceKey],
        currency: 'GHS',
        reference: paymentProject.lastPaymentReference || `PAY_${Date.now()}`,
        email: user?.email,
        paidAt: new Date().toISOString(),
        channel: DEV_BYPASS ? 'mock' : 'card',
      };
      setPaymentReceipt(receiptData);
      setPaymentProject(null);
      setPaymentTier(null);
      loadProjects();
      if (paymentIsUpgrade) {
      } else if (paymentTier === 'premium') {
        setShowSourceSetup(true);
      }
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
      await processPayment(paymentProject.id, paymentTier);
    }
    setShowPaymentModal(false);
    setPaymentProject(null);
    setPaymentTier(null);
    setPaymentIsUpgrade(false);
    loadProjects();
    if (!paymentIsUpgrade && paymentTier === 'premium') {
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
    <div style={{ minHeight: '100vh', backgroundColor: colors.background, padding: '32px', transition: 'all 0.3s' }}>
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
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', color: colors.text }}>Your Projects</h2>
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
          amount={paymentIsUpgrade ? PRICES_GHS.upgrade : (paymentTier === 'premium' ? PRICES_GHS.premium : PRICES_GHS.regular)}
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

      {showSourceSetup && createdProjectId && createdProjectTier === 'premium' && (
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
      sourceMode={sourceLibrary.sourceMode}
      onModeChange={sourceLibrary.setSourceMode}
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
