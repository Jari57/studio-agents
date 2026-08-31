import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const landing = readFileSync(new URL('../src/components/LandingPage.jsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/components/StudioHomeIntro.css', import.meta.url), 'utf8');
const state = landing.slice(landing.indexOf('  const [theme, setTheme]'), landing.indexOf('  const [scrolled, setScrolled]'));

function mountTheme(saved) {
  const updates = [];
  const api = runInNewContext(`(() => { ${state}; return { theme, toggleTheme }; })()`, {
    useStudioTheme: () => [saved, value => updates.push(value)]
  });
  return { ...api, updates };
}

test('homepage uses the shared persistent studio preference instead of independent theme state', () => {
  assert.match(landing, /import \{ useStudioTheme \} from '..\/hooks\/useStudioTheme'/);
  assert.match(landing, /const \[theme, setTheme\] = useStudioTheme\(\)/);
  assert.equal(mountTheme('dark').theme, 'dark');
  assert.equal(mountTheme('light').theme, 'light');
  assert.doesNotMatch(state, /localStorage|useState/);
});

test('theme toggle delegates both directions to the shared setter without changing navigation', () => {
  for (const initial of ['light', 'dark']) {
    const mounted = mountTheme(initial);
    mounted.toggleTheme();
    const next = initial === 'light' ? 'dark' : 'light';
    assert.deepEqual(mounted.updates, [next]);
  }
});

test('theme is applied to the homepage with a keyboard-accessible 44px toggle', () => {
  assert.match(landing, /className=\{`landing-container studio-home \$\{theme\}-theme`\}/);
  assert.match(landing, /onClick=\{toggleTheme\}\s+aria-label="Dark theme"\s+aria-pressed=\{theme === 'dark'\}/);
  assert.match(css, /\.studio-home-theme-toggle\s*\{[^}]*min-width: 44px; min-height: 44px;/);
  assert.match(css, /native-header button:focus-visible/);
  const parsed = ts.createSourceFile('LandingPage.jsx', landing, ts.ScriptTarget.Latest, true, ts.ScriptKind.JSX);
  assert.equal(parsed.parseDiagnostics.length, 0);
});

test('both themes preserve readable primary actions, role-tinted cards and the intentional dark pricing chapter', () => {
  assert.match(css, /--home-paper: var\(--studio-bg\)/);
  assert.match(css, /--home-ink: var\(--studio-ink\)/);
  assert.match(css, /\.studio-home-primary\s*\{[^}]*color: var\(--studio-on-accent\)/);
  assert.match(css, /\.landing-container.studio-home.dark-theme\s*\{[^}]*--home-peach:[^}]*--home-blue:[^}]*--home-mint:/);
  assert.match(css, /\.studio-home-existing\s*\{[^}]*--studio-ink: #f4f1e9; --studio-muted: #bac4bc;/);
  assert.match(css, /\.studio-home-agent\s*\{[^}]*background: var\(--studio-surface\)/);
  assert.match(css, /\.studio-home-disclosure\s*\{[^}]*background: var\(--studio-surface\)/);
});
