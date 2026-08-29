import { BACKEND_URL } from '../constants';

async function readJson(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `Production service failed (${response.status})`);
  }
  return payload;
}

export async function createProductionJob(headers, payload) {
  const response = await fetch(`${BACKEND_URL}/api/production-jobs`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });
  return readJson(response);
}

export async function checkpointProductionJob(headers, jobId, payload) {
  const response = await fetch(`${BACKEND_URL}/api/production-jobs/${encodeURIComponent(jobId)}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(payload)
  });
  return readJson(response);
}

export async function fetchActiveProductionJob(headers) {
  const response = await fetch(`${BACKEND_URL}/api/production-jobs/active`, { headers });
  return readJson(response);
}
