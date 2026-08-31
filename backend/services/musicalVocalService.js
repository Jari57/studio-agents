// Provider contracts: https://replicate.com/minimax/music-2.6/api/schema
// https://replicate.com/cjwbw/demucs/versions/25a173108cff36ef9f80f854c162d01df9e6528be175794b81158fa03836d953
const SONG_MODEL = 'minimax/music-2.6';
const STEM_MODEL = 'cjwbw/demucs:25a173108cff36ef9f80f854c162d01df9e6528be175794b81158fa03836d953';

function outputUrl(value) {
  const output = Array.isArray(value) ? value[0] : value;
  const raw = typeof output === 'string' ? output : typeof output?.url === 'function' ? String(output.url()) : output?.url;
  try {
    const url = new URL(raw);
    if (url.protocol === 'https:' && !url.username && !url.password) return url.href;
  } catch { /* Missing media must never become a successful result. */ }
  throw new Error('The provider did not return a usable audio URL.');
}

async function separateVocal(audio, run, emit = () => {}) {
  emit('separating-vocal');
  try {
    const stems = await run(STEM_MODEL, {
      audio, stem: 'vocals', model_name: 'htdemucs', output_format: 'mp3', mp3_bitrate: 320, clip_mode: 'rescale',
    }, 'Musical vocal stem separation');
    // The accompaniment/full song must never be substituted when extraction fails.
    return outputUrl(stems?.vocals);
  } catch (error) {
    error.stage = 'separation';
    throw error;
  }
}

async function generateMusicalVocal({ lyrics, style, genre, language, rapStyle, duration, bpm }, run, emit = () => {}) {
  if (typeof lyrics !== 'string' || !lyrics.trim() || lyrics.length > 3500) {
    const error = new Error('Musical vocals require 1–3500 characters of lyrics. Shorten the lyrics and retry.');
    error.status = 422;
    throw error;
  }
  const tempo = Number(bpm);
  const direction = [genre, style, rapStyle, `Language: ${language || 'English'}`,
    Number.isFinite(tempo) && tempo >= 40 && tempo <= 240 ? `${tempo} BPM` : '',
    `Aim for a concise ${duration || 30}-second performance. Original vocalist, clear lead vocal, restrained accompaniment. Perform the supplied lyrics; no spoken introduction.`
  ].filter(Boolean).join('. ').slice(0, 2000);
  emit('generating-musical-performance');
  let song;
  try {
    song = outputUrl(await run(SONG_MODEL, {
      prompt: direction, lyrics: lyrics.trim(), is_instrumental: false, lyrics_optimizer: false,
      audio_format: 'mp3', sample_rate: 44100, bitrate: 256000,
    }, 'MiniMax vocal generation'));
  } catch (error) {
    error.stage = 'performance';
    throw error;
  }
  const audioUrl = await separateVocal(song, run, emit);
  return { audioUrl, provider: 'minimax-music-2.6-demucs', performanceType: 'isolated-musical-vocal' };
}

module.exports = { SONG_MODEL, STEM_MODEL, generateMusicalVocal, separateVocal };
