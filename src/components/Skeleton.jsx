import React from 'react';

const shimmerKeyframes = `
@keyframes skeleton-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
`;

const Skeleton = ({ width, height, borderRadius = '8px', style = {} }) => (
  <div
    style={{
      width: width || '100%',
      height: height || '20px',
      borderRadius,
      background: 'linear-gradient(90deg, var(--color-border) 25%, var(--color-hover) 50%, var(--color-border) 75%)',
      backgroundSize: '200% 100%',
      animation: 'skeleton-shimmer 1.5s ease-in-out infinite',
      ...style,
    }}
  />
);

export const PageSkeleton = () => (
  <>
    <style>{shimmerKeyframes}</style>
    <div style={{ padding: '40px', maxWidth: '900px', margin: '0 auto' }}>
      <Skeleton width="180px" height="24px" style={{ marginBottom: '24px' }} />
      <Skeleton width="60%" height="32px" style={{ marginBottom: '16px' }} />
      <Skeleton width="40%" height="16px" style={{ marginBottom: '40px' }} />
      <Skeleton height="16px" style={{ marginBottom: '8px' }} />
      <Skeleton height="16px" width="90%" style={{ marginBottom: '8px' }} />
      <Skeleton height="16px" width="70%" style={{ marginBottom: '8px' }} />
      <Skeleton height="16px" width="85%" style={{ marginBottom: '32px' }} />
      <Skeleton height="120px" borderRadius="12px" style={{ marginBottom: '32px' }} />
      <Skeleton height="16px" width="50%" style={{ marginBottom: '8px' }} />
      <Skeleton height="16px" width="75%" style={{ marginBottom: '8px' }} />
      <Skeleton height="16px" width="60%" />
    </div>
  </>
);

export const CardSkeleton = ({ count = 3 }) => (
  <>
    <style>{shimmerKeyframes}</style>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '32px' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-surface)',
        }}>
          <Skeleton width="40%" height="20px" style={{ marginBottom: '12px' }} />
          <Skeleton height="14px" style={{ marginBottom: '6px' }} />
          <Skeleton height="14px" width="80%" style={{ marginBottom: '6px' }} />
          <Skeleton height="14px" width="60%" />
        </div>
      ))}
    </div>
  </>
);

export const InlineSkeleton = ({ text = 'Loading...' }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '8px 16px',
    color: 'var(--color-text-secondary)',
    fontSize: '14px',
  }}>
    <span style={{
      display: 'inline-block',
      width: '14px',
      height: '14px',
      border: '2px solid var(--color-primary)',
      borderTopColor: 'transparent',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    }} />
    {text}
  </div>
);

export default Skeleton;
