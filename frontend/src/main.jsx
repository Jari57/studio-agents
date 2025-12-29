import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'
import './App.css'
import './design-system.css'

console.log("Main.jsx: Starting execution...");

try {
  const rootElement = document.getElementById('root');
  console.log("Main.jsx: Root element found:", rootElement);

  if (!rootElement) {
    console.error("Main.jsx: FATAL - Root element not found!");
    document.body.innerHTML = '<h1 style="color:red">FATAL ERROR: Root element not found</h1>';
  } else {
    const root = ReactDOM.createRoot(rootElement);
    console.log("Main.jsx: Root created, rendering App...");
    
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>,
    );
    console.log("Main.jsx: Render called.");
  }
} catch (err) {
  console.error("Main.jsx: FATAL EXCEPTION:", err);
  document.body.innerHTML = `<h1 style="color:red">FATAL EXCEPTION: ${err.message}</h1>`;
}

