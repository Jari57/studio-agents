const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { LATIN_PROFILES, latinGenreProfile } = require('../services/genreDirection');
const { SONG_MODEL, generateMusicalVocal } = require('../services/musicalVocalService');

test('genre palettes keep salsa, bachata and Dominican dembow distinct', () => {
  assert.deepEqual(Object.keys(LATIN_PROFILES), ['salsa', 'bachata', 'dembow']);
  assert.match(latinGenreProfile('Salsa').instrumental, /montuno.*congas/);
  assert.match(latinGenreProfile('batchata').instrumental, /requinto.*bongos/);
  assert.match(latinGenreProfile('dembo').instrumental, /Dominican dembow/);
  assert.equal(latinGenreProfile('reggaeton'), null);
  assert.equal(latinGenreProfile('unknown'), null);
});

for (const genre of Object.keys(LATIN_PROFILES)) {
  test(`${genre} guides a complete MiniMax performance and separates that same song`, async () => {
    const calls = [];
    const lyrics = '[Verse]\nEsta es mi cancion original\n[Chorus]\nBailamos juntos otra vez';
    const result = await generateMusicalVocal({
      lyrics, genre, style: genre === 'dembow' ? 'rapper' : 'singer', language: 'Spanish', bpm: 128,
      musicalDirection: 'Custom brief '.repeat(400),
    }, async (model, input) => {
      calls.push({ model, input });
      return model === SONG_MODEL ? 'https://example.test/song.mp3'
        : { vocals: 'https://example.test/vocals.mp3', other: 'https://example.test/instrumental.mp3' };
    });
    assert.ok(calls[0].input.prompt.includes(LATIN_PROFILES[genre].instrumental));
    assert.ok(calls[0].input.prompt.includes(LATIN_PROFILES[genre].vocal));
    assert.match(calls[0].input.prompt, /Language: Spanish/);
    assert.match(calls[0].input.prompt, /128 BPM/);
    assert.match(calls[0].input.prompt, /no spoken introduction/);
    assert.ok(calls[0].input.prompt.length <= 2000);
    assert.equal(calls[0].input.lyrics, lyrics);
    assert.equal(calls[1].input.audio, 'https://example.test/song.mp3');
    assert.equal(result.instrumentalUrl, 'https://example.test/instrumental.mp3');
  });
}

test('standalone beat generation uses the same Latin instrumental palettes', () => {
  const server = readFileSync(require.resolve('../server.js'), 'utf8');
  assert.match(server, /Object\.entries\(require\('\.\/services\/genreDirection'\)\.LATIN_PROFILES\)/);
  assert.match(server, /\[genre, profile\.instrumental\]/);
});
