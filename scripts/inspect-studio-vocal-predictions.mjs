// Read-only incident check. Run with the linked project's production environment.
// Deliberately excludes prompts, input media, output URLs and credentials.
const token = process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_KEY;
if (!token) throw new Error('Replicate is not configured in this environment.');
const response = await fetch('https://api.replicate.com/v1/predictions', {
  headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(15000),
});
if (!response.ok) throw new Error(`Prediction-history access returned HTTP ${response.status}.`);
const data = await response.json();
const since = Date.parse(process.argv[2] || '2026-08-31T05:30:00Z');
const rows = (data.results || []).filter(p => Date.parse(p.created_at) >= since);
console.log(JSON.stringify(rows.map(p => ({
  id: p.id, model: p.model, version: p.version, status: p.status,
  createdAt: p.created_at, startedAt: p.started_at, completedAt: p.completed_at,
  metrics: p.metrics,
  error: String(p.error || '').replace(/https?:\/\/\S+/g, '[redacted URL]').replace(/r8_[A-Za-z0-9]+/g, '[redacted token]').slice(0, 700),
})), null, 2));
