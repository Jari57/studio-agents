import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function mount(saved) {
  const storage = new Map(saved === undefined ? [] : [['studio_theme', saved]]);
  const listeners = new Map();
  let blocked = false;
  let subscribe;
  const window = {
    localStorage: {
      getItem: key => { if (blocked) throw new Error('blocked'); return storage.get(key) ?? null; },
      setItem: (key, value) => { if (blocked) throw new Error('blocked'); storage.set(key, value); },
    },
    addEventListener: (name, listener) => { if (!listeners.has(name)) listeners.set(name, new Set()); listeners.get(name).add(listener); },
    removeEventListener: (name, listener) => listeners.get(name)?.delete(listener),
    dispatchEvent: event => listeners.get(event.type)?.forEach(listener => listener(event)),
  };
  const context = vm.createContext({ window, Event, useCallback: callback => callback,
    useSyncExternalStore: (listener, snapshot) => { subscribe = listener; return snapshot(); } });
  const source = readFileSync(new URL('../src/hooks/useStudioTheme.js', import.meta.url), 'utf8')
    .replace(/^import .*;\s*/m, '').replace('export function useStudioTheme', 'function useStudioTheme');
  vm.runInContext(source, context);
  return { hook: () => context.useStudioTheme(), storage, window, listeners,
    subscribe: callback => subscribe(callback), block: () => { blocked = true; } };
}

test('one theme store preserves existing dark choice and defaults missing/invalid values to light', () => {
  assert.equal(mount('dark').hook()[0], 'dark');
  assert.equal(mount().hook()[0], 'light');
  assert.equal(mount('legacy-purple').hook()[0], 'light');
});

test('homepage and workspace setters publish the same preference and unsubscribe cleanly', () => {
  const app = mount();
  const [, setTheme] = app.hook();
  let notified = 0;
  const unsubscribe = app.subscribe(() => notified++);
  setTheme('dark');
  assert.equal(app.hook()[0], 'dark');
  assert.equal(app.storage.get('studio_theme'), 'dark');
  assert.equal(notified, 1);
  setTheme(current => current === 'dark' ? 'light' : 'dark');
  assert.equal(app.hook()[0], 'light');
  unsubscribe();
  assert.equal(app.listeners.get('studio-theme-change').size, 0);
  assert.equal(app.listeners.get('storage').size, 0);
});

test('theme changes continue working when browser storage is unavailable', () => {
  const app = mount();
  app.block();
  app.hook()[1]('dark');
  assert.equal(app.hook()[0], 'dark');
  app.hook()[1]('light');
  assert.equal(app.hook()[0], 'light');
});

test('changes from another browser tab notify subscribers without touching unrelated keys', () => {
  const app = mount();
  app.hook();
  let notified = 0;
  app.subscribe(() => notified++);
  app.window.dispatchEvent({ type: 'storage', key: 'unrelated', newValue: 'dark' });
  assert.equal(notified, 0);
  app.storage.set('studio_theme', 'dark');
  app.window.dispatchEvent({ type: 'storage', key: 'studio_theme', newValue: 'dark' });
  assert.equal(app.hook()[0], 'dark');
  assert.equal(notified, 1);
});
