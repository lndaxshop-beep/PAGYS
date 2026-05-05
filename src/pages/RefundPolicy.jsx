import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const RefundPolicy = () => {
  const { colors, isDarkMode } = useTheme();
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.background }}>
      <header style={{ backgroundColor: colors.surface, borderBottom: `1px solid ${colors.border}`, padding: '20px 32px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '32px' }}>
          <h1 onClick={() => navigate('/')} style={{ fontSize: '28px', fontWeight: 'bold', color: colors.primary, margin: 0, cursor: 'pointer' }}>PAGYS</h1>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: colors.textSecondary, fontSize: '14px', cursor: 'pointer' }}>← Back</button>
        </div>
      </header>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 32px' }}>
        <div style={{ backgroundColor: colors.surface, borderRadius: '16px', padding: '40px', border: `1px solid ${colors.border}` }}>
          <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: colors.text, marginBottom: '8px' }}>Refund Policy</h1>
          <p style={{ color: colors.textSecondary, marginBottom: '32px' }}>Last updated: January 2026</p>

          <Section title="No Refunds" colors={colors}>
            <p style={{ lineHeight: '1.8', marginBottom: '16px' }}>
              A&P Firms operates PAGYS with a strict <strong>no-refund policy</strong>. All purchases, including regular project access (₵30) and premium upgrades, are final and non-refundable.
            </p>
            <p style={{ lineHeight: '1.8' }}>
              By making a payment on PAGYS, you acknowledge and agree that you will not receive a refund under any circumstances.
            </p>
          </Section>

          <Section title="Why No Refunds?" colors={colors}>
            <ul style={{ lineHeight: '1.8' }}>
              <li>Our service provides instant access to AI-generated academic content, which cannot be returned.</li>
              <li>API costs are incurred immediately upon content generation.</li>
              <li>This policy protects against abuse of our AI generation services.</li>
            </ul>
          </Section>

          <Section title="Technical Issues" colors={colors}>
            <p style={{ lineHeight: '1.8' }}>
              If you experience technical issues that prevent you from using PAGYS, please report them immediately to <strong>beaty.rice.7@gmail.com</strong>. We will investigate and resolve issues promptly. While we do not offer refunds, we are committed to ensuring you receive the service you paid for.
            </p>
          </Section>

          <Section title="Contact" colors={colors}>
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

export default RefundPolicy;