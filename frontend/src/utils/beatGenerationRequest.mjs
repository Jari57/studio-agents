export const BEAT_GENERATION_ENDPOINT = '/api/generate-audio';

// Product rule: every generated beat is a usable full-length track between
// 1:30 and 2:30. Shorter requests (bar-based loops, legacy 30/60s presets) are
// raised to the floor and longer ones capped so Stability renders in one pass.
export const BEAT_MIN_DURATION_SECONDS = 90;
export const BEAT_MAX_DURATION_SECONDS = 150;

export function clampBeatDuration(durationSeconds) {
  const parsed = Number.parseInt(durationSeconds, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return BEAT_MIN_DURATION_SECONDS;
  return Math.min(BEAT_MAX_DURATION_SECONDS, Math.max(BEAT_MIN_DURATION_SECONDS, parsed));
}

export function beatGenerationRequest({
  prompt,
  bpm = 90,
  genre = 'hip-hop',
  mood = 'chill',
  durationSeconds = BEAT_MIN_DURATION_SECONDS,
  referenceAudio = null,
  audioId = null,
  outputFormat = 'music',
  songStructure = 'full',
  arrangement = null,
  highMusicality = true,
  seed = -1,
  stem = 'Full Mix',
} = {}) {
  return {
    prompt: String(prompt || '').trim().slice(0, 1000),
    bpm: Number.parseInt(bpm, 10) || 90,
    genre: String(genre || 'hip-hop').trim().toLowerCase(),
    mood: String(mood || 'chill').trim().toLowerCase(),
    durationSeconds: clampBeatDuration(durationSeconds),
    referenceAudio: referenceAudio || null,
    audioId: audioId || null,
    quality: 'premium',
    engine: 'auto',
    outputFormat: outputFormat || 'music',
    songStructure: songStructure || 'full',
    arrangement: Array.isArray(arrangement) && arrangement.length > 0 ? arrangement : null,
    highMusicality: highMusicality !== false,
    seed: Number.isFinite(Number(seed)) ? Number(seed) : -1,
    stem: stem || 'Full Mix',
    agentId: 'beat-arch',
  };
}