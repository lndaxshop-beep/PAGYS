import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useResponsive } from '../hooks/useResponsive';
import { SUPPORT_EMAIL } from '../constants/app';

const TermsOfService = () => {
  const { colors, isDarkMode } = useTheme();
  const { isMobile } = useResponsive();
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.background }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: isMobile ? '24px 16px' : '48px 32px' }}>
        <button onClick={() => navigate(-1)} style={{
          background: 'none', border: 'none', color: colors.primary,
          cursor: 'pointer', fontSize: isMobile ? '13px' : '14px', fontWeight: '500',
          padding: 0, marginBottom: '16px', display: 'inline-flex',
          alignItems: 'center', gap: '4px'
        }}>← Back</button>
        <div style={{ backgroundColor: colors.surface, borderRadius: isMobile ? '12px' : '16px', padding: isMobile ? '24px' : '40px', border: `1px solid ${colors.border}` }}>
          <h1 style={{ fontSize: isMobile ? '28px' : '36px', fontWeight: 'bold', color: colors.text, marginBottom: '8px' }}>Terms of Service</h1>
          <p style={{ color: colors.textSecondary, marginBottom: isMobile ? '24px' : '32px', fontSize: isMobile ? '14px' : '15px' }}>Last updated: January 2026</p>

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
            <p>All purchases are final. We do not provide refunds. If you experience technical issues, please report them to {SUPPORT_EMAIL} and we will address them promptly.</p>
          </Section>

          <Section title="10. Limitation of Liability" colors={colors}>
            <ListItem>PAGYS is provided "AS IS" without warranties</ListItem>
            <ListItem>We are not liable for indirect, incidental, or consequential damages</ListItem>
            <ListItem>Our total liability shall not exceed the amount you paid us</ListItem>
          </Section>

          <Section title="11. Governing Law" colors={colors}>
            <p>These Terms are governed by international law. Disputes shall be resolved through negotiation first, then binding arbitration.</p>
          </Section>

          <Section title="12. Contact" colors={colors}>
            <div style={{ backgroundColor: isDarkMode ? '#2d2d2d' : '#f9fafb', padding: '20px', borderRadius: '8px', border: `1px solid ${colors.border}` }}>
              <p><strong>Email:</strong> {SUPPORT_EMAIL}</p>
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
