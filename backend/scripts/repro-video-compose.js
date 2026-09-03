// Local reproduction of the composition + beat-sync stages of generateSyncedMusicVideo
// using already-generated Hailuo segments (no paid provider calls).
const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');
const { composeVideoWithBeats, createBeatSyncedVideo, getVideoMetadata, downloadFile } = require('../services/videoCompositionService');
if (process.env.FFMPEG_OVERRIDE) {
  require('fluent-ffmpeg').setFfmpegPath(process.env.FFMPEG_OVERRIDE);
  console.log('using ffmpeg override', process.env.FFMPEG_OVERRIDE);
}

const logger = {
  info: (m, d) => console.log('[info]', m, d ? JSON.stringify(d).slice(0, 400) : ''),
  warn: (m, d) => console.log('[warn]', m, d ? JSON.stringify(d).slice(0, 400) : ''),
  error: (m, d) => console.log('[error]', m, d ? JSON.stringify(d).slice(0, 800) : ''),
  debug: () => {}
};

const SEGMENT_URLS = process.argv.slice(2);
if (SEGMENT_URLS.length === 0) {
  console.error('usage: node scripts/repro-video-compose.js <segmentUrl> [segmentUrl2]');
  process.exit(2);
}

(async () => {
  const tempDir = path.join(__dirname, '..', 'temp');
  fs.mkdirSync(tempDir, { recursive: true });
  const ffmpegBin = require('ffmpeg-static');
  const audioPath = path.join(tempDir, 'repro_audio.mp3');
  if (!fs.existsSync(audioPath)) {
    const r = spawnSync(ffmpegBin, ['-y', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=60', '-b:a', '128k', audioPath], { encoding: 'utf8' });
    if (r.status !== 0) { console.error(r.stderr); process.exit(1); }
  }

  const source = [];
  for (let i = 0; i < SEGMENT_URLS.length; i++) {
    const segPath = path.join(tempDir, `repro_segment_${i}.mp4`);
    await downloadFile(SEGMENT_URLS[i], segPath);
    console.log('downloaded', segPath, fs.statSync(segPath).size);
    source.push({ path: segPath, duration: 6 });
  }

  const timelineSegments = 10; // 60s / 6s
  const segments = Array.from({ length: timelineSegments }, (_, i) => ({ ...source[i % source.length] }));
  const beats = Array.from({ length: 140 }, (_, i) => Math.round(i * (60000 / 140)));

  const composedPath = path.join(tempDir, 'repro_composed.mp4');
  const t0 = Date.now();
  try {
    await composeVideoWithBeats(segments, audioPath, composedPath, beats, logger);
    console.log('compose OK in', Date.now() - t0, 'ms', fs.statSync(composedPath).size);
  } catch (e) {
    console.log('COMPOSE FAILED:', e.message);
    process.exit(1);
  }

  const syncedPath = path.join(tempDir, 'repro_synced.mp4');
  const t1 = Date.now();
  try {
    await createBeatSyncedVideo(composedPath, audioPath, beats, syncedPath, logger);
    console.log('beat sync OK in', Date.now() - t1, 'ms', fs.statSync(syncedPath).size);
  } catch (e) {
    console.log('BEAT SYNC FAILED:', e.message);
    process.exit(1);
  }

  const meta = await getVideoMetadata(syncedPath, logger).catch((e) => ({ error: e.message }));
  console.log('metadata', meta);
})();
