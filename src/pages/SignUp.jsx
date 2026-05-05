import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

const SignUp = () => {
  const { colors, isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    country: '',
    university: '',
    agreeToTerms: false
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

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    try {
      // Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // Save additional user data to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        fullName: formData.fullName,
        username: formData.username,
        email: formData.email,
        country: formData.country,
        university: formData.university,
        createdAt: new Date().toISOString(),
      });

      // Save basic info to localStorage for quick access
      localStorage.setItem('currentUser', JSON.stringify({
        uid: user.uid,
        fullName: formData.fullName,
        username: formData.username,
        email: formData.email,
        country: formData.country,
      }));

      navigate('/dashboard');
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Email already registered. Please login instead.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Use at least 8 characters.');
      } else {
        setError('Sign up failed. Please try again.');
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
        maxWidth: '600px',
        width: '100%',
        backgroundColor: colors.surface,
        borderRadius: '24px',
        padding: '40px',
        boxShadow: isDarkMode 
          ? '0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)' 
          : '0 20px 40px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.02)',
        transition: 'all 0.3s',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '80px', height: '80px', backgroundColor: colors.primary, borderRadius: '50%',
            margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 10px 20px ${colors.primary}40`
          }}>
            <span style={{ fontSize: '36px', color: 'white' }}>📚</span>
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: colors.text, marginBottom: '8px' }}>Create Your Account</h1>
          <p style={{ color: colors.textSecondary, fontSize: '15px' }}>Join thousands of students writing better theses</p>
        </div>

        {error && (
          <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', textAlign: 'center' }}>{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: colors.text, fontSize: '14px' }}>Full Name *</label>
              <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required
                style={{ width: '100%', padding: '14px', border: `2px solid ${colors.inputBorder}`, borderRadius: '12px', fontSize: '15px', backgroundColor: colors.input, color: colors.text }} placeholder="John Doe" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: colors.text, fontSize: '14px' }}>Email Address *</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required
                style={{ width: '100%', padding: '14px', border: `2px solid ${colors.inputBorder}`, borderRadius: '12px', fontSize: '15px', backgroundColor: colors.input, color: colors.text }} placeholder="you@university.edu" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: colors.text, fontSize: '14px' }}>Username *</label>
              <input type="text" name="username" value={formData.username} onChange={handleChange} required
                style={{ width: '100%', padding: '14px', border: `2px solid ${colors.inputBorder}`, borderRadius: '12px', fontSize: '15px', backgroundColor: colors.input, color: colors.text }} placeholder="johndoe123" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: colors.text, fontSize: '14px' }}>Password *</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} required
                style={{ width: '100%', padding: '14px', border: `2px solid ${colors.inputBorder}`, borderRadius: '12px', fontSize: '15px', backgroundColor: colors.input, color: colors.text }} placeholder="••••••••" />
              <p style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '4px' }}>Minimum 8 characters</p>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: colors.text, fontSize: '14px' }}>Confirm Password *</label>
              <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required
                style={{ width: '100%', padding: '14px', border: `2px solid ${colors.inputBorder}`, borderRadius: '12px', fontSize: '15px', backgroundColor: colors.input, color: colors.text }} placeholder="••••••••" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: colors.text, fontSize: '14px' }}>Country *</label>
              <select name="country" value={formData.country} onChange={handleChange} required
                style={{ width: '100%', padding: '14px', border: `2px solid ${colors.inputBorder}`, borderRadius: '12px', fontSize: '15px', backgroundColor: colors.input, color: colors.text }}>
                <option value="">Select your country</option>
                <option value="Ghana">Ghana</option>
                <option value="Nigeria">Nigeria</option>
                <option value="Canada">Canada</option>
                <option value="United States">United States</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: colors.text, fontSize: '14px' }}>University/Institution</label>
              <input type="text" name="university" value={formData.university} onChange={handleChange}
                style={{ width: '100%', padding: '14px', border: `2px solid ${colors.inputBorder}`, borderRadius: '12px', fontSize: '15px', backgroundColor: colors.input, color: colors.text }} placeholder="Your University" />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <input type="checkbox" name="agreeToTerms" checked={formData.agreeToTerms} onChange={handleChange} required style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
              <label style={{ fontSize: '14px', color: colors.textSecondary }}>I agree to the Terms of Service and Privacy Policy *</label>
            </div>
            <button type="submit" disabled={loading}
              style={{ width: '100%', backgroundColor: colors.primary, color: 'white', padding: '16px', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
            <p style={{ textAlign: 'center', color: colors.textSecondary, fontSize: '15px' }}>
              Already have an account? <Link to="/login" style={{ color: colors.primary, textDecoration: 'none', fontWeight: '600' }}>Log In</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignUp;