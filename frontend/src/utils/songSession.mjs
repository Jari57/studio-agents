const text = (value, fallback = '') => typeof value === 'string' ? value.slice(0, 4000) : fallback;
const gain = (value, fallback) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : fallback;

export function songStateSignature(state) {
  const canonical = value => Array.isArray(value) ? value.map(canonical)
    : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value;
  return JSON.stringify(canonical(state));
}

export function songSessionState(state = {}) {
  return {
    version: 1,
    voiceSource: state.voiceSource === 'personal' ? 'personal' : 'studio',
    voiceStyle: text(state.voiceStyle, 'singer'), genre: text(state.genre, 'hip-hop'), rapStyle: text(state.rapStyle, 'melodic'),
    voiceSampleUrl: text(state.voiceSampleUrl) || null,
    personalReferenceId: text(state.personalReferenceId) || null,
    personalLyricsExcerpt: text(state.personalLyricsExcerpt),
    referenceSongUrl: text(state.referenceSongUrl) || null,
    references: (Array.isArray(state.references) ? state.references : []).slice(0, 3).map(ref => ({
      assetId: text(ref.assetId), url: text(ref.url), name: text(ref.name, 'Song reference'),
    })).filter(ref => ref.url),
    mixPreset: text(state.mixPreset, 'vocal-focus'),
    mixVocalVolume: gain(state.mixVocalVolume, 0.95), mixBeatVolume: gain(state.mixBeatVolume, 0.48),
    outputFormat: text(state.outputFormat, 'music'),
    selectedOutputPreset: text(state.selectedOutputPreset, 'Full Song Release'),
    songStructure: text(state.songStructure, 'full'),
    arrangementSections: Array.isArray(state.arrangementSections) ? state.arrangementSections.slice(0, 64).map((section, i) => ({
      id: text(section.id, `section-${i}`), type: text(section.type, 'verse'), label: text(section.label, 'Verse'),
      color: text(section.color), bars: Math.max(1, Math.min(64, Number(section.bars) || 8)),
    })) : null,
    expandedSections: Object.fromEntries(['lyrics', 'audio', 'visual', 'video', 'vocalEngine', 'productionHub', 'config', 'outputPresets', 'arrangement', 'agentSelection'].map(key => [key, state.expandedSections?.[key] === true])),
    renderedMixSignature: text(state.renderedMixSignature),
    performance: state.performance && typeof state.performance === 'object' ? {
      id: text(state.performance.id), vocalUrl: text(state.performance.vocalUrl),
      instrumentalUrl: text(state.performance.instrumentalUrl), masterUrl: text(state.performance.masterUrl),
    } : null,
  };
}

export function mixStateSignature(media = {}, state = {}) {
  return JSON.stringify({ vocal: media.vocals || media.lyricsVocal || null, beat: media.audio || null,
    preset: state.mixPreset || 'vocal-focus', vocalGain: state.mixVocalVolume ?? 0.95, beatGain: state.mixBeatVolume ?? 0.48 });
}

export function authoritativeMaster(media = {}, preview) {
  return media.mixedAudio || (typeof preview === 'object' && preview?.mixedAudioUrl) || null;
}
