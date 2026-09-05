import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { LATIN_SONG_GENRES, LATIN_GENRE_PRESETS, detectLatinGenre } from '../src/utils/latinGenres.mjs';
import { restoreProductionConfig, withProductionConfig } from '../src/utils/productionProjectConfig.mjs';

test('Salsa, Bachata and Dembow have distinct editable song presets', () => {
  assert.deepEqual(LATIN_SONG_GENRES.map(({ label }) => label), ['Salsa', 'Bachata', 'Dembow']);
  for (const { label, bpm, hint, voice } of LATIN_SONG_GENRES) {
    assert.equal(LATIN_GENRE_PRESETS[label].bpm, bpm);
    assert.equal(LATIN_GENRE_PRESETS[label].structure, 'Full Song');
    assert.ok(bpm >= 40 && bpm <= 240);
    assert.ok(hint.length > 40);
    assert.ok(['singer', 'rapper'].includes(voice));
    assert.equal('language' in LATIN_GENRE_PRESETS[label], false, 'genre must not overwrite chosen language');
  }
});

test('genre detection understands spelling variants without matching parts of unrelated words', () => {
  for (const [brief, expected] of [
    ['An energetic SALSA song', 'salsa'], ['romantic batchata with guitar', 'bachata'],
    ['Bachata with pop vocals', 'bachata'], ['Dominican dembo with rap hooks', 'dembow'],
    ['Dembow', 'dembow'], ['reggaeton', undefined], ['demboxtest and salsalike', undefined],
  ]) assert.equal(detectLatinGenre(brief)?.id, expected);
});

test('each added genre survives project save and reopening', () => {
  for (const { label } of LATIN_SONG_GENRES) {
    const project = withProductionConfig({ id: 'existing-project' }, {
      selectedAgents: { lyrics: 'ghost', audio: 'beat' }, quickGenre: label, quickOutcome: 'song', quickMode: true,
    });
    assert.equal(restoreProductionConfig(project).quickGenre, label);
  }
});

test('Quick Create, advanced vocals and both studio selectors share the added genre options', () => {
  const orchestrator = readFileSync(new URL('../src/components/StudioOrchestratorV2.jsx', import.meta.url), 'utf8');
  const studio = readFileSync(new URL('../src/components/StudioView.jsx', import.meta.url), 'utf8');
  assert.match(orchestrator, /\.\.\.LATIN_GENRE_PRESETS/);
  assert.match(orchestrator, /LATIN_SONG_GENRES\.map/);
  assert.equal((studio.match(/LATIN_SONG_GENRES\.map/g) || []).length, 2);
  assert.doesNotMatch(orchestrator, /'Reggaeton':\s*\['reggaeton', 'perreo', 'dembow'\]/);
  assert.match(orchestrator, /if \(prev === 'cloned'\) return prev/);
});
