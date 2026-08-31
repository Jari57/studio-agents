import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const landing = readFileSync(new URL('../src/components/LandingPage.jsx', import.meta.url), 'utf8');
const homeStyles = readFileSync(new URL('../src/components/StudioHomeIntro.css', import.meta.url), 'utf8');

test('all homepage dialogs use the shared viewport-safe modal shell', () => {
  const overlays = landing.match(/className="modal-overlay landing-modal-overlay animate-fadeIn"/g) ?? [];
  const panels = landing.match(/className="(?:auth-modal|legal-modal) landing-modal-panel animate-scaleIn"/g) ?? [];

  assert.equal(overlays.length, 6);
  assert.equal(panels.length, 6);
});

test('homepage dialogs render above fixed navigation and scroll inside the viewport', () => {
  assert.match(homeStyles, /\.modal-overlay\.landing-modal-overlay\s*\{[\s\S]*?z-index:\s*12000\s*!important/);
  assert.match(homeStyles, /\.landing-modal-overlay\s*>\s*\.landing-modal-panel\s*\{[\s\S]*?max-height:\s*calc\(100dvh - 32px\)\s*!important/);
  assert.match(homeStyles, /\.landing-modal-panel\s*>\s*\.modal-body\s*\{[\s\S]*?overflow-y:\s*auto\s*!important/);
});
