import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const Settings = () => {
  const { colors, isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [country, setCountry] = useState('');
  const [saved, setSaved] = useState(false);

    useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser(parsed);
      setFullName(parsed.fullName || '');
      setEmail(parsed.email || '');
      setUsername(parsed.username || '');
      setCountry(parsed.country || '');
    }
  }, []);

    const handleSave = async () => {
    const updatedUser = {
      ...user,
      fullName,
      email,
      username,
      country
    };
    
    // Save to Firestore
    if (user?.uid) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          fullName,
          email,
          username,
          country,
        });
      } catch (e) { console.error('Error updating profile:', e); }
    }
    
    // Also update localStorage for quick access
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    setUser(updatedUser);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

    const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This will permanently delete all your data including projects, generated content, and files. This action cannot be undone.')) {
      if (window.confirm('FINAL WARNING: All your thesis projects and data will be permanently deleted. Continue?')) {
        // Get user's projects
        const { getProjects } = await import('../services/firestoreService');
const projects = await getProjects();
const userProjects = projects;
        
        // Delete all project data
        userProjects.forEach(project => {
          localStorage.removeItem(`generatedContent_${project.id}`);
          localStorage.removeItem(`chapters_${project.id}`);
          localStorage.removeItem(`citations_${project.id}`);
          localStorage.removeItem(`diagrams_${project.id}`);
          localStorage.removeItem(`charts_${project.id}`);
          localStorage.removeItem(`tables_${project.id}`);
          localStorage.removeItem(`diagramSVGs_${project.id}`);
          localStorage.removeItem(`defence_${project.id}`);
          localStorage.removeItem(`abbreviations_${project.id}`);
          localStorage.removeItem(`realReferences_${project.id}`);
        });
        
        // Remove user's projects
        const remainingProjects = projects.filter(p => p.userId !== user?.uid);
        localStorage.setItem('thesisProjects', JSON.stringify(remainingProjects));
        
        // Clear user data
        localStorage.removeItem('currentUser');
        localStorage.removeItem('authToken');
        
        alert('Your account has been deleted.');
        navigate('/');
      }
    }
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

        {/* Profile Settings */}
        <div style={{ backgroundColor: colors.surface, borderRadius: '16px', padding: '32px', border: `1px solid ${colors.border}`, marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: colors.text, marginBottom: '24px' }}>Profile Information</h2>
          
          <div style={{ display: 'grid', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: colors.text }}>Full Name</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                style={{ width: '100%', padding: '12px', border: `1px solid ${colors.inputBorder}`, borderRadius: '8px', fontSize: '14px', backgroundColor: colors.input, color: colors.text }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: colors.text }}>Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', padding: '12px', border: `1px solid ${colors.inputBorder}`, borderRadius: '8px', fontSize: '14px', backgroundColor: colors.input, color: colors.text }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: colors.text }}>Username</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                style={{ width: '100%', padding: '12px', border: `1px solid ${colors.inputBorder}`, borderRadius: '8px', fontSize: '14px', backgroundColor: colors.input, color: colors.text }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: colors.text }}>Country</label>
              <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g., Ghana"
                style={{ width: '100%', padding: '12px', border: `1px solid ${colors.inputBorder}`, borderRadius: '8px', fontSize: '14px', backgroundColor: colors.input, color: colors.text }} />
            </div>
          </div>

          <button onClick={handleSave}
            style={{ backgroundColor: saved ? '#059669' : colors.primary, color: 'white', padding: '12px 24px', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', marginTop: '24px', fontSize: '14px' }}>
            {saved ? '✅ Saved!' : 'Save Changes'}
          </button>
        </div>

        {/* Premium Status */}
        <div style={{ backgroundColor: colors.surface, borderRadius: '16px', padding: '32px', border: `1px solid ${colors.border}`, marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: colors.text, marginBottom: '16px' }}>Premium Status</h2>
          {(() => {
            const projects = JSON.parse(localStorage.getItem('thesisProjects') || '[]');
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
                <button onClick={() => { alert('Go to your project and click the 💎 Upgrade button in the header.'); }}
                  style={{ backgroundColor: '#f59e0b', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}>
                  💎 Upgrade to Premium
                </button>
              </div>
            );
          })()}
        </div>

        {/* Danger Zone */}
        <div style={{ backgroundColor: colors.surface, borderRadius: '16px', padding: '32px', border: `1px solid #ef4444` }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#ef4444', marginBottom: '16px' }}>Danger Zone</h2>
          <p style={{ color: colors.textSecondary, marginBottom: '16px', fontSize: '14px' }}>
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          <button onClick={handleDeleteAccount}
            style={{ backgroundColor: '#ef4444', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;