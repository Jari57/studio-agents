import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X, Type, Download, RotateCcw, Check, Sliders,
  Move, Bold, Italic, AlignLeft, AlignCenter, AlignRight,
  Plus, Trash2, ChevronDown
} from 'lucide-react';

const FONTS = [
  'Impact', 'Arial Black', 'Georgia', 'Courier New', 'Helvetica',
  'Futura', 'Oswald', 'Bebas Neue', 'Times New Roman', 'Verdana'
];

const PRESET_STYLES = [
  { name: 'Original', filter: 'none' },
  { name: 'B&W', filter: 'grayscale(100%)' },
  { name: 'High Contrast', filter: 'contrast(1.4) saturate(1.2)' },
  { name: 'Warm', filter: 'sepia(30%) saturate(1.3) brightness(1.05)' },
  { name: 'Cool', filter: 'hue-rotate(200deg) saturate(0.8) brightness(1.05)' },
  { name: 'Vintage', filter: 'sepia(50%) contrast(0.9) brightness(0.95)' },
  { name: 'Vivid', filter: 'saturate(1.8) contrast(1.1)' },
  { name: 'Dark', filter: 'brightness(0.7) contrast(1.3)' },
  { name: 'Fade', filter: 'brightness(1.1) contrast(0.85) saturate(0.7)' },
];

const DEFAULT_TEXT = {
  text: '',
  x: 50, // percentage
  y: 85,
  fontSize: 48,
  fontFamily: 'Impact',
  color: '#FFFFFF',
  strokeColor: '#000000',
  strokeWidth: 2,
  bold: false,
  italic: false,
  align: 'center',
  opacity: 1,
};

