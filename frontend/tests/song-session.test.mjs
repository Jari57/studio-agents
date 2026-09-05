import test from 'node:test';
import assert from 'node:assert/strict';
import { songSessionState, songStateSignature, mixStateSignature, authoritativeMaster } from '../src/utils/songSession.mjs';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { withProductionConfig, mergeProductionAssets } from '../src/utils/productionProjectConfig.mjs';
import { confirmProjectSave as confirmCloudProjectSave } from '../src/utils/productionIntegrity.mjs';

test('the actual save wrapper acknowledges its submitted master/settings snapshot, not a later unsaved edit', async () => {
  const source = readFileSync(new URL('../src/components/StudioOrchestratorV2.jsx', import.meta.url), 'utf8');
  const code = source.slice(source.indexOf('  function confirmProjectSave(save, project)'), source.indexOf('  const [selectedOutputPreset'));
  const session = songSessionState({ mixVocalVolume: 0, references: [], personalLyricsExcerpt: 'Original verse' });
  const state = { session, outputs: { lyrics: 'Verse' }, mediaUrls: { mixedAudio: 'old-master' }, mood: 'Calm', bars: 24, useBars: true };
  const currentSongSignatureRef = { current: songStateSignature(state) }, savedSongSignatureRef = { current: null };
  const confirm = runInNewContext(`${code}\nconfirmProjectSave`, { withProductionConfig, mergeProductionAssets, confirmCloudProjectSave, songStateSignature,
    selectedAgents: { lyrics: 'ghost', audio: 'beat' }, quickMode: true, quickOutcome: 'song', quickGenre: 'Salsa',
    currentSongSignatureRef, currentSongSessionRef: { current: session }, outputsRef: { current: state.outputs }, mediaUrlsRef: { current: state.mediaUrls },
    savedSongSignatureRef, existingProject: { assets: [] }, productionAssetIdentityRef: { current: new Map() },
  });
  let submitted, release;
  const completion = confirm(async payload => { submitted = payload; await new Promise(resolve => { release = resolve; }); return true; },
    { id: 'p', assets: [], mediaUrls: { mixedAudio: 'new-master' } });
  assert.equal(submitted.mediaUrls.mixedAudio, 'new-master'); assert.equal(submitted.songSession.mixVocalVolume, 0);
  assert.equal(submitted.mood, 'Calm'); assert.equal(submitted.musicalBars, 24); assert.equal(submitted.useBars, true);
  currentSongSignatureRef.current = songStateSignature({ ...state, outputs: { lyrics: 'A later unsaved edit' } });
  release(); await completion;
  assert.equal(savedSongSignatureRef.current, songStateSignature({ ...state, mediaUrls: { mixedAudio: 'new-master' } }));
  assert.notEqual(savedSongSignatureRef.current, currentSongSignatureRef.current);
});
import { restoreProjectOutputs } from '../src/utils/projectRestore.mjs';
import { initialProducerSession } from '../src/utils/producerSession.mjs';
import { deliveryReadiness } from '../src/utils/deliveryReadiness.mjs';
import { singingVoiceReadiness } from '../src/utils/personalVoiceReadiness.mjs';

test('song session survives JSON save/reopen including reference choices, excerpt, structure and zero gains', () => {
  const session = songSessionState({ voiceSource: 'personal', personalReferenceId: 'my-reference', personalLyricsExcerpt: 'My original hook',
    references: [{ assetId: 'style-one', url: 'https://example.com/style.wav', name: 'My style' }], referenceSongUrl: null,
    mixVocalVolume: 0, mixBeatVolume: 0.33, mixPreset: 'balanced', genre: 'bachata', songStructure: 'verse-chorus',
    arrangementSections: [{ id: 'verse-a', type: 'verse', label: 'Verse A', color: '#557766', bars: 16 }],
    expandedSections: { lyrics: false, productionHub: true, arrangement: true },
    renderedMixSignature: 'render', performance: { id: 'take-new', vocalUrl: 'v-new', instrumentalUrl: 'b-new', masterUrl: 'm-new' } });
  assert.deepEqual(songSessionState(JSON.parse(JSON.stringify(session))), session);
  assert.equal(session.expandedSections.productionHub, true); assert.equal(session.expandedSections.lyrics, false);
  assert.equal(session.arrangementSections[0].bars, 16);
  const removed = songSessionState({ ...session, references: [], referenceSongUrl: null, personalReferenceId: null, voiceSampleUrl: null });
  assert.deepEqual(removed.references, []); assert.equal(removed.personalReferenceId, null); assert.equal(removed.mixVocalVolume, 0);
});

