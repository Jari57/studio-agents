// Provider contracts: https://replicate.com/minimax/music-2.6/api/schema
// https://replicate.com/cjwbw/demucs/versions/25a173108cff36ef9f80f854c162d01df9e6528be175794b81158fa03836d953
const SONG_MODEL = 'minimax/music-2.6';
const STEM_MODEL = 'cjwbw/demucs:25a173108cff36ef9f80f854c162d01df9e6528be175794b81158fa03836d953';
const { latinGenreProfile } = require('./genreDirection');

function outputUrl(value) {
  const output = Array.isArray(value) ? value[0] : value;
  const raw = typeof output === 'string' ? output : typeof output?.url === 'function' ? String(output.url()) : output?.url;
  try {
    const url = new URL(raw);
    if (url.protocol === 'https:' && !url.username && !url.password) return url.href;
  } catch { /* Missing media must never become a successful result. */ }
  throw new Error('The provider did not return a usable audio URL.');
}

async function separateSongStems(audio, run, emit = () => {}) {
  emit('separating-vocal');
  try {
    const stems = await run(STEM_MODEL, {
      audio, stem: 'vocals', model_name: 'htdemucs', output_format: 'mp3', mp3_bitrate: 320, clip_mode: 'rescale',
    }, 'Musical vocal stem separation');
    // One separation pass yields the vocal and the exact accompaniment that
    // performed beneath it. Keeping both is what makes the final mix coherent;
    // a separately generated beat can share a BPM while still disagreeing on
    // key, chords, phrasing, bar boundaries, and arrangement.
    return {
      vocalUrl: outputUrl(stems?.vocals),
      instrumentalUrl: outputUrl(stems?.other),
    };
  } catch (error) {
    error.stage = 'separation';
    throw error;
  }
}

async function separateVocal(audio, run, emit = () => {}) {
  return (await separateSongStems(audio, run, emit)).vocalUrl;
}

// Recovery is supplied by the trusted caller, never by an unchecked client URL.
// checkpoint must durably save the master before expensive separation begins.
async function generateMusicalVocal({ lyrics, style, genre, language, rapStyle, duration, bpm, musicalDirection, mood, songStructure }, run, emit = () => {}, recovery = {}) {
  if (typeof lyrics !== 'string' || !lyrics.trim() || lyrics.length > 3500) {
    const error = new Error('Musical vocals require 1–3500 characters of lyrics. Shorten the lyrics and retry.');
    error.status = 422;
    throw error;
  }
  const tempo = Number(bpm);
  const latinProfile = latinGenreProfile(genre);
  const direction = [genre, style, rapStyle, mood, songStructure,
    `Language: ${language || 'English'}`,
    Number.isFinite(tempo) && tempo >= 40 && tempo <= 240 ? `${tempo} BPM` : '',
    `Create one complete, coherent song performance. Make the lead vocal the primary focus: clearly intelligible, present, melodic, rhythmically locked to the instrumental, and emotionally performed. Use supportive harmonies that never mask the lead. Keep the instrumental beneath the vocal with space in the midrange. Original vocalist, melodic or rhythmic delivery appropriate to the genre, and an arrangement written around the supplied lyrics. Perform the supplied lyrics; no spoken introduction. Target approximately ${duration || 120} seconds.`,
    latinProfile ? `${latinProfile.instrumental}. Vocal arrangement: ${latinProfile.vocal}` : '',
    typeof musicalDirection === 'string' ? musicalDirection.trim() : '',
  ].filter(Boolean).join('. ').slice(0, 2000);
  emit('generating-musical-performance');
  let song;
  try {
    song = recovery.songUrl ? outputUrl(recovery.songUrl) : outputUrl(await run(SONG_MODEL, {
      prompt: direction, lyrics: lyrics.trim(), is_instrumental: false, lyrics_optimizer: false,
      audio_format: 'mp3', sample_rate: 44100, bitrate: 256000,
    }, 'MiniMax vocal generation'));
  } catch (error) {
    error.stage = 'performance';
    throw error;
  }
  try {
    if (!recovery.songUrl && recovery.checkpoint) {
      emit('saving-musical-performance');
      song = outputUrl(await recovery.checkpoint(song));
    }
  } catch (error) {
    error.stage = 'checkpoint';
    error.songUrl = song;
    throw error;
  }
  let stems;
  try {
    stems = await separateSongStems(song, run, emit);
  } catch (error) {
    // Preserve the real master, without presenting it as an isolated vocal.
    error.songUrl = song;
    throw error;
  }
  return {
    audioUrl: stems.vocalUrl,
    instrumentalUrl: stems.instrumentalUrl,
    songUrl: song,
    provider: 'minimax-music-2.6-demucs',
    performanceType: 'coherent-song-stems',
  };
}

module.exports = { SONG_MODEL, STEM_MODEL, generateMusicalVocal, separateSongStems, separateVocal };
