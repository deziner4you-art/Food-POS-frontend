import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './ErrorBoundary.tsx'

import { Toaster } from 'react-hot-toast';

const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const response = await originalFetch(...args);
  if (response.status === 403) {
    const clone = response.clone();
    try {
      const data = await clone.json();
      if (data.message === 'SUBSCRIPTION_SUSPENDED') {
        window.dispatchEvent(new CustomEvent('subscription_suspended', { detail: data.reason }));
      }
    } catch (e) {}
  }
  return response;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Toaster position="bottom-right" />
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