test('reopening never resurrects explicitly cleared outputs or references from the historical library', () => {
  const project = { id: 'a', mediaUrls: { audio: null, vocals: null, lyricsVocal: null, mixedAudio: null, image: null }, outputs: { lyrics: '' }, assets: [
    { type: 'beat', audioUrl: 'old-beat' }, { type: 'vocal', audioUrl: 'old-vocal' }, { type: 'master', audioUrl: 'old-master' },
    { type: 'image', imageUrl: 'old-cover' }, { type: 'lyrics', content: 'old lyrics' },
  ] };
  assert.deepEqual(restoreProjectOutputs(project), { media: project.mediaUrls, outputs: project.outputs });
  assert.deepEqual(initialProducerSession(project).tracks, []);
});

test('legacy recovery chooses newest timestamp rather than first four assets or an obsolete master', () => {
  const assets = [ { type: 'beat', audioUrl: 'older', createdAt: '2026-01-01' }, { type: 'beat', audioUrl: 'newest', createdAt: '2026-09-04' },
    { type: 'master', audioUrl: 'master' }, { type: 'vocal', audioUrl: 'voice', createdAt: '2026-09-04' } ];
  const restored = restoreProjectOutputs({ assets }); assert.equal(restored.media.audio, 'newest');
  const producer = initialProducerSession({ id: 'p', assets });
  assert.deepEqual(producer.tracks.map(t => t.url), ['newest', 'voice']); assert.equal(producer.bpm, null); assert.equal(producer.key, '');
  assert.deepEqual(initialProducerSession({ id: 'p', assets }, { projectId: 'p', tracks: [] }).tracks, []);
  assert.deepEqual(initialProducerSession({ id: 'p', sessionState: { tracks: [] }, assets }).tracks, []);
});

test('master is authoritative and any source, gain or preset change marks its render signature stale', () => {
  const media = { audio: 'beat', vocals: 'voice', mixedAudio: 'master' }; const state = { mixVocalVolume: 0, mixBeatVolume: 0.4, mixPreset: 'balanced' };
  assert.equal(authoritativeMaster(media, 'beat'), 'master'); assert.equal(authoritativeMaster({ audio: 'beat' }, 'beat'), null);
  const original = mixStateSignature(media, state);
  for (const changed of [{ ...state, mixVocalVolume: 0.1 }, { ...state, mixBeatVolume: 0.3 }, { ...state, mixPreset: 'vocal-focus' }]) assert.notEqual(mixStateSignature(media, changed), original);
  assert.notEqual(mixStateSignature({ ...media, vocals: 'new-voice' }, state), original);
});

test('completion requires selected playable vocals and master, never text alone or unselected artwork/video', () => {
  const selected = { lyrics: 'writer', audio: 'beat' };
  const empty = deliveryReadiness({ lyrics: 'Lyrics', audio: 'Beat brief' }, {}, selected, true);
  assert.deepEqual(empty.selected, ['lyrics', 'audio', 'vocals', 'master']); assert.equal(empty.completed, 1); assert.equal(empty.complete, false);
  assert.equal(deliveryReadiness({ lyrics: 'Lyrics' }, { audio: 'b', vocals: 'v' }, selected, true).complete, false);
  assert.equal(deliveryReadiness({ lyrics: 'Lyrics' }, { audio: 'b', vocals: 'v', mixedAudio: 'm' }, selected, true).complete, true);
  assert.equal(deliveryReadiness({}, {}, {}, true).complete, false);
});

test('singing reference readiness belongs to the signed-in account and requires listening approval', () => {
  const ready = { referenceId: 'voice', ownerUid: 'a', currentUid: 'a', status: 'loaded', references: [{ id: 'voice', ownerUid: 'a', status: 'ready', review: { approved: true } }] };
  assert.equal(singingVoiceReadiness(ready).available, true);
  for (const change of [{ currentUid: 'b' }, { ownerUid: 'b' }, { referenceId: null }, { status: 'checking' }, { references: [] },
    { references: [{ id: 'voice', ownerUid: 'b', status: 'ready', review: { approved: true } }] },
    { references: [{ id: 'voice', ownerUid: 'a', status: 'ready', review: { approved: false } }] }]) assert.equal(singingVoiceReadiness({ ...ready, ...change }).available, false);
});
