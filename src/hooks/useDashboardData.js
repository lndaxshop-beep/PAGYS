import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveProject, getProjects, updateProject, deleteProject, saveDeletedProject, getDeletedProjects, permanentlyDeleteProject, getGeneratedContent, getChapters } from '../services/firestoreService';
import { calculateProjectProgress } from '../utils/dashboardHelpers';

const PROGRESS_CACHE_KEY = 'dashboard_progress_cache';
const CACHE_TTL_MS = 5 * 60 * 1000;

const getCachedProgress = () => {
  try {
    const raw = localStorage.getItem(PROGRESS_CACHE_KEY);
    if (!raw) return {};
    const { data, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > CACHE_TTL_MS) {
      localStorage.removeItem(PROGRESS_CACHE_KEY);
      return {};
    }
    return data;
  } catch {
    return {};
  }
};

const setCachedProgress = (projectId, progress) => {
  try {
    const existing = getCachedProgress();
    existing[projectId] = { progress, updatedAt: Date.now() };
    localStorage.setItem(PROGRESS_CACHE_KEY, JSON.stringify({ data: existing, timestamp: Date.now() }));
  } catch { /* silent */ }
};

export const useDashboardData = ({ confirmAction, notify } = {}) => {
  const [projects, setProjects] = useState([]);
  const [deletedProjects, setDeletedProjects] = useState([]);
  const [projectsWithProgress, setProjectsWithProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [progressLoading, setProgressLoading] = useState(false);
  const navigate = useNavigate();
  const prevProjectIdsRef = useRef('');

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
    const ids = projects.map(p => p.id).sort().join(',');
    if (!ids.length) {
      setProjectsWithProgress([]);
      return;
    }
    if (ids === prevProjectIdsRef.current) return;
    prevProjectIdsRef.current = ids;

    const cache = getCachedProgress();
    setProgressLoading(true);

    Promise.all(projects.map(async (project) => {
      const cached = cache[project.id];
      if (cached) {
        return { ...project, progress: cached.progress };
      }
      const chapters = await getChapters(project.id);
      const content = await getGeneratedContent(project.id);
      const progress = calculateProjectProgress(project, chapters, content);
      setCachedProgress(project.id, progress);
      return { ...project, progress };
    })).then((results) => {
      setProjectsWithProgress(results);
      setProgressLoading(false);
    });
  }, [projects]);

  const invalidateProgressCache = (projectId) => {
    try {
      const raw = localStorage.getItem(PROGRESS_CACHE_KEY);
      if (!raw) return;
      const { data, timestamp } = JSON.parse(raw);
      delete data[projectId];
      localStorage.setItem(PROGRESS_CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
    } catch { /* silent */ }
  };

  const handleDeleteProject = async (id) => {
    const confirmed = await confirmAction({
      title: 'Move to Recycle Bin',
      message: 'Are you sure? You can restore it from the Recycle Bin later.',
      confirmText: 'Move to Recycle Bin',
    });
    if (!confirmed) return;
    const project = projects.find(p => p.id === id);
    await deleteProject(id);
    await saveDeletedProject({ ...project, deletedAt: new Date().toISOString() });
    invalidateProgressCache(id);
    loadProjects();
    loadDeletedProjects();
    notify('Project moved to Recycle Bin', 'success');
  };

  const handleRestoreProject = async (id) => {
    const project = deletedProjects.find(p => p.id === id);
    await saveProject(project);
    await permanentlyDeleteProject(id);
    invalidateProgressCache(id);
    loadProjects();
    loadDeletedProjects();
    notify('Project restored successfully!', 'success');
  };

  const handlePermanentDelete = async (id) => {
    const confirmed = await confirmAction({
      title: 'Delete Permanently',
      message: 'This action cannot be undone. The project will be permanently removed.',
      confirmText: 'Delete Permanently',
      danger: true,
    });
    if (!confirmed) return;
    await permanentlyDeleteProject(id);
    invalidateProgressCache(id);
    loadDeletedProjects();
    notify('Project permanently deleted', 'error');
  };

  const handleEmptyRecycleBin = async () => {
    const confirmed = await confirmAction({
      title: 'Empty Recycle Bin',
      message: `Permanently delete all ${deletedProjects.length} item${deletedProjects.length === 1 ? '' : 's'}? This cannot be undone.`,
      confirmText: 'Empty Recycle Bin',
      danger: true,
    });
    if (!confirmed) return;
    for (const project of deletedProjects) {
      await permanentlyDeleteProject(project.id);
      invalidateProgressCache(project.id);
    }
    loadDeletedProjects();
    notify('Recycle bin emptied', 'error');
  };

  const continueProject = (id) => navigate(`/write/${id}`);

  return {
    projects, deletedProjects, projectsWithProgress, loading, progressLoading,
    loadProjects, loadDeletedProjects,
    handleDeleteProject, handleRestoreProject, handlePermanentDelete, handleEmptyRecycleBin,
    continueProject
  };
};
