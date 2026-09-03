import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { selectedVoiceInputs, generationFailureMessage } from '../src/utils/generationErrors.mjs';
import { isStaleChunkError, recoverSection } from '../src/utils/errorRecovery.mjs';
import { saveProjectChoices } from '../src/utils/saveProjectChoices.mjs';
import { producerRenderSignature, producerAudioLibrary, inferProducerRole, boundedProducerValue, producerSessionIssues } from '../src/utils/producerSession.mjs';
import { projectWizardHint } from '../src/utils/projectWizard.mjs';
import { productionJobMatchesProject } from '../src/utils/productionRecovery.mjs';

test('AI vocal selection never transmits a stored personal sample or clone ID', () => {
  const settings = { elevenLabsVoiceId: 'private-id', voiceSampleUrl: 'https://example.test/private.wav' };
  assert.deepEqual(selectedVoiceInputs({ ...settings, personalVoiceSelected: false }), {
    isPersonalVoice: false, elevenLabsVoiceId: null, speakerUrl: null, preferredProvider: null,
  });
  assert.equal(selectedVoiceInputs({ ...settings, personalVoiceSelected: true }).speakerUrl, settings.voiceSampleUrl);
});
test('permissions and consent errors are not mislabeled as credit failures', () => {
  assert.equal(generationFailureMessage(403, { error: 'Personal voice not found in your library' }), 'Personal voice not found in your library');
  assert.equal(generationFailureMessage(403, { details: 'Activate your own voice.', error: 'Unavailable' }), 'Activate your own voice.');
  assert.match(generationFailureMessage(403, { isUserCreditIssue: true, required: 2 }, 'Vocal Lab'), /needs 2 credits/);
  assert.doesNotMatch(generationFailureMessage(403), /credits/i);
});
test('saved canvas playback requests metadata without unnecessary CORS mode', () => {
  const source = readFileSync(new URL('../src/components/studio/CanvasView.jsx', import.meta.url), 'utf8');
  const player = source.slice(source.indexOf('<audio'), source.indexOf('/>', source.indexOf('<audio')));
  assert.match(player, /preload="metadata"/);
  assert.doesNotMatch(player, /crossOrigin/);
  assert.match(player, /aria-label/);
});

