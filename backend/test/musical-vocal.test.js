const test = require('node:test');
const assert = require('node:assert/strict');
const { SONG_MODEL, STEM_MODEL, generateMusicalVocal, separateVocal } = require('../services/musicalVocalService');
const brief = { lyrics: '[Verse]\nAn original test lyric line', style: 'singer', genre: 'soul', duration: 30, bpm: 92 };

test('musical generation returns only the separated vocal with unchanged lyrics', async () => {
  const calls = [];
  const result = await generateMusicalVocal(brief, async (model, input) => {
    calls.push({ model, input });
    return model === SONG_MODEL ? 'https://example.test/song.mp3' : { vocals: 'https://example.test/vocals.mp3', other: 'https://example.test/beat.mp3' };
  });
  assert.equal(result.audioUrl, 'https://example.test/vocals.mp3');
  assert.equal(result.performanceType, 'isolated-musical-vocal');
  assert.deepEqual(calls.map(call => call.model), [SONG_MODEL, STEM_MODEL]);
  assert.equal(calls[0].input.lyrics, brief.lyrics);
  assert.equal(calls[0].input.lyrics_optimizer, false);
  assert.match(calls[0].input.prompt, /92 BPM/);
  assert.equal(calls[1].input.audio, 'https://example.test/song.mp3');
  assert.equal(calls[1].input.stem, 'vocals');
});
test('missing vocal stem cannot fall back to accompaniment or full song', async () => {
  await assert.rejects(generateMusicalVocal(brief, async model => model === SONG_MODEL
    ? 'https://example.test/song.mp3' : { other: 'https://example.test/beat.mp3' }), /usable audio/);
});
test('empty/oversized lyrics fail before any billable provider call', async () => {
  for (const lyrics of ['', ' '.repeat(4), 'a'.repeat(3501)]) {
    await assert.rejects(generateMusicalVocal({ ...brief, lyrics }, () => assert.fail('must not generate')), { status: 422 });
  }
});
test('provider errors do not create duplicate performances', async () => {
  let calls = 0;
  await assert.rejects(generateMusicalVocal(brief, async () => { calls++; throw new Error('provider unavailable'); }), /provider unavailable/);
  assert.equal(calls, 1);
});
test('a separator failure is terminal, without another paid song generation', async () => {
  let calls = 0;
  await assert.rejects(generateMusicalVocal(brief, async () => {
    if (++calls === 1) return 'https://example.test/song.mp3';
    throw new Error('separator unavailable');
  }), { message: 'separator unavailable', stage: 'separation' });
  assert.equal(calls, 2);
});
test('legacy musical output is also explicitly separated, not relabeled', async () => {
  const url = await separateVocal('data:audio/mpeg;base64,test-fixture', async (_model, input) => {
    assert.equal(input.stem, 'vocals');
    return { vocals: 'https://example.test/isolated.mp3' };
  });
  assert.equal(url, 'https://example.test/isolated.mp3');
});
