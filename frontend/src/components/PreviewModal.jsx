import React, { useState } from 'react';
import { X, Download, Copy, Check } from 'lucide-react';
import { formatImageSrc, formatAudioSrc, formatVideoSrc } from '../utils/mediaUtils';

/**
 * PreviewModal - Display full-size previews of generated assets
 * Supports images, videos, audio, and text
 */
export function PreviewModal({ 
  isOpen, 
  onClose, 
  mediaUrl, 
  mediaType, 
  title = 'Asset Preview',
  textContent = null
}) {
  const [copied, setCopied] = useState(false);
  
  if (!isOpen || (!mediaUrl && !textContent)) return null;

  const handleDownload = () => {
    if (mediaType === 'image' && mediaUrl) {
      // Handle URLs, data URLs, and base64
      const imageSrc = mediaUrl.startsWith('http') || mediaUrl.startsWith('data:') 
        ? mediaUrl 
        : `data:image/png;base64,${mediaUrl}`;
      const link = document.createElement('a');
      link.href = imageSrc;
      link.download = `${title}-${Date.now()}.png`;
      link.click();
    } else if (mediaType === 'video' && mediaUrl) {
      const link = document.createElement('a');
      link.href = mediaUrl;
      link.download = `${title}-${Date.now()}.mp4`;
      link.click();
    } else if (mediaType === 'audio' && mediaUrl) {
      const link = document.createElement('a');
      link.href = mediaUrl;
      link.download = `${title}-${Date.now()}.mp3`;
      link.click();
    } else if (mediaType === 'text' && textContent) {
      const blob = new Blob([textContent], { type: 'text/plain' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${title}-${Date.now()}.txt`;
      link.click();
      URL.revokeObjectURL(link.href);
    }
  };

  const handleCopy = async () => {
    if (textContent) {
      await navigator.clipboard.writeText(textContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.98)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        backdropFilter: 'blur(12px)',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: 'relative',
          width: '95vw',
          maxWidth: '1200px',
          height: '90vh',
          maxHeight: '900px',
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(20, 20, 20, 0.95)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          overflow: 'hidden',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 12px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            background: 'rgba(0, 0, 0, 0.3)',
            flexShrink: 0,
            gap: '8px',
            flexWrap: 'wrap'
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: '0.85rem',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.9)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              flex: '1 1 auto',
              minWidth: '80px'
            }}
          >
            {title} Preview
          </h2>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            {mediaType === 'text' && textContent && (
              <button
                onClick={handleCopy}
                style={{
                  background: copied ? 'rgba(34, 197, 94, 0.2)' : 'rgba(139, 92, 246, 0.2)',
                  border: `1px solid ${copied ? 'rgba(34, 197, 94, 0.4)' : 'rgba(139, 92, 246, 0.4)'}`,
                  color: copied ? '#22c55e' : '#8b5cf6',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                  touchAction: 'manipulation',
                  minHeight: '36px',
                  whiteSpace: 'nowrap'
                }}
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            )}
            <button
              onClick={handleDownload}
              style={{
                background: 'rgba(59, 130, 246, 0.2)',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                color: '#3b82f6',
                padding: '6px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem',
                fontWeight: '600',
                transition: 'all 0.2s',
                touchAction: 'manipulation',
                minHeight: '36px',
                whiteSpace: 'nowrap'
              }}
            >
              <Download size={12} />
              Save
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#ef4444',
                padding: '6px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem',
                fontWeight: '600',
                transition: 'all 0.2s',
                touchAction: 'manipulation',
                minHeight: '36px',
                whiteSpace: 'nowrap'
              }}
            >
              <X size={14} />
              Close
            </button>
          </div>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            overflow: 'auto',
            minHeight: '300px'
          }}
        >
          {mediaType === 'image' && mediaUrl && (
            <img
              src={formatImageSrc(mediaUrl)}
              alt={title || 'Preview'}
              style={{
                maxWidth: '100%',
                maxHeight: 'calc(90vh - 120px)',
                borderRadius: '8px',
                objectFit: 'contain',
                animation: 'zoomIn 0.3s ease-out'
              }}
              onError={(e) => {
                console.warn('[PreviewModal] Image failed to load');
                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect fill="%231a1a2e" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23666" font-size="16" font-family="sans-serif"%3EImage could not be loaded%3C/text%3E%3C/svg%3E';
              }}
            />
          )}
          {mediaType === 'video' && mediaUrl && (
            <video
              src={formatVideoSrc(mediaUrl)}
              controls
              autoPlay
              style={{
                maxWidth: '100%',
                maxHeight: 'calc(90vh - 120px)',
                borderRadius: '8px',
                animation: 'zoomIn 0.3s ease-out'
              }}
              onError={(_e) => {
                console.warn('[PreviewModal] Video failed to load');
              }}
            />
          )}
          {mediaType === 'audio' && mediaUrl && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '32px',
                width: '100%',
                maxWidth: '700px',
                padding: '60px 40px',
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))',
                borderRadius: '24px',
                border: '1px solid rgba(139, 92, 246, 0.2)'
              }}
            >
              {/* Large Audio Visualizer Icon */}
              <div style={{
                width: '140px',
                height: '140px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 12px 48px rgba(59, 130, 246, 0.4)',
                animation: 'pulse 2s infinite'
              }}>
                <svg width="70" height="70" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
              </div>

              <h3 style={{
                color: 'white',
                fontSize: '1.5rem',
                fontWeight: '700',
                margin: 0,
                textAlign: 'center'
              }}>
                🎵 Beat Lab Preview
              </h3>

              {/* Large Audio Player */}
              <div style={{
                width: '100%',
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <audio
                  src={formatAudioSrc(mediaUrl)}
                  controls
                  autoPlay
                  style={{
                    width: '100%',
                    height: '54px',
                    borderRadius: '8px'
                  }}
                  onError={(_e) => {
                    console.warn('[PreviewModal] Audio failed to load');
                  }}
                />
              </div>
              
              <p
                style={{
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: '1rem',
                  textAlign: 'center'
                }}
              >
                Use the controls above to play, pause, or adjust volume
              </p>

              {/* Prominent Close Button for Audio */}
              <button
                onClick={onClose}
                style={{
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(220, 38, 38, 0.2))',
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                  borderRadius: '14px',
                  padding: '16px 40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  color: '#ef4444',
                  fontWeight: '700',
                  fontSize: '1.1rem',
                  transition: 'all 0.2s',
                  boxShadow: '0 6px 24px rgba(239, 68, 68, 0.25)',
                  marginTop: '8px',
                  touchAction: 'manipulation',
                  minWidth: '200px'
                }}
              >
                <X size={22} />
                Close Preview
              </button>
            </div>
          )}
          {mediaType === 'text' && textContent && (
            <div
              style={{
                width: '100%',
                maxWidth: '900px',
                height: '100%',
                maxHeight: 'calc(90vh - 140px)',
                overflow: 'auto',
                padding: '20px',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                animation: 'zoomIn 0.3s ease-out'
              }}
            >
              <pre
                style={{
                  margin: 0,
                  fontFamily: 'inherit',
                  fontSize: '1rem',
                  lineHeight: '1.8',
                  color: 'rgba(255, 255, 255, 0.9)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}
              >
                {textContent}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '8px 16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            background: 'rgba(0, 0, 0, 0.3)',
            fontSize: '0.7rem',
            color: 'rgba(255, 255, 255, 0.4)',
            textAlign: 'center',
            flexShrink: 0
          }}
        >
          Click &quot;Close&quot; or tap outside to dismiss
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes zoomIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 8px 32px rgba(59, 130, 246, 0.3);
          }
          50% {
            transform: scale(1.05);
            box-shadow: 0 12px 40px rgba(59, 130, 246, 0.5);
          }
        }
      `}</style>
    </div>
  );
}

export default PreviewModal;
