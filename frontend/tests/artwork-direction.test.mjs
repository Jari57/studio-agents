import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { artworkDirectionRequest } from '../src/utils/productionIntegrity.mjs';

test('initial and redo artwork text requests both use the isolated still-image contract', () => {
  const source = readFileSync(new URL('../src/components/StudioOrchestratorV2.jsx', import.meta.url), 'utf8');
  assert.equal((source.match(/JSON.stringify\(slot === 'visual' \? artworkDirectionRequest/g) || []).length, 2);
});

test('actual image recovery branch saves an existing take and preserves a failed save result', async () => {
  const source = readFileSync(new URL('../src/components/StudioOrchestratorV2.jsx', import.meta.url), 'utf8');
  const statement = source.match(/retrySucceeded = mediaUrlsRef.current.image[\s\S]*?: await handleGenerateImage\(outputs.visual\);/)?.[0];
  assert.ok(statement, 'image recovery branch must exist');
  assert.match(source, /const handleCreateProject = async \(\) =>/);
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  const recover = new AsyncFunction('mediaUrlsRef', 'outputs', 'handleCreateProject', 'handleGenerateImage', `let retrySucceeded; ${statement} return retrySucceeded;`);
  for (const saveResult of [true, false]) {
    let saves = 0;
    let generations = 0;
    const result = await recover({current:{image:'https://media.example/existing-take.png'}}, {visual:'direction'}, async () => { saves++; return saveResult; }, async () => { generations++; return true; });
    assert.equal(result, saveResult);
    assert.equal(saves, 1);
    assert.equal(generations, 0, 'saving must never repurchase a generated image');
  }
  let generations = 0;
  assert.equal(await recover({current:{}}, {visual:'direction'}, async () => { throw new Error('No image to save'); }, async () => { generations++; return true; }), true);
  assert.equal(generations, 1);
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

test('existing art-direction call produces positive composition without echoing exclusions', () => {
  const brief = 'A violet folded-paper sculpture on cream. No crowded room or labels.';
  const request = artworkDirectionRequest(brief);
  assert.ok(request.prompt.includes(brief), 'original exclusions remain authoritative');
  assert.match(request.systemInstruction, /positive-only visual specification for FLUX/);
  assert.match(request.systemInstruction, /Convert exclusions into concrete positive visual alternatives/);
  assert.match(request.systemInstruction, /Never repeat an excluded object or forbidden noun/);
  assert.ok(request.systemInstruction.length < 2000, 'backend must retain the full direction contract');
  const source = readFileSync(new URL('../src/components/StudioOrchestratorV2.jsx', import.meta.url), 'utf8');
  const image = source.slice(source.indexOf('const handleGenerateImage ='), source.indexOf('const tryVideoFrameFallback ='));
  assert.match(image, /prompt: artworkRequestPrompt\(runContext\?\.brief \?\? songIdea, visualPrompt, contextHint\)/);
  assert.match(image, /positivePrompt: visualPrompt/);
  assert.equal((image.match(/await fetch\(/g) || []).length, 1, 'no extra paid prompt-rewriting call');
});
