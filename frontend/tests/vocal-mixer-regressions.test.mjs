import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as icons from 'lucide-react';
import ts from 'typescript';
import * as producer from '../src/utils/producerSession.mjs';
import { restoreProjectOutputs } from '../src/utils/projectRestore.mjs';
import { replacedSongSource, authoritativeMaster } from '../src/utils/songSession.mjs';

test('saved mix discovery accepts historical casing, metadata and missing IDs without treating stems as masters', () => {
  const assets = [
    { id: 1, type: 'master', audioUrl: 'old', createdAt: '2026-01-01' },
    { type: 'Master', audioUrl: 'new', createdAt: '2026-09-01' },
    { type: 'MIX', audioUrl: 'mix' },
    { type: 'Audio', metadata: { role: 'master' }, audioUrl: 'metadata' },
    { type: 'master', audioUrl: 'new' },
    { type: 'vocal', audioUrl: 'voice' }, { type: 'beat', audioUrl: 'beat' },
    { type: 'master' },
  ];
  const mixes = producer.producerSavedMixes({ assets });
  assert.deepEqual(mixes.map(a => a.audioUrl), ['new', 'old', 'mix', 'metadata']);
  assert.equal(mixes[0].id, 'new');
  assert.equal(mixes[1].id, '1');
  assert.equal(producer.inferProducerRole(assets[3]), 'instrument');
  assert.equal(restoreProjectOutputs({ assets }).media.mixedAudio, 'new');
});

test('new vocal takes retire old masters but retain accompaniment and historical assets after reopening', () => {
  const historical = [{ type: 'master', audioUrl: 'old-master' }];
  const old = { audio: 'beat', vocals: 'old-vocal', mixedAudio: 'old-master', image: 'art' };
  const replacement = replacedSongSource('vocals', { audioUrl: 'new-vocal' });
  const media = { ...old, ...replacement.media };
  assert.deepEqual(media, { audio: 'beat', vocals: 'new-vocal', lyricsVocal: 'new-vocal', mixedAudio: null, image: 'art' });
  assert.equal(replacement.performance, null);
  assert.equal(replacement.renderedMixSignature, '');
  assert.equal(authoritativeMaster(media, null), null);
  assert.equal(restoreProjectOutputs({ mediaUrls: media, assets: historical }).media.mixedAudio, null);
  assert.equal(producer.producerSavedMixes({ assets: historical })[0].audioUrl, 'old-master');
  assert.equal(old.mixedAudio, 'old-master');
});

test('coherent response replaces all matching stems and master, while a new beat invalidates that master', () => {
  const result = replacedSongSource('vocals', { audioUrl: 'v', instrumentalUrl: 'b', mixedAudioUrl: 'm', performanceId: 'take' });
  assert.deepEqual(result.performance, { id: 'take', vocalUrl: 'v', instrumentalUrl: 'b', masterUrl: 'm' });
  assert.deepEqual(result.media, { vocals: 'v', lyricsVocal: 'v', audio: 'b', mixedAudio: 'm' });
  assert.equal(result.renderedMixSignature, 'provider-original');
  const beat = replacedSongSource('audio', { audioUrl: 'new-beat' });
  assert.deepEqual({ ...result.media, ...beat.media }, { vocals: 'v', lyricsVocal: 'v', audio: 'new-beat', mixedAudio: null });
  assert.equal(beat.performance, null);
  assert.equal(replacedSongSource('vocals', { output: 'legacy', wasMixed: true }).media.mixedAudio, 'legacy');
});

