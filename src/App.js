import React, { lazy, Suspense, useEffect, useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import { Routes, Route, Navigate } from 'react-router-dom';
import { GlobalStyle } from './components/styles/GlobalStyle';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';
import { auth } from './firebase/firebase';

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
                <Route 
                  path="/dashboard/*" 
                  element={
                    <PrivateRoute>
                      <Dashboard />
                    </PrivateRoute>
                  } 
                />
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
