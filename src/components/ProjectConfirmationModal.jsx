import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useCurrency } from '../hooks/useCurrency';
import { PRICES_USD } from '../constants/pricing';

const ProjectConfirmationModal = ({ project, tier, onConfirm, onEdit, onCancel }) => {
  const { colors, isDarkMode } = useTheme();
  const { fmt } = useCurrency();
  const isPremium = tier === 'premium';
  const amount = isPremium ? PRICES_USD.premium : PRICES_USD.regular;

  const rowStyle = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 0', borderBottom: `1px solid ${colors.border}`
  };

  const labelStyle = { color: colors.textSecondary, fontSize: '13px', fontWeight: '500' };
  const valueStyle = { color: colors.text, fontSize: '13px', fontWeight: '600', textAlign: 'right', maxWidth: '60%' };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 5000
    }} onClick={onCancel}>
      <div style={{
        backgroundColor: colors.surface, borderRadius: '16px',
        maxWidth: '500px', width: '90%', padding: '32px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
        maxHeight: '90vh', overflowY: 'auto'
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: '36px', textAlign: 'center', marginBottom: '12px' }}>
          {isPremium ? '💎' : '📘'}
        </div>
        <h2 style={{ textAlign: 'center', fontSize: '22px', fontWeight: '700', color: colors.text, margin: '0 0 4px' }}>
          Review Your Project
        </h2>
        <p style={{ textAlign: 'center', fontSize: '14px', color: colors.textSecondary, margin: '0 0 24px' }}>
          Please confirm the details below before proceeding to payment
        </p>

        <div style={{
          backgroundColor: colors.background, borderRadius: '12px',
          padding: '16px 20px', marginBottom: '24px',
          border: `1px solid ${colors.border}`
        }}>
          <div style={rowStyle}>
            <span style={labelStyle}>Title</span>
            <span style={valueStyle}>{project.title}</span>
          </div>
          <div style={rowStyle}>
            <span style={labelStyle}>Level</span>
            <span style={valueStyle}>{project.level}</span>
          </div>
          <div style={rowStyle}>
            <span style={labelStyle}>Field</span>
            <span style={valueStyle}>{project.field}</span>
          </div>
          <div style={rowStyle}>
            <span style={labelStyle}>Topic</span>
            <span style={valueStyle}>{project.topic}</span>
          </div>
          <div style={rowStyle}>
            <span style={labelStyle}>Methodology</span>
            <span style={valueStyle}>{project.methodology || 'Not specified'}</span>
          </div>
          <div style={rowStyle}>
            <span style={labelStyle}>Reference Style</span>
            <span style={valueStyle}>{project.referenceStyle?.toUpperCase()}</span>
          </div>
          {project.useOrganization && project.organizationName && (
            <div style={rowStyle}>
              <span style={labelStyle}>Organization</span>
              <span style={valueStyle}>
                {project.organizationName}{project.hideOrganization ? ' (internal)' : ''}
              </span>
            </div>
          )}
          <div style={{ ...rowStyle, borderBottom: 'none' }}>
            <span style={labelStyle}>Tier</span>
            <span style={{ ...valueStyle, color: isPremium ? '#d97706' : colors.text }}>
              {isPremium ? '💎 Premium' : '📘 Regular'}
            </span>
          </div>
          <div style={{
            ...rowStyle, borderBottom: 'none', marginTop: '8px',
            borderTop: `2px solid ${colors.primary}`, paddingTop: '14px'
          }}>
            <span style={{ color: colors.text, fontSize: '16px', fontWeight: '700' }}>Amount to Pay</span>
            <span style={{ color: colors.primary, fontSize: '20px', fontWeight: '700' }}>{fmt(amount)}</span>
          </div>
        </div>

        <div style={{
          backgroundColor: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '10px',
          padding: '12px 16px', marginBottom: '20px', display: 'flex', gap: '10px',
          alignItems: 'flex-start'
        }}>
          <span style={{ fontSize: '16px', flexShrink: 0 }}>⚠️</span>
          <div style={{ fontSize: '13px', color: '#92400e', lineHeight: '1.5' }}>
            <strong style={{ fontWeight: '600' }}>Please verify carefully.</strong> Once payment is made, the project title, research topic, and all details above cannot be edited. Review everything before proceeding.
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={onConfirm} style={{
            backgroundColor: colors.primary, color: 'white', padding: '14px',
            border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer',
            fontSize: '15px'
          }}>Confirm & Pay {fmt(amount)}</button>
          <button onClick={onEdit} style={{
            backgroundColor: 'transparent', color: colors.text,
            padding: '12px', border: `1px solid ${colors.border}`, borderRadius: '8px',
            fontWeight: '500', cursor: 'pointer', fontSize: '14px'
          }}>✏️ Edit Details</button>
          <button onClick={onCancel} style={{
            backgroundColor: 'transparent', color: colors.textSecondary,
            padding: '8px', border: 'none', borderRadius: '8px',
            fontWeight: '400', cursor: 'pointer', fontSize: '13px'
          }}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default ProjectConfirmationModal;
