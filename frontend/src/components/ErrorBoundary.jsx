import React from 'react';
import { captureException } from '../utils/errorMonitoring';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, showDetails: false };
  }

  static getDerivedStateFromError(_error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    
    // Extract crash location from stack
    const crashLocation = this.extractCrashLocation(error?.stack);
    
    console.error("🚨 Uncaught error:", {
      message: error?.message,
      crashLocation,
      componentStack: errorInfo?.componentStack?.slice(0, 500),
      fullStack: error?.stack
    });
    
    // Report to error monitoring with more context
    captureException(error, {
      component: this.props.name || 'Unknown',
      componentStack: errorInfo?.componentStack,
      crashLocation,
    });
  }
  
  extractCrashLocation = (stack) => {
    if (!stack) return 'Unknown location';
    const lines = stack.split('\n');
    // Find first line that points to app code (not node_modules)
    for (const line of lines) {
      if (line.includes('.jsx') || line.includes('.js')) {
        if (!line.includes('node_modules') && !line.includes('chunk-')) {
          return line.trim();
        }
      }
    }
    return lines[1]?.trim() || 'Unknown location';
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '40px 20px',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          color: '#fff',
          textAlign: 'center',
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        }}>
          {/* Icon */}
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
            border: '2px solid rgba(239, 68, 68, 0.3)',
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>

          {/* Message */}
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            marginBottom: '12px',
            background: 'linear-gradient(90deg, #fff, #a5b4fc)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Something went wrong
          </h1>
          
          <p style={{
            fontSize: '16px',
            color: 'rgba(255, 255, 255, 0.7)',
            maxWidth: '400px',
            lineHeight: '1.6',
            marginBottom: '32px',
          }}>
            We hit an unexpected error. Don't worry — your work is saved. 
            Try refreshing the page or click retry below.
          </p>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={this.handleRetry}
              style={{
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#fff',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              Try Again
            </button>
            
            <button
              onClick={this.handleRefresh}
              style={{
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.8)',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseOver={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.15)'}
              onMouseOut={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
            >
              Refresh Page
            </button>
          </div>

          {/* Technical details (collapsible - available in prod for troubleshooting) */}
          {this.state.error && (
            <div style={{ marginTop: '40px', width: '100%', maxWidth: '600px' }}>
              <button
                onClick={() => this.setState(prev => ({ showDetails: !prev.showDetails }))}
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span>📋 Error Details (for support)</span>
                <span>{this.state.showDetails ? '▼' : '▶'}</span>
              </button>
              {this.state.showDetails && (
                <div style={{
                  marginTop: '8px',
                  padding: '16px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '8px',
                  textAlign: 'left',
                }}>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#f87171', 
                    marginBottom: '12px',
                    padding: '8px 12px',
                    background: 'rgba(248, 113, 113, 0.1)',
                    borderRadius: '6px',
                    fontFamily: 'monospace'
                  }}>
                    {this.state.error.toString()}
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>
                    Location: {this.extractCrashLocation(this.state.error?.stack)}
                  </div>
                  <button
                    onClick={() => {
                      const errorText = `Error: ${this.state.error?.message}\nLocation: ${this.extractCrashLocation(this.state.error?.stack)}\nStack: ${this.state.error?.stack?.slice(0, 500)}`;
                      navigator.clipboard?.writeText(errorText);
                      alert('Error details copied to clipboard!');
                    }}
                    style={{
                      padding: '6px 12px',
                      fontSize: '11px',
                      background: 'rgba(99, 102, 241, 0.2)',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      borderRadius: '6px',
                      color: '#a5b4fc',
                      cursor: 'pointer'
                    }}
                  >
                    Copy Error Details
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
