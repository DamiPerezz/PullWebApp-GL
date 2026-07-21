import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ErrorBoundary } from './components/error-boundary/error-boundary';
import './index.css';

// Initialize i18n
import './i18n';

// PERFORMANCE: Initialize Web Vitals monitoring
import { initWebVitals } from './utils/webVitals';

// PERFORMANCE: Prefetch common routes after initial load
import { prefetchCommonRoutes } from './utils/prefetch';

// Initialize performance monitoring
if (typeof window !== 'undefined') {
  // Track Web Vitals after first paint
  initWebVitals();

  // Prefetch common routes when browser is idle
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      prefetchCommonRoutes();
    }, { timeout: 3000 });
  } else {
    setTimeout(prefetchCommonRoutes, 2000);
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