test('successful generation paths clear the preview fallback and persist explicit nulls', () => {
  const source = readFileSync(new URL('../src/components/StudioOrchestratorV2.jsx', import.meta.url), 'utf8');
  for (const [start, end] of [['const replacement = replacedSongSource(\'audio\'', 'setGenerationProviders'], ['const replacement = replacedSongSource(\'vocals\'', 'setGenerationProviders']]) {
    const from = source.indexOf(start);
    const block = source.slice(from, source.indexOf(end, from));
    assert.match(block, /setFinalMixPreview\(null\)/);
    assert.match(block, /setActivePerformance\(/);
    assert.match(block, /currentSongSessionRef.current =/);
    assert.match(block, /mediaUrlsRef.current =/);
  }
  assert.equal((source.match(/mediaUrls: \{ \.\.\.existingProject.mediaUrls, \.\.\.mediaUrlsRef.current \}/g) || []).length, 2);
});

test('mixer renders playable historical masters, honest add-track controls and recovered lyrics', () => {
  const source = readFileSync(new URL('../src/components/studio/ProducerCanvas.jsx', import.meta.url), 'utf8');
  const body = source.replace(/^import[\s\S]*?;\s*/gm, '').replace('export default function', 'function');
  const { outputText } = ts.transpileModule(body, { compilerOptions: { jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2022 }, fileName: 'ProducerCanvas.jsx' });
  const Canvas = runInNewContext(`${outputText}\nProducerCanvas`, { React, ...React, ...icons, ...producer, ProducerControl: () => null });
  const project = { id: 'p', assets: [{ type: 'master', title: 'Original song master', audioUrl: 'https://example.test/master.mp3' }], outputs: { lyrics: 'My recovered verse' } };
  const session = producer.initialProducerSession(project);
  assert.equal(session.lyricsDraft, 'My recovered verse');
  const html = renderToStaticMarkup(React.createElement(Canvas, { project, projects: [], session, onPlayingChange() {} }));
  assert.match(html, /aria-label="Play saved mix"/);
  assert.doesNotMatch(html, /disabled="" aria-label="Play saved mix"/);
  assert.match(html, /src="https:\/\/example.test\/master.mp3"/);
  assert.match(html, /Master mix · may already include vocals/);
  assert.match(html, /aria-label="Add Original song master as a track"/);
  assert.match(html, /My recovered verse/);
  assert.doesNotMatch(html, /Render your first mix to listen/);
});

test('Vocal Lab CTA addresses a real agent route instead of the general directory', () => {
  const source = readFileSync(new URL('../src/components/VocalsResourcePage.jsx', import.meta.url), 'utf8');
  const constants = readFileSync(new URL('../src/constants.js', import.meta.url), 'utf8');
  assert.match(source, /window.location.hash = '#\/studio\/vocal-arch'/);
  assert.match(constants, /id: 'vocal-arch'/);
  assert.doesNotMatch(source, /priority chain ensure/);
});

test('removing a source also clears master fallbacks, but removing artwork preserves the audio mix', () => {
  const source = readFileSync(new URL('../src/components/StudioOrchestratorV2.jsx', import.meta.url), 'utf8');
  const body = source.slice(source.indexOf('  const handleDelete = (slot) => {'), source.indexOf('  // Edit handler'));
  for (const slot of ['audio', 'lyrics', 'visual']) {
    let media = { audio: 'beat', vocals: 'vocal', mixedAudio: 'master', image: 'art' };
    let preview = { mixedAudioUrl: 'master' }, performance = { id: 'old' }, signature = 'old';
    const mediaUrlsRef = { current: { ...media } }, currentSongSessionRef = { current: { performance, renderedMixSignature: signature } };
    const remove = runInNewContext(`${body}\nhandleDelete`, {
      outputsRef: { current: {} }, mediaUrlsRef, currentSongSessionRef,
      setOutputs() {}, setArGrades() {}, setImageHistory() {}, setMusicVideoUrl() {}, toast: { success() {} },
      setMediaUrls(update) { media = update(media); },
      setFinalMixPreview(value) { preview = value; },
      setActivePerformance(value) { performance = value; },
      setRenderedMixSignature(value) { signature = value; },
    });
    remove(slot);
    const clear = slot !== 'visual';
    assert.equal(media.mixedAudio, clear ? null : 'master');
    assert.equal(mediaUrlsRef.current.mixedAudio, media.mixedAudio);
    assert.equal(preview?.mixedAudioUrl || null, clear ? null : 'master');
    assert.equal(performance?.id || null, clear ? null : 'old');
    assert.equal(signature, clear ? '' : 'old');
  }
});
