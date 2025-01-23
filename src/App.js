import React, { lazy, Suspense, useEffect, useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import { Routes, Route, Navigate } from 'react-router-dom';
import { GlobalStyle } from './components/styles/GlobalStyle';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';
import { auth } from './firebase/firebase';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import EmailVerification from './components/EmailVerification';
import ResetPassword from './components/ResetPassword';
import AccountTerminated from './components/AccountTerminated';
import Subscription from './components/Subscription';
import PDFUpload from './components/PDFUpload';

// Lazy load components
const LandingPage = lazy(() => import('./components/LandingPage'));
const History = lazy(() => import('./components/History'));
const Settings = lazy(() => import('./components/Settings'));

function PrivateRoute({ children }) {
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user);
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, []);

  if (!authChecked) return null;

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function App() {
  useEffect(() => {
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
                <Route path="/dashboard" element={<Dashboard />}>
                  <Route index element={<PDFUpload />} />
                  <Route path="history" element={<History />} />
                  <Route path="subscription" element={<Subscription />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/account-terminated" element={<AccountTerminated />} />
                <Route path="/" element={<Navigate to="/login" replace />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </SubscriptionProvider>
      </AuthProvider>
    </>
  );
}

export default App;