export default function CoverArtEditor({ imageUrl, onSave, onClose, songTitle, artistName }) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const containerRef = useRef(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [activeFilter, setActiveFilter] = useState('none');
  const [textLayers, setTextLayers] = useState(() => {
    const layers = [];
    if (artistName) {
      layers.push({ ...DEFAULT_TEXT, id: 'artist', text: artistName, y: 78, fontSize: 36 });
    }
    if (songTitle) {
      layers.push({ ...DEFAULT_TEXT, id: 'title', text: songTitle, y: 88, fontSize: 52 });
    }
    if (layers.length === 0) {
      layers.push({ ...DEFAULT_TEXT, id: 'default', text: '' });
    }
    return layers;
  });
  const [selectedLayerIdx, setSelectedLayerIdx] = useState(0);
  const [dragging, setDragging] = useState(null);
  const [showStylePanel, setShowStylePanel] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturate, setSaturate] = useState(100);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgRef.current = img;
      setImageLoaded(true);
    };
    img.onerror = () => {
      // Try without crossOrigin for data URLs
      const img2 = new Image();
      img2.onload = () => {
        imgRef.current = img2;
        setImageLoaded(true);
      };
      if (typeof imageUrl === 'string' && imageUrl.startsWith('data:')) {
        img2.src = imageUrl;
      } else {
        img2.src = imageUrl;
      }
    };
    // Format src
    let src = imageUrl;
    if (typeof src === 'string' && src.length > 200 && !src.startsWith('http') && !src.startsWith('data:')) {
      src = `data:image/jpeg;base64,${src}`;
    }
    img.src = src;
  }, [imageUrl]);

  // Build combined CSS filter
  const getCombinedFilter = useCallback(() => {
    const parts = [];
    if (activeFilter !== 'none') parts.push(activeFilter);
    if (brightness !== 100) parts.push(`brightness(${brightness / 100})`);
    if (contrast !== 100) parts.push(`contrast(${contrast / 100})`);
    if (saturate !== 100) parts.push(`saturate(${saturate / 100})`);
    return parts.length ? parts.join(' ') : 'none';
  }, [activeFilter, brightness, contrast, saturate]);

  // Render canvas
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    // Use fixed high-res output size
    const size = 1500;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Apply filter
    ctx.filter = getCombinedFilter();

    // Draw image centered/cover
    const imgAspect = img.width / img.height;
    let sx = 0, sy = 0, sw = img.width, sh = img.height;
    if (imgAspect > 1) {
      sw = img.height;
      sx = (img.width - sw) / 2;
    } else if (imgAspect < 1) {
      sh = img.width;
      sy = (img.height - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size, size);
    ctx.filter = 'none';

    // Draw text layers
    textLayers.forEach(layer => {
      if (!layer.text) return;
      ctx.save();
      ctx.globalAlpha = layer.opacity;

      const fSize = layer.fontSize * (size / 500);
      let fontStr = `${layer.bold ? 'bold ' : ''}${layer.italic ? 'italic ' : ''}${fSize}px "${layer.fontFamily}", sans-serif`;
      ctx.font = fontStr;
      ctx.textAlign = layer.align;
      ctx.textBaseline = 'middle';

      const x = (layer.x / 100) * size;
      const y = (layer.y / 100) * size;

      // Stroke
      if (layer.strokeWidth > 0) {
        ctx.strokeStyle = layer.strokeColor;
        ctx.lineWidth = layer.strokeWidth * (size / 500);
        ctx.lineJoin = 'round';
        ctx.strokeText(layer.text, x, y);
      }

      // Fill
      ctx.fillStyle = layer.color;
      ctx.fillText(layer.text, x, y);
      ctx.restore();
    });
  }, [imageLoaded, textLayers, getCombinedFilter]);

  useEffect(() => {
    if (imageLoaded) renderCanvas();
  }, [imageLoaded, renderCanvas]);

  // Pointer drag for text positioning
  const handlePointerDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    const py = ((e.clientY - rect.top) / rect.height) * 100;

    // Find closest text layer
    let closest = selectedLayerIdx;
    let minDist = Infinity;
    textLayers.forEach((layer, i) => {
      if (!layer.text) return;
      const dist = Math.hypot(layer.x - px, layer.y - py);
      if (dist < minDist && dist < 15) {
        minDist = dist;
        closest = i;
      }
    });
    setSelectedLayerIdx(closest);
    setDragging({ startX: px, startY: py, origX: textLayers[closest].x, origY: textLayers[closest].y });
  };

  const handlePointerMove = (e) => {
    if (!dragging) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    const py = ((e.clientY - rect.top) / rect.height) * 100;
    const dx = px - dragging.startX;
    const dy = py - dragging.startY;
    updateLayer(selectedLayerIdx, {
      x: Math.max(5, Math.min(95, dragging.origX + dx)),
      y: Math.max(5, Math.min(95, dragging.origY + dy)),
    });
  };

  const handlePointerUp = () => setDragging(null);

  const updateLayer = (idx, updates) => {
    setTextLayers(prev => prev.map((l, i) => i === idx ? { ...l, ...updates } : l));
  };

  const addTextLayer = () => {
    setTextLayers(prev => [...prev, { ...DEFAULT_TEXT, id: `layer-${Date.now()}`, y: 50 }]);
    setSelectedLayerIdx(textLayers.length);
  };

  const removeTextLayer = (idx) => {
    if (textLayers.length <= 1) {
      updateLayer(idx, { text: '' });
      return;
    }
    setTextLayers(prev => prev.filter((_, i) => i !== idx));
    setSelectedLayerIdx(Math.max(0, selectedLayerIdx - 1));
  };

  const handleSave = () => {
    renderCanvas();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    onSave(dataUrl);
  };

  const handleDownload = () => {
    renderCanvas();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `cover-art-${Date.now()}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.click();
  };

  const resetAll = () => {
    setActiveFilter('none');
    setBrightness(100);
    setContrast(100);
    setSaturate(100);
    setTextLayers([{ ...DEFAULT_TEXT, id: 'default', text: '' }]);
    setSelectedLayerIdx(0);
  };

  const selectedLayer = textLayers[selectedLayerIdx] || textLayers[0];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'rgba(0,0,0,0.92)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '8px 12px' : '12px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        flexShrink: 0,
      }}>
        <h3 style={{ margin: 0, fontSize: isMobile ? '1rem' : '1.1rem', color: 'white', fontWeight: 700 }}>
          Cover Art Editor
        </h3>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button onClick={resetAll} title="Reset" style={toolBtnStyle}>
            <RotateCcw size={16} />
          </button>
          <button onClick={handleDownload} title="Download" style={toolBtnStyle}>
            <Download size={16} />
          </button>
          <button onClick={handleSave} style={{
            ...toolBtnStyle,
            background: 'rgba(34,197,94,0.2)',
            border: '1px solid rgba(34,197,94,0.5)',
            color: '#22c55e',
            fontWeight: 700,
            padding: '8px 16px',
            gap: '6px',
          }}>
            <Check size={16} /> Save
          </button>
          <button onClick={onClose} style={{ ...toolBtnStyle, color: '#ef4444' }}>
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Main Area */}
      <div ref={containerRef} style={{
        flex: 1,
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        overflow: 'hidden',
        minHeight: 0,
      }}>
        {/* Canvas Preview */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isMobile ? '8px' : '20px',
          minHeight: 0,
          overflow: 'hidden',
        }}>
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            style={{
              maxWidth: '100%',
              maxHeight: isMobile ? '40vh' : '70vh',
              borderRadius: '8px',
              cursor: dragging ? 'grabbing' : 'crosshair',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              touchAction: 'none',
            }}
          />
        </div>

        {/* Controls Panel */}
        <div style={{
          width: isMobile ? '100%' : '340px',
          flexShrink: 0,
          borderLeft: isMobile ? 'none' : '1px solid rgba(255,255,255,0.1)',
          borderTop: isMobile ? '1px solid rgba(255,255,255,0.1)' : 'none',
          overflow: 'auto',
          padding: isMobile ? '10px' : '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>

          {/* Style Presets */}
          <SectionHeader title="Style Presets" />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {PRESET_STYLES.map(ps => (
              <button
                key={ps.name}
                onClick={() => setActiveFilter(ps.filter)}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  border: activeFilter === ps.filter
                    ? '1px solid rgba(139,92,246,0.6)'
                    : '1px solid rgba(255,255,255,0.1)',
                  background: activeFilter === ps.filter ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.05)',
                  color: activeFilter === ps.filter ? '#a78bfa' : 'rgba(255,255,255,0.7)',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {ps.name}
              </button>
            ))}
          </div>

          {/* Adjustments */}
          <SectionHeader
            title="Adjustments"
            action={showStylePanel ? 'Hide' : 'Show'}
            onAction={() => setShowStylePanel(!showStylePanel)}
          />
          {showStylePanel && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <SliderControl label="Brightness" value={brightness} onChange={setBrightness} min={30} max={170} />
              <SliderControl label="Contrast" value={contrast} onChange={setContrast} min={50} max={200} />
              <SliderControl label="Saturation" value={saturate} onChange={setSaturate} min={0} max={200} />
            </div>
          )}

          {/* Text Layers */}
          <SectionHeader title="Text Layers" action="+ Add" onAction={addTextLayer} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {textLayers.map((layer, idx) => (
              <div
                key={layer.id}
                onClick={() => setSelectedLayerIdx(idx)}
                style={{
                  padding: '8px 10px',
                  borderRadius: '8px',
                  background: idx === selectedLayerIdx ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.03)',
                  border: idx === selectedLayerIdx ? '1px solid rgba(139,92,246,0.4)' : '1px solid rgba(255,255,255,0.06)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ fontSize: '0.8rem', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                  <Type size={12} style={{ marginRight: 6, opacity: 0.5 }} />
                  {layer.text || '(empty)'}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); removeTextLayer(idx); }}
                  style={{ background: 'none', border: 'none', color: 'rgba(239,68,68,0.6)', cursor: 'pointer', padding: '2px' }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>

          {/* Selected Layer Controls */}
          {selectedLayer && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '8px 0' }}>
              <input
                type="text"
                value={selectedLayer.text}
                onChange={(e) => updateLayer(selectedLayerIdx, { text: e.target.value })}
                placeholder="Enter text..."
                style={inputStyle}
              />
              <div style={{ display: 'flex', gap: '6px' }}>
                <select
                  value={selectedLayer.fontFamily}
                  onChange={(e) => updateLayer(selectedLayerIdx, { fontFamily: e.target.value })}
                  style={{ ...inputStyle, flex: 1 }}
                >
                  {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
                <input
                  type="number"
                  value={selectedLayer.fontSize}
                  onChange={(e) => updateLayer(selectedLayerIdx, { fontSize: Math.max(8, Math.min(200, Number(e.target.value))) })}
                  style={{ ...inputStyle, width: '60px' }}
                  min={8}
                  max={200}
                />
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                <label style={colorLabelStyle}>
                  Fill
                  <input
                    type="color"
                    value={selectedLayer.color}
                    onChange={(e) => updateLayer(selectedLayerIdx, { color: e.target.value })}
                    style={colorInputStyle}
                  />
                </label>
                <label style={colorLabelStyle}>
                  Stroke
                  <input
                    type="color"
                    value={selectedLayer.strokeColor}
                    onChange={(e) => updateLayer(selectedLayerIdx, { strokeColor: e.target.value })}
                    style={colorInputStyle}
                  />
                </label>
                <input
                  type="number"
                  value={selectedLayer.strokeWidth}
                  onChange={(e) => updateLayer(selectedLayerIdx, { strokeWidth: Math.max(0, Math.min(20, Number(e.target.value))) })}
                  title="Stroke width"
                  style={{ ...inputStyle, width: '50px' }}
                  min={0}
                  max={20}
                />

                <button
                  onClick={() => updateLayer(selectedLayerIdx, { bold: !selectedLayer.bold })}
                  style={{ ...toggleBtnStyle, ...(selectedLayer.bold ? activeBtnStyle : {}) }}
                  title="Bold"
                >
                  <Bold size={14} />
                </button>
                <button
                  onClick={() => updateLayer(selectedLayerIdx, { italic: !selectedLayer.italic })}
                  style={{ ...toggleBtnStyle, ...(selectedLayer.italic ? activeBtnStyle : {}) }}
                  title="Italic"
                >
                  <Italic size={14} />
                </button>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                {['left', 'center', 'right'].map(a => (
                  <button
                    key={a}
                    onClick={() => updateLayer(selectedLayerIdx, { align: a })}
                    style={{ ...toggleBtnStyle, flex: 1, ...(selectedLayer.align === a ? activeBtnStyle : {}) }}
                  >
                    {a === 'left' ? <AlignLeft size={14} /> : a === 'center' ? <AlignCenter size={14} /> : <AlignRight size={14} />}
                  </button>
                ))}
              </div>
              <SliderControl label="Opacity" value={Math.round(selectedLayer.opacity * 100)} onChange={(v) => updateLayer(selectedLayerIdx, { opacity: v / 100 })} min={0} max={100} />
              <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', margin: 0 }}>
                <Move size={10} style={{ marginRight: 4 }} />
                Drag text on the canvas to reposition
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────

function SectionHeader({ title, action, onAction }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {title}
      </span>
      {action && (
        <button onClick={onAction} style={{ background: 'none', border: 'none', color: '#a78bfa', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600 }}>
          {action}
        </button>
      )}
    </div>
  );
}

function SliderControl({ label, value, onChange, min = 0, max = 100 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', minWidth: '70px' }}>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ flex: 1, accentColor: '#8b5cf6' }}
      />
      <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.5)', minWidth: '30px', textAlign: 'right' }}>
        {value}
      </span>
    </div>
  );
}

// ─── Shared styles ──────────────────────────────────────────────

const toolBtnStyle = {
  padding: '8px 12px',
  borderRadius: '8px',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)',
  color: 'white',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  fontSize: '0.8rem',
  fontWeight: 500,
};

const inputStyle = {
  padding: '7px 10px',
  borderRadius: '6px',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)',
  color: 'white',
  fontSize: '0.82rem',
  outline: 'none',
};

const colorLabelStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  fontSize: '0.72rem',
  color: 'rgba(255,255,255,0.6)',
  cursor: 'pointer',
};

const colorInputStyle = {
  width: '24px',
  height: '24px',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  background: 'transparent',
  padding: 0,
};

const toggleBtnStyle = {
  padding: '6px 8px',
  borderRadius: '6px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: 'rgba(255,255,255,0.6)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const activeBtnStyle = {
  background: 'rgba(139,92,246,0.15)',
  border: '1px solid rgba(139,92,246,0.4)',
  color: '#a78bfa',
};
