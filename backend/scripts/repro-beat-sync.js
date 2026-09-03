// Local regression check for the production video failure:
//  - MP3 beat analysis (was: empty beats because only WAV parsed)
//  - beat-sync pass on portrait video with no beats (was: odd height -> ffmpeg 7+ exit 187)
//  - beat-sync pass with beats (eval=frame)
const path = require('path');
const fs = require('fs');
const { createBeatSyncedVideo, getVideoMetadata } = require('../services/videoCompositionService');
const { analyzeMusicBeats } = require('../services/beatDetectionService');
if (process.env.FFMPEG_OVERRIDE) require('fluent-ffmpeg').setFfmpegPath(process.env.FFMPEG_OVERRIDE);

const logger = {
  info: (m, d) => console.log('[info]', m, d ? JSON.stringify(d).slice(0, 300) : ''),
  warn: (m, d) => console.log('[warn]', m, d ? JSON.stringify(d).slice(0, 300) : ''),
  error: (m, d) => console.log('[error]', m, d ? JSON.stringify(d).slice(0, 800) : ''),
  debug: () => {}
};

(async () => {
  const tempDir = path.join(__dirname, '..', 'temp');
  const composed = path.join(tempDir, 'repro_composed.mp4');
  const audio = path.join(tempDir, 'repro_audio.mp3');
  if (!fs.existsSync(composed) || !fs.existsSync(audio)) {
    console.error('run repro-video-compose.js first');
    process.exit(2);
  }

  // 1. MP3 analysis via file URL substitute: data URI
  const dataUri = 'data:audio/mpeg;base64,' + fs.readFileSync(audio).toString('base64');
  const analysis = await analyzeMusicBeats(dataUri, logger);
  console.log('analysis', { bpm: analysis.bpm, beats: analysis.beats.length, duration: analysis.duration, error: analysis.error });
  if (analysis.error) { console.log('ANALYSIS FAILED'); process.exit(1); }

  // 2. No-beat path (the production failure)
  const outNoBeats = path.join(tempDir, 'repro_sync_nobeats.mp4');
  try {
    await createBeatSyncedVideo(composed, audio, [], outNoBeats, logger);
    console.log('no-beat sync OK', (await getVideoMetadata(outNoBeats, logger)).video);
  } catch (e) { console.log('NO-BEAT SYNC FAILED:', e.message); process.exit(1); }

  // 3. Beat path with eval=frame
  const outBeats = path.join(tempDir, 'repro_sync_beats.mp4');
  const beats = Array.from({ length: 60 }, (_, i) => i * 500);
  try {
    await createBeatSyncedVideo(composed, audio, beats, outBeats, logger);
    console.log('beat sync OK', (await getVideoMetadata(outBeats, logger)).video);
  } catch (e) { console.log('BEAT SYNC FAILED:', e.message); process.exit(1); }
})();
