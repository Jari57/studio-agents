export const BEAT_GENERATION_ENDPOINT = '/api/generate-audio';

export function beatGenerationRequest({
  prompt,
  bpm = 90,
  genre = 'hip-hop',
  mood = 'chill',
  durationSeconds = 60,
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
    durationSeconds: Math.max(Number.parseInt(durationSeconds, 10) || 60, 30),
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