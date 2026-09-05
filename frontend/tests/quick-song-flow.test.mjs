import test from 'node:test';
import assert from 'node:assert/strict';
import { quickProductionPlan, songDirectionBrief, recoveryOfferVisible, quickSongJourney } from '../src/utils/quickSongFlow.mjs';
import { restoreProductionConfig } from '../src/utils/productionProjectConfig.mjs';

test('new projects default to a complete song without purchasing artwork or video', () => {
  const defaults = restoreProductionConfig(null);
  assert.equal(defaults.quickOutcome, 'song');
  const plan = quickProductionPlan(defaults.quickOutcome);
  assert.equal(plan.includeVocals, true);
  assert.deepEqual(plan.agentSelection, { lyrics: 'ghost', audio: 'beat', visual: null, video: null });
});
test('explicit legacy drafts and full packages retain their chosen deliverables', () => {
  assert.equal(quickProductionPlan('song-draft').includeVocals, false);
  assert.deepEqual(quickProductionPlan('full-package').agentSelection, {
    lyrics: 'ghost', audio: 'beat', visual: 'album', video: 'video-creator',
  });
});
test('a song is ready only when lyrics, vocals, accompaniment and a mix are present', () => {
  const state = { outcome: 'song', idea: 'My idea', lyrics: 'Words', media: { audio: 'beat' } };
  assert.equal(quickSongJourney(state).ready, false);
  assert.equal(quickSongJourney({ ...state, media: { audio: 'beat', vocals: 'vocal', mixedAudio: 'mix' } }).ready, true);
  assert.equal(quickSongJourney({ ...state, outcome: 'song-draft' }).ready, true);
  assert.equal(quickSongJourney({ ...state, outcome: 'full-package', media: { audio: 'beat', vocals: 'vocal', mixedAudio: 'mix', image: 'cover' } }).ready, false);
});
test('an old unassigned job cannot follow an artist into a different idea or a new run', () => {
  const job = { projectId: null, prompt: 'Old song' };
  assert.equal(recoveryOfferVisible(job, null, '', false), true);
  assert.equal(recoveryOfferVisible(job, null, 'New song', false), false);
  assert.equal(recoveryOfferVisible(job, null, '', true), false);
  assert.equal(recoveryOfferVisible(job, 'another-project', '', false), false);
});
test('the existing song brief supplies direction without needing another AI generation', () => {
  assert.match(songDirectionBrief({ idea: 'Sunrise', genre: 'Bachata', bpm: 128, language: 'Spanish' }), /Sunrise\nBachata · 128 BPM · Spanish/);
});
