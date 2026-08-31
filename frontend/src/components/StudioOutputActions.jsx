import { Download, FolderPlus } from 'lucide-react';

export default function StudioOutputActions({ outputs = {}, mediaUrls = {}, selectedAgents = {}, isMobile, onExport, onStems, onSave }) {
  const selected = ['lyrics', 'audio', 'visual', 'video'].filter(key => selectedAgents[key]);
  const ready = selected.filter(key => key === 'lyrics' ? outputs.lyrics : mediaUrls[key === 'visual' ? 'image' : key]).length;
  const buttonStyle = {
    minWidth: 0, minHeight: 48, padding: isMobile ? '10px 6px' : '12px 18px',
    borderRadius: 12, border: '1px solid rgba(255,255,255,0.16)',
    background: 'rgba(255,255,255,0.06)', color: '#fff', fontWeight: 600,
    fontSize: isMobile ? '0.78rem' : '0.9rem', cursor: 'pointer',
    display: 'flex', flexDirection: isMobile ? 'column' : 'row',
    alignItems: 'center', justifyContent: 'center', gap: 6,
    whiteSpace: 'normal', overflowWrap: 'anywhere', lineHeight: 1.3
  };
  return (
    <footer aria-label="Project output actions" style={{
      padding: isMobile ? '10px 12px calc(10px + env(safe-area-inset-bottom, 0px))' : '16px 24px',
      boxSizing: 'border-box', width: '100%', minWidth: 0,
      background: 'rgba(0,0,0,0.94)', borderTop: '1px solid rgba(255,255,255,0.14)',
      display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 8 : 16,
      justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center',
      position: 'sticky', bottom: 0, backdropFilter: 'blur(10px)'
    }}>
      <p style={{ margin: 0, minWidth: 0, fontSize: '0.8rem', color: '#cbd5e1' }}>
        {ready}/{selected.length} selected outputs ready · {Object.values(mediaUrls).filter(Boolean).length} media files
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: isMobile ? 8 : 12, minWidth: 0 }}>
        <button aria-label="Export All (.zip)" onClick={onExport} style={buttonStyle}>
          <Download size={16} aria-hidden="true" /><span>Export All (.zip)</span>
        </button>
        <button aria-label="Stems Pack (WAV)" onClick={onStems} style={{ ...buttonStyle, background: 'rgba(139,92,246,0.12)', color: '#ddd6fe' }} title="Download audio stems as WAV files">
          <Download size={16} aria-hidden="true" /><span>Stems Pack (WAV)</span>
        </button>
        <button aria-label="Save to Project" onClick={onSave} style={{ ...buttonStyle, background: 'linear-gradient(135deg, #6d28d9, #0e7490)', fontWeight: 700 }}>
          <FolderPlus size={18} aria-hidden="true" /><span>Save to Project</span>
        </button>
      </div>
    </footer>
  );
}
