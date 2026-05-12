import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const TermsOfService = () => {
  const { colors, isDarkMode } = useTheme();
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.background }}>
      <button onClick={() => navigate(-1)} style={{
        position: 'fixed', top: '20px', right: '20px', zIndex: 100,
        backgroundColor: colors.surface, color: colors.text,
        border: `1px solid ${colors.border}`, borderRadius: '10px',
        padding: '10px 18px', fontSize: '14px', fontWeight: '500',
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
        boxShadow: isDarkMode ? '0 4px 12px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.1)',
        transition: 'all 0.2s',
      }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = isDarkMode ? '0 6px 16px rgba(0,0,0,0.5)' : '0 6px 16px rgba(0,0,0,0.15)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = isDarkMode ? '0 4px 12px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.1)'; }}
      >← Back</button>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 32px' }}>
        <div style={{ backgroundColor: colors.surface, borderRadius: '16px', padding: '40px', border: `1px solid ${colors.border}` }}>
          <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: colors.text, marginBottom: '8px' }}>Terms of Service</h1>
          <p style={{ color: colors.textSecondary, marginBottom: '32px' }}>Last updated: January 2026</p>

          <p style={{ color: colors.text, lineHeight: '1.8', marginBottom: '24px' }}>
            Welcome to PAGYS, operated by A&P Firms. By accessing or using our thesis generation platform, you agree to these Terms of Service. Please read them carefully.
          </p>

          <Section title="1. Acceptance of Terms" colors={colors}>
            <p>By creating an account or using PAGYS, you acknowledge that you have read, understood, and agree to be bound by these Terms. If you do not agree, you may not use the Service.</p>
          </Section>

          <Section title="2. Eligibility" colors={colors}>
            <ListItem>You must be at least 16 years of age</ListItem>
            <ListItem>You must have legal capacity to enter into a binding agreement</ListItem>
            <ListItem>You must provide accurate registration information</ListItem>
          </Section>

          <Section title="3. Account Responsibility" colors={colors}>
            <ListItem>Keep your password confidential</ListItem>
            <ListItem>Notify us immediately of unauthorized access</ListItem>
            <ListItem>You are responsible for all activities under your account</ListItem>
          </Section>

          <Section title="4. AI-Generated Content Disclaimer" colors={colors}>
            <div style={{ backgroundColor: isDarkMode ? '#2d2d2d' : '#fef3c7', border: `1px solid ${isDarkMode ? '#d97706' : '#fbbf24'}`, borderRadius: '8px', padding: '20px', marginBottom: '20px' }}>
              <p style={{ fontWeight: '600', color: isDarkMode ? '#fbbf24' : '#d97706', marginBottom: '8px' }}>⚠️ IMPORTANT DISCLAIMER</p>
              <p>PAGYS uses artificial intelligence to generate academic content. While we strive for accuracy:</p>
            </div>
            <ListItem>AI-generated content may contain errors or inaccuracies</ListItem>
            <ListItem>You are solely responsible for reviewing and verifying all generated content</ListItem>
            <ListItem>PAGYS does not guarantee academic validity or originality</ListItem>
            <ListItem>Citations must be independently verified</ListItem>
          </Section>

          <Section title="5. Acceptable Use" colors={colors}>
            <ListItem>Do NOT use PAGYS for academic fraud or plagiarism</ListItem>
            <ListItem>Do NOT generate illegal, harmful, or discriminatory content</ListItem>
            <ListItem>Do NOT attempt to reverse engineer the Service</ListItem>
            <ListItem>Do NOT resell or commercially exploit the Service without authorization</ListItem>
          </Section>

          <Section title="6. Intellectual Property" colors={colors}>
            <p style={{ marginBottom: '16px' }}><strong>Your Content:</strong> You retain ownership of your thesis content, prompts, and uploaded documents.</p>
            <p><strong>Our Content:</strong> PAGYS platform, code, design, and proprietary algorithms belong to A&P Firms.</p>
          </Section>

          <Section title="7. Academic Integrity" colors={colors}>
            <ListItem>You are responsible for complying with your institution's policies</ListItem>
            <ListItem>Properly attribute AI assistance when required</ListItem>
            <ListItem>PAGYS is not liable for academic penalties from improper use</ListItem>
          </Section>

          <Section title="8. Pricing and Payment" colors={colors}>
            <ListItem>Regular access: ₵30 per project</ListItem>
            <ListItem>Premium upgrade: Additional features for a small fee</ListItem>
            <ListItem>All payments are final — we do not offer refunds</ListItem>
            <ListItem>Pricing may change with reasonable notice</ListItem>
          </Section>

          <Section title="9. No Refund Policy" colors={colors}>
            <p>All purchases are final. We do not provide refunds. If you experience technical issues, please report them to beaty.rice.7@gmail.com and we will address them promptly.</p>
          </Section>

          <Section title="10. Limitation of Liability" colors={colors}>
            <ListItem>PAGYS is provided "AS IS" without warranties</ListItem>
            <ListItem>We are not liable for indirect, incidental, or consequential damages</ListItem>
            <ListItem>Our total liability shall not exceed the amount you paid us</ListItem>
          </Section>

          <Section title="11. Governing Law" colors={colors}>
            <p>These Terms are governed by the laws of Canada. Disputes shall be resolved through negotiation first, then binding arbitration.</p>
          </Section>

          <Section title="12. Contact" colors={colors}>
            <div style={{ backgroundColor: isDarkMode ? '#2d2d2d' : '#f9fafb', padding: '20px', borderRadius: '8px', border: `1px solid ${colors.border}` }}>
              <p><strong>Email:</strong> beaty.rice.7@gmail.com</p>
              <p><strong>Business:</strong> A&P Firms</p>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
};

const Section = ({ title, children, colors }) => (
  <div style={{ marginBottom: '32px' }}>
    <h2 style={{ fontSize: '22px', fontWeight: '600', color: colors.text, marginBottom: '16px', borderBottom: `1px solid ${colors.border}`, paddingBottom: '8px' }}>{title}</h2>
    {children}
  </div>
);

const ListItem = ({ children }) => (
  <div style={{ display: 'flex', gap: '12px', marginBottom: '8px', marginLeft: '8px' }}>
    <span style={{ color: '#7c3aed' }}>•</span>
    <span style={{ flex: 1 }}>{children}</span>
  </div>
);

export default TermsOfService;