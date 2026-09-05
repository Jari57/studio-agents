const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const ffmpeg = require('ffmpeg-static');
const { SAFE_AUDIO_INPUT_ARGS } = require('../services/audioInputSafety');
const { tempoStretchVocal, padVocalStart } = require('../services/audioMixingService');

test('requested timing effects reject missing analysis, extreme edits and missing files instead of silently returning originals', async () => {
  for (const bpms of [[null, 120], ['unknown', 120], [60, 160]]) await assert.rejects(tempoStretchVocal('missing', ...bpms, 'unused'), /requires|too extreme/);
  await assert.rejects(tempoStretchVocal('missing', 100, 110, 'unused'), /Tempo processing failed/);
  await assert.rejects(padVocalStart('missing', 1, 'unused'), /Vocal padding failed/);
  await assert.rejects(padVocalStart('missing', 11, 'unused'), /between zero and ten/);
  assert.equal(await tempoStretchVocal('original', 120, 120, 'unused'), 'original');
  assert.equal(await padVocalStart('original', 0, 'unused'), 'original');
});

test('real FFmpeg rejects nested playlists before following any embedded URL or local path', () => {
  for (const payload of [
    '#EXTM3U\n#EXT-X-TARGETDURATION:2\n#EXTINF:2,\nhttp://127.0.0.1/secret\n#EXT-X-ENDLIST\n',
    "ffconcat version 1.0\nfile '/this-path-must-never-be-read.wav'\n",
  ]) {
    const result = spawnSync(ffmpeg, ['-v', 'error', ...SAFE_AUDIO_INPUT_ARGS, '-i', 'pipe:0', '-f', 'null', '-'],
      { input: Buffer.from(payload), encoding: 'utf8', timeout: 5000, windowsHide: true });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /not on whitelist|not in.*whitelist|Invalid data/i);
    assert.doesNotMatch(result.stderr, /Connection refused|Failed to open|Impossible to open/);
  }
});
