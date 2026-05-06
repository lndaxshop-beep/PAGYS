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

export const useDashboardData = () => {
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
    if (!window.confirm('Are you sure? You can restore it from Recycle Bin.')) return;
    const project = projects.find(p => p.id === id);
    await deleteProject(id);
    await saveDeletedProject({ ...project, deletedAt: new Date().toISOString() });
    invalidateProgressCache(id);
    loadProjects();
    loadDeletedProjects();
    alert('Project moved to Recycle Bin');
  };

  const handleRestoreProject = async (id) => {
    const project = deletedProjects.find(p => p.id === id);
    await saveProject(project);
    await permanentlyDeleteProject(id);
    invalidateProgressCache(id);
    loadProjects();
    loadDeletedProjects();
    alert('Project restored successfully!');
  };

  const handlePermanentDelete = async (id) => {
    if (!window.confirm('Permanently delete? This cannot be undone.')) return;
    await permanentlyDeleteProject(id);
    invalidateProgressCache(id);
    loadDeletedProjects();
    alert('Project permanently deleted');
  };

  const handleEmptyRecycleBin = async () => {
    if (!window.confirm('Permanently delete all? This cannot be undone.')) return;
    for (const project of deletedProjects) {
      await permanentlyDeleteProject(project.id);
      invalidateProgressCache(project.id);
    }
    loadDeletedProjects();
    alert('Recycle bin emptied');
  };

  const continueProject = (id) => navigate(`/write/${id}`);

  return {
    projects, deletedProjects, projectsWithProgress, loading, progressLoading,
    loadProjects, loadDeletedProjects,
    handleDeleteProject, handleRestoreProject, handlePermanentDelete, handleEmptyRecycleBin,
    continueProject
  };
};
