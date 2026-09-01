import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/components/studio/DashboardView.jsx', import.meta.url), 'utf8');
const studioSource = readFileSync(new URL('../src/components/StudioView.jsx', import.meta.url), 'utf8');

test('dashboard pipeline launchers dismiss onboarding before opening the orchestrator', () => {
  const launches = source.match(/setShowOnboarding\(false\); setShowOrchestrator\(true\);/g) || [];

  assert.equal(launches.length, 2);
});

test('completing or skipping Studio onboarding also completes orchestrator onboarding', () => {
  const completions = studioSource.match(/localStorage\.setItem\('studio_onboarding_complete', 'true'\);/g) || [];

  assert.equal(completions.length, 2);
});