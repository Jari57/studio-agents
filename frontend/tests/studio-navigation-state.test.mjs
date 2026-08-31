import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/components/StudioView.jsx', import.meta.url), 'utf8');

test('explicit top-level routes do not restore a stale saved agent workspace', () => {
  assert.match(
    source,
    /if \(tabOrId !== 'project_canvas'\) return null;[\s\S]*?\(activeTab === 'agents' \|\| activeTab === 'project_canvas'\) && savedId/
  );
});

test('shared tab navigation clears agent context outside agent-backed screens', () => {
  assert.match(
    source,
    /const setActiveTab = \(tab\) => \{[\s\S]*?if \(tab !== 'agents' && tab !== 'project_canvas'\) \{[\s\S]*?setSelectedAgent\(null\);/
  );
  assert.match(
    source,
    /VALID_TABS\.includes\(tabOrId\)[\s\S]*?tabOrId !== 'agents' && tabOrId !== 'project_canvas'[\s\S]*?setSelectedAgent\(null\)/
  );
});

test('resource and More cards share mouse and keyboard-safe navigation', () => {
  assert.match(source, /const openResourceItem = \(item\) => \{[\s\S]*?setSelectedAgent\(null\);/);
  assert.match(source, /onClick=\{\(\) => openResourceItem\(item\)\}/);
  assert.match(source, /event\.key === 'Enter' \|\| event\.key === ' '[\s\S]*?openResourceItem\(item\)/);

  assert.match(source, /const openMoreItem = \(item\) => \{[\s\S]*?setSelectedAgent\(null\);/);
  assert.match(source, /onClick=\{\(\) => openMoreItem\(item\)\}/);
  assert.match(source, /event\.key === 'Enter' \|\| event\.key === ' '[\s\S]*?openMoreItem\(item\)/);
});
