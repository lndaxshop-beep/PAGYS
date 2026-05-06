import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { saveProject } from '../services/firestoreService';
import ResearchQuestionModal from '../components/ResearchQuestionModal';
import ConfirmModal from '../components/ConfirmModal';
import Toast from '../components/Toast';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import RecycleBin from '../components/dashboard/RecycleBin';
import NewProjectForm from '../components/dashboard/NewProjectForm';
import ProjectsList from '../components/dashboard/ProjectsList';
import { useDashboardData } from '../hooks/useDashboardData';
import { useDashboardForm } from '../hooks/useDashboardForm';

const Dashboard = () => {
  const { colors } = useTheme();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [showRecycleBin, setShowRecycleBin] = useState(false);
  const [hoveredProject, setHoveredProject] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState(null);
  const [toast, setToast] = useState(null);

  const confirmAction = useCallback((config) => {
    return new Promise((resolve) => {
      setConfirmConfig({ ...config, resolve });
    });
  }, []);

  const notify = useCallback((message, type) => {
    setToast({ message, type });
  }, []);

  const {
    projects, deletedProjects, projectsWithProgress, loading, progressLoading,
    loadProjects, loadDeletedProjects,
    handleDeleteProject, handleRestoreProject, handlePermanentDelete, handleEmptyRecycleBin,
    continueProject
  } = useDashboardData({ confirmAction, notify });

  const {
    form, handleChange, useOrganization, setUseOrganization,
    organizationName, setOrganizationName, hideOrganization, setHideOrganization,
    questionModal, setQuestionModal, loadingQuestions,
    generateResearchQuestions, handleSubmit
  } = useDashboardForm(async (project) => {
    await saveProject(project);
    notify(`Project created successfully!${useOrganization && organizationName ? ` Organization "${organizationName}" will be used as case study.` : ''}`, 'success');
    setShowNewProjectForm(false);
    loadProjects();
  }, { onNotify: notify });

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) setUser(JSON.parse(savedUser));
    else navigate('/login');
  }, [navigate]);

  useEffect(() => { if (user) { loadProjects(); loadDeletedProjects(); } }, [user]);

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

  if (!user) return <div style={{ textAlign: 'center', padding: '50px', color: colors.text }}>Loading...</div>;

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

export default Dashboard;
