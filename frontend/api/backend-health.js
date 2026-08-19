const TARGETS = {
  canonical: 'https://web-production-b5922.up.railway.app/api/health',
  secondary: 'https://studio-agents-backend-production.up.railway.app/api/health',
};

async function probe(url) {
  const startedAt = Date.now();
  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' },
      signal: AbortSignal.timeout(10000),
    });
    const text = await response.text();
    let body = null;
    try { body = JSON.parse(text); } catch { body = { text: text.slice(0, 500) }; }
    return {
      ok: response.ok,
      status: response.status,
      durationMs: Date.now() - startedAt,
      body,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const [canonical, secondary] = await Promise.all([
    probe(TARGETS.canonical),
    probe(TARGETS.secondary),
  ]);
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({ canonical, secondary, checkedAt: new Date().toISOString() });
}
