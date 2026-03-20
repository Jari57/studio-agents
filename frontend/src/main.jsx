import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary'
import { initAnalytics } from './utils/analytics'
import { initErrorMonitoring } from './utils/errorMonitoring'
import './index.css'
import './App.css'
import './design-system.css'

// Initialize Google Analytics
initAnalytics();

// Initialize Error Monitoring (Sentry when configured)
initErrorMonitoring();

try {
  const rootElement = document.getElementById('root');

  if (!rootElement) {
    console.error("Main.jsx: FATAL - Root element not found!");
    document.body.innerHTML = '<h1 style="color:red">FATAL ERROR: Root element not found</h1>';
  } else {
    const root = ReactDOM.createRoot(rootElement);
    
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>,
    );
  }
} catch (err) {
  console.error("Main.jsx: FATAL EXCEPTION:", err);
  document.body.innerHTML = `<h1 style="color:red">FATAL EXCEPTION: ${err.message}</h1>`;
}

