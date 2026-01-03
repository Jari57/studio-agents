import React, { useState } from 'react';
import { X, Download, Eye } from 'lucide-react';

/**
 * PreviewModal - Display full-size previews of generated assets
 * Supports images, videos, and audio
 */
export function PreviewModal({ 
  isOpen, 
  onClose, 
  mediaUrl, 
  mediaType, 
  title = 'Asset Preview'
}) {
  if (!isOpen || !mediaUrl) return null;

  const handleDownload = () => {
    if (mediaType === 'image') {
      const link = document.createElement('a');
      link.href = mediaUrl.startsWith('data:') ? mediaUrl : `data:image/png;base64,${mediaUrl}`;
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
        background: 'rgba(0, 0, 0, 0.95)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: 'relative',
          maxWidth: '90vw',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(20, 20, 20, 0.8)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          overflow: 'hidden',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            background: 'rgba(0, 0, 0, 0.3)'
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: '1rem',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.9)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            {title} Preview
          </h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleDownload}
              style={{
                background: 'rgba(59, 130, 246, 0.2)',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                color: '#3b82f6',
                padding: '8px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8rem',
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.target.style.background = 'rgba(59, 130, 246, 0.3)';
                e.target.style.borderColor = 'rgba(59, 130, 246, 0.6)';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'rgba(59, 130, 246, 0.2)';
                e.target.style.borderColor = 'rgba(59, 130, 246, 0.4)';
              }}
            >
              <Download size={14} />
              Download
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'rgba(255, 255, 255, 0.7)',
                padding: '8px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                fontSize: '0.8rem',
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                e.target.style.color = 'rgba(255, 255, 255, 0.9)';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                e.target.style.color = 'rgba(255, 255, 255, 0.7)';
              }}
            >
              <X size={16} />
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
            padding: '24px',
            overflow: 'auto',
            minHeight: '400px'
          }}
        >
          {mediaType === 'image' && (
            <img
              src={mediaUrl.startsWith('data:') ? mediaUrl : `data:image/png;base64,${mediaUrl}`}
              alt={title}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
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
                maxHeight: '100%',
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
                gap: '20px'
              }}
            >
              <audio
                src={mediaUrl}
                controls
                autoPlay
                style={{
                  width: '100%',
                  maxWidth: '500px'
                }}
              />
              <p
                style={{
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: '0.9rem',
                  textAlign: 'center'
                }}
              >
                Audio player ready
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            background: 'rgba(0, 0, 0, 0.3)',
            fontSize: '0.75rem',
            color: 'rgba(255, 255, 255, 0.5)',
            textAlign: 'center'
          }}
        >
          Click outside or press Escape to close • Tip: Right-click to save
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
