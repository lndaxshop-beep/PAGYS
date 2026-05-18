import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useCurrency } from '../hooks/useCurrency';
import { PRICES_USD } from '../constants/pricing';

const PaymentModal = ({
  project, tier, amount, isUpgrade,
  processingPayment, onConfirm, onCancel
}) => {
  const { colors } = useTheme();
  const { fmt } = useCurrency();
  const label = tier === 'premium' ? 'Premium' : 'Regular';

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 5000
    }}>
      <div style={{
        backgroundColor: colors.surface, borderRadius: '16px',
        maxWidth: '440px', width: '90%', padding: '32px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
      }}>
        <div style={{ fontSize: '40px', textAlign: 'center', marginBottom: '16px' }}>
          {tier === 'premium' ? '💎' : '📘'}
        </div>
        <h2 style={{ textAlign: 'center', fontSize: '22px', fontWeight: '700', color: colors.text, margin: '0 0 8px' }}>
          {isUpgrade ? 'Upgrade to Premium' : `Confirm ${label} Project`}
        </h2>
        <p style={{ textAlign: 'center', fontSize: '14px', color: colors.textSecondary, margin: '0 0 24px' }}>
          {isUpgrade
            ? `Upgrade "${project?.title}" from Regular to Premium`
            : `You are creating a ${label.toLowerCase()} project for "${project?.title}"`
          }
        </p>

        <div style={{
          backgroundColor: colors.background, borderRadius: '12px',
          padding: '20px', marginBottom: '24px',
          border: `1px solid ${colors.border}`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ color: colors.textSecondary, fontSize: '14px' }}>Plan</span>
            <span style={{ color: colors.text, fontWeight: '600', fontSize: '14px' }}>{label}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ color: colors.textSecondary, fontSize: '14px' }}>Project</span>
            <span style={{ color: colors.text, fontWeight: '500', fontSize: '14px' }}>{project?.title || 'Untitled'}</span>
          </div>
          <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: '12px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: colors.textSecondary, fontSize: '14px' }}>Amount</span>
            <span style={{ color: colors.text, fontWeight: '700', fontSize: '18px' }}>{fmt(amount)}</span>
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: '12px', color: colors.textSecondary, margin: '0 0 20px' }}>
          {isUpgrade
            ? `You will be charged ${fmt(PRICES_USD.upgrade)} for the upgrade. This is a one-time payment.`
            : 'Payment is processed securely. This is a one-time payment per project.'
          }
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            onClick={onConfirm}
            disabled={processingPayment}
            style={{
              backgroundColor: processingPayment ? colors.border : colors.primary,
              color: 'white', padding: '14px', border: 'none', borderRadius: '8px',
              fontWeight: '600', cursor: processingPayment ? 'not-allowed' : 'pointer',
              fontSize: '15px', opacity: processingPayment ? 0.7 : 1
            }}
          >
            {processingPayment ? 'Processing...' : `Pay ${fmt(amount)}`}
          </button>
          <button
            onClick={onCancel}
            disabled={processingPayment}
            style={{
              backgroundColor: 'transparent', color: colors.textSecondary,
              padding: '10px', border: `1px solid ${colors.border}`, borderRadius: '8px',
              fontWeight: '500', cursor: processingPayment ? 'not-allowed' : 'pointer',
              fontSize: '14px'
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;