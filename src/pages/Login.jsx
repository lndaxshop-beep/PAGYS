import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const Login = () => {
  const { colors, isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();

      // Save to localStorage for quick access
      localStorage.setItem('currentUser', JSON.stringify({
        uid: user.uid,
        fullName: userData?.fullName || '',
        username: userData?.username || '',
        email: user.email,
        country: userData?.country || '',
      }));

      navigate('/dashboard');
    } catch (err) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password. Please try again.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else {
        setError('Login failed. Please try again.');
      }
    }

    setLoading(false);
  };

  return (
    <div style={{ 
      minHeight: 'calc(100vh - 80px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: isDarkMode 
        ? 'radial-gradient(circle at 10% 20%, #2d2d2d 0%, #1a1a1a 90%)' 
        : 'radial-gradient(circle at 10% 20%, #f5f3ff 0%, #ffffff 90%)',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '450px', width: '100%', backgroundColor: colors.surface, borderRadius: '24px', padding: '40px',
        boxShadow: isDarkMode ? '0 20px 40px rgba(0,0,0,0.4)' : '0 20px 40px rgba(0,0,0,0.1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '80px', height: '80px', backgroundColor: colors.primary, borderRadius: '50%', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '36px', color: 'white' }}>🔐</span>
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: colors.text, marginBottom: '8px' }}>Welcome Back</h1>
          <p style={{ color: colors.textSecondary, fontSize: '15px' }}>Log in to continue your thesis journey</p>
        </div>

        {error && (
          <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', textAlign: 'center' }}>{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: colors.text, fontSize: '14px' }}>Email *</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required
              style={{ width: '100%', padding: '14px', border: `2px solid ${colors.inputBorder}`, borderRadius: '12px', fontSize: '15px', backgroundColor: colors.input, color: colors.text }} placeholder="you@university.edu" />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: colors.text, fontSize: '14px' }}>Password *</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} required
              style={{ width: '100%', padding: '14px', border: `2px solid ${colors.inputBorder}`, borderRadius: '12px', fontSize: '15px', backgroundColor: colors.input, color: colors.text }} placeholder="••••••••" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: colors.textSecondary, fontSize: '14px' }}>
              <input type="checkbox" name="rememberMe" checked={formData.rememberMe} onChange={handleChange} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
              Remember me
            </label>
          </div>
          <button type="submit" disabled={loading}
            style={{ width: '100%', backgroundColor: colors.primary, color: 'white', padding: '16px', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Logging in...' : 'Log In'}
          </button>
          <p style={{ textAlign: 'center', color: colors.textSecondary, fontSize: '15px', marginTop: '20px' }}>
            Don't have an account? <Link to="/signup" style={{ color: colors.primary, textDecoration: 'none', fontWeight: '600' }}>Sign Up</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;