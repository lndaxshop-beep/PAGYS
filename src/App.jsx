import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Header from './components/layout/Header';
import Toast from './components/Toast';
import HomePage from './components/home/HomePage';
import SplashScreen from './components/SplashScreen';
import AppFeedbackButton from './components/AppFeedbackButton';
import { NavigationLoadingProvider, useNavigationLoading } from './contexts/NavigationLoadingContext';
import { PageSkeleton } from './components/Skeleton';
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
  const location = useLocation();
  const prevPath = useRef(location.pathname);
  const [splashMinTimeElapsed, setSplashMinTimeElapsed] = useState(false);
  const [pageReady, setPageReady] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { isTransitioning: contextTransitioning } = useNavigationLoading();
  const [toast, setToast] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const notify = (message, type) => setToast({ message, type });

  useEffect(() => {
    const timer = setTimeout(() => setSplashMinTimeElapsed(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setPageReady(true);
  }, []);

  useEffect(() => {
    if (!splashMinTimeElapsed) {
      prevPath.current = location.pathname;
      return;
    }
    const prev = prevPath.current;
    prevPath.current = location.pathname;
    const navPages = ['/dashboard', '/myfiles'];
    if (navPages.includes(prev) && navPages.includes(location.pathname) && prev !== location.pathname) {
      setIsTransitioning(true);
      const timer = setTimeout(() => setIsTransitioning(false), 800);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, splashMinTimeElapsed]);

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => { window.removeEventListener('offline', goOffline); window.removeEventListener('online', goOnline); };
  }, []);

  const showSplash = !splashMinTimeElapsed || !pageReady || isTransitioning || contextTransitioning;

  return (
    <>
    <SplashScreen show={showSplash} />
    {!showSplash && (
    <ErrorBoundary>
      <div style={{
        backgroundColor: colors.background,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {isOffline && (
          <div style={{
            backgroundColor: '#92400e', color: '#fde68a', padding: '8px 16px',
            textAlign: 'center', fontSize: '13px', fontWeight: '500',
            borderBottom: '1px solid #b45309'
          }}>
            📡 You're offline — viewing cached content
          </div>
        )}
        <Header />
        <div style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Page><HomePage /></Page>} />
            <Route path="/signup" element={<Page><SignUp /></Page>} />
            <Route path="/login" element={<Page><Login /></Page>} />
            <Route path="/dashboard" element={<Page><ProtectedRoute><Dashboard /></ProtectedRoute></Page>} />
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
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        <AppFeedbackButton />
      </div>
    </ErrorBoundary>
    )}
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <NavigationLoadingProvider>
            <AppContent />
          </NavigationLoadingProvider>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
