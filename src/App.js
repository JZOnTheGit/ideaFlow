import React, { lazy, Suspense, useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import { Routes, Route, Navigate } from 'react-router-dom';
import { GlobalStyle } from './components/styles/GlobalStyle';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';

// Lazy load components
const LandingPage = lazy(() => import('./components/LandingPage'));
const Auth = lazy(() => import('./components/Auth'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const EmailVerification = lazy(() => import('./components/EmailVerification'));
const PDFUpload = lazy(() => import('./components/PDFUpload'));
const Settings = lazy(() => import('./components/Settings'));
const History = lazy(() => import('./components/History'));
const ResetPassword = lazy(() => import('./components/ResetPassword'));
const AccountTerminated = lazy(() => import('./components/AccountTerminated'));
const Subscription = lazy(() => import('./components/Subscription'));

function App() {
  useEffect(() => {
    // Remove any existing CSP meta tags first
    const existingCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (existingCSP) {
      existingCSP.remove();
    }

    // Set CSP
    if (process.env.REACT_APP_CONTENT_SECURITY_POLICY) {
      console.log('Setting CSP:', process.env.REACT_APP_CONTENT_SECURITY_POLICY);
      const meta = document.createElement('meta');
      meta.setAttribute('http-equiv', 'Content-Security-Policy');
      meta.setAttribute('content', process.env.REACT_APP_CONTENT_SECURITY_POLICY);
      document.head.appendChild(meta);
    }
  }, []);

  return (
    <>
      <GlobalStyle />
      <AuthProvider>
        <SubscriptionProvider>
          <ErrorBoundary>
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Auth />} />
                <Route path="/signup" element={<Auth isSignUp />} />
                <Route path="/verify-email" element={<EmailVerification />} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>}>
                  <Route index element={<Navigate to="upload" replace />} />
                  <Route path="upload" element={<PDFUpload />} />
                  <Route path="history" element={<History />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="subscription" element={<Subscription />} />
                </Route>
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/account-terminated" element={<AccountTerminated />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </SubscriptionProvider>
      </AuthProvider>
    </>
  );
}

export default App;
