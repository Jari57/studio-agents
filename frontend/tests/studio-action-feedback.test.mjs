import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const appSource = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const orchestratorSource = readFileSync(new URL('../src/components/StudioOrchestratorV2.jsx', import.meta.url), 'utf8');

test('global action feedback renders above the Studio orchestrator', () => {
  const toastLayer = Number(appSource.match(/containerStyle=\{\{ bottom: 80, zIndex: (\d+) \}\}/)?.[1]);
  const orchestratorLayer = Number(orchestratorSource.match(/className="studio-orchestrator-overlay[\s\S]*?zIndex: (\d+)/)?.[1]);

  assert.ok(toastLayer > orchestratorLayer);
});