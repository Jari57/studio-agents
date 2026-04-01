import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { 
  Plus, X, ChevronUp, ChevronDown, Music, Clock, Layers, 
  Shuffle, RotateCcw, Copy
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// ARRANGEMENT EDITOR — Visual Song Structure Builder
// Lets users build song sections visually (Intro → Verse → Chorus → etc.)
// Outputs arrangement data for beat generation prompts
// ═══════════════════════════════════════════════════════════════════════════════

const SECTION_TYPES = [
  { type: 'intro', label: 'Intro', color: '#22d3ee', defaultBars: 4, icon: '🎬' },
  { type: 'verse', label: 'Verse', color: '#a78bfa', defaultBars: 16, icon: '📝' },
  { type: 'pre-chorus', label: 'Pre-Chorus', color: '#f59e0b', defaultBars: 4, icon: '⚡' },
  { type: 'chorus', label: 'Chorus', color: '#ec4899', defaultBars: 8, icon: '🔥' },
  { type: 'bridge', label: 'Bridge', color: '#14b8a6', defaultBars: 8, icon: '🌉' },
  { type: 'breakdown', label: 'Breakdown', color: '#6366f1', defaultBars: 8, icon: '💫' },
  { type: 'drop', label: 'Drop', color: '#ef4444', defaultBars: 8, icon: '🎯' },
  { type: 'outro', label: 'Outro', color: '#64748b', defaultBars: 4, icon: '🏁' },
];

const GENRE_ARRANGEMENTS = {
  'hip-hop': [
    { type: 'intro', bars: 4 },
    { type: 'verse', bars: 16 },
    { type: 'chorus', bars: 8 },
    { type: 'verse', bars: 16 },
    { type: 'chorus', bars: 8 },
    { type: 'bridge', bars: 8 },
    { type: 'chorus', bars: 8 },
    { type: 'outro', bars: 4 },
  ],
  'pop': [
    { type: 'intro', bars: 4 },
    { type: 'verse', bars: 8 },
    { type: 'pre-chorus', bars: 4 },
    { type: 'chorus', bars: 8 },
    { type: 'verse', bars: 8 },
    { type: 'pre-chorus', bars: 4 },
    { type: 'chorus', bars: 8 },
    { type: 'bridge', bars: 8 },
    { type: 'chorus', bars: 8 },
    { type: 'outro', bars: 4 },
  ],
  'trap': [
    { type: 'intro', bars: 4 },
    { type: 'verse', bars: 16 },
    { type: 'chorus', bars: 8 },
    { type: 'verse', bars: 16 },
    { type: 'chorus', bars: 8 },
    { type: 'drop', bars: 8 },
    { type: 'outro', bars: 4 },
  ],
  'edm': [
    { type: 'intro', bars: 8 },
    { type: 'breakdown', bars: 8 },
    { type: 'drop', bars: 16 },
    { type: 'breakdown', bars: 8 },
    { type: 'drop', bars: 16 },
    { type: 'outro', bars: 8 },
  ],
  'r&b': [
    { type: 'intro', bars: 4 },
    { type: 'verse', bars: 8 },
    { type: 'chorus', bars: 8 },
    { type: 'verse', bars: 8 },
    { type: 'chorus', bars: 8 },
    { type: 'bridge', bars: 8 },
    { type: 'chorus', bars: 8 },
    { type: 'outro', bars: 4 },
  ],
  'rock': [
    { type: 'intro', bars: 4 },
    { type: 'verse', bars: 8 },
    { type: 'chorus', bars: 8 },
    { type: 'verse', bars: 8 },
    { type: 'chorus', bars: 8 },
    { type: 'bridge', bars: 8 },
    { type: 'chorus', bars: 8 },
    { type: 'outro', bars: 4 },
  ],
  'default': [
    { type: 'intro', bars: 4 },
    { type: 'verse', bars: 16 },
    { type: 'chorus', bars: 8 },
    { type: 'verse', bars: 16 },
    { type: 'chorus', bars: 8 },
    { type: 'outro', bars: 4 },
  ],
};

let sectionIdCounter = 0;

function createSection(type, bars) {
  const typeDef = SECTION_TYPES.find(s => s.type === type) || SECTION_TYPES[0];
  sectionIdCounter += 1;
  return {
    id: `section-${Date.now()}-${sectionIdCounter}`,
    type,
    label: typeDef.label,
    bars: bars || typeDef.defaultBars,
    color: typeDef.color,
    icon: typeDef.icon,
  };
}

function barsToSeconds(bars, bpm) {
  // 1 bar = 4 beats, 1 beat = 60/bpm seconds
  return (bars * 4 * 60) / bpm;
}

export default function ArrangementEditor({ 
  bpm = 120, 
  genre = 'hip-hop', 
  isMobile = false,
  arrangement,
  onArrangementChange 
}) {
  // Use external state if provided, otherwise internal
  const [internalSections, setInternalSections] = useState(() => {
    const genreKey = genre.toLowerCase().replace(/\s+/g, '-').replace(/modern\s*/i, '');
    const template = GENRE_ARRANGEMENTS[genreKey] || GENRE_ARRANGEMENTS['default'];
    return template.map(s => createSection(s.type, s.bars));
  });

  const sections = arrangement || internalSections;
  const setSections = useCallback((newSections) => {
    const result = typeof newSections === 'function' ? newSections(sections) : newSections;
    if (onArrangementChange) {
      onArrangementChange(result);
    } else {
      setInternalSections(result);
    }
  }, [sections, onArrangementChange]);

  // Sync default internal sections to parent on mount (and when genre changes)
  // so the arrangement is never "null" when the user hits Generate without editing it
  const didSyncRef = useRef(false);
  useEffect(() => {
    if (onArrangementChange && !arrangement) {
      onArrangementChange(internalSections);
      didSyncRef.current = true;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When genre changes and parent hasn't set a custom arrangement, update to the new genre's default
  const prevGenreRef = useRef(genre);
  useEffect(() => {
    if (prevGenreRef.current !== genre) {
      prevGenreRef.current = genre;
      if (onArrangementChange && !arrangement) {
        const genreKey = genre.toLowerCase().replace(/\s+/g, '-').replace(/modern\s*/i, '');
        const template = GENRE_ARRANGEMENTS[genreKey] || GENRE_ARRANGEMENTS['default'];
        const newSections = template.map(s => createSection(s.type, s.bars));
        setInternalSections(newSections);
        onArrangementChange(newSections);
      }
    }
  }, [genre, arrangement, onArrangementChange]);

  const [showAddMenu, setShowAddMenu] = useState(false);

  const totalBars = useMemo(() => sections.reduce((sum, s) => sum + s.bars, 0), [sections]);
  const totalSeconds = useMemo(() => barsToSeconds(totalBars, bpm), [totalBars, bpm]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const addSection = (type) => {
    const typeDef = SECTION_TYPES.find(s => s.type === type);
    // Auto-number: count existing sections of same type
    const existingCount = sections.filter(s => s.type === type).length;
    const section = createSection(type, typeDef?.defaultBars);
    if (existingCount > 0) {
      section.label = `${typeDef?.label || type} ${existingCount + 1}`;
    }
    setSections(prev => [...prev, section]);
    setShowAddMenu(false);
  };

  const removeSection = (id) => {
    setSections(prev => prev.filter(s => s.id !== id));
  };

  const moveSection = (id, direction) => {
    setSections(prev => {
      const idx = prev.findIndex(s => s.id === id);
      if (idx < 0) return prev;
      const newIdx = idx + direction;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]];
      return copy;
    });
  };

  const updateBars = (id, bars) => {
    const clamped = Math.max(2, Math.min(64, bars));
    setSections(prev => prev.map(s => s.id === id ? { ...s, bars: clamped } : s));
  };

  const duplicateSection = (id) => {
    setSections(prev => {
      const idx = prev.findIndex(s => s.id === id);
      if (idx < 0) return prev;
      const source = prev[idx];
      const copy = createSection(source.type, source.bars);
      copy.label = source.label + ' (copy)';
      const result = [...prev];
      result.splice(idx + 1, 0, copy);
      return result;
    });
  };

  const loadGenrePreset = (genreKey) => {
    const key = genreKey.toLowerCase().replace(/\s+/g, '-').replace(/modern\s*/i, '');
    const template = GENRE_ARRANGEMENTS[key] || GENRE_ARRANGEMENTS['default'];
    setSections(template.map(s => createSection(s.type, s.bars)));
  };

  const shuffleSections = () => {
    setSections(prev => {
      const copy = [...prev];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    });
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.6), rgba(15, 23, 42, 0.8))',
      borderRadius: '16px',
      padding: isMobile ? '14px' : '20px',
      border: '1px solid rgba(255,255,255,0.1)',
      marginBottom: '24px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'rgba(139, 92, 246, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(139, 92, 246, 0.3)'
          }}>
            <Layers size={16} color="#a78bfa" />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: 'white' }}>
              Song Arrangement
            </h4>
            <p style={{ margin: 0, fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>
              Build your song structure visually
            </p>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 10px',
            borderRadius: '8px',
            background: 'rgba(139, 92, 246, 0.1)',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            fontSize: '0.75rem',
            fontWeight: '700',
            color: '#a78bfa'
          }}>
            <Music size={12} />
            {totalBars} bars
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 10px',
            borderRadius: '8px',
            background: 'rgba(34, 211, 238, 0.1)',
            border: '1px solid rgba(34, 211, 238, 0.2)',
            fontSize: '0.75rem',
            fontWeight: '700',
            color: '#22d3ee'
          }}>
            <Clock size={12} />
            {formatTime(totalSeconds)}
          </div>
        </div>
      </div>

      {/* Visual Timeline Bar */}
      <div style={{
        display: 'flex',
        height: '28px',
        borderRadius: '6px',
        overflow: 'hidden',
        marginBottom: '16px',
        border: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(0,0,0,0.3)'
      }}>
        {sections.map(section => (
          <div
            key={section.id}
            style={{
              flex: section.bars,
              background: `${section.color}40`,
              borderRight: '1px solid rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.55rem',
              fontWeight: '700',
              color: section.color,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              minWidth: 0
            }}
            title={`${section.label}: ${section.bars} bars (${formatTime(barsToSeconds(section.bars, bpm))})`}
          >
            {section.bars >= 6 ? section.label : section.icon}
          </div>
        ))}
      </div>

      {/* Sections List */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        marginBottom: '12px',
        maxHeight: '300px',
        overflowY: 'auto'
      }}>
        {sections.map((section, idx) => (
          <div
            key={section.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 10px',
              borderRadius: '10px',
              background: 'rgba(0,0,0,0.25)',
              border: `1px solid ${section.color}30`,
              transition: 'all 0.15s ease'
            }}
          >
            {/* Section Number */}
            <span style={{
              fontSize: '0.65rem',
              fontWeight: '600',
              color: 'rgba(255,255,255,0.3)',
              width: '16px',
              textAlign: 'center',
              flexShrink: 0
            }}>
              {idx + 1}
            </span>

            {/* Section Color Dot + Type */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              flex: 1,
              minWidth: 0
            }}>
              <span style={{ fontSize: '0.85rem' }}>{section.icon}</span>
              <span style={{
                fontSize: '0.8rem',
                fontWeight: '600',
                color: section.color,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {section.label}
              </span>
            </div>

            {/* Bars Control */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '6px',
              padding: '2px 4px',
              flexShrink: 0
            }}>
              <button
                onClick={() => updateBars(section.id, section.bars - 2)}
                disabled={section.bars <= 2}
                style={{
                  background: 'none',
                  border: 'none',
                  color: section.bars <= 2 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)',
                  cursor: section.bars <= 2 ? 'default' : 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <ChevronDown size={12} />
              </button>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: '700',
                color: 'white',
                minWidth: '28px',
                textAlign: 'center'
              }}>
                {section.bars}
              </span>
              <button
                onClick={() => updateBars(section.id, section.bars + 2)}
                disabled={section.bars >= 64}
                style={{
                  background: 'none',
                  border: 'none',
                  color: section.bars >= 64 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)',
                  cursor: section.bars >= 64 ? 'default' : 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <ChevronUp size={12} />
              </button>
              <span style={{
                fontSize: '0.6rem',
                color: 'rgba(255,255,255,0.35)',
                marginLeft: '2px'
              }}>bars</span>
            </div>

            {/* Duration display */}
            <span style={{
              fontSize: '0.65rem',
              color: 'rgba(255,255,255,0.3)',
              width: '35px',
              textAlign: 'right',
              flexShrink: 0
            }}>
              {formatTime(barsToSeconds(section.bars, bpm))}
            </span>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
              <button
                onClick={() => moveSection(section.id, -1)}
                disabled={idx === 0}
                style={{
                  background: 'none',
                  border: 'none',
                  color: idx === 0 ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.3)',
                  cursor: idx === 0 ? 'default' : 'pointer',
                  padding: '3px',
                  display: 'flex'
                }}
                title="Move up"
              >
                <ChevronUp size={14} />
              </button>
              <button
                onClick={() => moveSection(section.id, 1)}
                disabled={idx === sections.length - 1}
                style={{
                  background: 'none',
                  border: 'none',
                  color: idx === sections.length - 1 ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.3)',
                  cursor: idx === sections.length - 1 ? 'default' : 'pointer',
                  padding: '3px',
                  display: 'flex'
                }}
                title="Move down"
              >
                <ChevronDown size={14} />
              </button>
              <button
                onClick={() => duplicateSection(section.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255,255,255,0.3)',
                  cursor: 'pointer',
                  padding: '3px',
                  display: 'flex'
                }}
                title="Duplicate"
              >
                <Copy size={12} />
              </button>
              <button
                onClick={() => removeSection(section.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(239, 68, 68, 0.5)',
                  cursor: 'pointer',
                  padding: '3px',
                  display: 'flex'
                }}
                title="Remove"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ))}

        {sections.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '24px',
            color: 'rgba(255,255,255,0.3)',
            fontSize: '0.85rem',
            fontStyle: 'italic'
          }}>
            No sections yet. Add sections to build your arrangement.
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div style={{
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        {/* Add Section */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            style={{
              padding: '8px 14px',
              borderRadius: '10px',
              background: 'rgba(139, 92, 246, 0.15)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              color: '#a78bfa',
              fontWeight: '600',
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            <Plus size={14} /> Add Section
          </button>

          {showAddMenu && (
            <div style={{
              position: 'absolute',
              bottom: '110%',
              left: 0,
              background: 'rgba(15, 23, 42, 0.98)',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.15)',
              padding: '8px',
              zIndex: 100,
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '4px',
              minWidth: '220px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
            }}>
              {SECTION_TYPES.map(st => (
                <button
                  key={st.type}
                  onClick={() => addSection(st.type)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: `${st.color}15`,
                    border: `1px solid ${st.color}30`,
                    color: st.color,
                    fontWeight: '600',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s'
                  }}
                >
                  <span>{st.icon}</span> {st.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Genre Preset Buttons */}
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {['Hip-Hop', 'Pop', 'Trap', 'EDM', 'R&B', 'Rock'].map(g => (
            <button
              key={g}
              onClick={() => loadGenrePreset(g)}
              style={{
                padding: '5px 10px',
                borderRadius: '8px',
                background: genre.toLowerCase().includes(g.toLowerCase()) ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${genre.toLowerCase().includes(g.toLowerCase()) ? 'rgba(99, 102, 241, 0.4)' : 'rgba(255,255,255,0.08)'}`,
                color: genre.toLowerCase().includes(g.toLowerCase()) ? '#818cf8' : 'rgba(255,255,255,0.4)',
                fontSize: '0.65rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              title={`Load ${g} arrangement`}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Shuffle & Reset */}
        <button
          onClick={shuffleSections}
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.4)',
            borderRadius: '8px',
            padding: '6px',
            cursor: 'pointer',
            display: 'flex'
          }}
          title="Shuffle sections"
        >
          <Shuffle size={14} />
        </button>
        <button
          onClick={() => loadGenrePreset(genre)}
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.4)',
            borderRadius: '8px',
            padding: '6px',
            cursor: 'pointer',
            display: 'flex'
          }}
          title="Reset to genre default"
        >
          <RotateCcw size={14} />
        </button>
      </div>
    </div>
  );
}

/**
 * Converts arrangement sections into a prompt-friendly description
 * for use with the beat generation API
 */
export function arrangementToPrompt(sections, bpm) {
  if (!sections || sections.length === 0) return '';
  
  const totalBars = sections.reduce((sum, s) => sum + s.bars, 0);
  const sectionDescs = sections.map((s, i) => {
    const startBar = sections.slice(0, i).reduce((sum, x) => sum + x.bars, 0) + 1;
    return `${s.label} (bars ${startBar}-${startBar + s.bars - 1}, ${s.bars} bars)`;
  });
  
  return `Song structure (${totalBars} bars total at ${bpm} BPM): ${sectionDescs.join(' → ')}`;
}
