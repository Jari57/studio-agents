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

test('unavailable personal voices block without changing the selected identity', () => {
  for (const state of ['missing', 'consent', 'checking', 'unavailable']) {
    assert.deepEqual(resolvePersonalVoiceSelection({ voiceSource: 'personal', voiceStyle: 'cloned', readiness: { state, available: false } }),
      { voiceSource: 'personal', voiceStyle: 'cloned', recovered: false, blocked: true });
  }
  assert.match(personalVoiceReadiness({ ...baseline, voices: [] }).detail, /explicitly choose/);
});

test('actual vocal preflight blocks unavailable identity before generation', () => {
  const start = source.indexOf('    const verifiedPersonalVoice = personalVoiceStatus;');
  const end = source.indexOf('    if (voiceSource ===', start);
  assert.ok(start > 0 && end > start);
  const guard = new Function('personalVoiceStatus', 'resolvePersonalVoiceSelection', 'voiceSource', 'voiceStyle', 'setShowAssets', 'toast', source.slice(start, end) + '\nreturn "allowed";');
  for (const available of [true, false]) assert.equal(guard({ available, state: available ? 'available' : 'missing', detail: 'Check voice' }, resolvePersonalVoiceSelection, 'personal', 'cloned', () => {}, { error() {} }), available ? 'allowed' : undefined);
});

test('actual full-run preflight blocks paid personal singing, not artwork or completed recovery', () => {
  const start = source.indexOf('    const requestedVoiceStatus = personalVoiceStatus;');
  const end = source.indexOf("    // Track whether we're starting fresh", start);
  assert.ok(start > 0 && end > start);
  const guard = new Function('personalVoiceStatus', 'resolvePersonalVoiceSelection', 'productionScope', 'voiceSource', 'voiceStyle', 'requestedAgents', 'includeVocals', 'resumeJob', 'mediaUrlsRef', 'setShowAssets', 'toast', source.slice(start, end) + '\nreturn "allowed";');
  for (const [selection, vocals, resume, media, expected] of [
    [{ lyrics: true, audio: true }, true, null, {}, undefined],
    [{ visual: true }, true, null, {}, 'allowed'],
    [{ lyrics: true }, false, null, {}, 'allowed'],
    [{ lyrics: true }, true, {}, { vocals: 'saved.wav' }, 'allowed'],
  ]) assert.equal(guard({ available: false, state: 'missing', detail: 'Check voice' }, resolvePersonalVoiceSelection, productionScope, 'personal', 'cloned', selection, vocals, resume, { current: media }, () => {}, { error() {} }), expected);
});

test('unavailable saved voice offers an explicit Studio voice recovery path', () => {
  assert.match(source, /!personalVoiceStatus\.available && voiceSource === 'personal' && \([\s\S]*?Use Studio voice/);
  assert.match(source, /setVoiceSource\('studio'\);[\s\S]*?setVoiceStyle\('singer'\);[\s\S]*?setElevenLabsVoiceId\(''\);/);
});

test('a missing personal voice never clears the profile or silently substitutes a studio singer', () => {
  assert.doesNotMatch(source, /voice-studio-auto-recovery|Saved voice is unavailable\. Studio voice selected/);
  assert.match(source, /personalVoiceStatus = outputFormat === 'music' \? singingVoiceReadiness/);
  assert.match(source, /personalReferenceId: activeVoiceSource === 'personal' && requiresSungPerformance/);
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
