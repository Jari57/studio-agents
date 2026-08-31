import { useCallback, useSyncExternalStore } from 'react';

const THEME_KEY = 'studio_theme';
const THEME_EVENT = 'studio-theme-change';
let memoryTheme = 'light';
const normalize = value => value === 'dark' ? 'dark' : 'light';

function readTheme() {
  try {
    const saved = window.localStorage.getItem(THEME_KEY);
    if (saved !== null) memoryTheme = normalize(saved);
  } catch { /* Theme remains usable when browser storage is blocked. */ }
  return memoryTheme;
}

function subscribe(onChange) {
  const onStorage = event => {
    if (event.key === THEME_KEY || event.key === null) {
      memoryTheme = normalize(event.newValue);
      onChange();
    }
  };
  window.addEventListener(THEME_EVENT, onChange);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(THEME_EVENT, onChange);
    window.removeEventListener('storage', onStorage);
  };
}

/** One preference for the homepage, studio, dialogs and standalone resource pages. */
export function useStudioTheme() {
  const theme = useSyncExternalStore(subscribe, readTheme, () => 'light');
  const setTheme = useCallback(value => {
    memoryTheme = normalize(typeof value === 'function' ? value(readTheme()) : value);
    try { window.localStorage.setItem(THEME_KEY, memoryTheme); } catch { /* In-memory fallback. */ }
    window.dispatchEvent(new Event(THEME_EVENT));
  }, []);
  return [theme, setTheme];
}
