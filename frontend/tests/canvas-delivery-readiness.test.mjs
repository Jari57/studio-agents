import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { projectDeliveryReadiness } from '../src/utils/deliveryReadiness.mjs';

const draft = {
  id: 'qa',
  productionConfig: { version: 1, quickMode: true, quickOutcome: 'song', selectedAgents: { lyrics: 'ghost', audio: 'beat', visual: null, video: null } },
  outputs: { lyrics: 'Real verse', audio: 'A beat description, not an audio file' },
  mediaUrls: { audio: null, vocals: null, mixedAudio: null },
  assets: [{ type: 'audio', content: 'Beat description' }, { type: 'audio', audioUrl: 'https://media.test/old.mp3' }],
};

test('saved canvas and orchestrator count actual current media, not descriptions or old takes', () => {
  const state = projectDeliveryReadiness(draft);
  assert.equal(state.completed, 1);
  assert.equal(state.selected.length, 4);
  assert.equal(state.ready.audio, false);
  assert.equal(state.ready.vocals, false);
  assert.equal(state.complete, false);
  assert.ok(!state.selected.includes('visual') && !state.selected.includes('video'));
});

test('a complete song is ready without forcing unselected artwork and video', () => {
  const state = projectDeliveryReadiness({ ...draft, mediaUrls: { audio: 'beat', vocals: 'vocal', mixedAudio: 'master' } });
  assert.equal(state.completed, 4);
  assert.equal(state.complete, true);
  assert.equal(projectDeliveryReadiness(null).complete, false);
});

test('canvas delegates readiness and does not describe a text asset as a finished sound stage', () => {
  const source = readFileSync(new URL('../src/components/studio/CanvasView.jsx', import.meta.url), 'utf8');
  assert.match(source, /projectDeliveryReadiness\(selectedProject\)/);
  assert.match(source, /projectDelivery\.completed \/ projectDelivery\.selected\.length/);
  assert.match(source, /step\.optional \? 'Optional'/);
  assert.match(source, /Your selected outputs are ready to audition/);
  assert.doesNotMatch(source, /status: matching\.length > 0 \? 'complete'/);
});
