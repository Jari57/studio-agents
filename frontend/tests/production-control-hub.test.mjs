import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import React, { Suspense } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as icons from 'lucide-react';
import ts from 'typescript';

// Render the real presentational component without loading Firebase, providers,
// or the parent orchestrator. No generation requests or browser are involved.
const source = readFileSync(new URL('../src/components/StudioOrchestratorV2.jsx', import.meta.url), 'utf8');
const start = source.indexOf('function ProductionControlHub(');
const end = source.indexOf('// MAIN COMPONENT', start);
assert.ok(start >= 0 && end > start, 'ProductionControlHub must remain available');
const { outputText } = ts.transpileModule(source.slice(start, end), {
  compilerOptions: { jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2022 },
  fileName: 'ProductionControlHub.jsx'
});
const Hub = runInNewContext(`${outputText}\nProductionControlHub`, {
  React,
  Suspense,
  ...icons,
  VideoIcon: icons.Video,
  RealtimePreviewMixer: () => null
});
const renderHub = (props = {}) => renderToStaticMarkup(React.createElement(Hub, {
  outputs: {},
  mediaUrls: {},
  selectedAgents: { visual: 'album' },
  songIdea: 'An abstract record sleeve',
  isMobile: false,
  ...props
}));

test('artwork-only selection starts at zero of one and does not request a full song', () => {
  const html = renderHub();
  assert.match(html, /0\/1 selected outputs ready • 1 remaining/);
  assert.match(html, /Still to create: <strong>Artwork<\/strong>/);
  assert.doesNotMatch(html, /Create Full Song|Create Full Project|Next: Create Vocals/);
  assert.match(html, /mixing is not required for your selected outputs/);
  for (const control of ['Mixing Console', 'Create Mix', 'Create Music Video', 'Get Share Link']) {
    assert.ok(html.includes(control), `${control} must remain available`);
  }
  // SoundCloud is only advertised when the backend reports credentials.
  assert.ok(!html.includes('Push to SoundCloud'), 'SoundCloud must be hidden until the backend enables it');
  assert.ok(renderHub({ soundcloudEnabled: true }).includes('Push to SoundCloud'), 'SoundCloud appears when enabled');
});

test('an art description is saveable progress but not a completed image', () => {
  const html = renderHub({ outputs: { visual: 'A composition in rust and ivory' } });
  assert.match(html, /0\/1 selected outputs ready • 1 remaining/);
  assert.match(html, /Save Progress/);
  assert.doesNotMatch(html, /Production Complete|master-ready/);
});

test('the generated image completes only the requested artwork output', () => {
  const html = renderHub({ outputs: { visual: 'Art direction' }, mediaUrls: { image: 'https://example.test/art.png' } });
  assert.match(html, /1\/1 selected outputs ready • 0 remaining/);
  assert.match(html, /Selected outputs ready/);
  assert.match(html, /Publish to Hub/);
  assert.match(html, /optional tools, not requirements for this selection/);
  assert.doesNotMatch(html, /master-ready|4 remaining/);
});

test('restored extra media does not inflate the selected counter or hide saving', () => {
  const html = renderHub({
    selectedAgents: { visual: 'album', audio: 'beat' },
    outputs: { lyrics: 'Old lyrics', visual: 'Art', audio: 'Beat description', video: 'Old video plan', mix: 'Old mix' },
    mediaUrls: { image: 'art.png', video: 'video.mp4', mixedAudio: 'mix.wav' }
  });
  assert.match(html, /1\/2 selected outputs ready • 1 remaining/);
  assert.match(html, /Still to create: <strong>Beat<\/strong>/);
  assert.match(html, /saved, not selected/);
  assert.match(html, /Save Progress/);
  assert.doesNotMatch(html, /-1 remaining|5\/4/);
});

test('zero selected outputs has a useful empty state and finite progress', () => {
  const html = renderHub({ selectedAgents: {}, outputs: { visual: 'Saved art direction' } });
  assert.match(html, /No outputs selected — choose generators above/);
  assert.match(html, /Existing outputs stay available to save and review/);
  assert.match(html, /Save Progress/);
  assert.doesNotMatch(html, /NaN|Infinity|Selected outputs ready/);
});

test('four real selected outputs are ready for review, not claimed to be mastered', () => {
  const html = renderHub({
    selectedAgents: { lyrics: 'ghost', audio: 'beat', visual: 'album', video: 'video-gen' },
    outputs: { lyrics: 'A lyric draft', audio: 'Beat direction', visual: 'Art direction', video: 'Storyboard' },
    mediaUrls: { audio: 'beat.wav', image: 'art.png', video: 'video.mp4' }
  });
  assert.match(html, /4\/4 selected outputs ready • 0 remaining/);
  assert.doesNotMatch(html, /master-ready|All assets are/);
});

test('creator-specific selected labels and missing-brief guidance remain relevant', () => {
  const html = renderHub({ creatorMode: 'creator', songIdea: ' ', selectedAgents: { visual: 'album' } });
  assert.match(html, /Review your brief above before creating <strong>Graphics<\/strong>/);
  assert.doesNotMatch(html, /Create Full Project/);
});

test('advanced brief focus and collapsed selected progress match the expanded hub', () => {
  assert.match(source, /<textarea\s+id="studio-song-brief"\s+value=\{songIdea\}/);
  assert.match(source, /<ProductionControlHub[\s\S]*?selectedAgents=\{selectedAgents\}/);
  const hubCall = source.indexOf('<ProductionControlHub');
  const badge = source.slice(source.lastIndexOf('Production Control Hub', hubCall), hubCall);
  assert.match(badge, /selectedAgents\[key\][\s\S]*selected ready/);
  assert.doesNotMatch(badge, /\}\/4 ready/);
});
