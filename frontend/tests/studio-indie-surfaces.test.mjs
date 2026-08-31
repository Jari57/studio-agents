import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const read = path => readFileSync(new URL(`../src/${path}`, import.meta.url), 'utf8');
const canvas = read('components/studio/CanvasView.jsx');
const dashboard = read('components/studio/DashboardView.jsx');
const hub = read('components/ProjectHubV3.jsx');
const mixer = read('components/studio/ProducerCanvas.css');

test('project canvas, dashboard and project hub share the warm studio palette without neon accents', () => {
  for (const source of [canvas, dashboard, hub]) {
    assert.match(source, /var\(--studio-bg\)/);
    assert.match(source, /var\(--studio-ink\)/);
    assert.match(source, /var\(--studio-accent\)/);
    assert.match(source, /var\(--studio-sage\)/);
    assert.doesNotMatch(source, /#(?:a855f7|8b5cf6|06b6d4|ec4899)\b|var\(--color-(?:purple|cyan|pink)\)/i);
  }
});

test('media stays dark with readable labels while surrounding canvas inputs use ink text', () => {
  const stage = canvas.slice(canvas.indexOf('className="studio-media-stage"'), canvas.indexOf('{/* Metadata Grid */}'));
  assert.match(stage, /background: '#202724'/);
  assert.match(stage, /color: 'white'/);
  assert.match(stage, /color: '#c7cdc3'/);
  assert.match(canvas, /padding: '12px', color: 'var\(--studio-ink\)', fontSize: '0.85rem', resize: 'vertical'/);
  assert.match(canvas, /className="project-canvas-header-actions"/);
});

test('mixer fields, export action and hub selected controls have explicit contrasting palettes', () => {
  assert.match(mixer, /--producer-bg: var\(--studio-bg, #f3efe5\)/);
  assert.match(mixer, /--producer-panel: var\(--studio-surface, #fbf8f1\)/);
  assert.match(mixer, /\.producer-actions \.producer-render\s*\{[^}]*color: var\(--studio-on-accent, #fffaf0\)/);
  assert.match(mixer, /\.producer-precise-control input\[type='number'\][^}]*color: var\(--studio-ink, #202724\)[^}]*background: var\(--studio-surface, #fbf8f1\)/);
  assert.match(hub, /\.filter-pill\.active\s*\{[^}]*background: var\(--studio-accent\)[^}]*color: var\(--studio-on-accent\)/);
  assert.match(hub, /\.view-switch button\.active\s*\{[^}]*color: var\(--studio-on-accent\)/);
});

test('filled controls use theme-aware foregrounds with readable light and dark contrast', () => {
  const theme = read('studio-theme.css');
  const luminance = hex => {
    const rgb = hex.slice(1).match(/../g).map(value => parseInt(value, 16) / 255)
      .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  };
  for (const mode of ['light', 'dark']) {
    const block = theme.match(new RegExp(`\\.${mode}-theme\\s*\\{([^}]*)\\}`))[1];
    const tokens = Object.fromEntries([...block.matchAll(/--studio-([a-z-]+):\s*(#[a-f\d]{6})/gi)].map(match => [match[1], match[2]]));
    for (const fill of ['accent', 'sage', 'warning']) {
      const values = [luminance(tokens[fill]), luminance(tokens['on-accent'])].sort((a, b) => b - a);
      assert.ok((values[0] + 0.05) / (values[1] + 0.05) >= 4.5, `${mode} ${fill} control must retain readable text`);
    }
  }
  assert.doesNotMatch(dashboard, /color: 'var\(--studio-surface\)'/);
  for (const selector of ['btn-create-new', 'plus-circle', 'btn-open-project', 'btn-primary', 'play-circle', 'source-badge']) {
    assert.match(hub, new RegExp(`\\.${selector}\\s*\\{[^}]*color: var\\(--studio-on-accent\\)`));
  }
  assert.match(dashboard, /boxShadow: 'var\(--studio-shadow\)'/);
  assert.match(mixer, /box-shadow: var\(--studio-shadow\)/);
});

test('the changed studio presentation components still parse as JSX', () => {
  for (const path of ['components/studio/CanvasView.jsx', 'components/studio/DashboardView.jsx', 'components/ProjectHubV3.jsx', 'components/studio/ProducerCanvas.jsx']) {
    const result = ts.transpileModule(read(path), { fileName: path, reportDiagnostics: true, compilerOptions: { jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2022 } });
    assert.deepEqual((result.diagnostics || []).filter(item => item.category === ts.DiagnosticCategory.Error), [], path);
  }
});
