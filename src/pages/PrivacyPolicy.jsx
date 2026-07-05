import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useResponsive } from '../hooks/useResponsive';
import { SUPPORT_EMAIL } from '../constants/app';

const PrivacyPolicy = () => {
  const { colors, isDarkMode } = useTheme();
  const { isMobile } = useResponsive();
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.background }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 32px' }}>
        <button onClick={() => navigate(-1)} style={{
          background: 'none', border: 'none', color: colors.primary,
          cursor: 'pointer', fontSize: '14px', fontWeight: '500',
          padding: 0, marginBottom: '16px', display: 'inline-flex',
          alignItems: 'center', gap: '4px'
        }}>← Back</button>
        <div style={{ backgroundColor: colors.surface, borderRadius: '16px', padding: '40px', border: `1px solid ${colors.border}` }}>
          <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: colors.text, marginBottom: '8px' }}>Privacy Policy</h1>
          <p style={{ color: colors.textSecondary, marginBottom: '32px' }}>Last updated: January 2026</p>

          <p style={{ color: colors.text, lineHeight: '1.8', marginBottom: '24px' }}>
            A&P Firms ("we," "our," or "us") operates the PAGYSS platform. We are committed to protecting your privacy and handling your data transparently. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our thesis generation service.
          </p>

          <Section title="1. Information We Collect" colors={colors}>
            <SubSection title="1.1 Information You Provide">
              <ListItem>Account information: name, email address, username, and password</ListItem>
              <ListItem>Profile information: country, academic level, field of study</ListItem>
              <ListItem>Thesis content: titles, research questions, generated chapters, and uploaded documents</ListItem>
              <ListItem>Payment information processed securely through third-party processors</ListItem>
              <ListItem>Communications and feedback you send to us</ListItem>
            </SubSection>
            <SubSection title="1.2 Automatically Collected Information">
              <ListItem>Usage data: pages visited, features used, time spent</ListItem>
              <ListItem>Device information: browser type, operating system, IP address</ListItem>
              <ListItem>Cookies and similar tracking technologies</ListItem>
            </SubSection>
          </Section>

          <Section title="2. How We Use Your Information" colors={colors}>
            <ListItem>To provide, maintain, and improve our services</ListItem>
            <ListItem>To process transactions and manage your account</ListItem>
            <ListItem>To communicate about updates, security alerts, and support</ListItem>
            <ListItem>To personalize your experience</ListItem>
            <ListItem>To detect and prevent technical issues or fraud</ListItem>
          </Section>

          <Section title="3. AI Data Processing" colors={colors}>
            <p style={{ marginBottom: '16px' }}>PAGYSS uses Google Gemini AI to generate academic content. When you use our service:</p>
            <ListItem>Your prompts, topics, and research questions are transmitted to AI providers solely for content generation</ListItem>
            <ListItem>We do NOT use your thesis content to train AI models</ListItem>
            <ListItem>Generated content is stored securely and associated only with your account</ListItem>
            <ListItem>You retain full ownership of all generated thesis content</ListItem>
          </Section>

          <Section title="4. Data Sharing" colors={colors}>
            <p style={{ marginBottom: '16px' }}>We do NOT sell your personal information. We may share data:</p>
            <ListItem>With trusted service providers (hosting, payment processing, AI services)</ListItem>
            <ListItem>When required by law or to protect our rights</ListItem>
            <ListItem>In connection with a business transfer (merger, acquisition)</ListItem>
          </Section>

          <Section title="5. Data Security" colors={colors}>
            <ListItem>Encryption of data in transit (HTTPS/TLS)</ListItem>
            <ListItem>Secure storage with access controls</ListItem>
            <ListItem>However, no method of transmission over the internet is 100% secure</ListItem>
          </Section>

          <Section title="6. Data Retention" colors={colors}>
            <p>We retain your data as long as your account is active. You may request deletion at any time. Deleted data may remain in backups for up to 30 days.</p>
          </Section>

          <Section title="7. Your Rights" colors={colors}>
            <ListItem>Access: Request a copy of your personal data</ListItem>
            <ListItem>Rectification: Correct inaccurate data</ListItem>
            <ListItem>Erasure: Request deletion of your data</ListItem>
            <ListItem>Portability: Receive your data in a structured format</ListItem>
          </Section>

          <Section title="8. Cookies" colors={colors}>
            <p>We use cookies for essential functionality and analytics. You can control cookies through your browser settings.</p>
          </Section>

          <Section title="9. Contact Us" colors={colors}>
            <div style={{ backgroundColor: isDarkMode ? '#2d2d2d' : '#f9fafb', padding: '20px', borderRadius: '8px', border: `1px solid ${colors.border}` }}>
              <p><strong>Email:</strong> {SUPPORT_EMAIL}</p>
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

const SubSection = ({ title, children }) => (
  <div style={{ marginBottom: '20px', marginLeft: '16px' }}>
    <h3 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '12px' }}>{title}</h3>
    {children}
  </div>
);

const ListItem = ({ children }) => (
  <div style={{ display: 'flex', gap: '12px', marginBottom: '8px', marginLeft: '8px' }}>
    <span style={{ color: '#7c3aed' }}>•</span>
    <span style={{ flex: 1 }}>{children}</span>
  </div>
);

export default PrivacyPolicy;
