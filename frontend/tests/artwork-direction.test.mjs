import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { artworkDirectionRequest } from '../src/utils/productionIntegrity.mjs';

test('initial and redo artwork text requests both use the isolated still-image contract', () => {
  const source = readFileSync(new URL('../src/components/StudioOrchestratorV2.jsx', import.meta.url), 'utf8');
  assert.equal((source.match(/JSON.stringify\(slot === 'visual' \? artworkDirectionRequest/g) || []).length, 2);
  assert.match(source, /retrySucceeded = mediaUrlsRef.current.image\s*\? await handleSaveProject\(\)\s*: await handleGenerateImage/);
});

test('static artwork text request preserves the complete brief without injecting music settings', () => {
  const brief = 'A static square cover only: cobalt, ivory and copper. Abstract paper cutouts. No people, letters, logo, photography or video storyboard.';
  const request = artworkDirectionRequest(brief, {
    model: 'gemini-2.5-flash', language: 'English',
    // Callers cannot accidentally turn music defaults into output requirements.
    duration: 32, style: 'Modern Hip-Hop', bpm: 120,
  });
  assert.ok(request.prompt.includes(brief));
  assert.equal(request.model, 'gemini-2.5-flash');
  assert.equal(request.language, 'English');
  for (const key of ['duration', 'durationSeconds', 'style', 'bpm', 'genre']) {
    assert.equal(Object.hasOwn(request, key), false);
  }
  assert.doesNotMatch(request.prompt, /Target Duration|32 seconds|Modern Hip-Hop/);
  assert.match(request.systemInstruction, /one still composition/);
  assert.match(request.systemInstruction, /Do not produce a storyboard/);
  assert.match(request.systemInstruction, /original brief as authoritative/);
  assert.ok(request.systemInstruction.length < 2000, 'backend must not truncate the constraint contract');
});

test('references and same-project context stay subordinate to explicit visual constraints', () => {
  const request = artworkDirectionRequest('Ivory and blue, no text.', {
    language: 'Spanish', referenceUrl: 'https://media.example/reference.png',
    context: 'A song whose previous cover used red lettering.',
  });
  assert.equal(request.language, 'Spanish');
  assert.equal(request.referenceUrl, 'https://media.example/reference.png');
  assert.match(request.prompt, /ORIGINAL BRIEF:\nIvory and blue, no text\./);
  assert.match(request.prompt, /use only where compatible with the original brief/);
  assert.match(request.systemInstruction, /Do not expand the requested deliverable/);
});
