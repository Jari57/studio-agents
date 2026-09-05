import { Download, FolderPlus } from 'lucide-react';
import { deliveryReadiness } from '../utils/deliveryReadiness.mjs';

export default function StudioOutputActions({ outputs = {}, mediaUrls = {}, selectedAgents = {}, includeVocals = false, isMobile, onExport, onStems, onSave }) {
  const { selected, completed: ready } = deliveryReadiness(outputs, mediaUrls, selectedAgents, includeVocals);
  const buttonStyle = {
    minWidth: 0, minHeight: 48, padding: isMobile ? '10px 6px' : '12px 18px',
    borderRadius: 12, border: '1px solid var(--studio-border, #d8d5c9)',
    background: 'var(--studio-surface, #fbf8f1)', color: 'var(--studio-ink, #202724)', fontWeight: 600,
    fontSize: isMobile ? '0.78rem' : '0.9rem', cursor: 'pointer',
    display: 'flex', flexDirection: isMobile ? 'column' : 'row',
    alignItems: 'center', justifyContent: 'center', gap: 6,
    whiteSpace: 'normal', overflowWrap: 'anywhere', lineHeight: 1.3
  };
  return (
    <footer aria-label="Project output actions" style={{
      padding: isMobile ? '10px 12px calc(10px + env(safe-area-inset-bottom, 0px))' : '16px 24px',
      boxSizing: 'border-box', width: '100%', minWidth: 0,
      background: 'var(--studio-surface, #fbf8f1)', borderTop: '1px solid var(--studio-border, #d8d5c9)',
      display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 8 : 16,
      justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center',
      position: 'sticky', bottom: 0, backdropFilter: 'blur(10px)'
    }}>
      <p style={{ margin: 0, minWidth: 0, fontSize: '0.8rem', color: 'var(--studio-muted, #646c64)' }}>
        {ready}/{selected.length} selected outputs ready · {new Set(Object.values(mediaUrls).filter(Boolean)).size} media files · Listen before release
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: isMobile ? 8 : 12, minWidth: 0 }}>
        <button aria-label="Export All (.zip)" onClick={onExport} style={buttonStyle}>
          <Download size={16} aria-hidden="true" /><span>Export All (.zip)</span>
        </button>
        <button aria-label="Stems Pack (WAV)" onClick={onStems} style={{ ...buttonStyle, background: 'var(--studio-surface-alt, #e4e8dc)', color: 'var(--studio-sage, #566954)' }} title="Download audio stems as WAV files">
          <Download size={16} aria-hidden="true" /><span>Stems Pack (WAV)</span>
        </button>
        <button aria-label="Save to Project" onClick={onSave} style={{ ...buttonStyle, background: 'var(--studio-accent, #a34229)', color: 'var(--studio-on-accent, #fffaf0)', borderColor: 'var(--studio-accent, #a34229)', fontWeight: 700 }}>
          <FolderPlus size={18} aria-hidden="true" /><span>Save to Project</span>
        </button>
      </div>
    </footer>
  );
}
