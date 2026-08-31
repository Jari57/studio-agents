import React from 'react';
import { toast } from 'react-hot-toast';
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
    
    // Auto-refresh on ChunkLoadError/Dynamic Import failure
    // This happens when a new version is deployed and the user has an old one open
    const isChunkError = /Loading chunk|Failed to fetch dynamically imported module/.test(error?.message);
    if (isChunkError) {
      console.warn("🔄 Version mismatch (ChunkLoadError) detected. Refreshing for latest version...");
      
      // Use sessionStorage to prevent infinite reload loops
      const reloadCount = parseInt(sessionStorage.getItem('chunk_reload_count') || '0');
      const lastReload = sessionStorage.getItem('last_version_reload');
      const now = Date.now();
      
      // Give up after 3 reload attempts — show error screen instead of looping
      if (reloadCount >= 3) {
        console.warn('\uD83D\uDED1 Chunk reload failed 3 times. Showing error screen.');
        return;
      }
      
      const backoff = Math.min(5000 * Math.pow(2, reloadCount), 30000);
      if (!lastReload || (now - parseInt(lastReload)) > backoff) {
        sessionStorage.setItem('chunk_reload_count', String(reloadCount + 1));
        sessionStorage.setItem('last_version_reload', now.toString());
        window.location.reload();
        return;
      }
    }
    
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
    // Clear chunk reload counter on manual retry so user gets fresh attempts
    sessionStorage.removeItem('chunk_reload_count');
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
          background: "linear-gradient(135deg, var(--studio-surface) 0%, var(--studio-surface) 100%)",
          color: "var(--studio-inverse)",
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
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--studio-danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>

          {/* Message */}
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            marginBottom: '12px',
            background: "linear-gradient(90deg, #ff4d4d, var(--studio-warning))",
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            System Maintenance
          </h1>
          
          <p style={{
            fontSize: '16px',
            color: "var(--studio-muted)",
            maxWidth: '430px',
            lineHeight: '1.6',
            marginBottom: '32px',
          }}>
            The Studio is currently undergoing critical updates or experiencing connectivity issues. 
            We've saved your progress. Please try refreshing in a few moments.
          </p>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={this.handleRetry}
              style={{
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '600',
                color: "var(--studio-inverse)",
                background: "linear-gradient(135deg, var(--studio-blue) 0%, var(--studio-accent) 100%)",
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = "0 4px 12px rgba(61,100,114, 0.4)";
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
                color: "var(--studio-ink)",
                background: "rgba(var(--studio-ink-rgb), 0.1)",
                border: "1px solid rgba(var(--studio-ink-rgb), 0.16)",
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseOver={(e) => e.target.style.background = "rgba(var(--studio-ink-rgb), 0.15)"}
              onMouseOut={(e) => e.target.style.background = "rgba(var(--studio-ink-rgb), 0.1)"}
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
                  background: "var(--studio-surface-alt)",
                  border: "1px solid rgba(var(--studio-ink-rgb), 0.1)",
                  borderRadius: '8px',
                  padding: '10px 16px',
                  color: "var(--studio-muted)",
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
                  background: "var(--studio-surface-alt)",
                  borderRadius: '8px',
                  textAlign: 'left',
                }}>
                  <div style={{ 
                    fontSize: '12px', 
                    color: "var(--studio-danger)",
                    marginBottom: '12px',
                    padding: '8px 12px',
                    background: 'rgba(248, 113, 113, 0.1)',
                    borderRadius: '6px',
                    fontFamily: 'monospace'
                  }}>
                    {this.state.error.toString()}
                  </div>
                  <div style={{ fontSize: '11px', color: "var(--studio-muted)", marginBottom: '8px' }}>
                    Location: {this.extractCrashLocation(this.state.error?.stack)}
                  </div>
                  <button
                    onClick={() => {
                      const errorText = `Error: ${this.state.error?.message}\nLocation: ${this.extractCrashLocation(this.state.error?.stack)}\nStack: ${this.state.error?.stack?.slice(0, 500)}`;
                      navigator.clipboard?.writeText(errorText);
                      toast.success('Error details copied to clipboard!');
                    }}
                    style={{
                      padding: '6px 12px',
                      fontSize: '11px',
                      background: "rgba(61,100,114, 0.2)",
                      border: "1px solid rgba(61,100,114, 0.3)",
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
