/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic, Music, Image as ImageIcon, Video as VideoIcon, Trash2, Play, Pause,
  Upload, Download, Eye, Search, Filter, RotateCw, Volume2, X, Check,
  ChevronDown, Loader2, AlertCircle, Layers, Plus
} from 'lucide-react';
import { BACKEND_URL } from '../constants';

/**
 * MediaLibrary — Unified asset manager for voices, audio, images & video.
 * Supports inline preview/playback, upload, delete, and voice sampling.
 */
export default function MediaLibrary({ user, authToken, isMobile, toast }) {
  // --- State ---
  const [activeCategory, setActiveCategory] = useState('voices');
  const [assets, setAssets] = useState([]);
  const [voices, setVoices] = useState([]); // cloned voices from Firestore
  const [elVoices, setElVoices] = useState([]); // ElevenLabs professional voices
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [playingId, setPlayingId] = useState(null);
  const [previewItem, setPreviewItem] = useState(null); // full-screen preview
  const [voicePreviewLoading, setVoicePreviewLoading] = useState(null); // voiceId loading
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [uploadingType, setUploadingType] = useState(null);
  const [cloneModalOpen, setCloneModalOpen] = useState(false);
  const [cloneName, setCloneName] = useState('');
  const [cloneSamples, setCloneSamples] = useState([]);
  const [cloning, setCloning] = useState(false);
  const audioRef = useRef(null);
  const fileInputRef = useRef(null);
  const cloneInputRef = useRef(null);

  const categories = [
    { id: 'voices', icon: Mic, label: 'Voices', color: '#f472b6' },
    { id: 'audio', icon: Music, label: 'Audio', color: '#8b5cf6' },
    { id: 'images', icon: ImageIcon, label: 'Images', color: '#06b6d4' },
    { id: 'videos', icon: VideoIcon, label: 'Videos', color: '#f59e0b' },
  ];

  // --- Fetch assets on category change ---
  useEffect(() => {
    if (!authToken) return;
    if (activeCategory === 'voices') {
      fetchVoices();
    } else {
      fetchAssets(activeCategory);
    }
  }, [activeCategory, authToken]);

  const fetchAssets = async (type) => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/user/assets?assetType=${type}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAssets(data);
      } else {
        setAssets([]);
      }
    } catch (err) {
      console.error('Failed to load assets:', err);
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchVoices = async () => {
    setLoading(true);
    try {
      // Fetch ElevenLabs voices (includes cloned ones)
      const res = await fetch(`${BACKEND_URL}/api/v2/voices`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Separate cloned from professional
        const cloned = data.filter(v => v.category === 'cloned');
        const professional = data.filter(v => v.category !== 'cloned');
        setVoices(cloned);
        setElVoices(professional);
      }
    } catch (err) {
      console.error('Failed to load voices:', err);
    } finally {
      setLoading(false);
    }
  };

  // --- Voice preview: generate TTS sample ---
  const handleVoicePreview = useCallback(async (voiceId, voiceName) => {
    // If already playing this voice, stop
    if (playingId === voiceId) {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
      setPlayingId(null);
      return;
    }

    setVoicePreviewLoading(voiceId);
    try {
      const res = await fetch(`${BACKEND_URL}/api/voice-preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          voiceId,
          text: `Hey, this is ${voiceName || 'your cloned voice'}. Ready to make some hits in the studio.`
        })
      });

      if (!res.ok) throw new Error('Preview failed');

      const data = await res.json();
      if (data.audioUrl) {
        if (audioRef.current) { audioRef.current.pause(); }
        const audio = new Audio(data.audioUrl);
        audioRef.current = audio;
        setPlayingId(voiceId);
        audio.onended = () => setPlayingId(null);
        audio.onerror = () => { setPlayingId(null); toast?.error('Audio playback failed'); };
        audio.play();
      }
    } catch (err) {
      console.error('Voice preview error:', err);
      toast?.error('Could not preview voice');
    } finally {
      setVoicePreviewLoading(null);
    }
  }, [authToken, playingId, toast]);

  // --- Delete asset ---
  const handleDeleteAsset = async (assetId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/user/assets/${assetId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        setAssets(prev => prev.filter(a => a.id !== assetId));
        toast?.success('Asset deleted');
      } else {
        toast?.error('Failed to delete asset');
      }
    } catch (err) {
      toast?.error('Delete failed');
    }
    setDeleteConfirm(null);
  };

  // --- Clone voice from audio samples ---
  const handleCloneVoice = async () => {
    if (!cloneSamples.length) { toast?.error('Upload at least 1 audio sample'); return; }
    setCloning(true);
    try {
      // Convert files to base64
      const samplePromises = cloneSamples.map(file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      }));
      const base64Samples = await Promise.all(samplePromises);

      const res = await fetch(`${BACKEND_URL}/api/voice-clone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          samples: base64Samples,
          voiceName: cloneName || 'My Cloned Voice'
        })
      });

      if (res.ok) {
        toast?.success('Voice cloned successfully!');
        setCloneModalOpen(false);
        setCloneName('');
        setCloneSamples([]);
        fetchVoices();
      } else {
        const data = await res.json().catch(() => ({}));
        toast?.error(data.error || 'Voice cloning failed');
      }
    } catch (err) {
      console.error('Clone error:', err);
      toast?.error('Voice cloning failed');
    } finally {
      setCloning(false);
    }
  };

  // --- Delete voice ---
  const handleDeleteVoice = async (voiceId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/v2/voices/${voiceId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        setVoices(prev => prev.filter(v => v.voice_id !== voiceId));
        toast?.success('Voice deleted');
      } else {
        toast?.error('Failed to delete voice');
      }
    } catch (err) {
      toast?.error('Delete failed');
    }
    setDeleteConfirm(null);
  };

  // --- Upload handler ---
  const handleUpload = () => {
    const accept = activeCategory === 'audio' ? 'audio/*'
      : activeCategory === 'images' ? 'image/*'
      : activeCategory === 'videos' ? 'video/*'
      : 'audio/*';
    if (fileInputRef.current) {
      fileInputRef.current.accept = accept;
      fileInputRef.current.click();
    }
  };

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      toast?.error('File too large (max 100MB)');
      return;
    }

    setUploadingType(activeCategory);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result;
        const res = await fetch(`${BACKEND_URL}/api/upload-asset`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`
          },
          body: JSON.stringify({
            data: base64,
            fileName: file.name,
            mimeType: file.type,
            assetType: activeCategory === 'images' ? 'image' : activeCategory === 'videos' ? 'video' : 'audio'
          })
        });
        if (res.ok) {
          toast?.success(`${file.name} uploaded`);
          // Refresh the list
          fetchAssets(activeCategory);
        } else {
          toast?.error('Upload failed');
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      toast?.error('Upload error');
    } finally {
      setUploadingType(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // --- Play/pause audio asset inline ---
  const togglePlayAsset = (asset) => {
    if (playingId === asset.id) {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
      setPlayingId(null);
      return;
    }
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(asset.url);
    audioRef.current = audio;
    setPlayingId(asset.id);
    audio.onended = () => setPlayingId(null);
    audio.play();
  };

  // --- Filter assets by search ---
  const filteredAssets = assets.filter(a =>
    !searchQuery || (a.fileName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredVoices = [...voices, ...elVoices].filter(v =>
    !searchQuery || (v.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- Cleanup audio on unmount ---
  useEffect(() => {
    return () => { if (audioRef.current) audioRef.current.pause(); };
  }, []);

  // ===================== RENDER =====================

  const cardStyle = {
    background: 'var(--card-bg, rgba(30,30,40,0.9))',
    border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
    borderRadius: '14px',
    overflow: 'hidden',
    transition: 'all 0.2s ease',
    position: 'relative',
  };

  const renderVoiceCard = (voice, isCloned) => {
    const id = voice.voice_id || voice.voiceId;
    const name = voice.name || 'Unnamed Voice';
    const isPlaying = playingId === id;
    const isLoading = voicePreviewLoading === id;

    return (
      <div key={id} style={{
        ...cardStyle,
        borderColor: isCloned ? 'rgba(244, 114, 182, 0.3)' : 'var(--border-color)',
      }}>
        {/* Voice header */}
        <div style={{
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: isCloned ? 'rgba(244, 114, 182, 0.15)' : 'rgba(139, 92, 246, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Mic size={22} color={isCloned ? '#f472b6' : '#8b5cf6'} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '0.95rem',
              fontWeight: '600',
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {name}
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              display: 'flex',
              gap: '8px',
              marginTop: '2px'
            }}>
              <span style={{
                background: isCloned ? 'rgba(244, 114, 182, 0.15)' : 'rgba(139, 92, 246, 0.15)',
                color: isCloned ? '#f472b6' : '#8b5cf6',
                padding: '1px 8px',
                borderRadius: '6px',
                fontSize: '0.7rem',
                fontWeight: '600'
              }}>
                {isCloned ? 'Cloned' : 'Professional'}
              </span>
              {voice.labels?.accent && <span>{voice.labels.accent}</span>}
              {voice.labels?.gender && <span>{voice.labels.gender}</span>}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{
          padding: '8px 16px 12px',
          display: 'flex',
          gap: '8px'
        }}>
          {/* Preview / Sample button */}
          <button
            onClick={() => handleVoicePreview(id, name)}
            disabled={isLoading}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '10px',
              borderRadius: '10px',
              border: '1px solid',
              borderColor: isPlaying ? 'rgba(34, 197, 94, 0.4)' : 'rgba(139, 92, 246, 0.3)',
              background: isPlaying ? 'rgba(34, 197, 94, 0.1)' : 'rgba(139, 92, 246, 0.08)',
              color: isPlaying ? '#22c55e' : '#a78bfa',
              cursor: isLoading ? 'wait' : 'pointer',
              fontSize: '0.8rem',
              fontWeight: '600',
              transition: 'all 0.2s'
            }}
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : isPlaying ? (
              <Pause size={16} />
            ) : (
              <Play size={16} />
            )}
            {isLoading ? 'Generating...' : isPlaying ? 'Playing' : 'Sample'}
          </button>

          {/* Delete button (cloned voices only) */}
          {isCloned && (
            <button
              onClick={() => setDeleteConfirm({ type: 'voice', id, name })}
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                background: 'rgba(239, 68, 68, 0.08)',
                color: '#ef4444',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderAssetCard = (asset) => {
    const isAudio = asset.assetType === 'audio' || asset.mimeType?.startsWith('audio');
    const isImage = asset.assetType === 'image' || asset.mimeType?.startsWith('image');
    const isVideo = asset.assetType === 'video' || asset.mimeType?.startsWith('video');
    const isPlaying = playingId === asset.id;

    return (
      <div key={asset.id} style={cardStyle}>
        {/* Thumbnail / Preview area */}
        <div
          onClick={() => setPreviewItem(asset)}
          style={{
            height: isImage ? '160px' : isVideo ? '140px' : '80px',
            background: 'rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          {isImage && asset.url ? (
            <img
              src={asset.url}
              alt={asset.fileName}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              loading="lazy"
            />
          ) : isVideo && asset.url ? (
            <video
              src={asset.url}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              muted
              preload="metadata"
            />
          ) : isAudio ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Music size={28} color="#8b5cf6" />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                {formatFileSize(asset.size)}
              </span>
            </div>
          ) : (
            <Layers size={28} color="var(--text-secondary)" />
          )}

          {/* Play overlay for video */}
          {isVideo && (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.3)'
            }}>
              <Play size={32} color="white" fill="white" />
            </div>
          )}
        </div>

        {/* Info row */}
        <div style={{ padding: '10px 12px' }}>
          <div style={{
            fontSize: '0.8rem',
            fontWeight: '600',
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            marginBottom: '4px'
          }}>
            {asset.fileName || 'Untitled'}
          </div>
          <div style={{
            fontSize: '0.7rem',
            color: 'var(--text-secondary)',
            display: 'flex',
            justifyContent: 'space-between'
          }}>
            <span>{formatFileSize(asset.size)}</span>
            <span>{formatDate(asset.createdAt)}</span>
          </div>
        </div>

        {/* Action row */}
        <div style={{
          padding: '6px 12px 10px',
          display: 'flex',
          gap: '6px'
        }}>
          {isAudio && (
            <button
              onClick={() => togglePlayAsset(asset)}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                padding: '8px',
                borderRadius: '8px',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                background: isPlaying ? 'rgba(34, 197, 94, 0.1)' : 'rgba(139, 92, 246, 0.08)',
                color: isPlaying ? '#22c55e' : '#a78bfa',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: '600'
              }}
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              {isPlaying ? 'Stop' : 'Play'}
            </button>
          )}
          <button
            onClick={() => setPreviewItem(asset)}
            style={{
              flex: isAudio ? undefined : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              padding: '8px',
              borderRadius: '8px',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              background: 'rgba(6, 182, 212, 0.08)',
              color: '#06b6d4',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: '600'
            }}
          >
            <Eye size={14} />
            Preview
          </button>
          <button
            onClick={() => setDeleteConfirm({ type: 'asset', id: asset.id, name: asset.fileName })}
            style={{
              padding: '8px 10px',
              borderRadius: '8px',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              background: 'rgba(239, 68, 68, 0.08)',
              color: '#ef4444',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    );
  };

  // Full-screen preview overlay
  const renderPreviewOverlay = () => {
    if (!previewItem) return null;
    const item = previewItem;
    const isAudio = item.assetType === 'audio' || item.mimeType?.startsWith('audio');
    const isImage = item.assetType === 'image' || item.mimeType?.startsWith('image');
    const isVideo = item.assetType === 'video' || item.mimeType?.startsWith('video');

    return (
      <div
        onClick={() => setPreviewItem(null)}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.95)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10003,
          backdropFilter: 'blur(12px)',
          padding: '20px'
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: '900px',
            width: '100%',
            maxHeight: '90vh',
            background: 'rgba(20,20,25,0.98)',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.1)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 18px',
            borderBottom: '1px solid rgba(255,255,255,0.06)'
          }}>
            <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>
              {item.fileName || 'Preview'}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              {item.url && (
                <a
                  href={item.url}
                  download={item.fileName}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(59, 130, 246, 0.4)',
                    background: 'rgba(59, 130, 246, 0.1)',
                    color: '#3b82f6',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    textDecoration: 'none'
                  }}
                >
                  <Download size={14} /> Download
                </a>
              )}
              <button
                onClick={() => setPreviewItem(null)}
                style={{
                  padding: '6px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            overflow: 'auto'
          }}>
            {isImage && (
              <img
                src={item.url}
                alt={item.fileName}
                style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: '8px' }}
              />
            )}
            {isVideo && (
              <video
                src={item.url}
                controls
                autoPlay
                style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: '8px' }}
              />
            )}
            {isAudio && (
              <div style={{ width: '100%', textAlign: 'center' }}>
                <Music size={48} color="#8b5cf6" style={{ marginBottom: '16px' }} />
                <audio src={item.url} controls style={{ width: '100%', maxWidth: '500px' }} />
                <div style={{ marginTop: '12px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  {item.fileName} {item.size ? `• ${formatFileSize(item.size)}` : ''}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Delete confirmation modal
  const renderDeleteConfirm = () => {
    if (!deleteConfirm) return null;
    return (
      <div
        onClick={() => setDeleteConfirm(null)}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10004,
          padding: '20px'
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'var(--card-bg)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '400px',
            width: '100%',
            textAlign: 'center'
          }}
        >
          <AlertCircle size={40} color="#ef4444" style={{ marginBottom: '12px' }} />
          <h3 style={{ marginBottom: '8px' }}>Delete {deleteConfirm.type === 'voice' ? 'Voice' : 'Asset'}?</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
            "{deleteConfirm.name}" will be permanently deleted. This cannot be undone.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={() => setDeleteConfirm(null)}
              style={{
                padding: '10px 24px',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                background: 'transparent',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (deleteConfirm.type === 'voice') handleDeleteVoice(deleteConfirm.id);
                else handleDeleteAsset(deleteConfirm.id);
              }}
              style={{
                padding: '10px 24px',
                borderRadius: '10px',
                border: '1px solid rgba(239, 68, 68, 0.5)',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '600'
              }}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Empty state
  const renderEmpty = () => (
    <div style={{
      textAlign: 'center',
      padding: '60px 20px',
      color: 'var(--text-secondary)'
    }}>
      {activeCategory === 'voices' ? (
        <>
          <Mic size={48} style={{ marginBottom: '16px', opacity: 0.4 }} />
          <h3 style={{ marginBottom: '8px' }}>No Cloned Voices Yet</h3>
          <p style={{ fontSize: '0.85rem', marginBottom: '16px' }}>Upload an audio sample of your voice to create a clone.</p>
          <button
            onClick={() => setCloneModalOpen(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '12px 24px', borderRadius: '12px',
              border: '1px solid rgba(244, 114, 182, 0.4)',
              background: 'rgba(244, 114, 182, 0.12)',
              color: '#f472b6', cursor: 'pointer',
              fontSize: '0.9rem', fontWeight: '600'
            }}
          >
            <Plus size={18} /> Clone My Voice
          </button>
        </>
      ) : (
        <>
          {activeCategory === 'audio' && <Music size={48} style={{ marginBottom: '16px', opacity: 0.4 }} />}
          {activeCategory === 'images' && <ImageIcon size={48} style={{ marginBottom: '16px', opacity: 0.4 }} />}
          {activeCategory === 'videos' && <VideoIcon size={48} style={{ marginBottom: '16px', opacity: 0.4 }} />}
          <h3 style={{ marginBottom: '8px' }}>No {activeCategory} files</h3>
          <p style={{ fontSize: '0.85rem' }}>Upload {activeCategory} files or generate them in the studio.</p>
        </>
      )}
    </div>
  );

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <Mic size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
        <h3>Sign in to manage your media</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          Your voices, audio, images and videos are stored securely in the cloud.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fadeInUp" style={{ padding: isMobile ? '8px' : '20px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', margin: 0 }}>Media Library</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0 0' }}>
            Manage your voices, reference materials & generated assets
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {activeCategory === 'voices' && (
            <button
              onClick={() => setCloneModalOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 20px', borderRadius: '12px',
                border: '1px solid rgba(244, 114, 182, 0.4)',
                background: 'rgba(244, 114, 182, 0.12)',
                color: '#f472b6', cursor: 'pointer',
                fontSize: '0.85rem', fontWeight: '600'
              }}
            >
              <Plus size={16} /> Clone Voice
            </button>
          )}
          {activeCategory !== 'voices' && (
            <button
              onClick={handleUpload}
              disabled={!!uploadingType}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 20px', borderRadius: '12px',
                border: '1px solid rgba(139, 92, 246, 0.4)',
                background: 'rgba(139, 92, 246, 0.12)',
                color: '#a78bfa', cursor: 'pointer',
                fontSize: '0.85rem', fontWeight: '600'
              }}
            >
              {uploadingType ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              {uploadingType ? 'Uploading...' : 'Upload'}
            </button>
          )}
        </div>
      </div>

      {/* Category tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '16px',
        overflowX: 'auto',
        paddingBottom: '4px'
      }}>
        {categories.map(cat => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => { setActiveCategory(cat.id); setSearchQuery(''); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: isMobile ? '8px 14px' : '10px 18px',
                borderRadius: '10px',
                border: `1px solid ${isActive ? cat.color + '60' : 'var(--border-color)'}`,
                background: isActive ? cat.color + '18' : 'transparent',
                color: isActive ? cat.color : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: '600',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
            >
              <Icon size={16} />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Search bar */}
      <div style={{
        position: 'relative',
        marginBottom: '20px'
      }}>
        <Search size={16} style={{
          position: 'absolute',
          left: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'var(--text-secondary)'
        }} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Search ${activeCategory}...`}
          style={{
            width: '100%',
            padding: '10px 12px 10px 36px',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            background: 'var(--card-bg)',
            color: 'var(--text-primary)',
            fontSize: '0.85rem',
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-purple)', marginBottom: '12px' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading {activeCategory}...</p>
        </div>
      ) : activeCategory === 'voices' ? (
        filteredVoices.length === 0 ? renderEmpty() : (
          <div>
            {/* Cloned voices section */}
            {voices.length > 0 && (
              <>
                <h3 style={{
                  fontSize: '0.85rem',
                  color: '#f472b6',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Mic size={16} /> Your Cloned Voices ({voices.filter(v =>
                    !searchQuery || v.name?.toLowerCase().includes(searchQuery.toLowerCase())
                  ).length})
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '12px',
                  marginBottom: '28px'
                }}>
                  {voices
                    .filter(v => !searchQuery || v.name?.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map(v => renderVoiceCard(v, true))}
                </div>
              </>
            )}

            {/* Professional voices section */}
            {elVoices.length > 0 && (
              <>
                <h3 style={{
                  fontSize: '0.85rem',
                  color: '#8b5cf6',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Volume2 size={16} /> Professional Voices ({elVoices.filter(v =>
                    !searchQuery || v.name?.toLowerCase().includes(searchQuery.toLowerCase())
                  ).length})
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '12px'
                }}>
                  {elVoices
                    .filter(v => !searchQuery || v.name?.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map(v => renderVoiceCard(v, false))}
                </div>
              </>
            )}
          </div>
        )
      ) : (
        filteredAssets.length === 0 ? renderEmpty() : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile
              ? 'repeat(2, 1fr)'
              : activeCategory === 'audio'
                ? 'repeat(auto-fill, minmax(280px, 1fr))'
                : 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '12px'
          }}>
            {filteredAssets.map(a => renderAssetCard(a))}
          </div>
        )
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        onChange={handleFileSelected}
      />

      {/* Hidden clone file input */}
      <input
        ref={cloneInputRef}
        type="file"
        accept="audio/*"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => {
          const files = Array.from(e.target.files || []).slice(0, 3);
          setCloneSamples(prev => [...prev, ...files].slice(0, 3));
          if (cloneInputRef.current) cloneInputRef.current.value = '';
        }}
      />

      {/* Clone Voice Modal */}
      {cloneModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px'
        }} onClick={() => !cloning && setCloneModalOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'var(--card-bg, #1a1a2e)', border: '1px solid rgba(244,114,182,0.3)',
            borderRadius: '16px', padding: '28px', maxWidth: '440px', width: '100%'
          }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem' }}>Clone Your Voice</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '0 0 20px' }}>
              Upload 1-3 audio samples (10s-5min each). Speak naturally — no background noise.
            </p>

            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Voice Name
            </label>
            <input
              value={cloneName}
              onChange={e => setCloneName(e.target.value)}
              placeholder="My Voice"
              style={{
                width: '100%', padding: '10px 12px', borderRadius: '10px',
                border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.3)',
                color: 'var(--text-primary)', fontSize: '0.9rem', marginBottom: '16px',
                boxSizing: 'border-box', outline: 'none'
              }}
            />

            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
              Audio Samples ({cloneSamples.length}/3)
            </label>

            {cloneSamples.map((file, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 12px', borderRadius: '8px', marginBottom: '6px',
                background: 'rgba(244,114,182,0.08)', border: '1px solid rgba(244,114,182,0.2)'
              }}>
                <Music size={14} color="#f472b6" />
                <span style={{ flex: 1, fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file.name}
                </span>
                <button onClick={() => setCloneSamples(prev => prev.filter((_, j) => j !== i))}
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }}>
                  <X size={14} />
                </button>
              </div>
            ))}

            {cloneSamples.length < 3 && (
              <button
                onClick={() => cloneInputRef.current?.click()}
                style={{
                  width: '100%', padding: '12px', borderRadius: '10px',
                  border: '1px dashed rgba(244,114,182,0.3)', background: 'transparent',
                  color: '#f472b6', cursor: 'pointer', fontSize: '0.85rem',
                  marginBottom: '20px', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '8px'
                }}
              >
                <Upload size={16} /> Add Audio Sample
              </button>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button
                onClick={() => { setCloneModalOpen(false); setCloneSamples([]); setCloneName(''); }}
                disabled={cloning}
                style={{
                  flex: 1, padding: '12px', borderRadius: '10px',
                  border: '1px solid var(--border-color)', background: 'transparent',
                  color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.9rem'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCloneVoice}
                disabled={cloning || !cloneSamples.length}
                style={{
                  flex: 1, padding: '12px', borderRadius: '10px',
                  border: '1px solid rgba(244,114,182,0.5)',
                  background: cloneSamples.length ? 'rgba(244,114,182,0.15)' : 'rgba(244,114,182,0.05)',
                  color: cloneSamples.length ? '#f472b6' : 'rgba(244,114,182,0.4)',
                  cursor: cloning || !cloneSamples.length ? 'not-allowed' : 'pointer',
                  fontSize: '0.9rem', fontWeight: '600',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}
              >
                {cloning ? <><Loader2 size={16} className="animate-spin" /> Cloning...</> : 'Clone Voice'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overlays */}
      {renderPreviewOverlay()}
      {renderDeleteConfirm()}
    </div>
  );
}

// --- Helpers ---
function formatFileSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(ts) {
  if (!ts) return '';
  const d = ts?.toDate ? ts.toDate() : new Date(ts._seconds ? ts._seconds * 1000 : ts);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString();
}
