const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const ffmpegPath = require('ffmpeg-static');
const { WaveFile } = require('wavefile');

const {
  normalizeProducerTracks,
  buildMultiStemFilterGraph,
  mixMultipleStems,
} = require('../services/audioMixingService');

test('normalizes producer controls and removes muted tracks', () => {
  const tracks = normalizeProducerTracks([
    { id: 'beat', url: 'https://example.com/beat.mp3', role: 'beat', volume: 99, pan: -4, offset: -10 },
    { id: 'vocal', url: 'https://example.com/vocal.mp3', role: 'vocal', volume: 0.7, trimStart: 2, trimEnd: 1 },
    { id: 'muted', url: 'https://example.com/muted.mp3', muted: true },
  ]);

  assert.equal(tracks.length, 2);
  assert.equal(tracks[0].volume, 1.5);
  assert.equal(tracks[0].pan, -1);
  assert.equal(tracks[0].offset, 0);
  assert.equal(tracks[1].role, 'vocal');
});

test('builds separate vocal and music buses with safe sidechain mastering', () => {
  const result = buildMultiStemFilterGraph([
    { id: 'beat', url: 'https://example.com/beat.mp3', role: 'beat', volume: 0.65 },
    { id: 'synth', url: 'https://example.com/synth.wav', role: 'instrument', pan: 0.25 },
    { id: 'lead', url: 'https://example.com/lead.mp3', role: 'vocal', offset: 1.5, fadeIn: 0.2 },
    { id: 'harmony', url: 'https://example.com/harmony.mp3', role: 'harmony', volume: 0.5 },
  ], { lufsTarget: -13 });

  assert.equal(result.tracks.length, 4);
  assert.match(result.filterComplex, /amix=inputs=2.*\[music_bus\]/);
  assert.match(result.filterComplex, /amix=inputs=2.*\[vocal_bus\]/);
  assert.match(result.filterComplex, /adelay=1500:all=1/);
  assert.match(result.filterComplex, /sidechaincompress=/);
  assert.match(result.filterComplex, /loudnorm=I=-13/);
  assert.equal(result.outputLabel, 'producer_master');
});

test('solo tracks are the only tracks rendered', () => {
  const result = buildMultiStemFilterGraph([
    { id: 'beat', url: 'https://example.com/beat.mp3', role: 'beat' },
    { id: 'lead', url: 'https://example.com/lead.mp3', role: 'vocal', solo: true },
  ]);

  assert.deepEqual(result.tracks.map((track) => track.id), ['lead']);
  assert.doesNotMatch(result.filterComplex, /sidechaincompress=/);
});

test('rejects a session with no audible media', () => {
  assert.throws(
    () => buildMultiStemFilterGraph([{ url: 'https://example.com/a.mp3', muted: true }]),
    /At least one audible track/,
  );
});

test('never silently drops tracks beyond the supported lane count', () => {
  assert.throws(() => buildMultiStemFilterGraph(Array.from({ length: 13 }, () => ({ url: 'https://example.test/a.mp3' }))), /at most 12/);
});

test('fade-out follows actual source duration, including a trim beyond its end', () => {
  for (const trimEnd of [null, 30]) {
    const result = buildMultiStemFilterGraph([{ url: 'a', trimStart: 2, trimEnd, fadeOut: 1 }], { sourceDurations: [10] });
    assert.match(result.filterComplex, /afade=t=out:st=7:d=1/);
  }
  assert.throws(() => buildMultiStemFilterGraph([{ url: 'a', fadeOut: 1 }]), /duration is required/);
});

test('full-track fade and hard-left balance are audible in the actual FFmpeg export', async () => {
  const rate = 44100;
  const wav = new WaveFile();
  wav.fromScratch(1, rate, '16', Array.from({ length: rate * 2 }, (_, i) => Math.round(Math.sin(2 * Math.PI * 220 * i / rate) * 8000)));
  const result = await mixMultipleStems([{ url: `data:audio/wav;base64,${Buffer.from(wav.toBuffer()).toString('base64')}`, pan: -1, fadeOut: 0.8 }], { autoDuck: false });
  try {
    const pcm = execFileSync(ffmpegPath, ['-v', 'error', '-i', result.outputPath, '-ar', String(rate), '-ac', '2', '-f', 'f32le', '-'], { maxBuffer: 4 * 1024 * 1024, windowsHide: true });
    const rms = (start, end, channel) => {
      let sum = 0, count = 0;
      for (let i = Math.floor(start * rate); i < Math.min(Math.floor(end * rate), pcm.length / 8); i++) { sum += pcm.readFloatLE(i * 8 + channel * 4) ** 2; count++; }
      return Math.sqrt(sum / count);
    };
    assert.ok(rms(0.5, 1, 0) > 0.01, 'left channel has actual audio');
    assert.ok(rms(0.5, 1, 1) < rms(0.5, 1, 0) * 0.01, 'hard-left balance silences right channel');
    assert.ok(rms(1.9, 1.98, 0) < rms(0.5, 1, 0) * 0.3, 'requested fade attenuates the end without explicit trim-out');
  } finally { fs.unlinkSync(result.outputPath); }
});

test('renders a real two-lane preview master through bundled FFmpeg', async () => {
  const createTone = (frequency) => {
    const sampleRate = 44100;
    const samples = Array.from({ length: sampleRate }, (_, index) => (
      Math.round(Math.sin((2 * Math.PI * frequency * index) / sampleRate) * 8000)
    ));
    const wav = new WaveFile();
    wav.fromScratch(1, sampleRate, '16', samples);
    return `data:audio/wav;base64,${Buffer.from(wav.toBuffer()).toString('base64')}`;
  };

  const result = await mixMultipleStems([
    { id: 'beat', name: 'Test beat', url: createTone(220), role: 'beat', volume: 0.55 },
    { id: 'lead', name: 'Test lead', url: createTone(440), role: 'vocal', volume: 0.65, offset: 0.1 },
  ], { autoDuck: true, lufsTarget: -14 }, {
    info() {},
    error(_message, detail) { process.stderr.write(`${detail?.stderr || detail?.error || ''}\n`); },
  });

  try {
    assert.equal(result.success, true);
    assert.equal(result.processing.trackCount, 2);
    assert.ok(fs.statSync(result.outputPath).size > 5000);
  } finally {
    try { fs.unlinkSync(result.outputPath); } catch { /* best-effort temp cleanup */ }
  }
});
