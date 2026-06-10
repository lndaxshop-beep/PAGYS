import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useResponsive } from '../hooks/useResponsive';
import { SUPPORT_EMAIL } from '../constants/app';

const RefundPolicy = () => {
  const { colors, isDarkMode } = useTheme();
  const { isMobile } = useResponsive();
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

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: isMobile ? '24px 16px' : '48px 32px' }}>
        <div style={{ backgroundColor: colors.surface, borderRadius: isMobile ? '12px' : '16px', padding: isMobile ? '24px' : '40px', border: `1px solid ${colors.border}` }}>
          <h1 style={{ fontSize: isMobile ? '28px' : '36px', fontWeight: 'bold', color: colors.text, marginBottom: '8px' }}>Refund Policy</h1>
          <p style={{ color: colors.textSecondary, marginBottom: isMobile ? '24px' : '32px', fontSize: isMobile ? '14px' : '15px' }}>Last updated: January 2026</p>

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
              If you experience technical issues that prevent you from using PAGYS, please report them immediately to <strong>{SUPPORT_EMAIL}</strong>. We will investigate and resolve issues promptly. While we do not offer refunds, we are committed to ensuring you receive the service you paid for.
            </p>
          </Section>

          <Section title="Contact" colors={colors}>
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

export default RefundPolicy;
