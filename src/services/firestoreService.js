import { db } from '../firebase';
import { collection, doc, setDoc, getDoc, getDocs, deleteDoc, query, where } from 'firebase/firestore';

const logError = (context, e) => {
  console.error(`Firestore error [${context}]:`, e?.message || e);
};

export const saveProject = async (project) => {
  try {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) throw new Error('User not authenticated');
    await setDoc(doc(db, 'projects', project.id.toString()), {
      ...project,
      userId: user.uid,
      updatedAt: new Date().toISOString(),
    });
  } catch (e) { logError('saveProject', e); throw e; }
};

export const getProjects = async () => {
  try {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) return [];
    const q = query(collection(db, 'projects'), where('userId', '==', user.uid));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) { logError('getProjects', e); throw e; }
};

export const updateProject = async (projectId, data) => {
  try {
    await setDoc(doc(db, 'projects', projectId.toString()), data, { merge: true });
  } catch (e) { logError('updateProject', e); throw e; }
};

export const deleteProject = async (projectId) => {
  try {
    await deleteDoc(doc(db, 'projects', projectId.toString()));
  } catch (e) { logError('deleteProject', e); throw e; }
};

export const saveGeneratedContent = async (projectId, content) => {
  try {
    await setDoc(doc(db, 'content', projectId.toString()), {
      content, updatedAt: new Date().toISOString(),
    });
  } catch (e) { logError('saveGeneratedContent', e); throw e; }
};

export const getGeneratedContent = async (projectId) => {
  try {
    const snap = await getDoc(doc(db, 'content', projectId.toString()));
    if (snap.exists()) return snap.data().content;
    return {};
  } catch (e) { logError('getGeneratedContent', e); throw e; }
};

export const saveChapters = async (projectId, chapters) => {
  try {
    await setDoc(doc(db, 'chapters', projectId.toString()), {
      chapters, updatedAt: new Date().toISOString(),
    });
  } catch (e) { logError('saveChapters', e); throw e; }
};

export const getChapters = async (projectId) => {
  try {
    const snap = await getDoc(doc(db, 'chapters', projectId.toString()));
    if (snap.exists()) return snap.data().chapters;
    return [];
  } catch (e) { logError('getChapters', e); throw e; }
};

export const saveCitations = async (projectId, citations) => {
  try {
    await setDoc(doc(db, 'citations', projectId.toString()), {
      citations, updatedAt: new Date().toISOString(),
    });
  } catch (e) { logError('saveCitations', e); throw e; }
};

export const getCitations = async (projectId) => {
  try {
    const snap = await getDoc(doc(db, 'citations', projectId.toString()));
    if (snap.exists()) return snap.data().citations;
    return {};
  } catch (e) { logError('getCitations', e); throw e; }
};

export const saveDeletedProject = async (project) => {
  try {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) throw new Error('User not authenticated');
    await setDoc(doc(db, 'deletedProjects', project.id.toString()), {
      ...project, userId: user.uid,
    });
  } catch (e) { logError('saveDeletedProject', e); throw e; }
};

export const getDeletedProjects = async () => {
  try {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) return [];
    const q = query(collection(db, 'deletedProjects'), where('userId', '==', user.uid));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) { logError('getDeletedProjects', e); throw e; }
};

export const permanentlyDeleteProject = async (projectId) => {
  try {
    await deleteDoc(doc(db, 'deletedProjects', projectId.toString()));
  } catch (e) { logError('permanentlyDeleteProject', e); throw e; }
};

export const saveSubsectionVersions = async (projectId, versions) => {
  try {
    await setDoc(doc(db, 'subsectionVersions', projectId.toString()), {
      versions, updatedAt: new Date().toISOString(),
    });
  } catch (e) { logError('saveSubsectionVersions', e); throw e; }
};

export const getSubsectionVersions = async (projectId) => {
  try {
    const snap = await getDoc(doc(db, 'subsectionVersions', projectId.toString()));
    if (snap.exists()) return snap.data().versions;
    return {};
  } catch (e) { logError('getSubsectionVersions', e); throw e; }
};

export const saveVisualData = async (projectId, type, data) => {
  try {
    await setDoc(doc(db, 'visuals', projectId.toString()), {
      [type]: data, updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (e) { logError('saveVisualData', e); throw e; }
};

export const getVisualData = async (projectId) => {
  try {
    const snap = await getDoc(doc(db, 'visuals', projectId.toString()));
    if (snap.exists()) return snap.data();
    return {};
  } catch (e) { logError('getVisualData', e); throw e; }
};
