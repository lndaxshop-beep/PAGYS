import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import Toast from '../components/Toast';

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
  const [toast, setToast] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

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
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();

      localStorage.setItem('currentUser', JSON.stringify({
        uid: user.uid,
        fullName: userData?.fullName || '',
        username: userData?.username || '',
        email: user.email,
        country: userData?.country || '',
        university: userData?.university || '',
      }));

      navigate('/dashboard');
    } catch (err) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password. Please try again.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many login attempts. Please wait and try again.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error. Please check your connection.');
      } else {
        setError('Login failed. Please try again.');
      }
    }

    setLoading(false);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!formData.email.trim()) {
      setToast({ message: 'Please enter your email address first.', type: 'error' });
      return;
    }
    try {
      await sendPasswordResetEmail(auth, formData.email);
      setToast({ message: 'Password reset email sent! Check your inbox.', type: 'success' });
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        setToast({ message: 'No account found with this email.', type: 'error' });
      } else if (err.code === 'auth/invalid-email') {
        setToast({ message: 'Please enter a valid email address.', type: 'error' });
      } else {
        setToast({ message: 'Failed to send reset email. Please try again.', type: 'error' });
      }
    }
  };

  const inputStyle = { width: '100%', padding: '14px 42px 14px 42px', border: `2px solid ${error ? '#dc2626' : colors.inputBorder}`, borderRadius: '12px', fontSize: '15px', backgroundColor: colors.input, color: colors.text, outline: 'none', transition: 'all 0.2s' };
  const iconStyle = { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: colors.textSecondary, fontSize: '18px', zIndex: 1, pointerEvents: 'none' };
  const eyeBtnStyle = { position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: colors.textSecondary, fontSize: '18px', zIndex: 1, padding: '4px', lineHeight: 1 };
  const fieldContainerStyle = { position: 'relative' };
  const labelStyle = { display: 'block', marginBottom: '8px', fontWeight: '500', color: colors.text, fontSize: '14px' };

  const handleFocus = (e) => { e.target.style.borderColor = colors.primary; };
  const handleBlur = (e) => { e.target.style.borderColor = error ? '#dc2626' : colors.inputBorder; };

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
        boxShadow: isDarkMode ? '0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)' : '0 20px 40px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.02)',
        transition: 'all 0.3s'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '80px', height: '80px', backgroundColor: colors.primary, borderRadius: '50%',
            margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 10px 20px ${colors.primary}40`
          }}>
            <span style={{ fontSize: '36px', color: 'white' }}>🔐</span>
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: colors.text, marginBottom: '8px', letterSpacing: '-0.5px' }}>Welcome Back</h1>
          <p style={{ color: colors.textSecondary, fontSize: '15px' }}>Log in to continue your thesis journey</p>
        </div>

        {error && (
          <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', textAlign: 'center' }}>{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={fieldContainerStyle}>
            <label htmlFor="email" style={labelStyle}>Email *</label>
            <span style={iconStyle}>👤</span>
            <input id="email" type="email" name="email" value={formData.email} onChange={handleChange} required onFocus={handleFocus} onBlur={handleBlur} style={inputStyle} placeholder="you@university.edu" />
          </div>

          <div style={{ ...fieldContainerStyle, marginBottom: '16px' }}>
            <label htmlFor="password" style={labelStyle}>Password *</label>
            <span style={iconStyle}>🔒</span>
            <input id="password" type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} required onFocus={handleFocus} onBlur={handleBlur} style={inputStyle} placeholder="••••••••" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} style={eyeBtnStyle} tabIndex={-1} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? '👁‍🗨' : '👁'}</button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: colors.textSecondary, fontSize: '14px' }}>
              <input type="checkbox" name="rememberMe" checked={formData.rememberMe} onChange={handleChange} style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: colors.primary }} />
              Remember me
            </label>
            <button type="button" onClick={handleForgotPassword} style={{ background: 'none', border: 'none', color: colors.primary, textDecoration: 'none', fontSize: '14px', fontWeight: '500', cursor: 'pointer', padding: 0 }}>
              Forgot password?
            </button>
          </div>

          <button type="submit" disabled={loading}
            style={{ width: '100%', backgroundColor: colors.primary, color: 'white', padding: '16px', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, boxShadow: loading ? 'none' : `0 8px 16px ${colors.primary}40`, marginBottom: '20px', transition: 'all 0.2s' }}
            onMouseEnter={(e) => { if (!loading) { e.target.style.backgroundColor = colors.primaryDark; e.target.style.transform = 'translateY(-2px)'; } }}
            onMouseLeave={(e) => { if (!loading) { e.target.style.backgroundColor = colors.primary; e.target.style.transform = 'translateY(0)'; } }}>
            {loading ? 'Logging in...' : 'Log In'}
          </button>

          <p style={{ textAlign: 'center', color: colors.textSecondary, fontSize: '15px', marginTop: '20px' }}>
            Don't have an account? <Link to="/signup" style={{ color: colors.primary, textDecoration: 'none', fontWeight: '600', transition: 'opacity 0.2s' }}
              onMouseEnter={(e) => { e.target.style.opacity = '0.8'; }}
              onMouseLeave={(e) => { e.target.style.opacity = '1'; }}>Sign Up</Link>
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '32px' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: colors.border }}></div>
            <span style={{ color: colors.textSecondary, fontSize: '13px' }}>Secure Login</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: colors.border }}></div>
          </div>
        </form>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default Login;
