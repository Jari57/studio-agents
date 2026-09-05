import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Download, FolderPlus } from 'lucide-react';
import ts from 'typescript';
import { deliveryReadiness } from '../src/utils/deliveryReadiness.mjs';

const read = path => readFileSync(new URL(`../src/${path}`, import.meta.url), 'utf8');
const orchestrator = read('components/StudioOrchestratorV2.jsx');
const actions = read('components/StudioOutputActions.jsx');
const css = read('components/StudioOrchestratorTheme.css');
const { outputText } = ts.transpileModule(actions.replace(/^import .*;\r?\n/gm, '').replace('export default function', 'function'), {
  compilerOptions: { jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2022 }
});
const Actions = runInNewContext(`${outputText}\nStudioOutputActions`, { React, Download, FolderPlus, deliveryReadiness });

test('orchestrator uses the shared editorial palette, with explicitly scoped dark media stages', () => {
  for (const token of ['bg', 'surface', 'surface-alt', 'ink', 'muted', 'border', 'accent', 'accent-soft', 'sage']) {
    assert.ok(orchestrator.includes(`var(--studio-${token},`), `${token} should follow the shared theme`);
  }
  assert.doesNotMatch(orchestrator, /#(?:8b5cf6|a855f7|6366f1|06b6d4|ec4899)\b|rgba\(139,\s*92,\s*246/i);
  assert.doesNotMatch(orchestrator, /\)\)\$\{/, 'gradient templates must not append stops after a closed gradient');
  assert.ok((orchestrator.match(/className="studio-media-stage"/g) || []).length >= 4);
  assert.match(css, /\.studio-orchestrator-overlay \.studio-media-stage\s*\{[\s\S]*?--studio-ink: #f3efe5;/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /var\(--studio-on-accent,/);
  assert.doesNotMatch(css, /\*\s*\{[^}]*background/s, 'no blanket background override');
});

test('both immediate and advanced generation entry points retain their actions with one primary style', () => {
  assert.match(orchestrator, /className="quick-create-submit studio-primary-action"/);
  assert.match(orchestrator, /onClick=\{handleGenerate\}\s+className="studio-primary-action"/);
  for (const name of ['handleGenerateImage', 'handleGenerateAudio', 'handleGenerateVocals', 'handleCreateProject']) {
    assert.ok(orchestrator.includes(name));
  }
});

test('mobile output actions retain export, stems and durable save callbacks', () => {
  const calls = [];
  const tree = Actions({
    outputs: { visual: 'Cover direction' }, mediaUrls: { image: 'https://example.test/art.jpg' },
    selectedAgents: { visual: 'album' }, isMobile: true,
    onExport: () => calls.push('export'), onStems: () => calls.push('stems'), onSave: () => calls.push('save')
  });
  const buttons = tree.props.children[1].props.children;
  assert.deepEqual(buttons.map(button => button.props['aria-label']), ['Export All (.zip)', 'Stems Pack (WAV)', 'Save to Project']);
  buttons.forEach(button => button.props.onClick());
  assert.deepEqual(calls, ['export', 'stems', 'save']);
  const html = renderToStaticMarkup(tree);
  assert.match(html, /1\/1 selected outputs ready/);
  assert.match(html, /repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(html, /safe-area-inset-bottom/);
  assert.match(html, /var\(--studio-on-accent, #fffaf0\)/);
  assert.doesNotMatch(html, /#ddd6fe|#6d28d9|rgba\(0,0,0,0.94\)/);
});

function luminance(hex) {
  const channels = hex.replace('#', '').match(/../g).map(value => parseInt(value, 16) / 255)
    .map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
  return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
}
test('light, night and charcoal-stage text pairs meet normal text contrast', () => {
  for (const [foreground, background] of [
    ['#202724', '#fbf8f1'], ['#646c64', '#fbf8f1'], ['#566954', '#e4e8dc'],
    ['#fffaf0', '#a34229'], ['#202724', '#ecad8e'],
    ['#f2eee5', '#2c342e'], ['#b8c0b4', '#2c342e'], ['#f3efe5', '#202724'], ['#c1c9be', '#202724']
  ]) {
    const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
    assert.ok((values[0] + .05) / (values[1] + .05) >= 4.5, `${foreground} on ${background}`);
  }
});
