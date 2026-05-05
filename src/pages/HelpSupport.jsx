import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const HelpSupport = () => {
  const { colors, isDarkMode } = useTheme();
  const navigate = useNavigate();

  const faqs = [
    { q: 'How do I start a new thesis project?', a: 'Log into your dashboard and click "+ Create New Project". Fill in your thesis title, field of study, level, and methodology. Your project will be created instantly.' },
    { q: 'How does the AI generate my thesis?', a: 'PAGYS uses Google Gemini AI to generate academic content based on your topic, field, and methodology. You can guide the AI by uploading reference structures or pasting sample work.' },
    { q: 'Are the references real?', a: 'Yes! PAGYS fetches real academic references from Crossref, a database of over 150 million scholarly articles. References include real authors, titles, journals, and DOIs.' },
    { q: 'Can I edit the generated content?', a: 'Absolutely. Click "✏️ Edit" to switch to editing mode. Make changes, then click "Save & Preview" to see the rendered version.' },
    { q: 'What citation styles are supported?', a: 'APA 7th Edition, MLA 9th Edition, Chicago/Turabian, Harvard, and IEEE.' },
    { q: 'How do I upload my own chapter structure?', a: 'When you click a new chapter, a popup appears. Upload a screenshot, document, or paste formatted text showing your desired structure. The AI will follow it.' },
    { q: 'What is Premium?', a: 'Premium gives you extended use of Humanise and Feedback features — up to 4 times per subsection instead of 1.' },
    { q: 'Do you offer refunds?', a: 'No. All purchases are final. If you experience issues, contact beaty.rice.7@gmail.com.' },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.background }}>
      <header style={{ backgroundColor: colors.surface, borderBottom: `1px solid ${colors.border}`, padding: '20px 32px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '32px' }}>
          <h1 onClick={() => navigate('/')} style={{ fontSize: '28px', fontWeight: 'bold', color: colors.primary, margin: 0, cursor: 'pointer' }}>PAGYS</h1>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: colors.textSecondary, fontSize: '14px', cursor: 'pointer' }}>← Back</button>
        </div>
      </header>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 32px' }}>
        <div style={{ backgroundColor: colors.surface, borderRadius: '16px', padding: '40px', border: `1px solid ${colors.border}`, marginBottom: '32px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: colors.text, marginBottom: '8px' }}>Help & Support</h1>
          <p style={{ color: colors.textSecondary, marginBottom: '32px' }}>Find answers to common questions about PAGYS.</p>

          {faqs.map((faq, i) => (
            <div key={i} style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: i < faqs.length - 1 ? `1px solid ${colors.border}` : 'none' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: colors.text, marginBottom: '8px' }}>{faq.q}</h3>
              <p style={{ color: colors.textSecondary, lineHeight: '1.7' }}>{faq.a}</p>
            </div>
          ))}
        </div>

        <div style={{ backgroundColor: colors.primary + '10', borderRadius: '16px', padding: '32px', border: `1px solid ${colors.primary}20`, textAlign: 'center' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: colors.text, marginBottom: '12px' }}>Still Need Help?</h2>
          <p style={{ color: colors.textSecondary, marginBottom: '20px' }}>Contact us directly and we'll respond as soon as possible.</p>
          <a href="mailto:beaty.rice.7@gmail.com" style={{ backgroundColor: colors.primary, color: 'white', padding: '14px 32px', borderRadius: '8px', textDecoration: 'none', fontWeight: '600', display: 'inline-block', fontSize: '16px' }}>
            📧 beaty.rice.7@gmail.com
          </a>
        </div>
      </div>
    </div>
  );
};

export default HelpSupport;