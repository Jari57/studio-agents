import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
// import './index.css'  <-- REMOVED: If this file is missing, the app crashes.

console.log("🟢 Bridge Active: Main.jsx is loading..."); // Debug line to verify the file loads

// This line finds the <div id="root"> in your index.html
// and injects the <App /> component into it.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
