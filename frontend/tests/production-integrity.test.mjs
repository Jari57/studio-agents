import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { productionScope, productionPrerequisiteError, unfinishedProductionSteps, mergeCurrentMedia, artworkRequestPrompt, confirmProjectSave, currentRunLyrics } from '../src/utils/productionIntegrity.mjs';

test('music-video prerequisites fail before clearing assets or purchasing unrelated outputs', () => {
  assert.match(productionPrerequisiteError({ video: 'video-gen' }), /needs audio/);
  assert.equal(productionPrerequisiteError({ video: 'video-gen', audio: 'beat' }), '');
  assert.equal(productionPrerequisiteError({ video: 'video-gen' }, { audio: 'saved-beat' }), '');
  assert.equal(productionPrerequisiteError({ visual: 'album' }), '');
  const source = readFileSync(new URL('../src/components/StudioOrchestratorV2.jsx', import.meta.url), 'utf8');
  const generate = source.slice(source.indexOf('const handleGenerate ='), source.indexOf('// Keep ref in sync so clearAndGenerate'));
  assert.ok(generate.indexOf('if (prerequisiteError)') < generate.indexOf('setOutputs('));
  assert.ok(generate.indexOf('if (prerequisiteError)') < generate.indexOf('createProductionJob('));
  assert.match(generate, /resumeJob \? mediaUrlsRef.current : \{\}/);
  const video = source.slice(source.indexOf('const handleGenerateVideo ='), source.indexOf('const handleGenerateProfessionalMusicVideo ='));
  assert.doesNotMatch(video, /await handleGenerateAudio/);
});

test('failed fresh lyrics cannot silently spend on singing the previous song', () => {
  assert.equal(currentRunLyrics(true, null, '', 'old song'), '');
  assert.equal(currentRunLyrics(true, 'new song', 'old checkpoint', 'old song'), 'new song');
  assert.equal(currentRunLyrics(false, '', 'saved song', ''), 'saved song');
});

test('artwork/beat/video requests do not implicitly spend on vocals or mastering', () => {
  for (const selection of [{ visual: 'album' }, { audio: 'beat' }, { video: 'video-gen' }]) {
    assert.deepEqual(productionScope(selection), { vocals: false, finalMix: false, mux: false });
  }
  assert.deepEqual(productionScope({ lyrics: 'ghost', audio: 'beat', video: 'video-gen' }), { vocals: true, finalMix: true, mux: true });
  assert.equal(productionScope({ lyrics: 'ghost', audio: 'beat' }, false).finalMix, false);
});

test('pending, running, and failed steps cannot be certified completed', () => {
  const steps = [{ id: 'image', status: 'done' }, { id: 'final', status: 'pending' }, { id: 'vocal', status: 'error' }];
  assert.deepEqual(unfinishedProductionSteps(steps).map(step => step.id), ['final', 'vocal']);
  assert.deepEqual(unfinishedProductionSteps([{ status: 'done' }]), []);
});

test('current take wins, untouched prior media is preserved, inputs are not mutated', () => {
  const prior = { image: 'take-A', audio: 'beat-A' };
  assert.deepEqual(mergeCurrentMedia(prior, { image: 'take-B', audio: null, video: '' }), { image: 'take-B', audio: 'beat-A' });
  assert.equal(prior.image, 'take-A');
});

test('artwork request retains original constraints beyond the old 600-character cut', () => {
  const brief = `Cobalt sculptural sound wave. ${'Detailed guidance. '.repeat(60)}No text. No people. Amber horizon.`;
  const prompt = artworkRequestPrompt(brief, 'Supporting concept');
  assert.ok(prompt.includes(brief));
  assert.match(prompt, /original brief is authoritative/i);
  assert.doesNotMatch(prompt, /Billboard-standard|professional photography or elite/);
});

test('saved is returned only after an explicit durable acknowledgement', async () => {
  let finish;
  const pending = new Promise(resolve => { finish = resolve; });
  let confirmed = false;
  const saving = confirmProjectSave(() => pending, {}).then(() => { confirmed = true; });
  await Promise.resolve();
  assert.equal(confirmed, false);
  finish(true);
  await saving;
  assert.equal(confirmed, true);
  for (const result of [false, undefined, null]) await assert.rejects(confirmProjectSave(async () => result, {}), /Cloud save did not complete/);
  await assert.rejects(confirmProjectSave(async () => { throw new Error('offline'); }, {}), /offline/);
  await assert.rejects(confirmProjectSave(null, {}), /No project save connection/);
});

test('artwork failures cannot substitute video frames or reuse old image as success', () => {
  const source = readFileSync(new URL('../src/components/StudioOrchestratorV2.jsx', import.meta.url), 'utf8');
  const image = source.slice(source.indexOf('const handleGenerateImage ='), source.indexOf('const tryVideoFrameFallback ='));
  assert.doesNotMatch(image, /await tryVideoFrameFallback|await response\.text/);
  assert.match(image, /return false/);
  assert.match(image, /await confirmProjectSave/);
  assert.match(source, /\.then\(\(imageCreated\)/);
  const saveAndNew = source.slice(source.indexOf('const saveAndGenerate ='), source.indexOf('// Main generation function'));
  assert.ok(saveAndNew.indexOf('if (!saved) return') < saveAndNew.indexOf('setOutputs('));
  assert.ok(saveAndNew.indexOf('if (!mountedRef.current)') < saveAndNew.indexOf('setOutputs('));
  const generation = source.slice(source.indexOf('const handleGenerate ='), source.indexOf('// Keep ref in sync so clearAndGenerate'));
  assert.match(generation, /if \(!mountedRef.current \|\| isGenerating/);
  assert.match(generation, /currentRunLyrics\(freshGeneration/);
  assert.match(generation, /handleGenerateImage\(data.output, \{ brief: songIdea, lyrics: contextLyrics, video: '' \}\)/);
});
