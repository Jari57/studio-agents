import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { personalVoiceReadiness, personalVoiceCloneLabel } from '../src/utils/personalVoiceReadiness.mjs';
import { productionScope } from '../src/utils/productionIntegrity.mjs';

const verified = { voice_id: 'saved-voice', studioPersonalVoice: { owned: true, consentConfirmed: true, sampleCount: 2 } };
const baseline = { voiceId: 'saved-voice', voices: [verified], status: 'loaded', ownerUid: 'artist', currentUid: 'artist' };
const source = readFileSync(new URL('../src/components/StudioOrchestratorV2.jsx', import.meta.url), 'utf8');

test('zero newly queued samples does not invalidate a consented saved voice or label the clone button ready', () => {
  const status = personalVoiceReadiness({ ...baseline, queuedSamples: [] });
  assert.equal(status.available, true);
  assert.equal(status.label, 'Personal voice available');
  assert.match(status.detail, /No new samples/);
  assert.equal(personalVoiceCloneLabel({ voiceId: baseline.voiceId }), 'Create a New Personal Voice');
  assert.equal(personalVoiceCloneLabel({}), 'Create My Voice');
  assert.equal(personalVoiceCloneLabel({ isCloning: true }), 'Creating your voice...');
});

test('stale ID, missing consent, failed/checking provider and another-account catalog never show availability', () => {
  for (const update of [
    { voices: [] }, { voices: [{ ...verified, studioPersonalVoice: { owned: true, consentConfirmed: false } }] },
    { voices: [{ voice_id: 'saved-voice' }] }, { status: 'error' }, { status: 'checking' },
    { currentUid: null }, { currentUid: 'another-artist' },
  ]) assert.equal(personalVoiceReadiness({ ...baseline, ...update }).available, false);
});

test('actual vocal handler refuses unavailable personal voices before billable request setup', () => {
  const start = source.indexOf('    const verifiedPersonalVoice = personalVoiceReadiness(');
  const end = source.indexOf('    setGeneratingMedia(', start);
  const guard = new Function('personalVoiceReadiness', 'clonedVoiceId', 'elVoices', 'voiceCatalogCheck', 'auth', 'voiceSource', 'setShowAssets', 'toast', 'voiceStyle', source.slice(start, end) + '\nreturn "allowed";');
  for (const status of ['loaded', 'error']) {
    const notices = [];
    const result = guard(personalVoiceReadiness, baseline.voiceId, [verified], { status, ownerUid: 'artist' }, { currentUser: { uid: 'artist' } }, 'personal', () => {}, { error: message => notices.push(message) });
    assert.equal(result, status === 'loaded' ? 'allowed' : undefined);
    assert.equal(notices.length, status === 'loaded' ? 0 : 1);
  }
  assert.equal(guard(personalVoiceReadiness, 'stale', [], { status: 'loaded', ownerUid: 'artist' }, { currentUser: { uid: 'artist' } }, 'studio', () => {}, { error() {} }, 'cloned'), undefined, 'legacy cloned style must not bypass the same check the server applies');
});

test('actual full-run preflight blocks paid personal-vocal pipeline but allows artwork and text drafts', () => {
  const start = source.indexOf('    const requestedVoiceStatus = personalVoiceReadiness(');
  const end = source.indexOf("    // Track whether we're starting fresh", start);
  const guard = new Function('personalVoiceReadiness', 'productionScope', 'clonedVoiceId', 'elVoices', 'voiceCatalogCheck', 'auth', 'voiceSource', 'requestedAgents', 'includeVocals', 'resumeJob', 'mediaUrlsRef', 'setShowAssets', 'toast', 'voiceStyle', source.slice(start, end) + '\nreturn "allowed";');
  for (const [selection, vocals, resume, media, expected] of [
    [{ lyrics: true, audio: true }, true, null, {}, undefined],
    [{ visual: true }, true, null, {}, 'allowed'],
    [{ lyrics: true }, false, null, {}, 'allowed'],
    [{ lyrics: true, visual: true }, true, {}, { vocals: 'saved.wav' }, 'allowed'],
  ]) {
    const result = guard(personalVoiceReadiness, productionScope, 'stale', [], { status: 'error', ownerUid: 'artist' }, { currentUser: { uid: 'artist' } }, 'personal', selection, vocals, resume, { current: media }, () => {}, { error() {} });
    assert.equal(result, expected);
  }
});

test('actual clone guard requires explicit consent even when invoked outside its disabled button', async () => {
  const start = source.indexOf('    if (voiceSamples.length < 2)', source.indexOf('const handleCloneVoice'));
  const end = source.indexOf('    setIsCloningVoice(true)', start);
  const guard = new Function('voiceSamples', 'voiceOwnershipConfirmed', 'toast', source.slice(start, end) + '\nreturn "allowed";');
  assert.equal(guard([{}, {}], false, { error() {} }), undefined);
  assert.equal(guard([{}, {}], true, { error() {} }), 'allowed');
  assert.doesNotMatch(source, /'Personal Voice Ready'/);
  assert.match(source, /New Voice Samples/);
  assert.match(source, /voiceSamples\.length\}\/3 queued/);
});