test('saved producer mixes are previewed as existing assets with accurate attribution', () => {
  const source = readFileSync(new URL('../src/components/StudioView.jsx', import.meta.url), 'utf8');
  assert.match(source, /setPreviewItem\(\{ \.\.\.masterAsset, isExistingAsset: true \}\)/);
  assert.match(source, /previewItem\.provider \|\| previewItem\.metadata\?\.provider \|\| previewItem\.model/);
  assert.doesNotMatch(source, /previewItem\.model \|\| selectedModel/);
  assert.match(source, /className="modal-overlay studio-creation-preview" role="dialog"/);
  const css = readFileSync(new URL('../src/App.css', import.meta.url), 'utf8');
  assert.match(css, /\.modal-overlay\.studio-creation-preview\s*\{\s*z-index:\s*11000 !important/);
  assert.match(source, /aria-label="Close creation preview"/);
});

test('frontend preserves vocal opening stanzas for the backend lyric policy', () => {
  const source = readFileSync(new URL('../src/components/StudioView.jsx', import.meta.url), 'utf8');
  const start = source.indexOf('// VOCALS FIX:');
  const lyricsSection = source.slice(start, source.indexOf("finalEndpoint = '/api/generate-speech'", start));
  assert.doesNotMatch(lyricsSection, /\.replace\(/);
  assert.match(lyricsSection, /const vocalLyrics = \(contextLyrics \|\| expandedPrompt \|\| prompt\)\.trim\(\)/);
});

test('stale deployment recovery reloads on request rather than repeating a cached failed import', () => {
  let reloaded = 0, reset = 0;
  const actions = { reload: () => reloaded++, reset: () => reset++ };
  const error = new Error('Failed to fetch dynamically imported module: https://example.test/old-chunk.js');
  assert.equal(isStaleChunkError(error), true);
  assert.equal(reloaded, 0, 'inspection never automatically refreshes unsaved work');
  recoverSection(error, actions);
  assert.equal(reloaded, 1);
  assert.equal(reset, 0);
  recoverSection(new Error('Ordinary component error'), actions);
  assert.equal(reloaded, 1);
  assert.equal(reset, 1);
});

test('save picker includes recent projects beyond the old first-ten cutoff', () => {
  const projects = Array.from({ length: 20 }, (_, i) => ({ id: String(i), name: `Project ${i}`, updatedAt: i + 1 }));
  const originalOrder = projects.map(p => p.id);
  assert.equal(saveProjectChoices(projects).length, 20);
  assert.equal(saveProjectChoices(projects)[0].id, '19');
  assert.equal(saveProjectChoices(projects, 'PROJECT 19')[0].id, '19');
  assert.deepEqual(projects.map(p => p.id), originalOrder);
  assert.deepEqual(saveProjectChoices(projects, 'missing'), []);
});

test('every audio control invalidates a saved mix but notes do not', () => {
  const session = { tracks: [{ id: 'a', url: 'https://example.test/a.wav', role: 'vocal', volume: 0.8 }], bpm: 92 };
  const signature = producerRenderSignature(session);
  for (const [key, value] of Object.entries({ url: 'other', role: 'beat', volume: 1.2, pan: -1, offset: 2, trimStart: 1, trimEnd: 10, fadeIn: 1, fadeOut: 2, muted: true, solo: true })) {
    assert.notEqual(producerRenderSignature({ ...session, tracks: [{ ...session.tracks[0], [key]: value }] }), signature, key);
  }
  assert.notEqual(producerRenderSignature({ ...session, autoDuck: false }), signature);
  assert.notEqual(producerRenderSignature({ ...session, lufsTarget: -18 }), signature);
  assert.equal(producerRenderSignature({ ...session, bpm: 120, key: 'D minor', lyricsDraft: 'Notes' }), signature);
});

test('library searches all supplied private projects without mutating original assets', () => {
  const original = { id: 'vocal', title: 'Harmony vocal', audioUrl: 'https://example.test/a.mp3' };
  const project = { id: 'p', name: 'First', assets: [original] };
  const projects = [project, { id: 'q', name: 'Second', assets: [{ id: 'beat', audioUrl: 'https://example.test/b.mp3' }, original] }];
  assert.equal(producerAudioLibrary(project, projects).length, 2);
  assert.equal(producerAudioLibrary(project, projects, 'SECOND')[0].id, 'beat');
  assert.equal(original.projectName, undefined);
  assert.equal(inferProducerRole(original), 'harmony');
  assert.equal(inferProducerRole({ title: 'Ad-lib vocal' }), 'adlib');
});

test('producer audition uses the downloadable render, not a second approximate mixer', () => {
  const source = readFileSync(new URL('../src/components/studio/ProducerCanvas.jsx', import.meta.url), 'utf8');
  assert.match(source, /src=\{selectedMix\.audioUrl\}/);
  assert.match(source, /href=\{selectedMix\.audioUrl\}/);
  assert.match(source, /aria-label="Compare saved mixes"/);
  assert.doesNotMatch(source, /src=\{track\.url\}|element\.volume|timers\.current|slice\(0, 12\)/);
  assert.match(source, /New renders use 10 Studio credits/);
});

test('precise controls bound numeric input while retaining incomplete input safely', () => {
  assert.equal(boundedProducerValue('', -1, 1, 0.25), 0.25);
  assert.equal(boundedProducerValue('bad', -1, 1, 0.25), 0.25);
  assert.equal(boundedProducerValue('Infinity', -1, 1, 0.25), 0.25);
  assert.equal(boundedProducerValue('-0.45', -1, 1, 0), -0.45);
  assert.equal(boundedProducerValue('20', -1, 1, 0), 1);
  assert.equal(boundedProducerValue('-20', -1, 1, 0), -1);
  const control = readFileSync(new URL('../src/components/studio/ProducerControl.jsx', import.meta.url), 'utf8');
  assert.match(control, /type="number"/);
  assert.match(control, /type="range"/);
  assert.match(control, /onBlur=\{event => commit/);
});

test('invalid audible trims block render but not save; inactive lanes do not block render', () => {
  const invalid = { name: 'Lead', trimStart: 5, trimEnd: 3 };
  assert.equal(producerSessionIssues({ tracks: [invalid] }).length, 1);
  assert.equal(producerSessionIssues({ tracks: [{ trimEnd: 0 }] }).length, 1);
  assert.deepEqual(producerSessionIssues({ tracks: [{ ...invalid, muted: true }] }), []);
  assert.deepEqual(producerSessionIssues({ tracks: [invalid, { name: 'Solo beat', solo: true }] }), []);
  assert.deepEqual(producerSessionIssues({ tracks: [{ trimStart: 5, trimEnd: null }] }), []);
  assert.deepEqual(producerSessionIssues({ tracks: [{ trimStart: 5, trimEnd: '' }] }), []);
  const source = readFileSync(new URL('../src/components/studio/ProducerCanvas.jsx', import.meta.url), 'utf8');
  assert.match(source, /!audibleTracks\.length \|\| sessionIssues\.length > 0/);
  assert.match(source, /onClick=\{onSave\} disabled=\{uploading \|\| rendering\}/);
});

test('wizard identifies required choices, rejects blank names, and needs a custom team', () => {
  assert.match(projectWizardHint({ name: '   ', category: 'video' }), /name/);
  assert.match(projectWizardHint({ name: 'Visual QA' }), /category/);
  const project = { name: 'Visual QA', category: 'video' };
  assert.equal(projectWizardHint(project), '');
  assert.match(projectWizardHint(project, 2), /workflow/);
  assert.match(projectWizardHint({ ...project, workflow: 'custom', selectedAgents: [] }, 2), /agent/);
  assert.equal(projectWizardHint({ ...project, workflow: 'custom', selectedAgents: ['album'] }, 3), '');
  assert.equal(projectWizardHint({ ...project, workflow: 'full_song' }, 3), '');
});

test('project category, workflow and agent choices expose real keyboard buttons', () => {
  const source = readFileSync(new URL('../src/components/StudioView.jsx', import.meta.url), 'utf8');
  assert.match(source, /aria-labelledby="project-wizard-title"/);
  assert.match(source, /aria-label="Close project setup"/);
  assert.match(source, /htmlFor="project-wizard-name"/);
  assert.match(source, /id="project-wizard-hint" role="status"/);
  for (const className of ['category-card', 'workflow-card', 'agent-select-card']) {
    assert.ok(new RegExp(`<button type="button"[^>]*className=\\{\x60${className}`).test(source), className);
  }
});

test('full masters never become vocal stems just because their title mentions vocals', () => {
  assert.equal(inferProducerRole({ type: 'Master', title: 'Vocal Pipeline Mix 3', metadata: { role: 'vocal' } }), 'instrument');
  assert.equal(inferProducerRole({ type: 'Mix', title: 'Beat and voice' }), 'instrument');
  assert.equal(inferProducerRole({ type: 'Audio', title: 'Vocal sampled keys', metadata: { role: 'instrument' } }), 'instrument');
});

test('production recovery cannot import another project or an unassigned old job', () => {
  assert.equal(productionJobMatchesProject({ projectId: 'first' }, 'second'), false);
  assert.equal(productionJobMatchesProject({ projectId: null }, 'new-project'), false);
  assert.equal(productionJobMatchesProject({}, 'new-project'), false);
  assert.equal(productionJobMatchesProject(null, 'new-project'), false);
  assert.equal(productionJobMatchesProject({ projectId: 'same' }, 'same'), true);
  assert.equal(productionJobMatchesProject({ projectId: null }, null), true);
  const source = readFileSync(new URL('../src/components/StudioOrchestratorV2.jsx', import.meta.url), 'utf8');
  const recovery = source.slice(source.indexOf('const recover = async'), source.indexOf('const resumeRecoveredProduction'));
  // The recovery check may only OFFER a resume. Eagerly restoring outputs
  // meant a stale unfinished run took over every freshly opened orchestrator.
  assert.equal(recovery.includes('outputsRef.current ='), false, 'recovery check must not restore content before the user chooses to resume');
  assert.equal(recovery.includes('setSongIdea('), false, 'recovery check must not replace the brief before the user chooses to resume');
  const resume = source.slice(source.indexOf('const resumeRecoveredProduction'), source.indexOf('const discardRecoveredProduction'));
  assert.ok(resume.indexOf('!productionJobMatchesProject(job, existingProject?.id)') < resume.indexOf('outputsRef.current ='), 'project match is checked before restoring any content');
  assert.match(source, /if \(!productionJobMatchesProject\(job, existingProject\?\.id\) \|\| isGenerating\) return/);
  // Discarding must cancel the job server-side, otherwise it is re-offered forever.
  assert.match(resume + source.slice(source.indexOf('const discardRecoveredProduction'), source.indexOf('const discardRecoveredProduction') + 1200), /status: 'cancelled'/);
});
