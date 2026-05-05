import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Write from './pages/Write';
import MyFiles from './pages/MyFiles';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import RefundPolicy from './pages/RefundPolicy';
import HelpSupport from './pages/HelpSupport';
import ProtectedRoute from './components/ProtectedRoute';
import PaymentModal from './components/PaymentModal';
import ErrorBoundary from './components/ErrorBoundary';
import Header from './components/layout/Header';
import HomePage from './components/home/HomePage';
import usePayment from './hooks/usePayment';
import './App.css';
import Settings from './pages/Settings';

function AppContent() {
  const { colors } = useTheme();
  const {
    showPaymentModal, activeProjectForPayment, isPremium, setIsPremium,
    handlePremiumClick, handlePaymentSuccess, handleClosePayment
  } = usePayment();

  return (
    <ErrorBoundary>
      <div style={{
        backgroundColor: colors.background,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <Header onPremiumClick={handlePremiumClick} />
        <div style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/write/:projectId" element={<ProtectedRoute><Write /></ProtectedRoute>} />
            <Route path="/myfiles" element={<ProtectedRoute><MyFiles /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/refund" element={<RefundPolicy />} />
            <Route path="/help" element={<HelpSupport />} />
          </Routes>
        </div>
        {showPaymentModal && activeProjectForPayment && (
          <PaymentModal
            project={activeProjectForPayment}
            onSuccess={handlePaymentSuccess}
            onClose={handleClosePayment}
          />
        )}
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
