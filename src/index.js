import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import App from './App';
import './index.css';

// Suppress Stripe frame access errors
const originalError = console.error;
console.error = (...args) => {
  if (args[0]?.includes?.('Failed to read a named property \'href\' from \'Location\'')) {
    return;
  }
  originalError.apply(console, args);
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<div>Loading...</div>}>
          <App />
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
