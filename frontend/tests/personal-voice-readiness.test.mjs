import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { personalVoiceReadiness, personalVoiceCloneLabel, resolvePersonalVoiceSelection } from '../src/utils/personalVoiceReadiness.mjs';
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

test('stale and invalid personal voices recover to Studio without erasing transient selections', () => {
  for (const state of ['missing', 'consent']) {
    assert.deepEqual(resolvePersonalVoiceSelection({
      voiceSource: 'personal', voiceStyle: 'cloned', readiness: { state, available: false },
    }), { voiceSource: 'studio', voiceStyle: 'singer', recovered: true, blocked: false });
  }
  for (const state of ['checking', 'unavailable']) {
    assert.deepEqual(resolvePersonalVoiceSelection({
      voiceSource: 'personal', voiceStyle: 'cloned', readiness: { state, available: false },
    }), { voiceSource: 'personal', voiceStyle: 'cloned', recovered: false, blocked: true });
  }
  const stale = personalVoiceReadiness({ ...baseline, voices: [] });
  assert.match(stale.detail, /Studio voice will be selected automatically/);
  assert.doesNotMatch(stale.detail, /Check again or select another voice/);
});

test('actual vocal handler blocks unresolved checks but recovers a stale personal voice', () => {
  const start = source.indexOf('    const verifiedPersonalVoice = personalVoiceReadiness(');
  const end = source.indexOf('    setGeneratingMedia(', start);
  const guard = new Function('personalVoiceReadiness', 'resolvePersonalVoiceSelection', 'clonedVoiceId', 'elVoices', 'voiceCatalogCheck', 'auth', 'voiceSource', 'setShowAssets', 'toast', 'voiceStyle', source.slice(start, end) + '\nreturn "allowed";');
  for (const status of ['loaded', 'error']) {
    const notices = [];
    const result = guard(personalVoiceReadiness, resolvePersonalVoiceSelection, baseline.voiceId, [verified], { status, ownerUid: 'artist' }, { currentUser: { uid: 'artist' } }, 'personal', () => {}, { error: message => notices.push(message) }, 'cloned');
    assert.equal(result, status === 'loaded' ? 'allowed' : undefined);
    assert.equal(notices.length, status === 'loaded' ? 0 : 1);
  }
  assert.equal(guard(personalVoiceReadiness, resolvePersonalVoiceSelection, 'stale', [], { status: 'loaded', ownerUid: 'artist' }, { currentUser: { uid: 'artist' } }, 'personal', () => {}, { error() {} }, 'cloned'), 'allowed');
});

test('actual full-run preflight blocks paid personal-vocal pipeline but allows artwork and text drafts', () => {
  const start = source.indexOf('    const requestedVoiceStatus = personalVoiceReadiness(');
  const end = source.indexOf("    // Track whether we're starting fresh", start);
  const guard = new Function('personalVoiceReadiness', 'resolvePersonalVoiceSelection', 'productionScope', 'clonedVoiceId', 'elVoices', 'voiceCatalogCheck', 'auth', 'voiceSource', 'requestedAgents', 'includeVocals', 'resumeJob', 'mediaUrlsRef', 'setShowAssets', 'toast', 'voiceStyle', source.slice(start, end) + '\nreturn "allowed";');
  for (const [selection, vocals, resume, media, expected] of [
    [{ lyrics: true, audio: true }, true, null, {}, undefined],
    [{ visual: true }, true, null, {}, 'allowed'],
    [{ lyrics: true }, false, null, {}, 'allowed'],
    [{ lyrics: true, visual: true }, true, {}, { vocals: 'saved.wav' }, 'allowed'],
  ]) {
    const result = guard(personalVoiceReadiness, resolvePersonalVoiceSelection, productionScope, 'stale', [], { status: 'error', ownerUid: 'artist' }, { currentUser: { uid: 'artist' } }, 'personal', selection, vocals, resume, { current: media }, () => {}, { error() {} }, 'cloned');
    assert.equal(result, expected);
  }
  assert.equal(guard(personalVoiceReadiness, resolvePersonalVoiceSelection, productionScope, 'stale', [], { status: 'loaded', ownerUid: 'artist' }, { currentUser: { uid: 'artist' } }, 'personal', { lyrics: true, audio: true }, true, null, { current: {} }, () => {}, { error() {} }, 'cloned'), 'allowed');
});

test('unavailable saved voice offers an explicit Studio voice recovery path', () => {
  assert.match(source, /!personalVoiceStatus\.available && voiceSource === 'personal' && \([\s\S]*?Use Studio voice/);
  assert.match(source, /setVoiceSource\('studio'\);[\s\S]*?setVoiceStyle\('singer'\);[\s\S]*?setElevenLabsVoiceId\(''\);/);
});

test('conclusively unavailable saved voice is cleared before generation UX', () => {
  assert.match(source, /resolvePersonalVoiceSelection\(\{ voiceSource, voiceStyle, readiness: personalVoiceStatus \}\)/);
  assert.match(source, /setClonedVoiceId\(null\);[\s\S]*?clonedVoiceId: null/);
  assert.match(source, /Saved voice is unavailable\. Studio voice selected so generation can continue\./);
  assert.match(source, /activeVoiceSource === 'personal'[\s\S]*?isPersonalVoice: activeVoiceSource === 'personal'/);
  assert.match(source, /resolvedVoiceSelection\.recovered \? '' : elevenLabsVoiceId/);
  assert.match(source, /: \(resolvedVoiceSelection\.recovered \? null : \(generationProviders\.vocals \|\| null\)\)/);
});

test('actual clone guard requires explicit consent even when invoked outside its disabled button', async () => {
  const start = source.indexOf('    if (cloneSampleCount < 1)', source.indexOf('const handleCloneVoice'));
  const end = source.indexOf('    setIsCloningVoice(true)', start);
  assert.ok(start > 0 && end > start, 'clone guard block located');
  const guard = new Function('cloneSampleCount', 'voiceOwnershipConfirmed', 'toast', source.slice(start, end) + '\nreturn "allowed";');
  assert.equal(guard(2, false, { error() {} }), undefined);
  assert.equal(guard(0, true, { error() {} }), undefined);
  assert.equal(guard(1, true, { error() {} }), 'allowed');
  assert.doesNotMatch(source, /'Personal Voice Ready'/);
  // A user who already saved a profile voice sample must not be stuck at 0/3:
  // the saved sample counts toward the clone and is sent by URL.
  assert.match(source, /const savedSampleUsableForClone = !!voiceSampleUrl && !clonedVoiceId/);
  assert.match(source, /sampleUrls,/);
  assert.match(source, /cloneSampleCount\}\/3 ready/);
});
