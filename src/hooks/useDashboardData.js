import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNavigationLoading } from '../contexts/NavigationLoadingContext';
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

export const useDashboardData = ({ confirmAction = () => Promise.resolve(false), notify = () => {}, userId } = {}) => {
  const [projects, setProjects] = useState([]);
  const [deletedProjects, setDeletedProjects] = useState([]);
  const [projectsWithProgress, setProjectsWithProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [progressLoading, setProgressLoading] = useState(false);
  const navigate = useNavigate();
  const { startTransition, endTransition } = useNavigationLoading();
  const prevProjectIdsRef = useRef('');

  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await getProjects(userId);
      setProjects(data);
    } catch (e) {
      console.error('Error loading projects:', e);
    }
    setLoading(false);
  };

  const loadDeletedProjects = async () => {
    try {
      const data = await getDeletedProjects(userId);
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
    let cancelled = false;

    Promise.all(projects.map(async (project) => {
      const cached = cache[project.id];
      if (cached) {
        return { ...project, progress: cached.progress };
      }
      const [chapters, content] = await Promise.all([
        getChapters(project.id),
        getGeneratedContent(project.id),
      ]);
      const progress = calculateProjectProgress(project, chapters, content);
      setCachedProgress(project.id, progress);
      return { ...project, progress };
    })).then((results) => {
      if (!cancelled) {
        setProjectsWithProgress(results);
        setProgressLoading(false);
      }
    }).catch(e => {
      if (!cancelled) {
        console.error('Error loading progress:', e);
        setProjectsWithProgress(projects.map(p => ({ ...p, progress: 0 })));
        setProgressLoading(false);
      }
    });

    return () => { cancelled = true; };
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
    try {
      await deleteProject(id, userId);
      await saveDeletedProject({ ...project, deletedAt: new Date().toISOString() }, userId);
      invalidateProgressCache(id);
      loadProjects();
      loadDeletedProjects();
      notify('Project moved to Recycle Bin', 'success');
    } catch (e) {
      console.error('Error moving project to recycle bin:', e);
      notify('Failed to move project. Please try again.', 'error');
    }
  };

  const handleRestoreProject = async (id) => {
    const project = deletedProjects.find(p => p.id === id);
    if (!project) { notify('Project not found.', 'error'); return; }
    try {
      await saveProject(project, userId);
      await permanentlyDeleteProject(id, userId);
      invalidateProgressCache(id);
      loadProjects();
      loadDeletedProjects();
      notify('Project restored successfully!', 'success');
    } catch (e) {
      console.error('Error restoring project:', e);
      notify('Failed to restore project. Please try again.', 'error');
    }
  };

  const handlePermanentDelete = async (id) => {
    const confirmed = await confirmAction({
      title: 'Delete Permanently',
      message: 'This action cannot be undone. The project will be permanently removed.',
      confirmText: 'Delete Permanently',
      danger: true,
    });
    if (!confirmed) return;
    try {
      await permanentlyDeleteProject(id, userId);
      invalidateProgressCache(id);
      loadDeletedProjects();
      notify('Project permanently deleted', 'success');
    } catch (e) {
      console.error('Error permanently deleting project:', e);
      notify('Failed to delete project. Please try again.', 'error');
    }
  };

  const handleEmptyRecycleBin = async () => {
    const confirmed = await confirmAction({
      title: 'Empty Recycle Bin',
      message: `Permanently delete all ${deletedProjects.length} item${deletedProjects.length === 1 ? '' : 's'}? This cannot be undone.`,
      confirmText: 'Empty Recycle Bin',
      danger: true,
    });
    if (!confirmed) return;
    try {
      for (const project of deletedProjects) {
        await permanentlyDeleteProject(project.id, userId);
        invalidateProgressCache(project.id);
      }
      loadDeletedProjects();
      notify('Recycle bin emptied', 'success');
    } catch (e) {
      console.error('Error emptying recycle bin:', e);
      notify('Failed to empty recycle bin. Please try again.', 'error');
    }
  };

  const continueProject = (id) => {
    startTransition();
    // Fallback to clear splash screen if Write.jsx fails to load fully.
    // Write.jsx calls endTransition() on successful load, making this a no-op then.
    setTimeout(() => {
      endTransition();
    }, 8000);
    navigate(`/write/${id}`);
  };

  return {
    projects, deletedProjects, projectsWithProgress, loading, progressLoading,
    loadProjects, loadDeletedProjects,
    handleDeleteProject, handleRestoreProject, handlePermanentDelete, handleEmptyRecycleBin,
    continueProject
  };
};
