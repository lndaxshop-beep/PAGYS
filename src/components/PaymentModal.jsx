import React, { useState } from 'react';
import { PaystackButton } from '@makozi/paystack-react-pay';


const PaymentModal = ({ project, onSuccess, onClose, onNotify }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  // Paystack configuration
  const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY; // Replace with your test public key
  
  // Amount in GHS pesewas (GHS 30 = 3000 pesewas)
  const amount = 3000; // GHS 30.00

  // Generate unique reference
  const reference = `PROJ-${project.id}-${Date.now()}`;

  const componentProps = {
    email,
    amount,
    publicKey,
    text: 'Pay GHS 30 Now',
    reference,
    currency: 'GHS',
    metadata: {
      name,
      projectId: project.id,
      projectTitle: project.title
    },
    onSuccess: (response) => {
      console.log('Payment successful:', response);
      
      // Generate project code
      const projectCode = `THESIS-${project.id}-${response.reference.slice(-6)}`;
      
      onSuccess({
        ...response,
        projectCode
      });
    },
    onClose: () => {
      if (onNotify) onNotify('Payment cancelled. You need to complete payment to start this project.', 'info');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '32px',
        maxWidth: '450px',
        width: '90%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>
            Complete Payment
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#6b7280'
            }}
          >
            ×
          </button>
        </div>

        {/* Project Info */}
        <div style={{
          backgroundColor: '#f5f3ff',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '24px'
        }}>
          <p style={{ color: '#5b21b6', fontWeight: '500', marginBottom: '4px' }}>
            {project?.title}
          </p>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>
            Amount: <span style={{ fontWeight: 'bold', color: '#059669' }}>GHS 30.00</span>
          </p>
        </div>

        {/* Payment Form */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
              Full Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
              Email Address *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px'
              }}
              required
            />
          </div>

          <div style={{
            backgroundColor: '#f9fafb',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '13px',
            color: '#6b7280',
            marginBottom: '24px'
          }}>
            <p>💳 Test Mode: Use card number 4084 0840 8408 4081, any expiry in future, any CVV</p>
          </div>

          {/* Paystack Button */}
          {email && name ? (
            <PaystackButton
              {...componentProps}
              className="paystack-button"
              style={{
                width: '100%',
                backgroundColor: '#7c3aed',
                color: 'white',
                padding: '14px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
            />
          ) : (
            <button
              disabled
              style={{
                width: '100%',
                backgroundColor: '#d1d5db',
                color: '#9ca3af',
                padding: '14px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'not-allowed'
              }}
            >
              Please fill all fields
            </button>
          )}
        </div>

        {/* Payment Info */}
        <div style={{
          borderTop: '1px solid #e5e7eb',
          paddingTop: '16px',
          fontSize: '12px',
          color: '#9ca3af',
          textAlign: 'center'
        }}>
          <p>Secure payment processed by Paystack</p>
          <p style={{ marginTop: '4px' }}>You'll receive a unique project code after successful payment</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;