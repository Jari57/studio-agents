import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { serializeProductionConfig, restoreProductionConfig, withProductionConfig, mergeProductionAssets } from '../src/utils/productionProjectConfig.mjs';
import { mergeGeneratedProject } from '../src/utils/projectPersistence.mjs';

const artOnly = { selectedAgents: { lyrics: null, audio: null, visual: 'album', video: null }, quickMode: false, quickOutcome: 'song-draft', quickGenre: 'Indie' };

test('artwork-only autosave and manual save round-trip exact scope and mode without buying extra outputs', () => {
  const initial = { id: 'p', assets: [] };
  const automatic = withProductionConfig({ ...initial, assets: [{ id: 'art', type: 'image', imageUrl: 'https://example.test/a.png' }] }, artOnly);
  assert.deepEqual(restoreProductionConfig(JSON.parse(JSON.stringify(automatic))), serializeProductionConfig(artOnly));
  const manual = withProductionConfig({ ...automatic, name: 'My cover' }, artOnly);
  assert.deepEqual(restoreProductionConfig(JSON.parse(JSON.stringify(manual))), serializeProductionConfig(artOnly));
});

test('quick song-draft configuration and non-default generator IDs survive reopening', () => {
  const config = { selectedAgents: { lyrics: 'custom-lyric-agent', audio: 'custom-beat-agent', visual: null, video: null }, quickMode: true, quickOutcome: 'song-draft', quickGenre: 'Rock' };
  assert.deepEqual(restoreProductionConfig(withProductionConfig({ id: 'p' }, config)), serializeProductionConfig(config));
});

test('legacy image-only projects open Advanced with one generator even if old display-name list claims four', () => {
  const restored = restoreProductionConfig({ id: 'p', agents: ['Ghostwriter', 'Beat Lab', 'Album Artist', 'Video Creator'], assets: [{ id: 'a', type: 'visual', imageUrl: 'https://example.test/a.png' }] });
  assert.deepEqual(restored.selectedAgents, artOnly.selectedAgents);
  assert.equal(restored.quickMode, false);
  const unknown = restoreProductionConfig({ id: 'empty', assets: [] });
  assert.equal(Object.values(unknown.selectedAgents).some(Boolean), false);
  assert.equal(unknown.quickMode, false);
});

test('explicitly disabled slots stay disabled rather than inheriting full-package defaults', () => {
  const empty = serializeProductionConfig({ selectedAgents: {}, quickMode: false });
  assert.deepEqual(restoreProductionConfig({ id: 'p', productionConfig: empty }).selectedAgents, { lyrics: null, audio: null, visual: null, video: null });
  assert.equal(restoreProductionConfig(null).quickMode, true);
});

test('same image autosave/manual retry/reopen reuse one ID; genuinely changed artwork keeps both versions', () => {
  const original = [{ id: 'image-autosave', type: 'image', title: 'Cover take', imageUrl: 'https://example.test/a.png', createdAt: 'first', provider: 'real-provider' }];
  const cache = new Map();
  const first = mergeProductionAssets(original, [{ id: 'visual-random-one', type: 'visual', imageUrl: 'https://example.test/a.png', content: 'Art direction', createdAt: 'later' }], cache);
  assert.equal(first.length, 1);
  assert.equal(first[0].id, original[0].id);
  assert.equal(first[0].type, 'image');
  assert.equal(first[0].createdAt, 'first');
  assert.equal(first[0].provider, 'real-provider');
  const reopened = JSON.parse(JSON.stringify(first));
  const second = mergeProductionAssets(reopened, [{ id: 'visual-random-two', type: 'visual', imageUrl: 'https://example.test/a.png', content: 'Art direction' }]);
  assert.equal(second.length, 1);
  assert.equal(second[0].id, 'image-autosave');
  const changed = mergeProductionAssets(second, [{ id: 'new-take', type: 'visual', imageUrl: 'https://example.test/b.png' }]);
  assert.deepEqual(changed.map(a => a.id), ['image-autosave', 'new-take']);
});

test('same text saves reuse identity but a revision differing after a long prefix remains separate', () => {
  const content = 'a'.repeat(250) + ' ending one';
  const prior = [{ id: 'lyrics-one', type: 'lyrics', content }];
  assert.equal(mergeProductionAssets(prior, [{ id: 'random-save', type: 'lyrics', content }]).length, 1);
  assert.equal(mergeProductionAssets(prior, [{ id: 'lyrics-two', type: 'lyrics', content: 'a'.repeat(250) + ' ending two' }]).length, 2);
});

test('failed save retry uses the cached output identity even before parent acknowledgement', () => {
  const cache = new Map();
  const first = mergeProductionAssets([], [{ id: 'original-id', type: 'image', imageUrl: 'https://example.test/a.png' }], cache);
  const second = mergeProductionAssets([], [{ id: 'new-random-id', type: 'visual', imageUrl: 'https://example.test/a.png' }], cache);
  assert.equal(second[0].id, first[0].id);
});

test('canonical production assets integrate with history-preserving parent merge without duplicate manual saves', () => {
  const baseline = { id: 'p', assets: [{ id: 'auto-art', type: 'image', imageUrl: 'https://example.test/a.png' }] };
  let current = baseline;
  for (let index = 0; index < 3; index++) {
    const incoming = { ...baseline, assets: mergeProductionAssets(current.assets, [{ id: `random-${index}`, type: 'visual', imageUrl: 'https://example.test/a.png', content: 'Same artwork' }]) };
    current = mergeGeneratedProject(current, incoming, baseline);
  }
  assert.deepEqual(current.assets.map(a => a.id), ['auto-art']);
});

test('all save paths pass through config/identity wrapper; restore stays project-scoped and empty selection fails before clearing', () => {
  const source = readFileSync(new URL('../src/components/StudioOrchestratorV2.jsx', import.meta.url), 'utf8');
  assert.match(source, /function confirmProjectSave\(save, project\)[\s\S]*?withProductionConfig\(project, \{ selectedAgents, quickMode, quickOutcome, quickGenre \}\)/);
  assert.match(source, /return confirmCloudProjectSave\(save,[\s\S]*?mergeProductionAssets\(existingProject\?\.assets/);
  const restore = source.slice(source.indexOf('// Restore project settings'), source.indexOf('// Fetch saved voices from Firestore'));
  assert.match(restore, /setSelectedAgents\(productionConfig\.selectedAgents\)/);
  assert.match(restore, /\[existingProject\?\.id\]/);
  assert.doesNotMatch(source, /Auto-selected default agents for empty selection/);
  assert.ok(source.indexOf("'orch-no-generators'") < source.indexOf('// Track whether we\'re starting fresh'));
});
