import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { studioCreationCounts } from '../src/utils/studioCreationCounts.mjs';

test('studio inventory reports observed project and asset counts, never projected audience metrics', () => {
  const projects = [{ id: 'one', assets: [{ id: 'audio' }, { id: 'image' }, null] }, { id: 'two' }, null];
  assert.deepEqual(studioCreationCounts(projects), { projectCount: 2, assetCount: 2 });
  assert.deepEqual(studioCreationCounts([]), { projectCount: 0, assetCount: 0 });
  assert.deepEqual(studioCreationCounts(undefined), { projectCount: 0, assetCount: 0 });
  assert.equal(projects[0].assets.length, 3);
});

test('dashboard correctly labels actual counts and does not derive streams, listeners, or followers', () => {
  const studio = readFileSync(new URL('../src/components/StudioView.jsx', import.meta.url), 'utf8');
  const dashboard = readFileSync(new URL('../src/components/studio/DashboardView.jsx', import.meta.url), 'utf8');
  assert.doesNotMatch(studio, /performanceStats|projectCount \* 142|audioCount \* 452|projectCount \* 24/);
  assert.match(studio, /studioCreationCounts\(projects\)/);
  assert.match(dashboard, /creationStats\.projectCount/);
  assert.match(dashboard, /Total Projects/);
  assert.match(dashboard, /creationStats\.assetCount\} project assets/);
  assert.match(dashboard, /Streaming and audience analytics are not connected here/);
});

test('help avoids unsupported privacy, rights, recovery, and premium-training guarantees', () => {
  const studio = readFileSync(new URL('../src/components/StudioView.jsx', import.meta.url), 'utf8');
  const help = studio.slice(studio.indexOf('const HELP_ITEMS'), studio.indexOf('const NAVIGATION_ITEMS_STATIC'));
  assert.doesNotMatch(help, /We use end-to-end encryption|You own the rights to the output|full copyright protection|your project will be saved|exclusive masterclasses|scans real-time social data/);
  assert.match(help, /refreshing can discard unsaved work/);
  assert.match(help, /does not verify copyright ownership/);
  assert.match(help, /services needed to generate and store/);
  assert.match(help, /do not certify release quality/);
  assert.match(help, /title: 'Video Tutorials'/);
});
