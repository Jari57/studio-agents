import test from 'node:test';
import assert from 'node:assert/strict';
import { quickProductionPlan, quickBriefPreferences, songLyricStructure, musicalStageLabel, songDirectionBrief, recoveryOfferVisible, quickSongJourney } from '../src/utils/quickSongFlow.mjs';
import { readFileSync } from 'node:fs';
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

test('Quick Create respects explicit lyric language and length without guessing from geography or genre', () => {
  const languages = ['English', 'Spanish', 'French'];
  assert.deepEqual(quickBriefPreferences('Create an original Spanish salsa song. About one minute.', languages), { language: 'Spanish', duration: 60 });
  assert.deepEqual(quickBriefPreferences('Write lyrics in French, 45 seconds.', languages), { language: 'French', duration: 45 });
  assert.deepEqual(quickBriefPreferences('An English-language song, 1.5 minutes long.', languages), { language: 'English', duration: 90 });
  assert.equal(quickBriefPreferences('Spanish guitar by the French coast. Salsa.', languages).language, null);
  assert.equal(quickBriefPreferences('No English lyrics. Sing in Spanish.', languages).language, 'Spanish');
  assert.equal(quickBriefPreferences("Don't sing in English.", languages).language, null);
  assert.equal(quickBriefPreferences('English lyrics with Spanish lyrics.', languages).language, null);
  assert.equal(quickBriefPreferences('30 minutes', languages).duration, null);
});

test('short songs do not receive the old forced three-minute lyric layout', () => {
  assert.match(songLyricStructure(60), /60 seconds.*one short verse.*78 words/s);
  assert.match(songLyricStructure(150), /150 seconds.*225 words/s);
  const source = readFileSync(new URL('../src/components/StudioOrchestratorV2.jsx', import.meta.url), 'utf8');
  assert.match(source, /SONG STRUCTURE: \$\{songLyricStructure\(duration, songStructure\)\}/);
});

test('actual quick-start applies the brief before invoking the latest production callback', () => {
  const source = readFileSync(new URL('../src/components/StudioOrchestratorV2.jsx', import.meta.url), 'utf8');
  const body = source.slice(source.indexOf('  const startQuickCreate = '), source.indexOf('  // Regenerate single slot'));
  const calls = [];
  let deferred;
  const fn = new Function('quickProductionPlan', 'quickBriefPreferences', 'ALL_LANGUAGES', 'songIdea', 'quickOutcome', 'quickGenre', 'toast', 'detectGenreFromPrompt', 'setSelectedAgents', 'setQuickGenre', 'applyGenrePreset', 'setProjectBpm', 'setLanguage', 'setDuration', 'setUseBars', 'setTimeout', 'handleGenerateRef', `${body}; return startQuickCreate;`)(
    quickProductionPlan, quickBriefPreferences, ['English', 'Spanish'], 'Original Spanish salsa song. One minute, 180 BPM.', 'song', 'Pop', {}, () => 'Salsa',
    value => calls.push(['agents', value]), value => calls.push(['genre', value]), value => calls.push(['preset', value]), value => calls.push(['bpm', value]),
    value => calls.push(['language', value]), value => calls.push(['duration', value]), value => calls.push(['bars', value]), cb => { deferred = cb; },
    { current: value => calls.push(['generate', value]) },
  );
  fn();
  assert.ok(calls.some(([key, value]) => key === 'language' && value === 'Spanish'));
  assert.ok(calls.some(([key, value]) => key === 'duration' && value === 60));
  assert.ok(calls.some(([key, value]) => key === 'bars' && value === false));
  assert.ok(!calls.some(([key]) => key === 'generate'));
  deferred();
  assert.equal(calls.at(-1)[0], 'generate');
  assert.equal(calls.at(-1)[1].includeVocals, true);
});

test('musical stages update real progress and every paid step carries the active stream session', () => {
  assert.match(musicalStageLabel('generating-musical-performance'), /sung performance/);
  assert.match(musicalStageLabel('separating-vocal'), /matching vocal/);
  assert.equal(musicalStageLabel('unknown'), null);
  const source = readFileSync(new URL('../src/components/StudioOrchestratorV2.jsx', import.meta.url), 'utf8');
  const headersBody = source.slice(source.indexOf('  const getPaidStepHeaders = '), source.indexOf('  const checkpointCurrentProduction = '));
  assert.match(headersBody, /headers\['x-pipeline-session'\] = pipelineSessionIdRef\.current/);
  assert.match(source, /const musicalLabel = step === 'vocals' \? musicalStageLabel\(status\)/);
  assert.match(source, /if \(eventSource\)[\s\S]*?pipelineSessionIdRef\.current = null/);
});
