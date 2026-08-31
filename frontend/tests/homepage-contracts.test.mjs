import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const component = readFileSync(new URL('../src/components/StudioHomeIntro.jsx', import.meta.url), 'utf8');
const landing = readFileSync(new URL('../src/components/LandingPage.jsx', import.meta.url), 'utf8');
const stylesheet = readFileSync(new URL('../src/components/StudioHomeIntro.css', import.meta.url), 'utf8');

test('homepage opens the selected studio destination without an extra workflow dialog', () => {
  assert.match(component, /className="studio-home-primary" onClick=\{\(\) => onNavigate\('project_canvas'\)\}/);
  assert.match(landing, /onNavigate=\{\(tab\) => handleCtaClick\('return', tab\)\}/);
  assert.doesNotMatch(landing, /showWorkflowModal|handleWorkflowChoice/i);
  assert.match(landing, /\{showAuthModal &&/);
  assert.match(landing, /handleGoogleSignIn/);
});

test('archive showcase studio entry closes the archive and uses the existing authenticated canvas route', () => {
  assert.doesNotMatch(landing, /setShowWorkflowModal/);
  assert.match(landing, /onClick=\{\(\) => \{ setShowShowcase\(false\); handleCtaClick\('return', 'project_canvas'\); \}\}/);
  assert.match(landing, /Enter The Studio/);
});

test('all agents and existing destinations remain reachable after consolidation', () => {
  assert.match(component, /agents\.slice\(0, 4\)\.map/);
  assert.match(component, /agents\.slice\(4\)\.map/);
  for (const destination of ['project_canvas', 'hub', 'orchestrator', 'agents', 'resources', 'news']) {
    assert.ok(component.includes(`'${destination}'`), `${destination} must remain reachable`);
  }
  for (const retained of ['onSubscribe', 'setShowShowcase(true)', 'setShowInvestorPitch(true)', 'setShowPrivacy(true)', 'setShowTerms(true)', '/support.html', '/account-deletion.html']) {
    assert.ok(landing.includes(retained), `${retained} must remain available`);
  }
  assert.match(landing, /id="studio-home-pricing"/);
});

test('Your projects opens the project list while the canvas action keeps its editing destination', () => {
  assert.match(component, /onClick=\{\(\) => onNavigate\('hub'\)\}><FolderOpen[^>]*\/> Your projects/);
  assert.match(component, /tab: 'project_canvas'[^\n]*action: 'Open project canvas'/);
});

test('illustrative demos require an explicit open and only one demo mounts', () => {
  assert.match(component, /function StudioPreview/);
  assert.match(component, /\{open \? \(/);
  assert.match(component, /Illustrative demos, not a live generation/);
  assert.match(component, /preview === 'workflow' \? <HeroProductDemo/);
  assert.match(component, /preview === 'single' \? <SingleAgentDemo/);
  assert.match(component, /This is an illustration, not a generated project/);
});

test('homepage keyboard paths, reduced motion and small-screen layouts are explicit', () => {
  assert.match(component, /<button type="button" onClick=\{\(\) => onAgent\(agent.id\)\}/);
  assert.match(component, /<details className="studio-home-disclosure/);
  assert.match(component, /aria-pressed=\{preview === value\}/);
  assert.match(stylesheet, /:focus-visible/);
  assert.match(stylesheet, /prefers-reduced-motion: reduce/);
  assert.match(stylesheet, /max-width: 420px/);
  assert.match(stylesheet, /padding-top: 0 !important/);
  assert.doesNotMatch(stylesheet, /^\s*(?:body|button|section|h1)\s*\{/m);
});

test('homepage keeps planned pricing honest and removes unsupported traction claims', () => {
  for (const claim of ['127K+', '847K', '2.4M views', '92%', '4.9★', '10x faster', '$5M Seed', 'Limited to first 1000 users', '100% ownership']) {
    assert.ok(!landing.includes(claim), `unsupported claim must not return: ${claim}`);
  }
  assert.match(landing, /Roadmap — archived proposals, current priorities/);
  assert.match(landing, /Public API — not yet verified/);
  assert.match(landing, /Recurring allowance under review/);
  assert.match(landing, /Provider-dependent output duration/);
  for (const tab of ['vision', 'market', 'product', 'traction', 'roadmap', 'financials']) {
    assert.ok(landing.includes(`pitchTab === '${tab}'`), `${tab} investor tab is retained`);
  }
});
