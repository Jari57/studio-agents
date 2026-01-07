import React, { useState } from 'react';
import { X, Download, Eye, Copy, Check } from 'lucide-react';

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
    if (mediaType === 'image') {
      // Handle URLs, data URLs, and base64
      const imageSrc = mediaUrl.startsWith('http') || mediaUrl.startsWith('data:') 
        ? mediaUrl 
        : `data:image/png;base64,${mediaUrl}`;
      const link = document.createElement('a');
      link.href = imageSrc;
      link.download = `${title}-${Date.now()}.png`;
      link.click();
    } else if (mediaType === 'video') {
      const link = document.createElement('a');
      link.href = mediaUrl;
      link.download = `${title}-${Date.now()}.mp4`;
      link.click();
    } else if (mediaType === 'audio') {
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
            padding: '12px 16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            background: 'rgba(0, 0, 0, 0.3)',
            flexShrink: 0
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: '0.9rem',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.9)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            {title} Preview
          </h2>
          <div style={{ display: 'flex', gap: '6px' }}>
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
                  touchAction: 'manipulation'
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
                touchAction: 'manipulation'
              }}
            >
              <Download size={12} />
              Save
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'rgba(255, 255, 255, 0.7)',
                padding: '6px 8px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                fontSize: '0.75rem',
                fontWeight: '600',
                transition: 'all 0.2s',
                touchAction: 'manipulation'
              }}
            >
              <X size={14} />
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
          {mediaType === 'image' && (
            <img
              src={mediaUrl.startsWith('http') || mediaUrl.startsWith('data:') ? mediaUrl : `data:image/png;base64,${mediaUrl}`}
              alt={title}
              style={{
                maxWidth: '100%',
                maxHeight: 'calc(90vh - 120px)',
                borderRadius: '8px',
                objectFit: 'contain',
                animation: 'zoomIn 0.3s ease-out'
              }}
            />
          )}
          {mediaType === 'video' && (
            <video
              src={mediaUrl}
              controls
              autoPlay
              style={{
                maxWidth: '100%',
                maxHeight: 'calc(90vh - 120px)',
                borderRadius: '8px',
                animation: 'zoomIn 0.3s ease-out'
              }}
            />
          )}
          {mediaType === 'audio' && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '20px',
                width: '100%',
                maxWidth: '600px'
              }}
            >
              <audio
                src={mediaUrl}
                controls
                autoPlay
                style={{
                  width: '100%'
                }}
              />
              <p
                style={{
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: '0.85rem',
                  textAlign: 'center'
                }}
              >
                Audio player ready
              </p>
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
          Tap outside to close
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
      `}</style>
    </div>
  );
}

export default PreviewModal;
