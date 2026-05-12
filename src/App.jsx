import React, { useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Header from './components/layout/Header';
import Toast from './components/Toast';
import ConfirmModal from './components/ConfirmModal';
import PremiumModal from './components/PremiumModal';
import HomePage from './components/home/HomePage';
import { PageSkeleton } from './components/Skeleton';
import usePayment from './hooks/usePayment';
import './App.css';

const SignUp = lazy(() => import('./pages/SignUp'));
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Write = lazy(() => import('./pages/Write'));
const MyFiles = lazy(() => import('./pages/MyFiles'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const RefundPolicy = lazy(() => import('./pages/RefundPolicy'));
const HelpSupport = lazy(() => import('./pages/HelpSupport'));
const Settings = lazy(() => import('./pages/Settings'));
const MergeDocument = lazy(() => import('./pages/MergeDocument'));

const Page = ({ children }) => (
  <ErrorBoundary>
    <Suspense fallback={<PageSkeleton />}>
      {children}
    </Suspense>
  </ErrorBoundary>
);

function AppContent() {
  const { colors } = useTheme();
  const [toast, setToast] = useState(null);
  const notify = (message, type) => setToast({ message, type });
  const {
    showPremiumConfirm, showPremiumModal, isPremium,
    handlePremiumClick,
    handleConfirmPremium,
    handleCancelPremium,
    handleClosePremiumModal,
  } = usePayment(notify);

  return (
    <ErrorBoundary>
      <div style={{
        backgroundColor: colors.background,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <Header onPremiumClick={handlePremiumClick} isPremium={isPremium} />
        <div style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Page><HomePage /></Page>} />
            <Route path="/signup" element={<Page><SignUp /></Page>} />
            <Route path="/login" element={<Page><Login /></Page>} />
            <Route path="/dashboard" element={<Page><ProtectedRoute><Dashboard onPremiumClick={handlePremiumClick} isPremium={isPremium} /></ProtectedRoute></Page>} />
            <Route path="/write/:projectId" element={<Page><ProtectedRoute><Write /></ProtectedRoute></Page>} />
            <Route path="/myfiles" element={<Page><ProtectedRoute><MyFiles /></ProtectedRoute></Page>} />
            <Route path="/settings" element={<Page><ProtectedRoute><Settings /></ProtectedRoute></Page>} />
            <Route path="/privacy" element={<Page><PrivacyPolicy /></Page>} />
            <Route path="/terms" element={<Page><TermsOfService /></Page>} />
            <Route path="/refund" element={<Page><RefundPolicy /></Page>} />
            <Route path="/help" element={<Page><HelpSupport /></Page>} />
            <Route path="/merge/:projectId" element={<Page><ProtectedRoute><MergeDocument /></ProtectedRoute></Page>} />
          </Routes>
        </div>
        {showPremiumModal && <PremiumModal onClose={handleClosePremiumModal} />}
        {showPremiumConfirm && (
          <ConfirmModal
            title="💎 Upgrade to Premium"
            message="Premium Benefits:\n\n✨ Humanise up to 4 times per subsection\n✏️ Feedback up to 4 times per subsection\n\nThis is a one-time upgrade for your current project."
            confirmText="Upgrade Now"
            onConfirm={handleConfirmPremium}
            onCancel={handleCancelPremium}
          />
        )}
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}

export default App;
