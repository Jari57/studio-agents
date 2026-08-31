import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resourceNavigationContext, safeResourceReturnHash } from '../src/utils/resourceNavigation.mjs';

test('studio legal and sibling resources return to the actual originating tab', () => {
  for (const resource of ['legal', 'whitepapers', 'dna', 'vocals', 'billboard', 'campaign']) {
    const result = resourceNavigationContext('#/studio/more', `#/${resource}`);
    assert.equal(result.returnHash, '#/studio/more');
    assert.deepEqual(result.historyState.studioResourceReturn, { page: `#/${resource}`, returnHash: '#/studio/more' });
  }
  assert.equal(resourceNavigationContext('#/studio/project_canvas', '#/legal').returnHash, '#/studio/project_canvas');
});

test('public and direct legal visits return to the public homepage', () => {
  assert.equal(resourceNavigationContext('#/', '#/legal', '#/studio/more').returnHash, '#/');
  assert.equal(resourceNavigationContext('#/', '#/legal').returnHash, '#/');
});

test('resource chains, refresh and browser history retain the correct return origin', () => {
  const legal = resourceNavigationContext('#/studio/resources', '#/legal', '#/', { unrelated: 'preserve' });
  const dna = resourceNavigationContext('#/legal', '#/dna', legal.returnHash, legal.historyState);
  assert.equal(dna.returnHash, '#/studio/resources');
  assert.equal(dna.historyState.unrelated, 'preserve');
  assert.equal(resourceNavigationContext('#/', '#/legal', '#/', legal.historyState).returnHash, '#/studio/resources');
  const studio = resourceNavigationContext('#/legal', '#/studio/resources', legal.returnHash, legal.historyState);
  assert.equal(studio.historyState.studioResourceReturn, undefined);
  const landing = resourceNavigationContext('#/studio/resources', '#/', studio.returnHash, studio.historyState);
  assert.equal(resourceNavigationContext('#/', '#/legal', landing.returnHash, landing.historyState).returnHash, '#/');
});

test('return destinations never become external URLs or arbitrary hashes', () => {
  for (const hash of ['https://example.test', '//example.test', '#/studioevil', '#/studio/../legal', '#/legal', null]) {
    assert.equal(safeResourceReturnHash(hash), '#/');
  }
  assert.equal(safeResourceReturnHash('#/studio'), '#/studio');
});

test('all resource pages use contextual back while the studio logo retains homepage navigation', () => {
  const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
  for (const component of ['WhitepapersPage', 'LegalResourcesPage', 'DnaResourcePage', 'VocalsResourcePage', 'BillboardBlueprintPage', 'ContentMultiplicationPage']) {
    assert.match(app, new RegExp(`<${component} onBack=\\{handleBackFromResource\\}`));
  }
  assert.match(app, /<StudioView\s+onBack=\{handleBackToLanding\}/);
  assert.match(app, /window\.history\.replaceState\(context\.historyState/);
  assert.match(app, /setInitialTab\(null\)/);
});
