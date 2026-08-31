import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('legal help actions open existing guides rather than inert schedules or downloads', () => {
  const source = readFileSync(new URL('../src/components/LegalResourcesPage.jsx',import.meta.url),'utf8');
  for (const id of ['split-sheets','legal-agreements']) {
    assert.ok(source.includes(`resource.id === '${id}'`));
    assert.ok(source.includes(`id: '${id}'`));
  }
  assert.doesNotMatch(source,/Office Hours Schedule|Download Templates|monthly Legal Office Hours/);
  assert.match(source,/onKeyDown=\{event =>/);
  assert.match(source,/minmax\(min\(100%, 350px\), 1fr\)/);
});

test('whitepaper does not promise unimplemented attorney services or compliance guarantees', () => {
  const source = readFileSync(new URL('../src/components/WhitepapersPage.jsx',import.meta.url),'utf8');
  assert.doesNotMatch(source,/Automatic compliance updates|monthly Legal Office Hours|our partnership with music law firms/);
  assert.match(source,/not legal advice, attorney services, or a guarantee of compliance/);
});
