// Local reproduction of /api/create-final-mix processing with real asset URLs.
// usage: node scripts/repro-final-mix.js <vocalUrl> <beatUrl> [coverArtUrl]
const path = require('path');
const fs = require('fs');
const svc = require('../services/audioMixingService');
if (process.env.FFMPEG_OVERRIDE) require('fluent-ffmpeg').setFfmpegPath(process.env.FFMPEG_OVERRIDE);

const logger = {
  info: (m, d) => console.log('[info]', m, d ? JSON.stringify(d).slice(0, 300) : ''),
  warn: (m, d) => console.log('[warn]', m, d ? JSON.stringify(d).slice(0, 400) : ''),
  error: (m, d) => console.log('[error]', m, d ? (typeof d === 'string' ? d : JSON.stringify(d)).slice(0, 800) : ''),
  debug: () => {}
};

const [vocalUrl, beatUrl] = process.argv.slice(2);
if (!vocalUrl || !beatUrl) { console.error('need vocalUrl beatUrl'); process.exit(2); }

(async () => {
  const tempDir = path.join(__dirname, '..', 'temp');
  fs.mkdirSync(tempDir, { recursive: true });
  const ts = Date.now();
  const rawVocalPath = path.join(tempDir, `vocal_raw_${ts}.mp3`);
  const beatLocalPath = path.join(tempDir, `beat_local_${ts}.mp3`);
  await Promise.all([svc.downloadAudio(vocalUrl, rawVocalPath), svc.downloadAudio(beatUrl, beatLocalPath)]);
  console.log('downloaded', fs.statSync(rawVocalPath).size, fs.statSync(beatLocalPath).size);

  let currentVocalPath = rawVocalPath;
  const t = Date.now();
  try {
    const tuned = path.join(tempDir, `vocal_tuned_${ts}.mp3`);
    const r = await svc.applyAutoTuneEffect(currentVocalPath, 'trap', tuned, logger);
    console.log('autotune ->', r === currentVocalPath ? 'skipped' : 'ok', Date.now() - t, 'ms');
    if (r !== currentVocalPath) currentVocalPath = r;
  } catch (e) { console.log('AUTOTUNE FAILED', e.message); }

  try {
    const targetBpm = 140;
    const vocalBpm = await svc.detectBpmFromFile(currentVocalPath, logger);
    console.log('vocalBpm', vocalBpm);
    if (vocalBpm && vocalBpm !== targetBpm) {
      const stretched = path.join(tempDir, `vocal_stretched_${ts}.mp3`);
      const r = await svc.tempoStretchVocal(currentVocalPath, vocalBpm, targetBpm, stretched, logger);
      console.log('stretch ->', r === currentVocalPath ? 'skipped' : 'ok');
      if (r !== currentVocalPath) currentVocalPath = r;
    }
    const entry = await svc.detectDownbeatOffset(beatLocalPath, targetBpm, logger);
    console.log('downbeat entry', entry);
    if (entry > 0) {
      const padded = path.join(tempDir, `vocal_aligned_${ts}.mp3`);
      const r = await svc.padVocalStart(currentVocalPath, entry, padded, logger);
      console.log('pad ->', r === currentVocalPath ? 'skipped' : 'ok');
      if (r !== currentVocalPath) currentVocalPath = r;
    }
  } catch (e) { console.log('TEMPO SYNC FAILED', e.message); }

  const processedVocalUrl = `data:audio/mpeg;base64,${fs.readFileSync(currentVocalPath).toString('base64')}`;
  const preset = svc.getMixPreset('rapper-over-beat');
  const outputPath = path.join(tempDir, `final_mix_${ts}.mp3`);
  const t2 = Date.now();
  try {
    const mixResult = await svc.mixAudioFromUrls(processedVocalUrl, beatUrl, { ...preset, vocalVolume: 0.85, beatVolume: 0.6, outputFormat: 'music', outputPath }, logger);
    console.log('MIX OK', Date.now() - t2, 'ms', mixResult && mixResult.outputPath, fs.existsSync(outputPath) && fs.statSync(outputPath).size);
  } catch (e) {
    console.log('MIX FAILED', Date.now() - t2, 'ms', e.message);
    process.exit(1);
  }
})();
