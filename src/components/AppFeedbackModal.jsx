import React, { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const CATEGORIES = ['Bug Report', 'Feature Request', 'General Feedback', 'Other'];

const AppFeedbackModal = ({ isOpen, onClose }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('General Feedback');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (user?.email) setEmail(user.email);
      setMessage('');
      setCategory('General Feedback');
      setSubmitted(false);
      setError('');
    }
  }, [isOpen, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitting(true);
    setError('');

    try {
      const userName = user?.fullName || user?.username || '';

      await addDoc(collection(db, 'feedback'), {
        userId: user?.uid || null,
        userEmail: email || '',
        userName,
        message: message.trim(),
        category,
        page: window.location.pathname,
        createdAt: serverTimestamp(),
        status: 'new',
      });

      setSubmitted(true);
      setTimeout(() => onClose(), 2000);
    } catch (err) {
      console.error('Feedback submit error:', err);
      setError('Failed to send feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="feedback-modal-title" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }} onClick={onClose}>
      <div style={{ backgroundColor: colors.surface, borderRadius: '16px', padding: '32px', maxWidth: '480px', width: '90%', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>
        {submitted ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🙏</div>
            <h3 style={{ color: colors.text, fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>Thank You!</h3>
            <p style={{ color: colors.textSecondary, fontSize: '14px' }}>Your feedback helps us improve PAGYS.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 id="feedback-modal-title" style={{ color: colors.text, fontSize: '20px', fontWeight: '600' }}>Send Feedback</h3>
              <button type="button" onClick={onClose} aria-label="Close feedback modal" style={{ background: 'none', border: 'none', color: colors.textSecondary, fontSize: '24px', cursor: 'pointer', padding: '0', lineHeight: '1' }}>×</button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: colors.text, fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Your Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{ width: '100%', padding: '10px 12px', border: `1px solid ${colors.inputBorder}`, borderRadius: '8px', backgroundColor: colors.input, color: colors.text, fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: colors.text, fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: `1px solid ${colors.inputBorder}`, borderRadius: '8px', backgroundColor: colors.input, color: colors.text, fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: colors.text, fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Your Message *</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Tell us what you think..."
                rows="4"
                required
                style={{ width: '100%', padding: '10px 12px', border: `1px solid ${colors.inputBorder}`, borderRadius: '8px', backgroundColor: colors.input, color: colors.text, fontSize: '14px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
            </div>

            {error && <p style={{ color: '#ef4444', fontSize: '13px', marginBottom: '12px' }}>{error}</p>}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="button" onClick={onClose} style={{ flex: 1, backgroundColor: 'transparent', color: colors.text, padding: '12px', border: `1px solid ${colors.border}`, borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>
                Cancel
              </button>
              <button type="submit" disabled={submitting || !message.trim()} style={{ flex: 1, backgroundColor: (submitting || !message.trim()) ? colors.border : colors.primary, color: 'white', padding: '12px', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: (submitting || !message.trim()) ? 'not-allowed' : 'pointer', fontSize: '14px' }}>
                {submitting ? 'Sending...' : 'Send Feedback'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AppFeedbackModal;
