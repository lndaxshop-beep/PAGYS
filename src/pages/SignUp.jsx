import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useResponsive } from '../hooks/useResponsive';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

const SignUp = () => {
  const { colors, isDarkMode } = useTheme();
  const { isMobile } = useResponsive();
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
      setError('Password must be at least 8 characters with uppercase, number, and special character');
      setLoading(false);
      return;
    }
    if (!/[A-Z]/.test(formData.password)) {
      setError('Password must contain at least one uppercase letter');
      setLoading(false);
      return;
    }
    if (!/[0-9]/.test(formData.password)) {
      setError('Password must contain at least one number');
      setLoading(false);
      return;
    }
    if (!/[\W_]/.test(formData.password)) {
      setError('Password must contain at least one special character');
      setLoading(false);
      return;
    }

    let fbUser = null;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      fbUser = userCredential.user;

      const stripTags = (s) => (typeof s === 'string' ? s.replace(/<[^>]*>/g, '').trim() : '');
      await setDoc(doc(db, 'users', fbUser.uid), {
        fullName: stripTags(formData.fullName).slice(0, 100),
        username: stripTags(formData.username).slice(0, 50),
        email: stripTags(formData.email).slice(0, 254),
        country: stripTags(formData.country).slice(0, 50),
        university: stripTags(formData.university).slice(0, 100),
        createdAt: new Date().toISOString(),
      });

      navigate('/dashboard');
    } catch (err) {
      console.error('SignUp error:', err.code, err.message);
      if (fbUser?.uid) {
        try { await deleteUser(fbUser); } catch (e) { console.error('Error cleaning up auth user:', e); }
      }
      if (err.code === 'auth/email-already-in-use') {
        setError('Email already registered. Please login instead.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Must be at least 8 characters with uppercase, number, and special character.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many attempts. Please wait and try again.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error. Please check your connection.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Email/password sign-in is not enabled in Firebase Console. Please contact support.');
      } else if (err.code === 'auth/unauthorized-continue-uri' || err.code === 'auth/invalid-continue-uri') {
        setError('Sign up configuration error. Please contact support.');
      } else if (err.code === 'permission-denied') {
        setError('Database permission denied. Please contact support.');
      } else {
        setError('Sign up failed (' + (err.code || 'unknown') + '). ' + (err.message || 'Please try again.'));
      }
    }

    setLoading(false);
  };

  const inputStyle = { width: '100%', padding: '14px 42px 14px 42px', border: `2px solid ${colors.inputBorder}`, borderRadius: '12px', fontSize: '15px', backgroundColor: colors.input, color: colors.text, transition: 'border-color 0.2s' };
  const iconStyle = { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: colors.textSecondary, fontSize: '18px', zIndex: 1, pointerEvents: 'none' };
  const eyeBtnStyle = { position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: colors.textSecondary, fontSize: '18px', zIndex: 1, padding: '4px', lineHeight: 1 };
  const fieldContainerStyle = { position: 'relative' };
  const labelStyle = { display: 'block', marginBottom: '8px', fontWeight: '500', color: colors.text, fontSize: '14px' };
  const helperStyle = { fontSize: '12px', color: colors.textSecondary, marginTop: '4px', marginLeft: '4px' };

  const handleFocus = (e) => { e.target.style.borderColor = colors.primary; };
  const handleBlur = (e) => { e.target.style.borderColor = colors.inputBorder; };

  return (
    <div style={{
      minHeight: isMobile ? 'calc(100vh - 60px)' : 'calc(100vh - 80px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: isDarkMode
        ? 'radial-gradient(circle at 10% 20%, #2d2d2d 0%, #1a1a1a 90%)'
        : 'radial-gradient(circle at 10% 20%, #f5f3ff 0%, #ffffff 90%)',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: isMobile ? '100%' : '600px',
        width: '100%',
        backgroundColor: colors.surface,
        borderRadius: isMobile ? '16px' : '24px',
        padding: isMobile ? '24px' : '40px',
        boxShadow: isDarkMode
          ? '0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)'
          : '0 20px 40px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.02)',
        transition: 'all 0.3s',
        maxHeight: isMobile ? '100%' : '90vh',
        overflowY: 'auto'
      }}>
        <div style={{ textAlign: 'center', marginBottom: isMobile ? '24px' : '32px' }}>
          <div style={{
            width: isMobile ? '64px' : '80px', height: isMobile ? '64px' : '80px',
            backgroundColor: colors.primary, borderRadius: '50%',
            margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 10px 20px ${colors.primary}40`
          }}>
            <span style={{ fontSize: isMobile ? '28px' : '36px', color: 'white' }}>📚</span>
          </div>
          <h1 style={{ fontSize: isMobile ? '24px' : '32px', fontWeight: 'bold', color: colors.text, marginBottom: '4px', letterSpacing: '-0.5px' }}>Create Your Account</h1>
          <p style={{ color: colors.textSecondary, fontSize: isMobile ? '14px' : '15px' }}>Join thousands of students writing better theses</p>
        </div>

        {error && (
          <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', textAlign: 'center' }}>{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gap: '20px' }}>
            <div style={fieldContainerStyle}>
              <label htmlFor="fullName" style={labelStyle}>Full Name *</label>
              <span style={iconStyle}>👤</span>
              <input id="fullName" type="text" name="fullName" value={formData.fullName} onChange={handleChange} required onFocus={handleFocus} onBlur={handleBlur} style={inputStyle} placeholder="John Doe" />
            </div>

            <div style={fieldContainerStyle}>
              <label htmlFor="email" style={labelStyle}>Email Address *</label>
              <span style={iconStyle}>✉️</span>
              <input id="email" type="email" name="email" value={formData.email} onChange={handleChange} required onFocus={handleFocus} onBlur={handleBlur} style={inputStyle} placeholder="you@university.edu" />
            </div>

            <div style={fieldContainerStyle}>
              <label htmlFor="username" style={labelStyle}>Username *</label>
              <span style={iconStyle}>@</span>
              <input id="username" type="text" name="username" value={formData.username} onChange={handleChange} required onFocus={handleFocus} onBlur={handleBlur} style={inputStyle} placeholder="johndoe123" />
            </div>

            <div style={fieldContainerStyle}>
              <label htmlFor="password" style={labelStyle}>Password *</label>
              <span style={iconStyle}>🔒</span>
              <input id="password" type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} required onFocus={handleFocus} onBlur={handleBlur} style={inputStyle} placeholder="••••••••" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={eyeBtnStyle} tabIndex={-1} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? '👁‍🗨' : '👁'}</button>
              <div style={{ marginTop: '6px', marginLeft: '4px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <span style={{ fontSize: '12px', color: formData.password.length >= 8 ? '#16a34a' : (formData.password.length > 0 ? '#dc2626' : colors.textSecondary) }}>
                  {formData.password.length >= 8 ? '✓' : '○'} At least 8 characters
                </span>
                <span style={{ fontSize: '12px', color: /[A-Z]/.test(formData.password) ? '#16a34a' : (formData.password.length > 0 ? '#dc2626' : colors.textSecondary) }}>
                  {/[A-Z]/.test(formData.password) ? '✓' : '○'} One uppercase letter
                </span>
                <span style={{ fontSize: '12px', color: /[0-9]/.test(formData.password) ? '#16a34a' : (formData.password.length > 0 ? '#dc2626' : colors.textSecondary) }}>
                  {/[0-9]/.test(formData.password) ? '✓' : '○'} One number
                </span>
                <span style={{ fontSize: '12px', color: /[\W_]/.test(formData.password) ? '#16a34a' : (formData.password.length > 0 ? '#dc2626' : colors.textSecondary) }}>
                  {/[\W_]/.test(formData.password) ? '✓' : '○'} One special character
                </span>
              </div>
            </div>

            <div style={fieldContainerStyle}>
              <label htmlFor="confirmPassword" style={labelStyle}>Confirm Password *</label>
              <span style={iconStyle}>✓</span>
              <input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required onFocus={handleFocus} onBlur={handleBlur} style={inputStyle} placeholder="••••••••" />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={eyeBtnStyle} tabIndex={-1} aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}>{showConfirmPassword ? '👁‍🗨' : '👁'}</button>
            </div>
            {(formData.confirmPassword || formData.password) && (
              <span style={{ fontSize: '12px', color: formData.password === formData.confirmPassword ? '#16a34a' : '#dc2626', marginTop: '-10px', marginLeft: '8px' }}>
                {formData.password === formData.confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
              </span>
            )}

            <div style={fieldContainerStyle}>
              <label htmlFor="country" style={labelStyle}>Country *</label>
              <span style={iconStyle}>🌍</span>
              <select id="country" name="country" value={formData.country} onChange={handleChange} required onFocus={handleFocus} onBlur={handleBlur}
                style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}>
                <option value="">Select your country</option>
                <option value="United States">United States</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Canada">Canada</option>
                <option value="Australia">Australia</option>
                <option value="Germany">Germany</option>
                <option value="France">France</option>
                <option value="China">China</option>
                <option value="India">India</option>
                <option value="Brazil">Brazil</option>
                <option value="Nigeria">Nigeria</option>
                <option value="South Africa">South Africa</option>
                <option value="Kenya">Kenya</option>
                <option value="Ghana">Ghana</option>
                <option value="Other">Other</option>
              </select>
              <p style={helperStyle}>We use this to tailor thesis to your academic standards</p>
            </div>

            <div style={fieldContainerStyle}>
              <label htmlFor="university" style={labelStyle}>University/Institution</label>
              <span style={iconStyle}>🏛️</span>
              <input id="university" type="text" name="university" value={formData.university} onChange={handleChange} onFocus={handleFocus} onBlur={handleBlur} style={inputStyle} placeholder="Your University" />
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginTop: '8px' }}>
              <input id="agreeToTerms" type="checkbox" name="agreeToTerms" checked={formData.agreeToTerms} onChange={handleChange} required style={{ width: '18px', height: '18px', marginTop: '2px', cursor: 'pointer', accentColor: colors.primary }} />
              <label htmlFor="agreeToTerms" style={{ fontSize: '14px', color: colors.textSecondary, lineHeight: '1.5' }}>
                I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: colors.primary, textDecoration: 'underline' }}>Terms of Service</a>
                {' '}and{' '}<a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: colors.primary, textDecoration: 'underline' }}>Privacy Policy</a> *
              </label>
            </div>

            <button type="submit" disabled={loading}
              style={{ width: '100%', backgroundColor: colors.primary, color: 'white', padding: '16px', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, boxShadow: loading ? 'none' : `0 8px 16px ${colors.primary}40`, marginTop: '16px', transition: 'all 0.2s' }}
              onMouseEnter={(e) => { if (!loading) { e.target.style.backgroundColor = colors.primaryDark; e.target.style.transform = 'translateY(-2px)'; } }}
              onMouseLeave={(e) => { if (!loading) { e.target.style.backgroundColor = colors.primary; e.target.style.transform = 'translateY(0)'; } }}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>

            <p style={{ textAlign: 'center', color: colors.textSecondary, fontSize: '15px', marginTop: '16px' }}>
              Already have an account? <Link to="/login" style={{ color: colors.primary, textDecoration: 'none', fontWeight: '600' }} onMouseEnter={(e) => { e.target.style.opacity = '0.8'; }} onMouseLeave={(e) => { e.target.style.opacity = '1'; }}>Log In</Link>
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '16px' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: colors.border }}></div>
              <span style={{ color: colors.textSecondary, fontSize: '13px' }}>Secure Sign Up</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: colors.border }}></div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignUp;
