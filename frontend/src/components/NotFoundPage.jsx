import React from 'react';
import { Home, ArrowLeft, Search, Sparkles } from 'lucide-react';

/**
 * Custom 404 Page - User-friendly error page
 */
function NotFoundPage({ onNavigateHome, onNavigateBack }) {
  return (
    <div className="not-found-page" style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      textAlign: 'center',
      background: 'linear-gradient(180deg, var(--color-bg-primary) 0%, #0a0a1a 100%)'
    }}>
      {/* Animated Icon */}
      <div style={{
        width: '120px',
        height: '120px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '32px',
        animation: 'pulse 2s ease-in-out infinite'
      }}>
        <Search size={48} style={{ color: 'var(--color-purple)', opacity: 0.8 }} />
      </div>

      {/* Error Code */}
      <h1 style={{
        fontSize: '6rem',
        fontWeight: '800',
        margin: '0 0 8px 0',
        background: 'linear-gradient(135deg, var(--color-purple) 0%, var(--color-cyan) 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        lineHeight: 1
      }}>
        404
      </h1>

      {/* Message */}
      <h2 style={{
        fontSize: '1.5rem',
        fontWeight: '600',
        margin: '0 0 16px 0',
        color: 'var(--text-primary)'
      }}>
        Page Not Found
      </h2>

      <p style={{
        color: 'var(--text-secondary)',
        fontSize: '1rem',
        maxWidth: '400px',
        marginBottom: '32px',
        lineHeight: 1.6
      }}>
        Looks like this page took an unexpected beat break. 
        Let's get you back to creating.
      </p>

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: '16px',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        <button
          onClick={onNavigateBack || (() => window.history.back())}
          className="cta-button-secondary touch-feedback"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '14px 24px'
          }}
        >
          <ArrowLeft size={18} />
          Go Back
        </button>
        
        <button
          onClick={onNavigateHome || (() => window.location.href = '/')}
          className="cta-button-premium touch-feedback"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '14px 24px'
          }}
        >
          <Home size={18} />
          Back to Studio
        </button>
      </div>

      {/* Fun suggestion */}
      <div style={{
        marginTop: '48px',
        padding: '20px 28px',
        background: 'rgba(139, 92, 246, 0.1)',
        borderRadius: '16px',
        border: '1px solid rgba(139, 92, 246, 0.2)',
        maxWidth: '400px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '8px',
          color: 'var(--color-purple)'
        }}>
          <Sparkles size={16} />
          <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>While you're here...</span>
        </div>
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '0.85rem',
          margin: 0
        }}>
          Try asking Ghostwriter to write a verse about getting lost. 
          Sometimes the best bars come from unexpected places.
        </p>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}

export default NotFoundPage;
