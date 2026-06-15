import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { getCurrency, getUserCountry } from '../constants/pricing';

const MockPaymentModal = ({ email, amount, currency, metadata, onClose, onSuccess }) => {
  const { colors } = useTheme();
  const [step, setStep] = useState('card');
  const [cardNumber, setCardNumber] = useState('4084 0808 0808 0808');
  const [expiry, setExpiry] = useState('12/28');
  const [cvv, setCvv] = useState('123');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const successTimerRef = useRef(null);

  const curr = getCurrency(getUserCountry());
  const currencyCode = currency || curr.code;
  const symbol = curr.symbol;
  const formattedAmount = `${symbol}${amount.toLocaleString()}.00`;

  const formatCardNumber = useCallback((value) => {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  }, []);

  const formatExpiry = useCallback((value) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  }, []);

  const handlePay = useCallback(() => {
    setProcessing(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setStep('success');
          const ref = `MOCK_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
          successTimerRef.current = setTimeout(() => onSuccess({ reference: ref, status: 'success' }), 1500);
          return 100;
        }
        return prev + Math.random() * 15 + 5;
      });
    }, 200);
  }, [onSuccess]);

  const handleCancel = useCallback(() => {
    setProcessing(false);
    onClose();
  }, [onClose]);

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape' && !processing) handleCancel(); };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, [handleCancel, processing]);

  if (step === 'success') {
    return (
      <div style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
      }} onClick={handleCancel}>
        <div style={{
          backgroundColor: '#ffffff', borderRadius: '16px', padding: '40px 32px',
          maxWidth: '380px', width: '90%', textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }} onClick={(e) => e.stopPropagation()}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #00c853, #00e676)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px', fontSize: '32px', color: 'white',
          }}>✓</div>
          <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1a1a2e', margin: '0 0 8px' }}>
            Payment Successful
          </h3>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 16px' }}>
            {formattedAmount} has been processed
          </p>
          <div style={{
            backgroundColor: '#f3f4f6', borderRadius: '8px', padding: '12px',
            marginBottom: '20px', fontSize: '12px', color: '#9ca3af',
          }}>
            Reference: MOCK_{Date.now()}
          </div>
          <button onClick={handleCancel} style={{
            width: '100%', backgroundColor: '#00c853', color: 'white',
            padding: '14px', border: 'none', borderRadius: '8px',
            fontWeight: '600', cursor: 'pointer', fontSize: '15px',
          }}>
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
    }} onClick={handleCancel}>
      <div style={{
        backgroundColor: '#ffffff', borderRadius: '16px',
        maxWidth: '400px', width: '90%', overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #0a1128, #1a237e)',
          padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff' }}>Paystack</div>
            <div style={{ fontSize: '11px', color: '#90caf9', marginTop: '2px' }}>Secure Payment</div>
          </div>
          <button onClick={handleCancel} disabled={processing} style={{
            background: 'rgba(255,255,255,0.1)', border: 'none', color: '#ffffff',
            width: '32px', height: '32px', borderRadius: '50%', cursor: processing ? 'not-allowed' : 'pointer',
            fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
        </div>

        {/* Amount */}
        <div style={{ padding: '24px 24px 16px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Pay</div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#1a1a2e' }}>{formattedAmount}</div>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>{email}</div>
        </div>

        {processing ? (
          <div style={{ padding: '40px 24px', textAlign: 'center' }}>
            <div style={{
              width: '48px', height: '48px', border: '4px solid #e5e7eb',
              borderTopColor: '#0a1128', borderRadius: '50%',
              margin: '0 auto 16px', animation: 'spin 0.8s linear infinite',
            }} />
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '12px' }}>
              Processing payment...
            </div>
            <div style={{
              width: '100%', height: '4px', backgroundColor: '#e5e7eb',
              borderRadius: '2px', overflow: 'hidden',
            }}>
              <div style={{
                width: `${Math.min(progress, 100)}%`, height: '100%',
                backgroundColor: '#0a1128', borderRadius: '2px',
                transition: 'width 0.2s ease',
              }} />
            </div>
          </div>
        ) : (
          <>
            {/* Card Form */}
            <div style={{ padding: '20px 24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                  Card Number
                </label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  placeholder="0000 0000 0000 0000"
                  style={{
                    width: '100%', padding: '12px', border: '1px solid #d1d5db',
                    borderRadius: '8px', fontSize: '16px', fontFamily: 'monospace',
                    boxSizing: 'border-box', outline: 'none',
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                    Expiry
                  </label>
                  <input
                    type="text"
                    value={expiry}
                    onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                    placeholder="MM/YY"
                    style={{
                      width: '100%', padding: '12px', border: '1px solid #d1d5db',
                      borderRadius: '8px', fontSize: '16px', fontFamily: 'monospace',
                      boxSizing: 'border-box', outline: 'none',
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                    CVV
                  </label>
                  <input
                    type="text"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="123"
                    style={{
                      width: '100%', padding: '12px', border: '1px solid #d1d5db',
                      borderRadius: '8px', fontSize: '16px', fontFamily: 'monospace',
                      boxSizing: 'border-box', outline: 'none',
                    }}
                  />
                </div>
              </div>
              <div style={{
                backgroundColor: '#f0fdf4', borderRadius: '8px', padding: '10px 12px',
                fontSize: '11px', color: '#059669', marginBottom: '16px',
              }}>
                🔒 Test mode — no real charges will be made
              </div>
            </div>

            {/* Pay Button */}
            <div style={{ padding: '0 24px 24px' }}>
              <button onClick={handlePay} style={{
                width: '100%', background: 'linear-gradient(135deg, #0a1128, #1a237e)',
                color: 'white', padding: '14px', border: 'none', borderRadius: '8px',
                fontWeight: '600', cursor: 'pointer', fontSize: '15px',
              }}>
                Pay {formattedAmount}
              </button>
            </div>
          </>
        )}

        {/* Footer */}
        <div style={{
          padding: '12px 24px', backgroundColor: '#f9fafb',
          borderTop: '1px solid #e5e7eb', textAlign: 'center',
        }}>
          <span style={{ fontSize: '10px', color: '#9ca3af' }}>
            Powered by Paystack • Secured with 256-bit SSL
          </span>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default MockPaymentModal;
