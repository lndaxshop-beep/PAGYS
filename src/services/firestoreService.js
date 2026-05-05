import { db } from '../firebase';
import { collection, doc, setDoc, getDoc, getDocs, deleteDoc, query, where } from 'firebase/firestore';

// ============================================
// PROJECTS
// ============================================

// Save a new project
export const saveProject = async (project) => {
  const user = JSON.parse(localStorage.getItem('currentUser'));
  if (!user) return;
  await setDoc(doc(db, 'projects', project.id.toString()), {
    ...project,
    userId: user.uid,
    updatedAt: new Date().toISOString(),
  });
};

// Get all projects for current user
export const getProjects = async () => {
  const user = JSON.parse(localStorage.getItem('currentUser'));
  if (!user) return [];
  const q = query(collection(db, 'projects'), where('userId', '==', user.uid));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
};

// Update a project
export const updateProject = async (projectId, data) => {
  await setDoc(doc(db, 'projects', projectId.toString()), data, { merge: true });
};

// Delete a project
export const deleteProject = async (projectId) => {
  await deleteDoc(doc(db, 'projects', projectId.toString()));
};

// ============================================
// GENERATED CONTENT
// ============================================

// Save generated content for a project
export const saveGeneratedContent = async (projectId, content) => {
  await setDoc(doc(db, 'content', projectId.toString()), {
    content: content,
    updatedAt: new Date().toISOString(),
  });
};

// Get generated content for a project
export const getGeneratedContent = async (projectId) => {
  const snap = await getDoc(doc(db, 'content', projectId.toString()));
  if (snap.exists()) return snap.data().content;
  return {};
};

// ============================================
// CHAPTERS
// ============================================

// Save chapters for a project
export const saveChapters = async (projectId, chapters) => {
  await setDoc(doc(db, 'chapters', projectId.toString()), {
    chapters: chapters,
    updatedAt: new Date().toISOString(),
  });
};

// Get chapters for a project
export const getChapters = async (projectId) => {
  const snap = await getDoc(doc(db, 'chapters', projectId.toString()));
  if (snap.exists()) return snap.data().chapters;
  return [];
};

// ============================================
// CITATIONS
// ============================================

// Save citations for a project
export const saveCitations = async (projectId, citations) => {
  await setDoc(doc(db, 'citations', projectId.toString()), {
    citations: citations,
    updatedAt: new Date().toISOString(),
  });
};

// Get citations for a project
export const getCitations = async (projectId) => {
  const snap = await getDoc(doc(db, 'citations', projectId.toString()));
  if (snap.exists()) return snap.data().citations;
  return {};
};

// ============================================
// DELETED PROJECTS
// ============================================

// Save deleted project
export const saveDeletedProject = async (project) => {
  const user = JSON.parse(localStorage.getItem('currentUser'));
  if (!user) return;
  await setDoc(doc(db, 'deletedProjects', project.id.toString()), {
    ...project,
    userId: user.uid,
  });
};

// Get deleted projects
export const getDeletedProjects = async () => {
  const user = JSON.parse(localStorage.getItem('currentUser'));
  if (!user) return [];
  const q = query(collection(db, 'deletedProjects'), where('userId', '==', user.uid));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
};

// Permanently delete a deleted project
export const permanentlyDeleteProject = async (projectId) => {
  await deleteDoc(doc(db, 'deletedProjects', projectId.toString()));
};

// ============================================
// VISUAL ELEMENTS
// ============================================

// Save visual elements
export const saveVisualData = async (projectId, type, data) => {
  await setDoc(doc(db, 'visuals', projectId.toString()), {
    [type]: data,
    updatedAt: new Date().toISOString(),
  }, { merge: true });
};

// Get visual elements
export const getVisualData = async (projectId) => {
  const snap = await getDoc(doc(db, 'visuals', projectId.toString()));
  if (snap.exists()) return snap.data();
  return {};
};