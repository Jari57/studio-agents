// Backend feature flags (optional integrations). Fetched once per page load and
// cached so every component that asks gets the same answer without re-hitting
// /api/health. Defaults are conservative: a feature is OFF until the backend
// says it is configured, so the UI never advertises a button that can only 503.
const DEFAULT_FEATURES = Object.freeze({ soundcloud: false });

let cached = null;
let inflight = null;

export function normalizeBackendFeatures(payload) {
  const features = payload && typeof payload === 'object' ? payload.features : null;
  return {
    ...DEFAULT_FEATURES,
    soundcloud: features?.soundcloud === true
  };
}

export async function fetchBackendFeatures(backendUrl, fetchImpl = globalThis.fetch) {
  if (cached) return cached;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const res = await fetchImpl(`${backendUrl}/api/health`);
      const data = res && typeof res.json === 'function' ? await res.json().catch(() => null) : null;
      cached = normalizeBackendFeatures(data);
    } catch {
      cached = { ...DEFAULT_FEATURES };
    } finally {
      inflight = null;
    }
    return cached;
  })();
  return inflight;
}

export function resetBackendFeaturesCache() {
  cached = null;
  inflight = null;
}
