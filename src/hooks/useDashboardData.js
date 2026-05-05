import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveProject, getProjects, updateProject, deleteProject, saveDeletedProject, getDeletedProjects, permanentlyDeleteProject, getGeneratedContent, getChapters } from '../services/firestoreService';
import { calculateProjectProgress } from '../utils/dashboardHelpers';

export const useDashboardData = () => {
  const [projects, setProjects] = useState([]);
  const [deletedProjects, setDeletedProjects] = useState([]);
  const [projectsWithProgress, setProjectsWithProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (e) {
      console.error('Error loading projects:', e);
    }
    setLoading(false);
  };

  const loadDeletedProjects = async () => {
    try {
      const data = await getDeletedProjects();
      setDeletedProjects(data);
    } catch (e) {
      console.error('Error loading deleted projects:', e);
    }
  };

  useEffect(() => {
    if (projects.length > 0) {
      Promise.all(projects.map(async (project) => {
        const chapters = await getChapters(project.id);
        const content = await getGeneratedContent(project.id);
        const progress = calculateProjectProgress(project, chapters, content);
        return { ...project, progress };
      })).then(setProjectsWithProgress);
    } else {
      setProjectsWithProgress([]);
    }
  }, [projects]);

  const handleDeleteProject = async (id) => {
    if (!window.confirm('Are you sure? You can restore it from Recycle Bin.')) return;
    const project = projects.find(p => p.id === id);
    await deleteProject(id);
    await saveDeletedProject({ ...project, deletedAt: new Date().toISOString() });
    loadProjects();
    loadDeletedProjects();
    alert('Project moved to Recycle Bin');
  };

  const handleRestoreProject = async (id) => {
    const project = deletedProjects.find(p => p.id === id);
    await saveProject(project);
    await permanentlyDeleteProject(id);
    loadProjects();
    loadDeletedProjects();
    alert('Project restored successfully!');
  };

  const handlePermanentDelete = async (id) => {
    if (!window.confirm('Permanently delete? This cannot be undone.')) return;
    await permanentlyDeleteProject(id);
    loadDeletedProjects();
    alert('Project permanently deleted');
  };

  const handleEmptyRecycleBin = async () => {
    if (!window.confirm('Permanently delete all? This cannot be undone.')) return;
    for (const project of deletedProjects) {
      await permanentlyDeleteProject(project.id);
    }
    loadDeletedProjects();
    alert('Recycle bin emptied');
  };

  const continueProject = (id) => navigate(`/write/${id}`);

  return {
    projects, deletedProjects, projectsWithProgress, loading,
    loadProjects, loadDeletedProjects,
    handleDeleteProject, handleRestoreProject, handlePermanentDelete, handleEmptyRecycleBin,
    continueProject
  };
};
