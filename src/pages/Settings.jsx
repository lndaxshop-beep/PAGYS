import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useResponsive } from '../hooks/useResponsive';
import { doc, updateDoc, deleteDoc, collection, query, where, getDocs, setDoc, getDoc, orderBy, limit } from 'firebase/firestore';
import { deleteUser, sendEmailVerification } from 'firebase/auth';
import { db, auth } from '../firebase';
import Toast from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
import { clearAllProjectCache } from '../utils/cacheUtils';

const Settings = () => {
  const { colors, isDarkMode } = useTheme();
  const { isMobile } = useResponsive();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [country, setCountry] = useState('');
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [projects, setProjects] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  const notify = (message, type) => setToast({ message, type });

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setEmail(user.email || '');
      setUsername(user.username || '');
      setCountry(user.country || '');
    }
  }, [user]);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const { getProjects } = await import('../services/firestoreService');
        const data = await getProjects(user?.uid);
        setProjects(data);
      } catch (e) { console.error('Failed to load projects:', e); }
    };
    if (user) loadProjects();
  }, [user]);

  useEffect(() => {
    const loadPayments = async () => {
      if (!user?.uid) return;
      setLoadingPayments(true);
      try {
        const { collection, query, where, orderBy, limit, getDocs } = await import('firebase/firestore');
        const { db } = await import('../firebase');
        const paymentsRef = collection(db, 'payments');
        const q = query(paymentsRef, where('userId', '==', user.uid), orderBy('createdAt', 'desc'), limit(20));
        const snapshot = await getDocs(q);
        const paymentList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPayments(paymentList);
      } catch (e) {
        console.error('Failed to load payments:', e);
      } finally {
        setLoadingPayments(false);
      }
    };
    loadPayments();
  }, [user]);

  const handleSave = async () => {
    const updatedUser = { ...user, fullName, email, username, country };
    if (user?.uid) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { fullName, email, username, country });
      } catch (e) {
        console.error('Error updating profile:', e);
        notify('Failed to save profile. Please try again.', 'error');
        return;
      }
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleVerifyEmail = async () => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser && !currentUser.emailVerified) {
        await sendEmailVerification(currentUser);
        notify('Verification email sent. Check your inbox.', 'success');
      } else if (currentUser?.emailVerified) {
        notify('Email already verified.', 'info');
      } else {
        notify('No authenticated user found.', 'error');
      }
    } catch (err) {
      console.error('Error sending verification email:', err);
      notify('Failed to send verification email.', 'error');
    }
  };

  const executeDelete = async () => {
    setDeleting(true);
    setConfirm(null);
    let backupUserData = null;
    let backupProjects = [];
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        backupUserData = { id: user.uid, ...userDocSnap.data() };
      }

      const projectsQuery = query(collection(db, 'projects'), where('userId', '==', user?.uid));
      const projectsSnapshot = await getDocs(projectsQuery);
      backupProjects = projectsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

      const deletePromises = projectsSnapshot.docs.map(d => deleteDoc(doc(db, 'projects', d.id)));
      await Promise.all(deletePromises);

      projectsSnapshot.docs.forEach(d => clearAllProjectCache(d.id));

      const allProjects = JSON.parse(localStorage.getItem('thesisProjects') || '[]');
      localStorage.setItem('thesisProjects', JSON.stringify(allProjects.filter(p => p.userId !== user?.uid)));

      await deleteDoc(userDocRef);

      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          await deleteUser(currentUser);
        } catch (authErr) {
          console.error('Auth deletion failed, rolling back:', authErr);
          await setDoc(userDocRef, backupUserData).catch(e => console.error('Rollback user doc failed:', e));
          const restorePromises = backupProjects.map(p => setDoc(doc(db, 'projects', p.id), p)).catch(e => console.error('Rollback projects failed:', e));
          await Promise.allSettled(restorePromises);
          notify('Account deletion failed. Your data has been restored.', 'error');
          setDeleting(false);
          return;
        }
      }

      localStorage.removeItem('currentUser');
      notify('Your account has been deleted.', 'success');
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      console.error('Error deleting account:', err);
      if (backupUserData) {
        try {
          await setDoc(doc(db, 'users', user.uid), backupUserData);
        } catch (rollbackErr) {
          console.error('Rollback failed:', rollbackErr);
        }
      }
      notify('Failed to delete account. Please try again.', 'error');
      setDeleting(false);
    }
  };

  const handleDeleteClick = () => {
    setConfirm({
      title: 'Delete Account',
      message: 'Are you sure you want to permanently delete your account? This will delete all your projects, generated content, and files from both our servers and your device. This action cannot be undone.',
      confirmText: 'Delete Permanently',
      danger: true,
      onConfirm: executeDelete
    });
  };

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: colors.background, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <p style={{ color: colors.text }}>Please log in to access settings.</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.background }}>
      <header style={{ backgroundColor: colors.surface, borderBottom: `1px solid ${colors.border}`, padding: '20px 32px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '32px' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: colors.textSecondary, fontSize: '14px', cursor: 'pointer' }}>← Back</button>
        </div>
      </header>

      <div style={{ maxWidth: '700px', margin: '0 auto', padding: isMobile ? '24px 16px' : '48px 32px' }}>
        <h1 style={{ fontSize: isMobile ? '24px' : '32px', fontWeight: 'bold', color: colors.text, marginBottom: isMobile ? '24px' : '32px' }}>Settings</h1>

        <div style={{ backgroundColor: colors.surface, borderRadius: isMobile ? '12px' : '16px', padding: isMobile ? '20px' : '32px', border: `1px solid ${colors.border}`, marginBottom: '24px' }}>
          <h2 style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: '600', color: colors.text, marginBottom: '24px' }}>Profile Information</h2>
          <div style={{ display: 'grid', gap: '20px' }}>
            <div>
              <label htmlFor="settingsFullName" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: colors.text }}>Full Name</label>
              <input id="settingsFullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                style={{ width: '100%', padding: '12px', border: `1px solid ${colors.inputBorder}`, borderRadius: '8px', fontSize: '14px', backgroundColor: colors.input, color: colors.text }} />
            </div>
            <div>
              <label htmlFor="settingsEmail" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: colors.text }}>Email Address</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input id="settingsEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  style={{ flex: 1, padding: '12px', border: `1px solid ${colors.inputBorder}`, borderRadius: '8px', fontSize: '14px', backgroundColor: colors.input, color: colors.text }} />
                <button onClick={handleVerifyEmail}
                  style={{ padding: '12px 16px', border: `1px solid ${colors.primary}`, borderRadius: '8px', fontSize: '13px', backgroundColor: 'transparent', color: colors.primary, cursor: 'pointer', fontWeight: '500', whiteSpace: 'nowrap' }}>
                  Verify Email
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="settingsUsername" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: colors.text }}>Username</label>
              <input id="settingsUsername" type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                style={{ width: '100%', padding: '12px', border: `1px solid ${colors.inputBorder}`, borderRadius: '8px', fontSize: '14px', backgroundColor: colors.input, color: colors.text }} />
            </div>
            <div>
              <label htmlFor="settingsCountry" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: colors.text }}>Country</label>
              <input id="settingsCountry" type="text" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g., Ghana"
                style={{ width: '100%', padding: '12px', border: `1px solid ${colors.inputBorder}`, borderRadius: '8px', fontSize: '14px', backgroundColor: colors.input, color: colors.text }} />
            </div>
          </div>
          <button onClick={handleSave}
            style={{ backgroundColor: saved ? '#059669' : colors.primary, color: 'white', padding: '12px 24px', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', marginTop: '24px', fontSize: '14px' }}>
            {saved ? '✅ Saved!' : 'Save Changes'}
          </button>
        </div>

        <div style={{ backgroundColor: colors.surface, borderRadius: '16px', padding: '32px', border: `1px solid ${colors.border}`, marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: colors.text, marginBottom: '16px' }}>My Projects</h2>
          {projects.length > 0 ? (
            <div style={{ display: 'grid', gap: '12px' }}>
              {projects.map(p => (
                <div key={p.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 16px', backgroundColor: colors.background, borderRadius: '8px',
                  border: `1px solid ${colors.border}`
                }}>
                  <span style={{ color: colors.text, fontWeight: '500', fontSize: '14px' }}>{p.title}</span>
                  <span style={{
                    fontSize: '12px', padding: '3px 10px', borderRadius: '10px', fontWeight: '600',
                    backgroundColor: p.tier === 'premium' ? (isDarkMode ? '#3d2d1a' : '#fffbe6') : (isDarkMode ? '#2d2d2d' : '#f3f4f6'),
                    color: p.tier === 'premium' ? '#d97706' : colors.textSecondary,
                    border: `1px solid ${p.tier === 'premium' ? '#f59e0b' : colors.border}`
                  }}>
                    {p.tier === 'premium' ? '💎 Premium' : '📘 Regular'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: colors.textSecondary, fontSize: '14px' }}>No projects yet. Create one from the Dashboard.</p>
          )}
        </div>

        <div style={{ backgroundColor: colors.surface, borderRadius: '16px', padding: '32px', border: `1px solid ${colors.border}`, marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: colors.text, marginBottom: '16px' }}>Payment History</h2>
          {loadingPayments ? (
            <p style={{ color: colors.textSecondary, fontSize: '14px' }}>Loading payments...</p>
          ) : payments.length > 0 ? (
            <div style={{ display: 'grid', gap: '12px' }}>
              {payments.map(p => (
                <div key={p.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 16px', backgroundColor: colors.background, borderRadius: '8px',
                  border: `1px solid ${colors.border}`
                }}>
                  <div>
                    <span style={{ color: colors.text, fontWeight: '500', fontSize: '14px' }}>
                      {p.type === 'upgrade' ? 'Premium Upgrade' : p.type === 'project_creation' ? (p.tier === 'premium' ? 'Premium Project' : 'Regular Project') : 'Feature Payment'}
                    </span>
                    <span style={{ color: colors.textSecondary, fontSize: '12px', marginLeft: '8px' }}>
                      {p.reference}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ color: colors.text, fontWeight: '600', fontSize: '14px' }}>
                      {p.currency?.toUpperCase()} {p.amount?.toFixed(2)}
                    </span>
                    <span style={{ color: colors.textSecondary, fontSize: '11px', display: 'block' }}>
                      {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: colors.textSecondary, fontSize: '14px' }}>No payment history yet.</p>
          )}
        </div>

        <div style={{ backgroundColor: colors.surface, borderRadius: '16px', padding: '32px', border: `1px solid #ef4444` }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#ef4444', marginBottom: '16px' }}>Danger Zone</h2>
          <p style={{ color: colors.textSecondary, marginBottom: '16px', fontSize: '14px' }}>
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          <button onClick={handleDeleteClick} disabled={deleting}
            style={{ backgroundColor: deleting ? '#fca5a5' : '#ef4444', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: deleting ? 'not-allowed' : 'pointer', fontSize: '14px', opacity: deleting ? 0.6 : 1 }}>
            {deleting ? 'Deleting...' : 'Delete Account'}
          </button>
        </div>
      </div>

      {confirm && (
        <ConfirmModal
          title={confirm.title}
          message={confirm.message}
          confirmText={confirm.confirmText}
          danger={confirm.danger}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default Settings;