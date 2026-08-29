'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..', '..');
const backend = fs.readFileSync(path.join(root, 'backend', 'server.js'), 'utf8');
const frontend = fs.readFileSync(path.join(root, 'frontend', 'src', 'components', 'StudioView.jsx'), 'utf8');

test('Collab Connect and Release Manager are server-bound text packages', () => {
  assert.match(backend, /const TEXT_AGENT_SYSTEM_INSTRUCTIONS = Object\.freeze/);
  assert.match(backend, /collab: 'You are Collab Connect/);
  assert.match(backend, /release: 'You are Release Manager/);
  assert.match(backend, /serverAgentInstruction \|\| systemInstruction/);
  assert.doesNotMatch(frontend, /'trends', 'social', 'collab', 'release'/);
  assert.match(frontend, /TEXT_AGENT_OUTPUT_CONTRACTS\[agentId\]/);
});

test('Mastering accepts playable audio and every execution identifies its agent', () => {
  assert.match(frontend, /\(isAudioAgent \|\| isSpeechAgent \|\| isMasterAgent\)/);
  assert.match(frontend, /finalBody = \{ \.\.\.finalBody, agentId \}/);
  assert.match(frontend, /metadata: \{ projectId: targetProjectSnapshot\?\.id \|\| null, featureType, agentId \}/);
  assert.match(frontend, /requestedDuration > 30/);
});
