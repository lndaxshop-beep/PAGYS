import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { doc, updateDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import { db, auth } from '../firebase';
import Toast from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';

const Settings = () => {
  const { colors, isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [country, setCountry] = useState('');
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const notify = (message, type) => setToast({ message, type });

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        setFullName(parsed.fullName || '');
        setEmail(parsed.email || '');
        setUsername(parsed.username || '');
        setCountry(parsed.country || '');
      } catch (e) { console.warn('Failed to parse cached user:', e); }
    }
  }, []);

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
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    setUser(updatedUser);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const executeDelete = async () => {
    setDeleting(true);
    setConfirm(null);
    try {
      const projectsQuery = query(collection(db, 'projects'), where('userId', '==', user?.uid));
      const projectsSnapshot = await getDocs(projectsQuery);
      const deletePromises = projectsSnapshot.docs.map(d => deleteDoc(doc(db, 'projects', d.id)));
      await Promise.all(deletePromises);

      projectsSnapshot.docs.forEach(d => {
        ['generatedContent', 'chapters', 'citations', 'diagrams', 'charts', 'tables', 'diagramSVGs', 'defence', 'abbreviations', 'realReferences', 'instrument_content'].forEach(prefix => {
          localStorage.removeItem(`${prefix}_${d.id}`);
        });
      });

      const allProjects = JSON.parse(localStorage.getItem('thesisProjects') || '[]');
      localStorage.setItem('thesisProjects', JSON.stringify(allProjects.filter(p => p.userId !== user?.uid)));

      await deleteDoc(doc(db, 'users', user.uid));
      const currentUser = auth.currentUser;
      if (currentUser) await deleteUser(currentUser).catch(() => {});

      localStorage.removeItem('currentUser');
      notify('Your account has been deleted.', 'success');
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      console.error('Error deleting account:', err);
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
          <h1 onClick={() => navigate('/')} style={{ fontSize: '28px', fontWeight: 'bold', color: colors.primary, margin: 0, cursor: 'pointer' }}>PAGYS</h1>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: colors.textSecondary, fontSize: '14px', cursor: 'pointer' }}>← Back</button>
        </div>
      </header>

      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '48px 32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: colors.text, marginBottom: '32px' }}>Settings</h1>

        <div style={{ backgroundColor: colors.surface, borderRadius: '16px', padding: '32px', border: `1px solid ${colors.border}`, marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: colors.text, marginBottom: '24px' }}>Profile Information</h2>
          <div style={{ display: 'grid', gap: '20px' }}>
            <div>
              <label htmlFor="settingsFullName" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: colors.text }}>Full Name</label>
              <input id="settingsFullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                style={{ width: '100%', padding: '12px', border: `1px solid ${colors.inputBorder}`, borderRadius: '8px', fontSize: '14px', backgroundColor: colors.input, color: colors.text }} />
            </div>
            <div>
              <label htmlFor="settingsEmail" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: colors.text }}>Email Address</label>
              <input id="settingsEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', padding: '12px', border: `1px solid ${colors.inputBorder}`, borderRadius: '8px', fontSize: '14px', backgroundColor: colors.input, color: colors.text }} />
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
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: colors.text, marginBottom: '16px' }}>Premium Status</h2>
          {(() => {
            let projects = [];
            try { projects = JSON.parse(localStorage.getItem('thesisProjects') || '[]'); } catch (e) { console.warn('Failed to parse thesisProjects:', e); }
            const userProjects = projects.filter(p => p.userId === user?.uid);
            const isPremium = userProjects.some(p => p.isPremium);
            return isPremium ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>💎</span>
                <div>
                  <p style={{ fontWeight: '600', color: '#f59e0b' }}>Premium Active</p>
                  <p style={{ fontSize: '13px', color: colors.textSecondary }}>Humanise & Feedback: up to 4 times per subsection</p>
                </div>
              </div>
            ) : (
              <div>
                <p style={{ color: colors.textSecondary, marginBottom: '12px' }}>Upgrade to Premium for extended features.</p>
                <button onClick={() => notify('Go to your project and click the 💎 Upgrade button in the header.', 'info')}
                  style={{ backgroundColor: '#f59e0b', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}>
                  💎 Upgrade to Premium
                </button>
              </div>
            );
          })()}
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