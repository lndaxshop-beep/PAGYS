import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const PaymentReceipt = ({ payment, onClose }) => {
  const { colors } = useTheme();
  if (!payment) return null;

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return dateStr || 'N/A'; }
  };

  const typeLabels = {
    project_creation: 'Project Creation',
    upgrade: 'Premium Upgrade',
    micro_payment: 'Feature Payment',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-title"
      style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 6000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: colors.surface, borderRadius: '16px',
          maxWidth: '420px', width: '90%', padding: '32px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            backgroundColor: '#059669', display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 12px', fontSize: '28px',
          }}>
            ✓
          </div>
          <h2 id="receipt-title" style={{ fontSize: '20px', fontWeight: '700', color: colors.text, margin: '0 0 4px' }}>
            Payment Successful
          </h2>
          <p style={{ fontSize: '13px', color: colors.textSecondary, margin: 0 }}>
            Your payment has been confirmed
          </p>
        </div>

        <div style={{
          backgroundColor: colors.background, borderRadius: '12px',
          padding: '20px', marginBottom: '24px', border: `1px solid ${colors.border}`,
        }}>
          {[
            { label: 'Type', value: typeLabels[payment.type] || payment.type },
            { label: 'Amount', value: `${payment.currency?.toUpperCase() || 'USD'} ${payment.amount?.toFixed(2)}` },
            { label: 'Reference', value: payment.reference },
            { label: 'Email', value: payment.email },
            { label: 'Date', value: formatDate(payment.paidAt) },
            { label: 'Channel', value: payment.channel?.replace('_', ' ') || 'N/A' },
          ].map((row, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '8px 0',
              borderBottom: i < 5 ? `1px solid ${colors.border}` : 'none',
            }}>
              <span style={{ fontSize: '13px', color: colors.textSecondary }}>{row.label}</span>
              <span style={{ fontSize: '13px', fontWeight: '500', color: colors.text }}>{row.value}</span>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          style={{
            width: '100%', backgroundColor: colors.primary, color: 'white',
            padding: '14px', border: 'none', borderRadius: '8px',
            fontWeight: '600', cursor: 'pointer', fontSize: '15px',
          }}
        >
          Done
        </button>
      </div>
    </div>
  );
};

export default PaymentReceipt;
